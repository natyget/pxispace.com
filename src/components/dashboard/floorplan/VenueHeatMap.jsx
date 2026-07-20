'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { HugeiconsIcon } from '@hugeicons/react';
import { PauseIcon, PlayIcon } from '@hugeicons/core-free-icons';
import { authStorage } from '@/services/auth';
import { getEventHeatmap, listFloorPlans, attachFloorPlan, detachFloorPlan } from '@/services/floorPlans';
import { latLngToPlanPx, mapMetersPerPixel, staticMapUrl, METERS_PER_DEG } from './geo';

const BASE_URL = globalThis.process?.env?.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';
const PLAYBACK_BUCKETS_PER_SECOND = 8;
const TRAIL_BUCKETS = 4;
const TRAIL_DECAY = 0.55;
const MAP_W = 1024;
const MAP_H = 640;

function formatBucketTime(windowStartIso, bucketMinutes, t) {
    const at = new Date(new Date(windowStartIso).getTime() + t * bucketMinutes * 60000);
    return at.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' }) + ' UTC';
}

/**
 * Spatial heat map with two modes:
 * - Floor-plan mode: activity projects onto the calibrated plan image.
 * - Map mode (no plan needed): activity heats a real map framed to the event's
 *   own photo footprint — spatial intelligence works out of the box; the plan
 *   is an upgrade, not a requirement.
 * Both share the scrubber/playback/live plumbing. Blob radius is the honesty
 * mechanism — indoor GPS reads as areas, not seats.
 */
export default function VenueHeatMap({ eventId }) {
    const [payload, setPayload] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [pos, setPos] = useState(0);
    const [playing, setPlaying] = useState(false);
    const [live, setLive] = useState(false);
    const [myPlans, setMyPlans] = useState(null);
    const [attaching, setAttaching] = useState(false);
    const canvasRef = useRef(null);
    const refetchTimerRef = useRef(null);

    const load = useCallback(async ({ keepPosition = false } = {}) => {
        if (!eventId) return;
        try {
            const data = await getEventHeatmap(eventId);
            setPayload(data);
            setError('');
            if (!keepPosition) {
                const lastActive = Math.max(
                    ...data.media.tuples.map((tuple) => tuple.t),
                    data.scans.totalsByBucket.reduce((max, n, t) => (n > 0 ? t : max), -1),
                    0
                );
                setPos(Math.min(lastActive, data.window.bucketCount - 1));
            }
        } catch (err) {
            setError(err?.data?.error || err?.message || 'Failed to load the heat map');
        } finally {
            setLoading(false);
        }
    }, [eventId]);

    useEffect(() => {
        setLoading(true);
        setPayload(null);
        setPlaying(false);
        setLive(false);
        setMyPlans(null);
        const timer = setTimeout(() => load(), 0);
        return () => clearTimeout(timer);
    }, [load]);

    const bucketCount = payload?.window.bucketCount ?? 0;
    const plan = payload?.floorPlan || null;
    const bbox = payload?.media?.bbox || null;

    // ── the view: plan-space or map-space ───────────────────────────────────
    const view = useMemo(() => {
        if (!payload) return null;
        if (plan) {
            return {
                mode: 'plan',
                width: plan.imageWidthPx,
                height: plan.imageHeightPx,
                project: (lat, lng) => {
                    const { xPx, yPx } = latLngToPlanPx(lat, lng, plan);
                    return { x: xPx, y: yPx };
                },
                metersToUnits: (m) => m / plan.metersPerPixel,
            };
        }
        if (!bbox) return null;
        const center = payload.clusters?.clusters?.[0]
            ? { lat: payload.clusters.clusters[0].centroidLat, lng: payload.clusters.clusters[0].centroidLng }
            : { lat: (bbox.minLat + bbox.maxLat) / 2, lng: (bbox.minLng + bbox.maxLng) / 2 };
        // Zoom to fit the photo footprint into ~60% of the frame.
        const cosLat = Math.cos((center.lat * Math.PI) / 180);
        const spanM = Math.max(
            60,
            (bbox.maxLat - bbox.minLat) * METERS_PER_DEG,
            (bbox.maxLng - bbox.minLng) * cosLat * METERS_PER_DEG
        );
        let zoom = 19;
        while (zoom > 14 && spanM > mapMetersPerPixel(center.lat, zoom) * MAP_W * 0.6) zoom--;
        const mpp = mapMetersPerPixel(center.lat, zoom);
        return {
            mode: 'map',
            width: MAP_W,
            height: MAP_H,
            bgUrl: staticMapUrl({ lat: center.lat, lng: center.lng, zoom, width: MAP_W, height: MAP_H }),
            project: (lat, lng) => ({
                x: MAP_W / 2 + ((lng - center.lng) * cosLat * METERS_PER_DEG) / mpp,
                y: MAP_H / 2 - ((lat - center.lat) * METERS_PER_DEG) / mpp,
            }),
            metersToUnits: (m) => m / mpp,
        };
    }, [payload, plan, bbox]);

    // Projected tuples + off-frame count.
    const projected = useMemo(() => {
        if (!view || !payload) return { tuples: [], offPlan: 0 };
        const tuples = [];
        let offPlan = 0;
        for (const tuple of payload.media.tuples) {
            const { x, y } = view.project(tuple.lat, tuple.lng);
            if (x < 0 || x > view.width || y < 0 || y > view.height) {
                offPlan += tuple.n;
                continue;
            }
            tuples.push({ x, y, t: tuple.t, n: tuple.n });
        }
        return { tuples, offPlan };
    }, [payload, view]);

    const clusterRings = useMemo(() => {
        if (!view || !payload) return [];
        return (payload.clusters.clusters || [])
            .map((cluster) => {
                const { x, y } = view.project(cluster.centroidLat, cluster.centroidLng);
                return { x, y, r: Math.max(12, view.metersToUnits(cluster.radiusM)), count: cluster.count };
            })
            .filter((ring) => ring.x > -ring.r && ring.x < view.width + ring.r && ring.y > -ring.r && ring.y < view.height + ring.r);
    }, [payload, view]);

    // Per-bucket totals for the activity ribbon.
    const ribbon = useMemo(() => {
        if (!payload) return [];
        const photos = new Array(bucketCount).fill(0);
        for (const tuple of payload.media.tuples) photos[tuple.t] += tuple.n;
        return photos.map((count, t) => ({
            photos: count,
            scans: payload.scans.totalsByBucket[t] || 0,
            chat: payload.chat.totalsByBucket[t] || 0,
        }));
    }, [payload, bucketCount]);
    const ribbonMax = useMemo(
        () => Math.max(1, ...ribbon.map((bucket) => bucket.photos + bucket.scans + bucket.chat)),
        [ribbon]
    );

    // ── canvas heat pass ────────────────────────────────────────────────────
    const draw = useCallback((atBucket) => {
        const canvas = canvasRef.current;
        if (!canvas || !view) return;
        const cssWidth = canvas.clientWidth;
        const cssHeight = canvas.clientHeight;
        if (!cssWidth) return;
        const dpr = window.devicePixelRatio || 1;
        if (canvas.width !== Math.round(cssWidth * dpr)) {
            canvas.width = Math.round(cssWidth * dpr);
            canvas.height = Math.round(cssHeight * dpr);
        }
        const ctx = canvas.getContext('2d');
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, cssWidth, cssHeight);
        ctx.globalCompositeOperation = 'lighter';

        const displayScale = cssWidth / view.width;
        // Blur floor of 8 real-world meters — the honesty radius for GPS.
        const radius = Math.max(18, view.metersToUnits(8) * displayScale);

        for (const tuple of projected.tuples) {
            const age = atBucket - tuple.t;
            if (age < 0 || age >= TRAIL_BUCKETS) continue;
            const weight = tuple.n * TRAIL_DECAY ** age;
            const alpha = Math.min(0.55, 0.16 + weight * 0.1);
            const x = tuple.x * displayScale;
            const y = tuple.y * displayScale;
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
            gradient.addColorStop(0, `rgba(216, 74, 255, ${alpha})`);
            gradient.addColorStop(0.55, `rgba(216, 74, 255, ${alpha * 0.4})`);
            gradient.addColorStop(1, 'rgba(216, 74, 255, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }, [view, projected]);

    useEffect(() => {
        draw(pos);
    }, [draw, pos]);

    // Playback loop.
    useEffect(() => {
        if (!playing || !bucketCount) return undefined;
        const interval = setInterval(() => {
            setPos((cur) => {
                if (cur >= bucketCount - 1) {
                    setPlaying(false);
                    return cur;
                }
                return cur + 1;
            });
        }, 1000 / PLAYBACK_BUCKETS_PER_SECOND);
        return () => clearInterval(interval);
    }, [playing, bucketCount]);

    // Live mode: pin to the latest bucket + debounce-refetch on SSE scan/media events.
    const isLiveWindow = useMemo(() => {
        if (!payload) return false;
        const now = Date.now();
        return now >= new Date(payload.window.startIso).getTime() && now <= new Date(payload.window.endIso).getTime();
    }, [payload]);

    useEffect(() => {
        if (!live || !payload) return undefined;
        setPlaying(false);
        const nowBucket = () => Math.min(
            bucketCount - 1,
            Math.max(0, Math.floor((Date.now() - new Date(payload.window.startIso).getTime()) / (payload.window.bucketMinutes * 60000)))
        );
        setPos(nowBucket());

        const token = authStorage.getToken();
        let es;
        if (token) {
            const refetch = () => {
                clearTimeout(refetchTimerRef.current);
                refetchTimerRef.current = setTimeout(() => load({ keepPosition: true }), 5000);
            };
            es = new EventSource(`${BASE_URL}/api/analytics/events/${eventId}/live-ops/stream?token=${encodeURIComponent(token)}`);
            es.addEventListener('scan', refetch);
            es.addEventListener('media', refetch);
        }
        const tick = setInterval(() => setPos(nowBucket()), 30000);
        return () => {
            es?.close();
            clearInterval(tick);
            clearTimeout(refetchTimerRef.current);
        };
    }, [live, payload, bucketCount, eventId, load]);

    const openAttachPicker = async () => {
        try {
            const res = await listFloorPlans();
            setMyPlans(res.floorPlans || []);
        } catch {
            setMyPlans([]);
        }
    };

    const attach = async (floorPlanId) => {
        setAttaching(true);
        try {
            await attachFloorPlan(eventId, floorPlanId);
            setMyPlans(null);
            setLoading(true);
            await load();
        } catch (err) {
            setError(err?.data?.error || err?.message || 'Could not attach the floor plan');
        } finally {
            setAttaching(false);
        }
    };

    const detach = async () => {
        if (!window.confirm('Detach this floor plan from the event? The heat map falls back to the area map.')) return;
        try {
            await detachFloorPlan(eventId);
            setLoading(true);
            await load();
        } catch (err) {
            setError(err?.data?.error || err?.message || 'Could not detach the floor plan');
        }
    };

    // ── states ──────────────────────────────────────────────────────────────
    if (loading) {
        return <div className="h-72 animate-pulse rounded-2xl bg-white/[0.035]" />;
    }
    if (error && !payload) {
        return <div className="rounded-2xl bg-white/[0.035] p-6 text-sm text-zinc-400">{error}</div>;
    }
    if (!payload) return null;

    // Nothing to place anywhere: no plan AND no geotagged media.
    if (!view) {
        return (
            <div className="rounded-2xl bg-white/[0.035] p-6">
                <p className="text-sm font-bold text-white">The heat map fills in as the night happens</p>
                <p className="mt-1 max-w-xl text-sm leading-6 text-zinc-500">
                    No geotagged photos yet — as guests shoot, activity heats a map of the venue automatically.
                    Attaching a calibrated floor plan upgrades it to room-level.
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                    <button type="button" onClick={openAttachPicker} className="pill-solid px-4 py-2 text-xs">Attach a saved plan</button>
                    <Link href={`/dashboard/floor-plans?eventId=${eventId}`} className="pill-ghost px-4 py-2 text-xs font-bold tracking-[0.02em]">
                        Calibrate a new floor plan
                    </Link>
                </div>
                {myPlans ? (
                    <div className="mt-4 space-y-2">
                        {myPlans.length === 0 ? (
                            <p className="text-xs text-zinc-500">No saved plans on this account yet — calibrate one first.</p>
                        ) : (
                            myPlans.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    disabled={attaching}
                                    onClick={() => attach(item.id)}
                                    className="flex w-full items-center gap-3 rounded-2xl bg-white/[0.045] p-3 text-left transition hover:bg-white/[0.08] disabled:opacity-50"
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={item.imageUrl} alt="" className="h-10 w-14 rounded-lg object-cover" />
                                    <span className="min-w-0">
                                        <span className="block truncate text-sm font-bold text-white">{item.name}</span>
                                        <span className="block text-xs text-zinc-500">{item.attachedEventCount || 0} event{(item.attachedEventCount || 0) === 1 ? '' : 's'} use this plan</span>
                                    </span>
                                </button>
                            ))
                        )}
                    </div>
                ) : null}
                {error ? <p className="mt-3 text-xs font-semibold text-red-300">{error}</p> : null}
            </div>
        );
    }

    const hasAnyData = projected.tuples.length > 0 || payload.scans.total > 0;
    const bucketLabel = formatBucketTime(payload.window.startIso, payload.window.bucketMinutes, pos);
    const gateCountsAt = (gate) => {
        const series = payload.scans.byGate.find((entry) => entry.gate === gate);
        if (!series) return 0;
        let count = 0;
        for (const [t, n] of series.counts) {
            if (t <= pos && t > pos - TRAIL_BUCKETS) count += n;
        }
        return count;
    };

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                    <p className="text-sm font-bold text-white">{plan ? plan.name : 'Where the night happened'}</p>
                    {view.mode === 'map' ? (
                        <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[11px] font-medium text-zinc-400">
                            Auto-mapped from photo GPS
                        </span>
                    ) : null}
                    {projected.offPlan > 0 ? (
                        <span
                            className="rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-200"
                            title="Geotagged photos that land outside this frame — GPS drift or calibration worth checking"
                        >
                            {projected.offPlan} off-frame
                        </span>
                    ) : null}
                </div>
                <div className="flex items-center gap-2">
                    {isLiveWindow ? (
                        <button
                            type="button"
                            onClick={() => setLive((v) => !v)}
                            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                                live ? 'bg-emerald-400/15 text-emerald-200' : 'bg-white/[0.07] text-zinc-300 hover:bg-white/[0.12]'
                            }`}
                        >
                            <span className={`h-1.5 w-1.5 rounded-full ${live ? 'animate-pulse bg-emerald-300' : 'bg-zinc-500'}`} />
                            Live
                        </button>
                    ) : null}
                    {plan ? (
                        <>
                            <Link
                                href={`/dashboard/floor-plans?planId=${plan.id}`}
                                className="rounded-full bg-white/[0.07] px-3.5 py-1.5 text-xs font-medium text-zinc-300 transition hover:bg-white/[0.12] hover:text-white"
                            >
                                Recalibrate
                            </Link>
                            <button
                                type="button"
                                onClick={detach}
                                className="rounded-full bg-white/[0.07] px-3.5 py-1.5 text-xs font-medium text-zinc-400 transition hover:bg-red-500/15 hover:text-red-200"
                            >
                                Detach
                            </button>
                        </>
                    ) : (
                        <button
                            type="button"
                            onClick={openAttachPicker}
                            className="rounded-full bg-white/[0.07] px-3.5 py-1.5 text-xs font-medium text-zinc-300 transition hover:bg-white/[0.12] hover:text-white"
                        >
                            Upgrade with a floor plan
                        </button>
                    )}
                </div>
            </div>

            {myPlans && !plan ? (
                <div className="space-y-2 rounded-2xl bg-white/[0.035] p-3">
                    {myPlans.length === 0 ? (
                        <p className="text-xs text-zinc-500">
                            No saved plans yet — <Link href={`/dashboard/floor-plans?eventId=${eventId}`} className="text-zinc-300 underline">calibrate one</Link>.
                        </p>
                    ) : (
                        myPlans.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                disabled={attaching}
                                onClick={() => attach(item.id)}
                                className="flex w-full items-center gap-3 rounded-2xl bg-white/[0.045] p-3 text-left transition hover:bg-white/[0.08] disabled:opacity-50"
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={item.imageUrl} alt="" className="h-10 w-14 rounded-lg object-cover" />
                                <span className="min-w-0">
                                    <span className="block truncate text-sm font-bold text-white">{item.name}</span>
                                    <span className="block text-xs text-zinc-500">{item.attachedEventCount || 0} event{(item.attachedEventCount || 0) === 1 ? '' : 's'} use this plan</span>
                                </span>
                            </button>
                        ))
                    )}
                </div>
            ) : null}

            <div
                className="relative w-full overflow-hidden rounded-[1.25rem] bg-[#0b0b0f] ring-1 ring-white/[0.07]"
                style={{ aspectRatio: `${view.width} / ${view.height}`, maxHeight: 560 }}
            >
                {view.mode === 'plan' ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={plan.imageUrl}
                        alt="Venue floor plan"
                        className="absolute inset-0 h-full w-full object-contain"
                        style={{ filter: 'brightness(0.55) saturate(0.4)' }}
                        draggable={false}
                    />
                ) : view.bgUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={view.bgUrl}
                        alt="Area map"
                        className="absolute inset-0 h-full w-full object-cover"
                        style={{ filter: 'brightness(0.75)' }}
                        draggable={false}
                    />
                ) : null}
                <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
                <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox={`0 0 ${view.width} ${view.height}`} preserveAspectRatio="xMidYMid meet">
                    {clusterRings.map((ring, index) => (
                        <circle
                            key={index}
                            cx={ring.x}
                            cy={ring.y}
                            r={ring.r}
                            fill="none"
                            stroke="rgba(216,74,255,0.35)"
                            strokeWidth={Math.max(1.5, view.width / 500)}
                            strokeDasharray={`${view.width / 120} ${view.width / 200}`}
                        />
                    ))}
                </svg>
                {plan ? (plan.gatePins || []).map((pin) => {
                    const recent = gateCountsAt(pin.gate);
                    return (
                        <span
                            key={pin.gate}
                            className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
                            style={{ left: `${(pin.xPx / plan.imageWidthPx) * 100}%`, top: `${(pin.yPx / plan.imageHeightPx) * 100}%` }}
                        >
                            <span className={`block rounded-full px-2 py-0.5 text-[10px] font-bold shadow-lg ${recent > 0 ? 'bg-emerald-400 text-black' : 'bg-black/70 text-white ring-1 ring-white/20'}`}>
                                {pin.gate}{recent > 0 ? ` +${recent}` : ''}
                            </span>
                        </span>
                    );
                }) : null}
                {view.mode === 'map' ? (
                    <p className="absolute bottom-1.5 right-2 z-10 text-[9px] text-white/40">© OpenStreetMap contributors, © Geoapify</p>
                ) : null}
                {!hasAnyData ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <p className="max-w-sm px-6 text-center text-sm leading-6 text-zinc-300">
                            No geotagged photos or scans in this event&apos;s window yet — the heat map fills in as the night happens.
                        </p>
                    </div>
                ) : null}
            </div>

            {/* Transport: play/scrub + activity ribbon. */}
            <div className="rounded-2xl bg-white/[0.035] p-3">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => { setLive(false); setPlaying((v) => !v); }}
                        disabled={!hasAnyData}
                        aria-label={playing ? 'Pause playback' : 'Play the night back'}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-black transition hover:bg-zinc-200 disabled:opacity-40"
                    >
                        <HugeiconsIcon icon={playing ? PauseIcon : PlayIcon} size={16} />
                    </button>
                    <input
                        type="range"
                        min="0"
                        max={Math.max(0, bucketCount - 1)}
                        step="1"
                        value={pos}
                        onChange={(e) => { setLive(false); setPlaying(false); setPos(Number(e.target.value)); }}
                        className="w-full accent-[#d84aff]"
                        aria-label="Scrub through the event window"
                    />
                    <span className="shrink-0 text-xs font-bold tabular-nums text-zinc-300">{bucketLabel}</span>
                </div>
                <div className="mt-2 flex h-9 items-end gap-px" aria-hidden="true">
                    {ribbon.map((bucket, t) => {
                        const total = bucket.photos + bucket.scans + bucket.chat;
                        return (
                            <button
                                key={t}
                                type="button"
                                tabIndex={-1}
                                onClick={() => { setLive(false); setPlaying(false); setPos(t); }}
                                className="min-w-0 flex-1 rounded-t-sm transition-colors"
                                style={{
                                    height: `${Math.max(6, (total / ribbonMax) * 100)}%`,
                                    backgroundColor: t === pos ? '#d84aff' : total > 0 ? 'rgba(216,74,255,0.35)' : 'rgba(255,255,255,0.06)',
                                }}
                            />
                        );
                    })}
                </div>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] font-medium text-zinc-500">
                    <span>
                        {payload.media.totalGeotagged.toLocaleString('en-US')} geotagged photos · {payload.scans.total.toLocaleString('en-US')} scans
                        {payload.media.truncated ? ' · capped at 3,000 photos' : ''}
                        {payload.media.outsideWindow > 0 ? ` · ${payload.media.outsideWindow} outside the window` : ''}
                    </span>
                    <span>Heat reads as ~8 m areas — GPS is approximate by nature.</span>
                </div>
            </div>
        </div>
    );
}
