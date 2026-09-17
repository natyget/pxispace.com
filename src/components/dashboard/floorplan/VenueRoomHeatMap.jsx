'use client';

// VEN-3: the venue-level heat map. Every night in the room combined (GET /api/venue-analytics/:id/heatmap).
// A still picture, not playback: where captures happen across all nights, gate totals, and an average night.
// Cells under five captures never reach the client, so nothing here can point at one person. Projection uses the
// same geo.js as the per-event VenueHeatMap, and the colour comes from chartStyles.js.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DASHBOARD_BRAND_COLOR, getDashboardChartShade } from '@/components/dashboard/chartStyles';
import { fetchVenueHeatmap } from '@/services/venues';
import { latLngToPlanPx, mapMetersPerPixel, staticMapUrl, METERS_PER_DEG } from './geo';

const MAP_W = 1024;
const MAP_H = 640;

function rgba(hex, alpha) {
    const n = parseInt(hex.replace('#', ''), 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

function minutesLabel(m) {
    if (m === 0) return 'Doors';
    const sign = m < 0 ? '-' : '+';
    const abs = Math.abs(m);
    return `${sign}${Math.floor(abs / 60)}h${abs % 60 ? String(abs % 60).padStart(2, '0') : ''}`;
}

export default function VenueRoomHeatMap({ venueId }) {
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const canvasRef = useRef(null);

    useEffect(() => {
        let cancelled = false;
        fetchVenueHeatmap(venueId)
            .then((res) => { if (!cancelled) setData(res.heatmap); })
            .catch((err) => { if (!cancelled) setError(err.message || 'Failed to load the heat map'); });
        return () => { cancelled = true; };
    }, [venueId]);

    const plan = data?.floorPlan || null;
    const cells = useMemo(() => data?.media?.cells ?? [], [data]);
    const bbox = data?.media?.bbox || null;

    const view = useMemo(() => {
        if (!data) return null;
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
        const center = { lat: (bbox.minLat + bbox.maxLat) / 2, lng: (bbox.minLng + bbox.maxLng) / 2 };
        const cosLat = Math.cos((center.lat * Math.PI) / 180);
        const spanM = Math.max(60, (bbox.maxLat - bbox.minLat) * METERS_PER_DEG, (bbox.maxLng - bbox.minLng) * cosLat * METERS_PER_DEG);
        let zoom = 19;
        while (zoom > 14 && spanM > mapMetersPerPixel(center.lat, zoom) * MAP_W * 0.6) zoom -= 1;
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
    }, [data, plan, bbox]);

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas || !view) return;
        const cssWidth = canvas.clientWidth;
        const cssHeight = canvas.clientHeight;
        if (!cssWidth) return;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.round(cssWidth * dpr);
        canvas.height = Math.round(cssHeight * dpr);
        const ctx = canvas.getContext('2d');
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, cssWidth, cssHeight);
        ctx.globalCompositeOperation = 'lighter';
        const scale = cssWidth / view.width;
        // Indoor GPS reads as areas, not seats: never draw tighter than 8 real metres.
        const radius = Math.max(18, view.metersToUnits(8) * scale);
        const max = Math.max(1, ...cells.map((c) => c.n));
        for (const cell of cells) {
            const { x, y } = view.project(cell.lat, cell.lng);
            const alpha = Math.min(0.6, 0.18 + (cell.n / max) * 0.42);
            const px = x * scale;
            const py = y * scale;
            const gradient = ctx.createRadialGradient(px, py, 0, px, py, radius);
            gradient.addColorStop(0, rgba(DASHBOARD_BRAND_COLOR, alpha));
            gradient.addColorStop(0.55, rgba(DASHBOARD_BRAND_COLOR, alpha * 0.4));
            gradient.addColorStop(1, rgba(DASHBOARD_BRAND_COLOR, 0));
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(px, py, radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }, [view, cells]);

    useEffect(() => {
        draw();
        window.addEventListener('resize', draw);
        return () => window.removeEventListener('resize', draw);
    }, [draw]);

    if (error) return <p className="text-sm text-red-300">{error}</p>;
    if (!data) return <div className="h-64 animate-pulse rounded-2xl bg-white/[0.035]" />;

    const timelineMax = Math.max(1, ...data.timeline.map((t) => t.captures + t.scans));
    const hasTimeline = data.timeline.some((t) => t.captures + t.scans > 0);

    return (
        <div className="space-y-4">
            {view ? (
                <div className="relative w-full overflow-hidden rounded-2xl bg-black/40" style={{ aspectRatio: `${view.width} / ${view.height}` }}>
                    {view.mode === 'plan' ? (
                        <img src={plan.imageUrl} alt="Floor plan" className="absolute inset-0 h-full w-full object-contain" style={{ filter: 'brightness(0.7)' }} draggable={false} />
                    ) : view.bgUrl ? (
                        <img src={view.bgUrl} alt="Area map" className="absolute inset-0 h-full w-full object-cover" style={{ filter: 'brightness(0.75)' }} draggable={false} />
                    ) : null}
                    <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
                    {plan ? (plan.gatePins || []).map((pin) => {
                        const total = data.gates.find((g) => g.gate === pin.gate)?.scans ?? 0;
                        return (
                            <span key={pin.gate} className="absolute z-10 -translate-x-1/2 -translate-y-1/2" style={{ left: `${(pin.xPx / plan.imageWidthPx) * 100}%`, top: `${(pin.yPx / plan.imageHeightPx) * 100}%` }}>
                                <span className="block rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-bold text-white ring-1 ring-white/20">
                                    {pin.gate} · {total.toLocaleString()}
                                </span>
                            </span>
                        );
                    }) : null}
                    {view.mode === 'map' ? <p className="absolute bottom-1.5 right-2 z-10 text-[9px] text-white/40">© OpenStreetMap contributors, © Geoapify</p> : null}
                </div>
            ) : (
                <div className="rounded-2xl bg-white/[0.035] p-6">
                    <p className="text-sm font-semibold text-white">The room map fills in as nights happen</p>
                    <p className="mt-1 max-w-xl text-sm leading-6 text-white/50">
                        When guests take photos at your events, the busiest spots in the room light up here, combined over every night.
                    </p>
                </div>
            )}

            <p className="text-[12px] leading-5 text-white/45">
                {data.nights} {data.nights === 1 ? 'night' : 'nights'} combined · {data.media.geotagged.toLocaleString()} located captures
                {data.media.suppressed ? ` · ${data.media.suppressed.toLocaleString()} in quiet spots are not placed, so no one can be singled out` : ''}
                {data.media.truncated ? ' · capped for speed' : ''}
            </p>

            <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
                <div className="rounded-2xl bg-white/[0.035] p-4">
                    <p className="mb-2 text-[11px] font-medium text-white/40">Doors used</p>
                    {data.gates.length ? (
                        <ul className="space-y-1.5">
                            {data.gates.map((g, i) => (
                                <li key={g.gate} className="flex items-center gap-2 text-[13px] text-white/70">
                                    <span className="h-2 w-2 rounded-full" style={{ background: getDashboardChartShade(i) }} />
                                    <span className="flex-1">{g.gate}</span>
                                    <span className="tabular-nums text-white/50">{g.scans.toLocaleString()}</span>
                                </li>
                            ))}
                        </ul>
                    ) : <p className="text-[13px] text-white/45">No scans yet.</p>}
                </div>
                <div className="rounded-2xl bg-white/[0.035] p-4">
                    <p className="mb-2 text-[11px] font-medium text-white/40">An average night</p>
                    {hasTimeline ? (
                        <>
                            {/* Columns stretch to the strip's fixed height, so the bars' percentage heights resolve
                                (QA 2026-09-17, V3-08b: with items-end the columns had no height and drew nothing). */}
                            <div className="flex h-24 gap-px" role="img" aria-label="Captures and door scans per 15 minutes, averaged over nights">
                                {data.timeline.map((t) => (
                                    <div key={t.minutesFromDoors} className="flex h-full min-w-0 flex-1 flex-col justify-end" title={`${minutesLabel(t.minutesFromDoors)}: ${t.scans} scans, ${t.captures} captures`}>
                                        <div style={{ height: `${(t.captures / timelineMax) * 100}%`, background: getDashboardChartShade(0) }} className="rounded-t-sm" />
                                        <div style={{ height: `${(t.scans / timelineMax) * 100}%`, background: getDashboardChartShade(1) }} />
                                    </div>
                                ))}
                            </div>
                            <div className="mt-1 flex justify-between text-[10px] text-white/35">
                                <span>2h before doors</span><span>Doors</span><span>+8h</span>
                            </div>
                            <div className="mt-2 flex gap-4 text-[11px] text-white/50">
                                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: getDashboardChartShade(0) }} />Captures</span>
                                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: getDashboardChartShade(1) }} />Door scans</span>
                            </div>
                        </>
                    ) : <p className="text-[13px] text-white/45">Appears after the first night with scans or photos.</p>}
                </div>
            </div>
        </div>
    );
}
