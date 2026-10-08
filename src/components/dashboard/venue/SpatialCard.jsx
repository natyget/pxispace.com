'use client';

// VEN-8, "Spatial Intel": where the room is alive, from VEN-3's venue heat map. Every night combined, never one
// night and never live: a spot is only drawn once five captures land on it, so nobody can be picked out. The
// three reads beside the map and the strip under it are all from that same payload.

import VenueRoomHeatMap from '@/components/dashboard/floorplan/VenueRoomHeatMap';
import { DASHBOARD_LIVE_COLOR, getDashboardChartShade } from '@/components/dashboard/chartStyles';
import { formatInteger, hasRoomView, relativeToDoors } from '@/lib/venueDashboard';
import { CardError, CardSkeleton, EmptyNote, VenueCard } from './VenueCard';

const GRID_TEXTURE = {
    backgroundImage:
        'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
    backgroundSize: '24px 24px',
};

function Read({ label, value, tone = 'text-white', detail = null }) {
    return (
        <div className="min-w-0 flex-1 rounded-xl bg-white/[0.02] px-2.5 py-2 ring-1 ring-white/[0.06]">
            <p className="text-[9px] uppercase leading-3 tracking-wider text-zinc-500">{label}</p>
            <p className={`mt-0.5 truncate text-sm font-black tabular-nums ${tone}`} title={String(value)}>{value}</p>
            {detail ? <p className="mt-0.5 truncate text-[9px] leading-3 text-zinc-500">{detail}</p> : null}
        </div>
    );
}

function Timeline({ timeline }) {
    const max = Math.max(1, ...timeline.map((t) => t.captures + t.scans));
    return (
        <>
            {/* Columns stretch to the strip's fixed height, so the bars' percentage heights resolve
                (QA 2026-09-17, V3-08b: with items-end the columns had no height and drew nothing). */}
            <div className="flex h-12 gap-px" role="img" aria-label="Captures and door scans per 15 minutes, averaged over nights">
                {timeline.map((t) => (
                    <div key={t.minutesFromDoors} className="flex h-full min-w-0 flex-1 flex-col justify-end" title={`${relativeToDoors(t.minutesFromDoors)}: ${t.scans} scans, ${t.captures} captures`}>
                        <div style={{ height: `${(t.captures / max) * 100}%`, background: getDashboardChartShade(0) }} className="rounded-t-sm" />
                        <div style={{ height: `${(t.scans / max) * 100}%`, background: getDashboardChartShade(1) }} />
                    </div>
                ))}
            </div>
            <div className="mt-1 flex items-center justify-between text-[9px] text-zinc-500">
                <span>2h before doors</span>
                <span className="flex gap-3">
                    <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full" style={{ background: getDashboardChartShade(0) }} />Captures</span>
                    <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full" style={{ background: getDashboardChartShade(1) }} />Door scans</span>
                </span>
                <span>+8h</span>
            </div>
        </>
    );
}

export default function SpatialCard({ heatmap, venueName = '', loading = false, error = null, className = '' }) {
    const empty = !heatmap || (heatmap.nights === 0 && !hasRoomView(heatmap));
    const gates = heatmap?.gates || [];
    const scans = gates.reduce((sum, g) => sum + g.scans, 0);
    const hasTimeline = (heatmap?.timeline || []).some((t) => t.captures + t.scans > 0);

    return (
        <VenueCard title="Spatial Intel" className={className} data-venue-card="spatial">
            {loading ? <CardSkeleton className="h-56" /> : error ? <CardError>{error}</CardError> : empty ? (
                <EmptyNote>Host an event for spatial intel</EmptyNote>
            ) : (
                <div className="flex flex-1 flex-col rounded-xl bg-black/30 p-3">
                    <div className="mb-2.5 flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2">
                            <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: DASHBOARD_LIVE_COLOR }} />
                            <span className="truncate text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400">
                                Room density, {venueName}
                            </span>
                        </div>
                        <span className="shrink-0 text-[10px] text-zinc-600">
                            {heatmap.nights} {heatmap.nights === 1 ? 'night' : 'nights'} combined
                        </span>
                    </div>

                    <div className="flex flex-col gap-2.5 sm:flex-row">
                        <div className="relative min-w-0 flex-1 overflow-hidden rounded-xl bg-black/40 ring-1 ring-white/10">
                            <div className="pointer-events-none absolute inset-0 opacity-[0.06]" style={GRID_TEXTURE} aria-hidden="true" />
                            {hasRoomView(heatmap) ? (
                                <VenueRoomHeatMap data={heatmap} className="!rounded-none !bg-transparent" />
                            ) : (
                                <div className="relative flex aspect-[16/10] items-center justify-center px-4 text-center">
                                    <p className="max-w-[34ch] text-[11px] leading-4 text-white/55">
                                        The room map fills in as guests take photos at your nights. The busiest spots light up here.
                                    </p>
                                </div>
                            )}
                        </div>
                        <div className="grid shrink-0 grid-cols-3 gap-2 sm:flex sm:w-32 sm:flex-col">
                            <Read label="Nights mapped" value={formatInteger(heatmap.nights)} tone="text-pxi-purple" />
                            <Read label="Located captures" value={formatInteger(heatmap.media.geotagged)} tone="text-pxi-orange" />
                            <Read
                                label="Busiest door"
                                value={gates.length && scans ? gates[0].gate : 'No scans yet'}
                                detail={gates.length && scans ? `${Math.round((gates[0].scans / scans) * 100)}% of door scans` : null}
                            />
                        </div>
                    </div>
                    {heatmap.media.suppressed || heatmap.media.truncated ? (
                        <p className="mt-2 text-[10px] leading-4 text-zinc-500">
                            {heatmap.media.suppressed ? `${formatInteger(heatmap.media.suppressed)} captures in quiet spots are not placed, so no one can be singled out.` : ''}
                            {heatmap.media.truncated ? ' Capped for speed.' : ''}
                        </p>
                    ) : null}

                    <p className="mb-1.5 mt-2.5 text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                        Through the night, average per 15 minutes
                    </p>
                    {hasTimeline ? <Timeline timeline={heatmap.timeline} /> : (
                        <p className="text-[11px] text-white/45">Appears after the first night with scans or photos.</p>
                    )}
                </div>
            )}
        </VenueCard>
    );
}
