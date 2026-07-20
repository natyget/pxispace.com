'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { uploadImageToR2 } from '@/services/media';
import { getEventHeatmap } from '@/services/floorPlans';
import { METERS_PER_DEG, mapMetersPerPixel, staticMapUrl, panMapCenter } from './geo';

// Logical canvas size — the static map is requested at exactly this size and the
// stage is CSS-scaled to fit, so pointer math converts via rect.width/CANVAS_W.
const CANVAS_W = 1024;
const CANVAS_H = 640;
const MIN_ZOOM = 15;
const MAX_ZOOM = 20;

const fieldCls = 'glass-field w-full rounded-xl px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-500';

/**
 * Calibrate a floor-plan image over a static map of the venue: drag to
 * position, pull the corner handle to scale, slide to rotate. The stored
 * truth is the 4-DOF similarity transform (anchor lat/lng at image center,
 * rotation, meters-per-pixel) — screen placement is derived from it each
 * render, so panning/zooming the map never drifts the calibration.
 *
 * Gate placement is selection-driven: the parent wizard owns the venue's
 * gate list; pick a chip here (or in the aside list) then click the plan to
 * drop/move its pin. There is no free-text pin entry — that was the
 * confusing part of the old flow.
 */
export default function PlanCalibrationStage({
    imageUrl,
    setImageUrl,
    imageDims,
    setImageDims,
    calib,
    setCalib,
    gates,
    placingGateId,
    setPlacingGateId,
    onPlaceGate,
    onUnplaceGate,
    seedCenter,
    eventId = null,
}) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [opacity, setOpacity] = useState(0.7);
    const [mapBroken, setMapBroken] = useState(false);
    const [eventPoints, setEventPoints] = useState([]); // media capture points from the event's DBSCAN payload
    const [eventBbox, setEventBbox] = useState(null);

    const initialCenter =
        calib.anchorLat != null && calib.anchorLng != null
            ? { lat: calib.anchorLat, lng: calib.anchorLng }
            : seedCenter && seedCenter.lat != null && seedCenter.lng != null
              ? seedCenter
              : { lat: 40.7128, lng: -74.006 };
    const [map, setMap] = useState({ center: initialCenter, zoom: 18 });

    const stageRef = useRef(null);
    const dragRef = useRef(null); // { kind: 'plan'|'map'|'scale', lastX, lastY, ... }
    const [mapUrlCommitted, setMapUrlCommitted] = useState(null);
    const [mapOffset, setMapOffset] = useState({ dx: 0, dy: 0 }); // visual-only offset while panning

    useEffect(() => {
        setMapUrlCommitted(staticMapUrl({ lat: map.center.lat, lng: map.center.lng, zoom: map.zoom, width: CANVAS_W, height: CANVAS_H }));
        setMapOffset({ dx: 0, dy: 0 });
    }, [map]);

    // Event-based alignment aid: pull the event's real photo points so the
    // plan can be lined up against where people actually shot.
    useEffect(() => {
        if (!eventId) return undefined;
        let cancelled = false;
        getEventHeatmap(eventId)
            .then((payload) => {
                if (cancelled) return;
                setEventPoints((payload.media?.tuples || []).slice(0, 400));
                setEventBbox(payload.media?.bbox || null);
            })
            .catch(() => {});
        return () => {
            cancelled = true;
        };
    }, [eventId]);

    const centerOnEventPhotos = () => {
        if (!eventBbox) return;
        const centerLat = (eventBbox.minLat + eventBbox.maxLat) / 2;
        const centerLng = (eventBbox.minLng + eventBbox.maxLng) / 2;
        setMap((cur) => ({ ...cur, center: { lat: centerLat, lng: centerLng } }));
    };

    const mapMpp = mapMetersPerPixel(map.center.lat, map.zoom);
    const cosLat = Math.cos((map.center.lat * Math.PI) / 180);

    // Derived screen placement of the plan (logical canvas px).
    const screen = useMemo(() => {
        if (!imageDims || calib.anchorLat == null || calib.anchorLng == null) return null;
        const cx = CANVAS_W / 2 + ((calib.anchorLng - map.center.lng) * cosLat * METERS_PER_DEG) / mapMpp;
        const cy = CANVAS_H / 2 - ((calib.anchorLat - map.center.lat) * METERS_PER_DEG) / mapMpp;
        const s = calib.metersPerPixel / mapMpp; // screen px per image px
        return { cx, cy, s };
    }, [calib, map, imageDims, cosLat, mapMpp]);

    const toLogical = useCallback((clientX, clientY) => {
        const rect = stageRef.current?.getBoundingClientRect();
        if (!rect) return { x: 0, y: 0, scale: 1 };
        const scale = CANVAS_W / rect.width;
        return { x: (clientX - rect.left) * scale, y: (clientY - rect.top) * scale, scale };
    }, []);

    const pickImage = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        setUploading(true);
        setError('');
        try {
            const publicUrl = await uploadImageToR2(file, {
                filename: `floorplan_${Date.now()}.${(file.name?.split('.').pop() || 'png').toLowerCase()}`,
                contentType: file.type || 'image/png',
            });
            const dims = await new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
                img.onerror = () => reject(new Error('Could not read the image'));
                img.src = publicUrl;
            });
            setImageUrl(publicUrl);
            setImageDims(dims);
            // Sensible starting scale: plan spans ~60% of the canvas width. Seed the
            // anchor from the current map center the first time a plan is attached.
            setCalib((cur) => ({
                ...cur,
                anchorLat: cur.anchorLat ?? map.center.lat,
                anchorLng: cur.anchorLng ?? map.center.lng,
                metersPerPixel: (mapMpp * CANVAS_W * 0.6) / dims.w,
            }));
        } catch (err) {
            setError(err?.message || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const removeImage = () => {
        setImageUrl('');
        setImageDims(null);
    };

    // ── pointer interactions ────────────────────────────────────────────────
    const onStagePointerDown = (e) => {
        if (!screen) {
            dragRef.current = { kind: 'map', lastX: e.clientX, lastY: e.clientY, moved: 0 };
            e.currentTarget.setPointerCapture(e.pointerId);
            return;
        }
        const { x, y } = toLogical(e.clientX, e.clientY);

        if (placingGateId && imageDims) {
            // Click → image-pixel coords via inverse of the screen transform.
            const theta = (-calib.rotationDeg * Math.PI) / 180;
            const dx = x - screen.cx;
            const dy = y - screen.cy;
            const rx = dx * Math.cos(theta) - dy * Math.sin(theta);
            const ry = dx * Math.sin(theta) + dy * Math.cos(theta);
            const xPx = Math.round(imageDims.w / 2 + rx / screen.s);
            const yPx = Math.round(imageDims.h / 2 + ry / screen.s);
            if (xPx >= 0 && xPx <= imageDims.w && yPx >= 0 && yPx <= imageDims.h) {
                onPlaceGate(placingGateId, xPx, yPx);
                setPlacingGateId(null);
            }
            return;
        }

        // Hit-test the (rotated) plan rect for drag-vs-pan.
        let onPlan = false;
        if (imageDims) {
            const theta = (-calib.rotationDeg * Math.PI) / 180;
            const dx = x - screen.cx;
            const dy = y - screen.cy;
            const rx = dx * Math.cos(theta) - dy * Math.sin(theta);
            const ry = dx * Math.sin(theta) + dy * Math.cos(theta);
            onPlan = Math.abs(rx) <= (imageDims.w * screen.s) / 2 && Math.abs(ry) <= (imageDims.h * screen.s) / 2;
        }
        dragRef.current = { kind: onPlan ? 'plan' : 'map', lastX: e.clientX, lastY: e.clientY, moved: 0 };
        e.currentTarget.setPointerCapture(e.pointerId);
    };

    const onStagePointerMove = (e) => {
        const drag = dragRef.current;
        if (!drag) return;
        const rect = stageRef.current?.getBoundingClientRect();
        const logicalScale = rect ? CANVAS_W / rect.width : 1;
        const dx = (e.clientX - drag.lastX) * logicalScale;
        const dy = (e.clientY - drag.lastY) * logicalScale;
        drag.lastX = e.clientX;
        drag.lastY = e.clientY;
        drag.moved += Math.abs(dx) + Math.abs(dy);

        if (drag.kind === 'plan') {
            setCalib((cur) => ({
                ...cur,
                anchorLng: cur.anchorLng + (dx * mapMpp) / (cosLat * METERS_PER_DEG),
                anchorLat: cur.anchorLat - (dy * mapMpp) / METERS_PER_DEG,
            }));
        } else if (drag.kind === 'map') {
            setMapOffset((cur) => ({ dx: cur.dx + dx, dy: cur.dy + dy }));
        } else if (drag.kind === 'scale' && screen) {
            const { x, y } = toLogical(e.clientX, e.clientY);
            const dist = Math.hypot(x - screen.cx, y - screen.cy);
            if (drag.startDist > 4 && dist > 4) {
                const ratio = dist / drag.startDist;
                setCalib((cur) => ({ ...cur, metersPerPixel: drag.startMpp * ratio }));
            }
        }
    };

    const onStagePointerUp = () => {
        const drag = dragRef.current;
        dragRef.current = null;
        if (drag?.kind === 'map' && drag.moved > 2) {
            // Commit the visual pan into a new map center + fresh tile.
            setMapOffset((offset) => {
                setMap((cur) => ({ ...cur, center: panMapCenter(cur.center, offset.dx, offset.dy, cur.zoom) }));
                return { dx: 0, dy: 0 };
            });
        }
    };

    const onScaleHandleDown = (e) => {
        if (!screen) return;
        e.stopPropagation();
        const { x, y } = toLogical(e.clientX, e.clientY);
        dragRef.current = {
            kind: 'scale',
            lastX: e.clientX,
            lastY: e.clientY,
            startDist: Math.hypot(x - screen.cx, y - screen.cy),
            startMpp: calib.metersPerPixel,
            moved: 0,
        };
        stageRef.current?.setPointerCapture(e.pointerId);
    };

    const planWidthMeters = imageDims && calib.metersPerPixel ? imageDims.w * calib.metersPerPixel : 0;
    const placedCount = gates.filter((gate) => gate.xPx != null && gate.yPx != null).length;
    const placingGate = placingGateId ? gates.find((gate) => gate.id === placingGateId) : null;

    return (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
            <div>
                {placingGate ? (
                    <p className="mb-2 rounded-xl bg-[#d84aff]/15 px-3 py-2 text-xs font-bold text-[#f0b8ff]">
                        Placing &ldquo;{placingGate.gate}&rdquo; — click the plan to drop its pin.
                    </p>
                ) : null}
                <div
                    ref={stageRef}
                    className="relative w-full touch-none select-none overflow-hidden rounded-[1.25rem] bg-[#0b0b0f] ring-1 ring-white/[0.07]"
                    style={{ aspectRatio: `${CANVAS_W} / ${CANVAS_H}`, cursor: placingGateId ? 'crosshair' : 'grab' }}
                    onPointerDown={onStagePointerDown}
                    onPointerMove={onStagePointerMove}
                    onPointerUp={onStagePointerUp}
                    onPointerCancel={onStagePointerUp}
                >
                    {mapUrlCommitted && !mapBroken ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={mapUrlCommitted}
                            alt=""
                            draggable={false}
                            onError={() => setMapBroken(true)}
                            className="absolute inset-0 h-full w-full object-cover"
                            style={{ transform: `translate(${(mapOffset.dx / CANVAS_W) * 100}%, ${(mapOffset.dy / CANVAS_H) * 100}%)` }}
                        />
                    ) : (
                        <div
                            className="absolute inset-0"
                            style={{
                                backgroundImage:
                                    'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
                                backgroundSize: '40px 40px',
                            }}
                        />
                    )}

                    {/* Real photo locations from the event — the alignment truth layer. */}
                    {eventPoints.map((point, index) => {
                        const px = CANVAS_W / 2 + ((point.lng - map.center.lng) * cosLat * METERS_PER_DEG) / mapMpp + mapOffset.dx;
                        const py = CANVAS_H / 2 - ((point.lat - map.center.lat) * METERS_PER_DEG) / mapMpp + mapOffset.dy;
                        if (px < -10 || px > CANVAS_W + 10 || py < -10 || py > CANVAS_H + 10) return null;
                        return (
                            <span
                                key={index}
                                className="pointer-events-none absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-300/80 ring-1 ring-black/40"
                                style={{ left: `${(px / CANVAS_W) * 100}%`, top: `${(py / CANVAS_H) * 100}%` }}
                            />
                        );
                    })}

                    {imageUrl && imageDims && screen ? (
                        <>
                            {/* The plan overlay — position derived from geo truth each render. */}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={imageUrl}
                                alt="Floor plan"
                                draggable={false}
                                className="absolute origin-center"
                                style={{
                                    left: `${((screen.cx + mapOffset.dx - (imageDims.w * screen.s) / 2) / CANVAS_W) * 100}%`,
                                    top: `${((screen.cy + mapOffset.dy - (imageDims.h * screen.s) / 2) / CANVAS_H) * 100}%`,
                                    width: `${((imageDims.w * screen.s) / CANVAS_W) * 100}%`,
                                    transform: `rotate(${calib.rotationDeg}deg)`,
                                    opacity,
                                }}
                            />
                            {/* Placed gate pins — click the label to re-select for a re-drop, × to unpin. */}
                            {gates
                                .filter((gate) => gate.xPx != null && gate.yPx != null)
                                .map((gate) => {
                                    const theta = (calib.rotationDeg * Math.PI) / 180;
                                    const rx = (gate.xPx - imageDims.w / 2) * screen.s;
                                    const ry = (gate.yPx - imageDims.h / 2) * screen.s;
                                    const px = screen.cx + mapOffset.dx + rx * Math.cos(theta) - ry * Math.sin(theta);
                                    const py = screen.cy + mapOffset.dy + rx * Math.sin(theta) + ry * Math.cos(theta);
                                    const active = placingGateId === gate.id;
                                    return (
                                        <span
                                            key={gate.id}
                                            className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
                                            style={{ left: `${(px / CANVAS_W) * 100}%`, top: `${(py / CANVAS_H) * 100}%` }}
                                            onPointerDown={(e) => e.stopPropagation()}
                                        >
                                            <span
                                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold text-white shadow-lg ${
                                                    active ? 'bg-emerald-400 text-black' : 'bg-[#d84aff]'
                                                }`}
                                            >
                                                <button type="button" onClick={() => setPlacingGateId(gate.id)} title="Click to reposition">
                                                    {gate.gate}
                                                </button>
                                                <button
                                                    type="button"
                                                    aria-label={`Unpin ${gate.gate}`}
                                                    onClick={() => onUnplaceGate(gate.id)}
                                                    className="text-white/80 hover:text-white"
                                                >
                                                    ×
                                                </button>
                                            </span>
                                        </span>
                                    );
                                })}
                            {/* Scale handle at the plan's bottom-right corner (unrotated frame). */}
                            <button
                                type="button"
                                aria-label="Resize floor plan"
                                onPointerDown={onScaleHandleDown}
                                className="absolute z-10 h-5 w-5 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize rounded-full bg-white shadow-lg ring-2 ring-black/30"
                                style={(() => {
                                    const theta = (calib.rotationDeg * Math.PI) / 180;
                                    const rx = (imageDims.w * screen.s) / 2;
                                    const ry = (imageDims.h * screen.s) / 2;
                                    const px = screen.cx + mapOffset.dx + rx * Math.cos(theta) - ry * Math.sin(theta);
                                    const py = screen.cy + mapOffset.dy + rx * Math.sin(theta) + ry * Math.cos(theta);
                                    return { left: `${(px / CANVAS_W) * 100}%`, top: `${(py / CANVAS_H) * 100}%` };
                                })()}
                            />
                        </>
                    ) : null}

                    {/* Zoom controls */}
                    <div className="absolute right-3 top-3 z-10 flex flex-col overflow-hidden rounded-xl bg-black/60 ring-1 ring-white/10">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setMap((cur) => ({ ...cur, zoom: Math.min(MAX_ZOOM, cur.zoom + 1) }));
                            }}
                            onPointerDown={(e) => e.stopPropagation()}
                            className="px-3 py-1.5 text-sm font-bold text-white hover:bg-white/10"
                        >
                            +
                        </button>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setMap((cur) => ({ ...cur, zoom: Math.max(MIN_ZOOM, cur.zoom - 1) }));
                            }}
                            onPointerDown={(e) => e.stopPropagation()}
                            className="border-t border-white/10 px-3 py-1.5 text-sm font-bold text-white hover:bg-white/10"
                        >
                            −
                        </button>
                    </div>
                    <p className="absolute bottom-1.5 right-2 z-10 text-[9px] text-white/40">© OpenStreetMap contributors, © Geoapify</p>
                </div>
                {mapBroken ? (
                    <p className="mt-2 text-xs font-semibold text-amber-200/80">
                        Map tiles unavailable — use the numeric fields to calibrate.
                    </p>
                ) : null}
                {error ? <p className="mt-2 rounded-xl bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-200">{error}</p> : null}
            </div>

            <aside className="space-y-3">
                <div className="rounded-2xl bg-white/[0.035] p-3">
                    <p className="text-[11px] font-medium tracking-[0.02em] text-zinc-500">Floor-plan image</p>
                    <div className="mt-2 flex items-center gap-2">
                        <label className="pill-ghost inline-flex cursor-pointer items-center gap-2 px-4 py-2 text-xs font-bold tracking-[0.02em]">
                            {uploading ? 'Uploading...' : imageUrl ? 'Replace image' : 'Upload image'}
                            <input type="file" accept="image/*" className="hidden" onChange={pickImage} disabled={uploading} />
                        </label>
                        {imageUrl ? (
                            <button type="button" onClick={removeImage} className="text-xs font-bold text-red-400 transition hover:text-red-300">
                                Remove
                            </button>
                        ) : null}
                    </div>
                    {imageDims ? (
                        <p className="mt-2 text-xs text-zinc-500">
                            {imageDims.w}×{imageDims.h}px · spans ~{Math.round(planWidthMeters)} m wide
                        </p>
                    ) : (
                        <p className="mt-2 text-[10px] leading-4 text-zinc-600">
                            Optional — upload a floor-plan image to calibrate it over the map and place gates precisely.
                        </p>
                    )}
                </div>

                {imageUrl && imageDims ? (
                    <>
                        <div className="rounded-2xl bg-white/[0.035] p-3">
                            <div className="flex items-center justify-between">
                                <p className="text-[11px] font-medium tracking-[0.02em] text-zinc-500">Rotation</p>
                                <span className="text-xs font-bold tabular-nums text-white">{Math.round(calib.rotationDeg)}°</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="359"
                                step="1"
                                value={((calib.rotationDeg % 360) + 360) % 360}
                                onChange={(e) => setCalib((cur) => ({ ...cur, rotationDeg: Number(e.target.value) }))}
                                className="mt-2 w-full accent-[#d84aff]"
                            />
                            <div className="mt-3 flex items-center justify-between">
                                <p className="text-[11px] font-medium tracking-[0.02em] text-zinc-500">Plan opacity</p>
                                <span className="text-xs font-bold tabular-nums text-white">{Math.round(opacity * 100)}%</span>
                            </div>
                            <input
                                type="range"
                                min="0.2"
                                max="1"
                                step="0.05"
                                value={opacity}
                                onChange={(e) => setOpacity(Number(e.target.value))}
                                className="mt-2 w-full accent-[#d84aff]"
                            />
                        </div>

                        <div className="rounded-2xl bg-white/[0.035] p-3">
                            <p className="text-[11px] font-medium tracking-[0.02em] text-zinc-500">Numeric calibration</p>
                            <div className="mt-2 grid grid-cols-2 gap-2">
                                <label className="block">
                                    <span className="text-[10px] text-zinc-600">Anchor lat</span>
                                    <input
                                        type="number"
                                        step="0.000001"
                                        value={calib.anchorLat ?? ''}
                                        onChange={(e) => setCalib((cur) => ({ ...cur, anchorLat: Number(e.target.value) }))}
                                        className={`${fieldCls} mt-1 !px-2 !py-1.5 !text-xs`}
                                    />
                                </label>
                                <label className="block">
                                    <span className="text-[10px] text-zinc-600">Anchor lng</span>
                                    <input
                                        type="number"
                                        step="0.000001"
                                        value={calib.anchorLng ?? ''}
                                        onChange={(e) => setCalib((cur) => ({ ...cur, anchorLng: Number(e.target.value) }))}
                                        className={`${fieldCls} mt-1 !px-2 !py-1.5 !text-xs`}
                                    />
                                </label>
                                <label className="col-span-2 block">
                                    <span className="text-[10px] text-zinc-600">Plan width in meters (real building width the image spans)</span>
                                    <input
                                        type="number"
                                        min="1"
                                        step="0.5"
                                        value={planWidthMeters ? Math.round(planWidthMeters * 10) / 10 : ''}
                                        onChange={(e) => {
                                            const meters = Number(e.target.value);
                                            if (imageDims && meters > 0) setCalib((cur) => ({ ...cur, metersPerPixel: meters / imageDims.w }));
                                        }}
                                        className={`${fieldCls} mt-1 !px-2 !py-1.5 !text-xs`}
                                    />
                                </label>
                            </div>
                        </div>

                        {eventBbox ? (
                            <button type="button" onClick={centerOnEventPhotos} className="pill-ghost w-full px-3 py-2 text-xs font-bold tracking-[0.02em]">
                                Center on this event&apos;s photos
                            </button>
                        ) : null}
                        {eventPoints.length ? (
                            <p className="text-[10px] leading-4 text-zinc-600">
                                Green dots are real photo locations from the event — line your plan up with them.
                            </p>
                        ) : null}

                        <div className="rounded-2xl bg-white/[0.035] p-3">
                            <p className="text-[11px] font-medium tracking-[0.02em] text-zinc-500">
                                Gates {placedCount}/{gates.length} placed
                            </p>
                            {gates.length ? (
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                    {gates.map((gate) => {
                                        const placed = gate.xPx != null && gate.yPx != null;
                                        const active = placingGateId === gate.id;
                                        return (
                                            <button
                                                key={gate.id}
                                                type="button"
                                                onClick={() => setPlacingGateId(active ? null : gate.id)}
                                                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold transition ${
                                                    active
                                                        ? 'bg-[#d84aff] text-white'
                                                        : placed
                                                          ? 'bg-emerald-400/15 text-emerald-200 hover:bg-emerald-400/25'
                                                          : 'bg-white/[0.07] text-zinc-300 hover:bg-white/[0.12]'
                                                }`}
                                            >
                                                {gate.gate}
                                                {!placed ? <span className="font-medium opacity-70">tap to place</span> : null}
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="mt-2 text-[10px] leading-4 text-zinc-600">Add gates in the previous step first — they&apos;ll show up here to place.</p>
                            )}
                        </div>
                    </>
                ) : null}
            </aside>
        </div>
    );
}
