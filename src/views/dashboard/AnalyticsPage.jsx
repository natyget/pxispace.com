'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import SectionCard from '@/components/dashboard/SectionCard';
import { TimeSeriesChartShell, ChartSkeleton } from '@/components/dashboard/ChartFrame';
import MetricCard, { StatRow } from '@/components/dashboard/MetricCard';
import FunnelChart from '@/components/dashboard/FunnelChart';
import { getDashboardChartShade } from '@/components/dashboard/chartStyles';
import { eventsService } from '@/services/events';
import { organizerAnalyticsService } from '@/services/organizerAnalytics';
import { useDashboardShellStore } from '@/lib/dashboardShellStore';
import LiveScanDashboard from '@/views/dashboard/LiveScanDashboard';

function formatNumber(value) {
    return Number(value || 0).toLocaleString('en-US');
}

function formatMoney(cents = 0) {
    return `$${(Math.max(0, Number(cents) || 0) / 100).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

function formatEventDate(value) {
    if (!value) return 'Date TBD';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Date TBD';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** 'YYYY-MM-DD' -> 'Jun 7' (parsed as UTC so day boundaries match the backend's UTC buckets). */
function formatDayTick(value) {
    if (!value) return '';
    const [y, m, d] = String(value).split('-').map(Number);
    if (!y || !m || !d) return '';
    const date = new Date(Date.UTC(y, m - 1, d));
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

function tickInterval(length, maxTicks = 8) {
    if (length <= maxTicks) return 0;
    return Math.ceil(length / maxTicks) - 1;
}

function round1(value) {
    return Math.round((Number(value) || 0) * 10) / 10;
}

function avgLast7(series = [], key = 'count') {
    const last7 = series.slice(-7);
    if (!last7.length) return 0;
    return last7.reduce((sum, point) => sum + (Number(point[key]) || 0), 0) / last7.length;
}

function SalesTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    const point = payload[0]?.payload || {};
    return (
        <div className="dashboard-glow-popover min-w-[180px] rounded-2xl bg-zinc-950 p-3.5 shadow-2xl">
            <p className="text-[11px] font-semibold tracking-wide text-zinc-300">{formatDayTick(label)}</p>
            <p className="mt-1 text-base font-black text-white">{formatNumber(point.count)} tickets</p>
            {point.cumulative != null ? (
                <p className="mt-1 text-xs font-semibold text-zinc-400">{formatNumber(point.cumulative)} cumulative</p>
            ) : null}
        </div>
    );
}

/**
 * Sales velocity: daily tickets sold (hero area chart, its own axis) with a compact
 * cumulative-total strip beneath (its own axis) — two single-axis charts sharing an
 * x-domain rather than one dual-axis chart, since cumulative and daily magnitudes
 * differ by orders of magnitude.
 */
function SalesVelocityChart({ byDay, velocityPerDay7d, totalSold, isMobile }) {
    const heroShade = getDashboardChartShade(0);
    const cumulativeShade = getDashboardChartShade(3);
    const interval = tickInterval(byDay.length, isMobile ? 5 : 9);

    return (
        <TimeSeriesChartShell
            title="Sales Velocity"
            subheading="Tickets sold per day, with the running total tracked beneath."
            liveValue={formatNumber(round1(velocityPerDay7d))}
            unit="tickets/day (7d avg)"
            change={{ label: `${formatNumber(totalSold)} sold total`, tone: 'neutral' }}
            chartClassName="relative h-[300px] md:h-[360px]"
        >
            <div className="flex h-full flex-col gap-2">
                <div className="min-h-0 flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={byDay} margin={{ top: 14, right: 12, left: isMobile ? -18 : 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="salesVelocityGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={heroShade} stopOpacity={0.34} />
                                    <stop offset="100%" stopColor={heroShade} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid stroke="rgba(255,255,255,0.08)" strokeDasharray="3 8" vertical={false} />
                            <XAxis
                                dataKey="date"
                                stroke="rgba(255,255,255,0.24)"
                                tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: isMobile ? 9 : 10 }}
                                tickFormatter={formatDayTick}
                                interval={interval}
                            />
                            <YAxis
                                stroke="rgba(255,255,255,0.24)"
                                tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 10 }}
                                width={isMobile ? 28 : 36}
                                allowDecimals={false}
                            />
                            <Tooltip content={<SalesTooltip />} />
                            <Area
                                type="monotone"
                                dataKey="count"
                                name="Tickets/day"
                                stroke={heroShade}
                                fill="url(#salesVelocityGradient)"
                                strokeWidth={2.2}
                                dot={false}
                                activeDot={{ r: 4, fill: '#ffffff', stroke: '#09090b' }}
                                isAnimationActive={false}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
                <div className="h-16 shrink-0 border-t border-white/[0.06] pt-2">
                    <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-white/35">Cumulative</p>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={byDay} margin={{ top: 0, right: 12, left: isMobile ? -18 : 0, bottom: 0 }}>
                            <Tooltip content={<SalesTooltip />} />
                            <Area
                                type="monotone"
                                dataKey="cumulative"
                                name="Cumulative tickets"
                                stroke={cumulativeShade}
                                fill={cumulativeShade}
                                fillOpacity={0.14}
                                strokeWidth={1.6}
                                dot={false}
                                isAnimationActive={false}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </TimeSeriesChartShell>
    );
}

function EventPicker({ events, selectedEventId, onSelect, loading }) {
    return (
        <div className="glass-panel rounded-2xl p-4">
            <div className="flex items-center justify-between gap-2 pb-3">
                <p className="text-xs font-bold uppercase tracking-widest text-white/40">Drill into an event</p>
                {loading ? <span className="text-xs font-semibold text-zinc-500">Syncing events</span> : null}
            </div>
            {events.length === 0 && !loading ? (
                <p className="text-sm text-zinc-400">Create an event to see its analytics here.</p>
            ) : (
                <div className="flex flex-wrap items-center gap-2">
                    {events.map((event) => {
                        const selected = event.id === selectedEventId;
                        return (
                            <button
                                key={event.id}
                                type="button"
                                onClick={() => onSelect(event.id)}
                                aria-pressed={selected}
                                className={`rounded-2xl px-4 py-3 text-left text-xs font-bold transition ${
                                    selected ? 'pill-solid' : 'pill-ghost text-zinc-400 hover:text-white'
                                }`}
                            >
                                <span className="block">{event.name}</span>
                                <span className="mt-1 block text-[10px] uppercase tracking-widest text-zinc-500">{event.dateLabel}</span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function TopUploadersList({ uploaders = [] }) {
    if (!uploaders.length) {
        return <div className="glow-surface-soft rounded-2xl p-4 text-sm text-zinc-400">No uploads yet.</div>;
    }
    return (
        <div className="space-y-2">
            <p className="px-1 text-[10px] font-black uppercase tracking-widest text-white/35">Top uploaders</p>
            {uploaders.map((uploader) => (
                <div key={uploader.userId} className="glass-field flex items-center gap-3 rounded-2xl p-3">
                    {uploader.avatarUrl ? (
                        <img src={uploader.avatarUrl} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
                    ) : (
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-xs font-black text-white">
                            {(uploader.name || uploader.username || '?').slice(0, 1).toUpperCase()}
                        </span>
                    )}
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-white">{uploader.name || uploader.username || 'Guest'}</p>
                        {uploader.username ? <p className="truncate text-xs text-zinc-500">@{uploader.username}</p> : null}
                    </div>
                    <span className="shrink-0 text-xs font-black text-zinc-300">{formatNumber(uploader.count)}</span>
                </div>
            ))}
        </div>
    );
}

/** Non-map list rendering of the per-event DBSCAN photo-location clusters. */
function LocationClustersCard({ clusters = [], noise = 0, totalGeotagged = 0 }) {
    if (!totalGeotagged) {
        return (
            <div className="glow-surface-soft rounded-2xl p-6 text-sm text-zinc-400">
                No geotagged photos yet for this event.
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {clusters.length === 0 ? (
                <div className="glow-surface-soft rounded-2xl p-4 text-sm text-zinc-400">
                    No hotspots detected yet — photos are too spread out to cluster.
                </div>
            ) : (
                clusters.map((cluster, index) => (
                    <div
                        key={`${cluster.centroidLat}-${cluster.centroidLng}-${index}`}
                        className="glass-field flex items-center justify-between gap-4 rounded-2xl p-4"
                    >
                        <div className="min-w-0">
                            <p className="text-sm font-black text-white">Cluster of {formatNumber(cluster.count)} photos</p>
                            <p className="mt-1 text-xs font-semibold text-zinc-500">~{formatNumber(cluster.radiusM)} m radius</p>
                        </div>
                        <span className="shrink-0 rounded-full bg-white/[0.07] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-zinc-300">
                            Hotspot {index + 1}
                        </span>
                    </div>
                ))
            )}
            {noise > 0 ? (
                <p className="px-1 text-xs font-semibold text-zinc-500">
                    {formatNumber(noise)} photo{noise === 1 ? '' : 's'} outside hotspots
                </p>
            ) : null}
        </div>
    );
}

function AnalyticsPageContent() {
    const searchParams = useSearchParams();
    const viewMode = searchParams.get('view') === 'live-ops' ? 'live-ops' : 'analytics';
    const isLiveEvent = useDashboardShellStore((store) => store.isLiveEvent);

    const [events, setEvents] = useState([]);
    const [eventsLoading, setEventsLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(false);

    const [overview, setOverview] = useState(null);
    const [overviewLoading, setOverviewLoading] = useState(true);

    const [selectedEventId, setSelectedEventId] = useState(null);
    const [eventDetail, setEventDetail] = useState(null);
    const [eventDetailLoading, setEventDetailLoading] = useState(false);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setEventsLoading(true);
            try {
                const res = await eventsService.getMyEvents({ limit: 100, offset: 0 });
                if (!cancelled) setEvents(res?.events || []);
            } catch {
                if (!cancelled) setEvents([]);
            } finally {
                if (!cancelled) setEventsLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return undefined;
        const mq = window.matchMedia('(max-width: 768px)');
        const onChange = () => setIsMobile(mq.matches);
        onChange();
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, []);

    useEffect(() => {
        let cancelled = false;
        setOverviewLoading(true);
        organizerAnalyticsService
            .getOverview()
            .then((res) => { if (!cancelled) setOverview(res); })
            .catch(() => { if (!cancelled) setOverview(null); })
            .finally(() => { if (!cancelled) setOverviewLoading(false); });
        return () => { cancelled = true; };
    }, []);

    const eventOptions = useMemo(
        () => events.map((event) => ({
            id: event.id,
            name: event.name || 'Untitled event',
            dateLabel: formatEventDate(event.startDate),
        })),
        [events]
    );

    useEffect(() => {
        if (eventsLoading || selectedEventId || !eventOptions.length) return;
        setSelectedEventId(eventOptions[0].id);
    }, [eventOptions, eventsLoading, selectedEventId]);

    useEffect(() => {
        if (!selectedEventId) {
            setEventDetail(null);
            return undefined;
        }
        let cancelled = false;
        setEventDetailLoading(true);
        organizerAnalyticsService
            .getEventAnalytics(selectedEventId)
            .then((res) => { if (!cancelled) setEventDetail(res); })
            .catch(() => { if (!cancelled) setEventDetail(null); })
            .finally(() => { if (!cancelled) setEventDetailLoading(false); });
        return () => { cancelled = true; };
    }, [selectedEventId]);

    const totals = overview?.totals;
    const last30d = overview?.last30d;
    const overviewVelocity7d = useMemo(() => avgLast7(last30d?.ticketsByDay || [], 'count'), [last30d]);

    const funnelData = useMemo(() => {
        if (!eventDetail) return [];
        const id = eventDetail.event.id;
        return [
            {
                stage: 'Sold',
                value: eventDetail.funnel.sold,
                cta: 'View event',
                href: `/dashboard/events/${id}`,
                suggestions: ['Every ticket sold for this event, paid and free.'],
            },
            {
                stage: 'Scanned',
                value: eventDetail.funnel.scanned,
                cta: 'View attendees',
                href: `/dashboard/events/${id}/members`,
                suggestions: ['Attendees whose ticket was scanned at the door.'],
            },
            {
                stage: 'Posted media',
                value: eventDetail.funnel.postedMedia,
                cta: 'View gallery',
                href: `/dashboard/events/${id}/upload`,
                suggestions: ['Distinct attendees who posted at least one photo or video.'],
            },
        ];
    }, [eventDetail]);

    if (viewMode === 'live-ops') {
        return <LiveScanDashboard isLiveEvent={isLiveEvent} />;
    }

    return (
        <div className="dashboard-surface-a mx-auto max-w-6xl space-y-7 rounded-[2rem] p-1 md:space-y-8">
            <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <h1 className="text-2xl font-black tracking-tight text-white md:text-3xl">Analytics</h1>
                {isLiveEvent ? (
                    <Link
                        href="/dashboard/analytics?view=live-ops"
                        className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-300"
                    >
                        <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300" />
                        Operations
                    </Link>
                ) : null}
            </header>

            <SectionCard title="Organizer Overview">
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    <MetricCard title="Events" value={formatNumber(totals?.events)} loading={overviewLoading} description="Owned events" />
                    <MetricCard
                        title="Tickets sold"
                        value={formatNumber(totals?.ticketsSold)}
                        loading={overviewLoading}
                        description="Last 30 days"
                        sparkline={{ points: (last30d?.ticketsByDay || []).map((d) => d.count) }}
                    />
                    <MetricCard title="Tickets scanned" value={formatNumber(totals?.ticketsScanned)} loading={overviewLoading} description="Checked in at the door" />
                    <MetricCard title="Attendees" value={formatNumber(totals?.attendees)} loading={overviewLoading} description="Distinct ticket holders" />
                    <MetricCard
                        title="Gross revenue"
                        value={formatMoney(totals?.grossCents)}
                        loading={overviewLoading}
                        description="Last 30 days"
                        sparkline={{ points: (last30d?.revenueByDay || []).map((d) => d.grossCents) }}
                    />
                    <MetricCard title="Net revenue" value={formatMoney(totals?.netCents)} loading={overviewLoading} description="After platform fees" />
                    <MetricCard
                        title="Media uploads"
                        value={formatNumber(totals?.mediaCount)}
                        loading={overviewLoading}
                        description="Last 30 days"
                        sparkline={{ points: (last30d?.mediaByDay || []).map((d) => d.count) }}
                    />
                    <MetricCard
                        title="Sales velocity"
                        value={`${formatNumber(round1(overviewVelocity7d))}/day`}
                        loading={overviewLoading}
                        description="7-day avg, all events"
                    />
                </div>
            </SectionCard>

            <EventPicker events={eventOptions} selectedEventId={selectedEventId} onSelect={setSelectedEventId} loading={eventsLoading} />

            {!selectedEventId ? (
                <div className="glow-surface-soft rounded-2xl p-6 text-sm text-zinc-400">Select an event above to see its full analytics.</div>
            ) : eventDetailLoading || !eventDetail ? (
                <div className="space-y-4">
                    <ChartSkeleton className="h-[300px] md:h-[360px]" />
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        {[0, 1, 2].map((item) => (
                            <div key={item} className="h-28 rounded-2xl bg-white/[0.035] animate-pulse" />
                        ))}
                    </div>
                </div>
            ) : (
                <>
                    <SalesVelocityChart
                        byDay={eventDetail.sales.byDay}
                        velocityPerDay7d={eventDetail.sales.velocityPerDay7d}
                        totalSold={eventDetail.sales.total}
                        isMobile={isMobile}
                    />

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <MetricCard
                            title="Gross revenue"
                            value={formatMoney(eventDetail.sales.revenue.grossCents)}
                            sparkline={{ points: eventDetail.sales.revenue.byDay.map((d) => d.grossCents) }}
                        />
                        <MetricCard title="Net revenue" value={formatMoney(eventDetail.sales.revenue.netCents)} description="After platform fees" />
                        <MetricCard
                            title="Scan rate"
                            value={`${Math.round((eventDetail.attendance.scanRate || 0) * 100)}%`}
                            description={`${formatNumber(eventDetail.attendance.scanned)} of ${formatNumber(eventDetail.attendance.sold)} scanned`}
                            sparkline={{ points: eventDetail.attendance.scansByHour.map((d) => d.count) }}
                        />
                    </div>

                    <SectionCard title="Media">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="space-y-4">
                                <MetricCard
                                    title="Media uploads"
                                    value={formatNumber(eventDetail.media.count)}
                                    sparkline={{ points: eventDetail.media.byHour.map((d) => d.count) }}
                                />
                                <StatRow
                                    items={[
                                        { label: 'Reactions', value: formatNumber(eventDetail.media.reactions) },
                                        { label: 'Comments', value: formatNumber(eventDetail.media.comments) },
                                        { label: 'Face tags', value: formatNumber(eventDetail.media.faceTags) },
                                    ]}
                                />
                            </div>
                            <TopUploadersList uploaders={eventDetail.media.topUploaders} />
                        </div>
                    </SectionCard>

                    <SectionCard title="Attendee Funnel">
                        <FunnelChart data={funnelData} singleSelection />
                    </SectionCard>

                    <SectionCard title="Where the night happened">
                        <LocationClustersCard {...eventDetail.locationClusters} />
                    </SectionCard>
                </>
            )}
        </div>
    );
}

export default function AnalyticsPage() {
    return (
        <Suspense fallback={<div className="mx-auto max-w-6xl p-8 text-zinc-500">Loading analytics...</div>}>
            <AnalyticsPageContent />
        </Suspense>
    );
}
