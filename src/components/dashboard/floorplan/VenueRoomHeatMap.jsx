'use client';

// VEN-3: the venue-level heat map. Every night in the room combined (GET /api/venue-analytics/:id/heatmap).
// A still picture, not playback: where captures happen across all nights. Cells under five captures never reach
// the client, so nothing here can point at one person. Projection uses the same geo.js as the per-event
// VenueHeatMap, and the colour comes from chartStyles.js.
//
// This is the map alone. VEN-8's Spatial Intel card (venue/SpatialCard.jsx) loads the data once and puts the
// doors and the average night around it.

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { DASHBOARD_BRAND_COLOR } from '@/components/dashboard/chartStyles';
import { latLngToPlanPx, mapMetersPerPixel, staticMapUrl, METERS_PER_DEG } from './geo';

const MAP_W = 1024;
const MAP_H = 640;

function rgba(hex, alpha) {
    const n = parseInt(hex.replace('#', ''), 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

export default function VenueRoomHeatMap({ data, className = '' }) {
    const canvasRef = useRef(null);
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

    if (!view) return null;

    return (
        <div className={`relative w-full overflow-hidden rounded-xl bg-black/40 ${className}`.trim()} style={{ aspectRatio: `${view.width} / ${view.height}` }}>
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
    );
}
