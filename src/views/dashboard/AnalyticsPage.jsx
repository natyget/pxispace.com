'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
    Area,
    AreaChart,
    CartesianGrid,
    ReferenceDot,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import SectionCard from '@/components/dashboard/SectionCard';
import { TimeSeriesChartShell, ChartSkeleton } from '@/components/dashboard/ChartFrame';
import { MicroChart, StatRow } from '@/components/dashboard/MetricCard';
import FunnelChart from '@/components/dashboard/FunnelChart';
import EventTimelinePicker from '@/components/dashboard/EventTimelinePicker';
import InsightsPanel from '@/components/dashboard/InsightsPanel';
import MarketingPanel from '@/components/dashboard/MarketingPanel';
import MarketingKitModal from '@/components/dashboard/MarketingKitModal';
import VenueHeatMap from '@/components/dashboard/floorplan/VenueHeatMap';
import {
    DASHBOARD_BRAND_COLOR,
    DASHBOARD_GRID_STROKE,
    DASHBOARD_MUTED_COLOR,
    DASHBOARD_TOOLTIP_PROPS,
    getDashboardChartShade,
} from '@/components/dashboard/chartStyles';
import { eventsService } from '@/services/events';
import { organizerAnalyticsService } from '@/services/organizerAnalytics';
import { deleteFeedItem } from '@/services/feed';
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

function percent(value) {
    return `${Math.round((Number(value) || 0) * 100)}%`;
}

function clampPercent(value, max) {
    if (!max) return 0;
    return Math.max(2, Math.min(100, (Number(value) / max) * 100));
}

/** '2026-07-04T22:00:00.000Z' -> '10 PM' for the hype chart axis. */
function formatHourTick(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleTimeString('en-US', { hour: 'numeric', timeZone: 'UTC' });
}

const HYPE_CHANNELS = [
    { id: 'all', label: 'All activity' },
    { id: 'messages', label: 'Chat' },
    { id: 'reactions', label: 'Reactions' },
    { id: 'media', label: 'Captures' },
];

// "Captures", not "Uploads": the series is bucketed on when the shot was taken
// (`capturedAt ?? createdAt`), so a late upload still lands on the hour it happened.
const HYPE_SERIES = {
    messages: { label: 'Messages', color: getDashboardChartShade(0) },
    reactions: { label: 'Reactions', color: getDashboardChartShade(1) },
    media: { label: 'Captures', color: getDashboardChartShade(2) },
};

/** `+14m` / `+2h 10m` / `same minute` — capture→upload lag for the stat strip. */
function formatCaptureLag(minutes) {
    if (minutes == null) return '—';
    if (minutes < 1) return 'Instant';
    if (minutes < 60) return `+${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const rem = minutes % 60;
    if (hours < 24) return rem ? `+${hours}h ${rem}m` : `+${hours}h`;
    return `+${Math.round(hours / 24)}d`;
}

/**
 * Hype: engagement velocity through the night — chart first, one compact stat
 * strip, and spike markers flagging moments worth investigating (a song, a
 * shoutout, a drop — the chart can't know which, but it can point at when).
 */
function HypePanel({ behavior, capture, isMobile }) {
    const [channel, setChannel] = useState('all');
    if (!behavior) return null;
    const series = (behavior.byHour || []).map((d) => ({
        hourIso: d.hourIso,
        messages: d.messages,
        reactions: d.reactions,
        media: d.media,
        total: (Number(d.messages) || 0) + (Number(d.reactions) || 0) + (Number(d.media) || 0),
    }));
    const activeKeys = channel === 'all' ? ['messages', 'reactions', 'media'] : [channel];
    const hasActivity = series.some((d) => activeKeys.some((key) => Number(d[key]) > 0));

    // Spike detection: hours well above the night's own baseline, worth a look.
    const activeSeries = series.map((point) => ({
        hourIso: point.hourIso,
        value: activeKeys.reduce((sum, key) => sum + (Number(point[key]) || 0), 0),
    }));
    const mean = activeSeries.reduce((sum, p) => sum + p.value, 0) / Math.max(1, activeSeries.length);
    const std = Math.sqrt(activeSeries.reduce((sum, p) => sum + (p.value - mean) ** 2, 0) / Math.max(1, activeSeries.length));
    const spikes = activeSeries
        .filter((p) => p.value >= 5 && p.value > mean + 1.5 * std)
        .sort((a, b) => b.value - a.value)
        .slice(0, 3);
    const peakHour = activeSeries.reduce((peak, p) => (p.value > peak.value ? p : peak), { hourIso: null, value: 0 });

    const statStrip = [
        { label: 'Hype score', value: `${formatNumber(behavior.hypeScore)} · ${behavior.hypeTierLabel || 'Quiet'}` },
        { label: 'Peak hour', value: peakHour.hourIso ? formatHourTick(peakHour.hourIso) : '—' },
        { label: 'Chat', value: formatNumber(behavior.totals?.messages) },
        { label: 'Reactions', value: formatNumber(behavior.totals?.reactions) },
        { label: 'Captures', value: formatNumber(behavior.totals?.media) },
        // Only honest above ~20% coverage — below that the median is one phone's story.
        ...(capture?.medianLagMinutes != null && capture.coverage >= 0.2
            ? [{ label: 'Capture lag', value: formatCaptureLag(capture.medianLagMinutes) }]
            : [{ label: 'Comments', value: formatNumber(behavior.totals?.comments) }]),
    ];

    return (
        <SectionCard
            title="Hype through the night"
            actions={(
                <div className="dashboard-segmented-toggle max-w-full" aria-label="Hype activity channel">
                    {HYPE_CHANNELS.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            className="dashboard-segmented-toggle__item"
                            data-active={channel === item.id}
                            aria-pressed={channel === item.id}
                            onClick={() => setChannel(item.id)}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            )}
            className="!rounded-[1.25rem]"
        >
            {hasActivity ? (
                <>
                    <div className="relative h-[280px] md:h-[340px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={series} margin={{ top: 16, right: 14, bottom: 0, left: isMobile ? -18 : 0 }}>
                                <defs>
                                    {Object.entries(HYPE_SERIES).map(([key, config]) => (
                                        <linearGradient key={key} id={`hypeGradient-${key}`} x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor={config.color} stopOpacity={0.18} />
                                            <stop offset="100%" stopColor={config.color} stopOpacity={0.02} />
                                        </linearGradient>
                                    ))}
                                </defs>
                                <CartesianGrid stroke={DASHBOARD_GRID_STROKE} vertical={false} />
                                <XAxis
                                    dataKey="hourIso"
                                    tickFormatter={formatHourTick}
                                    interval={tickInterval(series.length, isMobile ? 5 : 10)}
                                    tick={{ fill: 'rgba(255,255,255,0.46)', fontSize: 11 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    allowDecimals={false}
                                    tick={{ fill: 'rgba(255,255,255,0.46)', fontSize: 11 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip {...DASHBOARD_TOOLTIP_PROPS} labelFormatter={formatHourTick} />
                                {activeKeys.map((key) => (
                                    <Area
                                        key={key}
                                        type="monotone"
                                        dataKey={key}
                                        name={HYPE_SERIES[key].label}
                                        stackId={channel === 'all' ? 'hype' : undefined}
                                        stroke={HYPE_SERIES[key].color}
                                        fill={`url(#hypeGradient-${key})`}
                                        strokeWidth={2.2}
                                        dot={false}
                                        activeDot={{ r: 4, fill: '#fff', stroke: '#09090b' }}
                                        isAnimationActive={false}
                                    />
                                ))}
                                {spikes.map((spike) => (
                                    <ReferenceDot
                                        key={spike.hourIso}
                                        x={spike.hourIso}
                                        y={spike.value}
                                        r={5}
                                        fill={DASHBOARD_BRAND_COLOR}
                                        stroke="#0e0e13"
                                        strokeWidth={2}
                                        isFront
                                    />
                                ))}
                            </AreaChart>
                        </ResponsiveContainer>
                        <div className="absolute bottom-2 left-4 flex flex-wrap items-center gap-4 text-[11px] font-bold text-zinc-500">
                            {activeKeys.map((key) => (
                                <span key={key} className="inline-flex items-center gap-1.5">
                                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: HYPE_SERIES[key].color }} />
                                    {HYPE_SERIES[key].label}
                                </span>
                            ))}
                        </div>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-px overflow-hidden rounded-2xl bg-white/[0.06] ring-1 ring-white/[0.07] sm:grid-cols-6">
                        {statStrip.map((item) => (
                            <div key={item.label} className="bg-[#0e0e13] px-3 py-2.5">
                                <p className="text-[11px] font-medium text-zinc-500">{item.label}</p>
                                <p className="mt-1 truncate text-sm font-semibold tabular-nums text-white">{item.value}</p>
                            </div>
                        ))}
                    </div>
                    {spikes.length ? (
                        <p className="mt-3 text-xs leading-5 text-zinc-500">
                            <span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: DASHBOARD_BRAND_COLOR }} />
                            Marked spikes at {spikes.map((spike) => formatHourTick(spike.hourIso)).join(', ')} — moments worth investigating:
                            a track, a shoutout, an announcement, or a drop usually sits behind them. Check the gallery around those times.
                        </p>
                    ) : null}
                </>
            ) : (
                <div className="rounded-2xl bg-white/[0.035] p-6 text-sm text-zinc-500">
                    No {channel === 'all' ? 'chat, reaction, or upload' : HYPE_CHANNELS.find((item) => item.id === channel)?.label.toLowerCase()} activity in the event window yet.
                </div>
            )}
        </SectionCard>
    );
}

/** Most-reacted media with host moderation (remove = backend Bouncer endpooint permissions). */
function TopMomentsPanel({ moments, onRemoved, onPromote }) {
    const [busyId, setBusyId] = useState(null);
    const [error, setError] = useState(null);

    if (!moments?.length) {
        return (
            <SectionCard title="Top moments">
                <p className="text-sm text-zinc-500">No reacted media yet — top moments appear as guests react.</p>
            </SectionCard>
        );
    }

    const remove = async (mediaId) => {
        if (!window.confirm('Remove this media from the event for everyone? This cannot be undone.')) return;
        setBusyId(mediaId);
        setError(null);
        try {
            await deleteFeedItem(mediaId);
            onRemoved?.(mediaId);
        } catch (err) {
            setError(err.message || 'Failed to remove media');
        } finally {
            setBusyId(null);
        }
    };

    return (
        <SectionCard
            title="Top moments"
            actions={onPromote ? (
                <button
                    type="button"
                    onClick={onPromote}
                    className="rounded-full bg-white px-4 py-1.5 text-xs font-bold tracking-[0.02em] text-black transition hover:bg-zinc-200"
                >
                    Marketing kit
                </button>
            ) : null}
        >
            <p className="mb-4 text-xs text-zinc-500">
                The most-reacted media at this event — your best marketing content, and your moderation queue.
            </p>
            {error ? <p className="mb-3 text-xs text-red-400">{error}</p> : null}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {moments.map((m) => (
                    <div key={m.mediaId} className="group relative overflow-hidden rounded-2xl bg-white/[0.035]">
                        <img
                            src={m.thumbnailUrl || m.r2Url}
                            alt=""
                            className="aspect-[3/4] w-full object-cover"
                            loading="lazy"
                        />
                        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/85 to-transparent p-3 pt-8">
                            <div className="min-w-0">
                                <p className="truncate text-[11px] font-bold text-white">
                                    {m.author?.username ? `@${m.author.username}` : m.author?.name || 'Guest'}
                                </p>
                                <p className="text-[11px] text-zinc-400">{formatNumber(m.reactions)} reactions</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => remove(m.mediaId)}
                                disabled={busyId === m.mediaId}
                                className="shrink-0 rounded-full bg-red-500/15 px-2.5 py-1 text-[11px] font-medium tracking-[0.02em] text-red-300 opacity-0 transition group-hover:opacity-100 disabled:opacity-60"
                            >
                                {busyId === m.mediaId ? '...' : 'Remove'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </SectionCard>
    );
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
            <p className="mt-1 text-base font-bold text-white">{formatNumber(point.count)} tickets</p>
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
const SALES_RANGES = ['1D', '1W', '1M', 'ALL'];
const SALES_RANGE_DAYS = { '1D': 1, '1W': 7, '1M': 30, ALL: Infinity };

/** Ticket sales, full window: event creation → doors (or today). Range toggle windows the daily chart; cumulative always shows the whole run. */
function SalesVelocityChart({ byDay, velocityPerDay7d, totalSold, grossCents, netCents, eventStartDate, isMobile }) {
    const [range, setRange] = useState('ALL');
    const heroShade = DASHBOARD_BRAND_COLOR;
    const cumulativeShade = DASHBOARD_MUTED_COLOR;

    const windowedByDay = useMemo(() => {
        const days = SALES_RANGE_DAYS[range];
        return Number.isFinite(days) ? byDay.slice(-days) : byDay;
    }, [byDay, range]);
    const interval = tickInterval(windowedByDay.length, isMobile ? 5 : 9);

    // Plain-language pace read: what this pace means for the door.
    const paceNote = useMemo(() => {
        const pace = Number(velocityPerDay7d) || 0;
        const start = eventStartDate ? new Date(eventStartDate) : null;
        if (!start || Number.isNaN(start.getTime())) return null;
        const daysToDoors = Math.ceil((start.getTime() - Date.now()) / 86400000);
        if (daysToDoors <= 0) {
            return `Doors have opened — final count ${formatNumber(totalSold)} tickets.`;
        }
        if (pace <= 0) {
            return `No sales this week — ${daysToDoors} day${daysToDoors === 1 ? '' : 's'} to doors. A campaign or ad boost can restart momentum.`;
        }
        const projected = Math.round(totalSold + pace * daysToDoors);
        return `Selling ${formatNumber(round1(pace))}/day — at this pace, about ${formatNumber(projected)} sold by doors (${daysToDoors} day${daysToDoors === 1 ? '' : 's'} away).`;
    }, [velocityPerDay7d, totalSold, eventStartDate]);

    return (
        <TimeSeriesChartShell
            title="Ticket sales"
            subheading={paceNote || 'Tickets sold per day, with the running total tracked beneath.'}
            liveValue={formatMoney(grossCents)}
            unit={`gross · ${formatMoney(netCents)} net`}
            change={{ label: `${formatNumber(totalSold)} sold total`, tone: 'neutral' }}
            timeframes={null}
            chartClassName="relative h-[300px] md:h-[360px]"
        >
            <div className="flex h-full flex-col gap-2">
                <div className="min-h-0 flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={windowedByDay} margin={{ top: 14, right: 12, left: isMobile ? -18 : 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="salesVelocityGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={heroShade} stopOpacity={0.34} />
                                    <stop offset="100%" stopColor={heroShade} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid stroke={DASHBOARD_GRID_STROKE} vertical={false} />
                            <XAxis
                                dataKey="date"
                                tick={{ fill: 'rgba(255,255,255,0.46)', fontSize: isMobile ? 9 : 10 }}
                                tickFormatter={formatDayTick}
                                interval={interval}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
                                tick={{ fill: 'rgba(255,255,255,0.46)', fontSize: 10 }}
                                width={isMobile ? 28 : 36}
                                allowDecimals={false}
                                axisLine={false}
                                tickLine={false}
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
                <div className="flex h-20 shrink-0 flex-col gap-1 rounded-2xl bg-black/15 px-2 py-2">
                    <p className="shrink-0 text-[11px] font-medium tracking-[0.02em] text-white/35">Cumulative (full run)</p>
                    {/* The label above sits in normal flow, so the chart needs its own
                        flex-1/min-h-0 box — a bare height:100% ResponsiveContainer here
                        would size itself off the parent's full height and get clipped
                        by the label instead of only using the space left beneath it. */}
                    <div className="min-h-0 flex-1">
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
            </div>
        </TimeSeriesChartShell>
    );
}

/** Event-page card language: the cover IS the card, bottom gradient carries the text. */
function EventPickerCard({ event, selected, order, onToggle }) {
    return (
        <button
            type="button"
            onClick={() => onToggle(event.id)}
            aria-pressed={selected}
            className={`group relative aspect-[3/4] w-[168px] shrink-0 overflow-hidden rounded-2xl bg-[#0A0A0A] text-left transition ${
                selected ? 'ring-2 ring-inset ring-[#d84aff]' : 'opacity-80 hover:opacity-100'
            }`}
        >
            {event.coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={event.coverImage} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
            ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-white/[0.05]">
                    <span className="text-2xl font-bold text-white/30">{(event.name || '?').slice(0, 1).toUpperCase()}</span>
                </div>
            )}
            <div
                className="absolute inset-x-0 bottom-0 h-[72%]"
                style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.94) 0%, rgba(0,0,0,0.7) 40%, rgba(0,0,0,0) 100%)' }}
            />
            <span className="absolute left-3 top-3 flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ring-2 ring-black/40 ${event.status === 'LIVE' || event.status === 'ACTIVE' ? 'bg-emerald-400' : 'bg-white/40'}`} aria-hidden="true" />
            </span>
            {selected ? (
                <span className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#d84aff] text-[11px] font-bold text-white">
                    {order}
                </span>
            ) : null}
            <div className="absolute inset-x-0 bottom-0 p-3">
                <p className="truncate text-sm font-bold text-white">{event.name}</p>
                <p className="mt-0.5 truncate text-[11px] text-white/60">
                    {event.dateLabel}{event.venueName ? ` · ${event.venueName}` : ''}
                </p>
            </div>
        </button>
    );
}

function EventPicker({ events, selectedIds, onToggle, loading }) {
    const [view, setView] = useState('cards');
    return (
        <div className="rounded-[1.25rem] bg-white/[0.035] p-4">
            <div className="flex flex-col gap-3 pb-4 md:flex-row md:items-end md:justify-between">
                <div>
                    <p className="text-xs font-bold tracking-[0.02em] text-white/40">Choose events</p>
                    <p className="mt-1 text-sm text-zinc-500">Click to open one, or click several to compare (up to 4). Click again to deselect.</p>
                </div>
                <div className="flex items-center gap-3">
                    {loading ? <span className="text-xs font-semibold text-zinc-500">Syncing events</span> : null}
                    <div className="dashboard-segmented-toggle" role="tablist" aria-label="Event picker view">
                        {[{ id: 'cards', label: 'Cards' }, { id: 'timeline', label: 'Timeline' }].map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                className="dashboard-segmented-toggle__item"
                                data-active={view === item.id}
                                aria-pressed={view === item.id}
                                onClick={() => setView(item.id)}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            {events.length === 0 && !loading ? (
                <p className="text-sm text-zinc-400">Create an event to see its analytics here.</p>
            ) : view === 'timeline' ? (
                <EventTimelinePicker events={events} selectedIds={selectedIds} onToggle={onToggle} />
            ) : (
                <div className="dashboard-scrollbar-none -m-1.5 flex gap-3 overflow-x-auto p-1.5">
                    {events.map((event) => (
                        <EventPickerCard
                            key={event.id}
                            event={event}
                            selected={selectedIds.includes(event.id)}
                            order={selectedIds.indexOf(event.id) + 1}
                            onToggle={onToggle}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

const COMPARISON_COLORS = [DASHBOARD_BRAND_COLOR, getDashboardChartShade(1), getDashboardChartShade(2), getDashboardChartShade(3)];

/**
 * Overlaid comparison: one multi-series "tickets sold" chart (aligned by days
 * since each event's creation, so different calendar dates overlay meaningfully),
 * end-labeled per series, with a compact numbers row underneath — no cards.
 */
function EventComparisonChart({ details = [], loading }) {
    if (loading) {
        return (
            <div className="rounded-[1.25rem] bg-white/[0.035] p-5">
                <p className="text-xs font-bold tracking-[0.02em] text-white/35">Comparing</p>
                <div className="mt-4 h-[280px] animate-pulse rounded-2xl bg-white/[0.035]" />
            </div>
        );
    }
    if (!details.length) return null;

    const rows = details.map((detail, index) => ({
        id: detail.event?.id,
        name: detail.event?.name || 'Event',
        color: COMPARISON_COLORS[index % COMPARISON_COLORS.length],
        tickets: Number(detail.sales?.total || detail.funnel?.sold || 0),
        gross: Number(detail.sales?.revenue?.grossCents || 0),
        scanRate: Number(detail.attendance?.scanRate || 0),
        hype: Number(detail.behavior?.hypeScore || 0),
        byDay: detail.sales?.byDay || [],
    }));

    // Align by day-index-since-start rather than calendar date.
    const maxDays = Math.max(1, ...rows.map((row) => row.byDay.length));
    const series = Array.from({ length: maxDays }, (_, dayIndex) => {
        const point = { dayIndex };
        rows.forEach((row) => {
            point[row.id] = row.byDay[dayIndex]?.cumulative ?? null;
        });
        return point;
    });

    return (
        <section className="rounded-[1.25rem] bg-white/[0.035] p-5">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-xs font-bold tracking-[0.02em] text-white/35">Comparing {rows.length} events</p>
                    <h2 className="mt-2 text-xl font-bold tracking-normal text-white">Cumulative tickets sold</h2>
                </div>
                <div className="flex flex-wrap gap-3">
                    {rows.map((row) => (
                        <span key={row.id} className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-zinc-400">
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: row.color }} />
                            {row.name}
                        </span>
                    ))}
                </div>
            </div>
            <div className="mt-4 h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={series} margin={{ top: 12, right: 12, left: -8, bottom: 0 }}>
                        <CartesianGrid stroke={DASHBOARD_GRID_STROKE} vertical={false} />
                        <XAxis
                            dataKey="dayIndex"
                            tickFormatter={(v) => `Day ${v + 1}`}
                            tick={{ fill: 'rgba(255,255,255,0.46)', fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis allowDecimals={false} tick={{ fill: 'rgba(255,255,255,0.46)', fontSize: 10 }} width={36} axisLine={false} tickLine={false} />
                        <Tooltip {...DASHBOARD_TOOLTIP_PROPS} labelFormatter={(v) => `Day ${v + 1}`} />
                        {rows.map((row) => (
                            <Area
                                key={row.id}
                                type="monotone"
                                dataKey={row.id}
                                name={row.name}
                                stroke={row.color}
                                fill="none"
                                strokeWidth={2.2}
                                dot={false}
                                connectNulls
                                isAnimationActive={false}
                            />
                        ))}
                    </AreaChart>
                </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-1.5">
                {rows.map((row) => (
                    <div key={row.id} className="grid grid-cols-[16px_1.4fr_repeat(3,80px)] items-center gap-3 rounded-xl bg-white/[0.03] px-3 py-2 text-sm">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: row.color }} />
                        <span className="truncate font-semibold text-white">{row.name}</span>
                        <span className="text-right tabular-nums text-zinc-300">{formatNumber(row.tickets)}<span className="ml-1 text-[10px] text-zinc-600">sold</span></span>
                        <span className="text-right tabular-nums text-zinc-300">{formatMoney(row.gross)}<span className="ml-1 text-[10px] text-zinc-600">gross</span></span>
                        <span className="text-right tabular-nums text-zinc-300">{percent(row.scanRate)}<span className="ml-1 text-[10px] text-zinc-600">scan</span></span>
                    </div>
                ))}
            </div>
        </section>
    );
}

/** Content engine, chart-first: uploads over the night + who fed the feed. */
/** Compact top-5 leaderboard — shared row style for uploaders/chatters/engagers. */
function Leaderboard({ title, people = [], emptyLabel }) {
    return (
        <div>
            <p className="px-1 text-[11px] font-medium tracking-[0.02em] text-white/35">{title}</p>
            {people.length ? (
                <div className="mt-2 space-y-1.5">
                    {people.map((person, index) => (
                        <div key={person.userId} className="glass-field flex items-center gap-3 rounded-2xl p-2.5">
                            <span className="w-4 shrink-0 text-center text-[11px] font-bold text-zinc-600">{index + 1}</span>
                            {person.avatarUrl ? (
                                <img src={person.avatarUrl} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
                            ) : (
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-xs font-bold text-white">
                                    {(person.name || person.username || '?').slice(0, 1).toUpperCase()}
                                </span>
                            )}
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-bold text-white">{person.name || person.username || 'Guest'}</p>
                                {person.username ? <p className="truncate text-xs text-zinc-500">@{person.username}</p> : null}
                            </div>
                            <span className="shrink-0 text-xs font-bold text-zinc-300">{formatNumber(person.count)}</span>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="mt-2 rounded-2xl bg-white/[0.035] p-4 text-sm text-zinc-400">{emptyLabel}</div>
            )}
        </div>
    );
}

/** "The people who made it": top uploaders, chatters, and engagers — replaces the old repeat-y content-engine card. */
function AudienceLeaderboardsPanel({ media, behavior }) {
    return (
        <SectionCard title="The people who made it" className="h-full !rounded-[1.25rem]">
            <div className="grid gap-4 sm:grid-cols-3">
                <Leaderboard title="Top uploaders" people={media.topUploaders} emptyLabel="No uploads yet." />
                <Leaderboard title="Top chatters" people={behavior?.topChatters} emptyLabel="No chat activity yet." />
                <Leaderboard title="Top engagers" people={behavior?.topEngagers} emptyLabel="No comments or reactions yet." />
            </div>
        </SectionCard>
    );
}

function AnalyticsSectionLabel({ eyebrow, title, copy }) {
    return (
        <div className="px-1">
            <p className="text-[11px] font-medium tracking-[0.02em] text-zinc-500">{eyebrow}</p>
            <h2 className="mt-2 text-xl font-bold tracking-normal text-white normal-case md:text-2xl">{title}</h2>
            {copy ? <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-500">{copy}</p> : null}
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

    // Click-to-select picker: one id = full storyline, several = overlay comparison.
    const [selectedIds, setSelectedIds] = useState([]);
    const [comparisonDetails, setComparisonDetails] = useState([]);
    const [comparisonLoading, setComparisonLoading] = useState(false);
    const [eventDetail, setEventDetail] = useState(null);
    const [eventDetailLoading, setEventDetailLoading] = useState(false);
    const [marketingKitOpen, setMarketingKitOpen] = useState(false);
    const selectedEventId = selectedIds.length === 1 ? selectedIds[0] : null;

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setEventsLoading(true);
            try {
                // managed=1: created OR co-hosted events, so venue accounts see the events they staff.
                const res = await eventsService.getManagedEvents({ limit: 100, offset: 0 });
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
        const timer = setTimeout(() => {
            setOverviewLoading(true);
            organizerAnalyticsService
                .getOverview()
                .then((res) => { if (!cancelled) setOverview(res); })
                .catch(() => { if (!cancelled) setOverview(null); })
                .finally(() => { if (!cancelled) setOverviewLoading(false); });
        }, 0);
        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, []);

    const eventOptions = useMemo(
        () => events.map((event) => ({
            id: event.id,
            name: event.name || 'Untitled event',
            dateLabel: formatEventDate(event.startDate),
            startDate: event.startDate || null,
            coverImage: event.coverImage || null,
            venueName: event.venueName || null,
            status: event.effectiveStatus || event.status || null,
        })),
        [events]
    );

    useEffect(() => {
        if (eventsLoading || selectedIds.length || !eventOptions.length) return;
        const timer = setTimeout(() => setSelectedIds([eventOptions[0].id]), 0);
        return () => clearTimeout(timer);
    }, [eventOptions, eventsLoading, selectedIds.length]);

    // Click selects; clicking again deselects (at least one stays selected). Max 4 for readable overlays.
    const handleToggleEvent = (eventId) => {
        setSelectedIds((current) => {
            if (current.includes(eventId)) {
                const next = current.filter((id) => id !== eventId);
                return next.length ? next : current;
            }
            return [...current, eventId].slice(-4);
        });
    };

    useEffect(() => {
        if (!selectedEventId) {
            const timer = setTimeout(() => setEventDetail(null), 0);
            return () => clearTimeout(timer);
        }
        let cancelled = false;
        const timer = setTimeout(() => {
            setEventDetailLoading(true);
            organizerAnalyticsService
                .getEventAnalytics(selectedEventId)
                .then((res) => { if (!cancelled) setEventDetail(res); })
                .catch(() => { if (!cancelled) setEventDetail(null); })
                .finally(() => { if (!cancelled) setEventDetailLoading(false); });
        }, 0);
        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [selectedEventId]);

    // Only fetches when actually comparing (2+ selected) — single-select reuses eventDetail above.
    useEffect(() => {
        const ids = selectedIds.length > 1 ? selectedIds.slice(0, 4) : [];
        if (!ids.length) {
            const timer = setTimeout(() => setComparisonDetails([]), 0);
            return () => clearTimeout(timer);
        }
        let cancelled = false;
        const timer = setTimeout(() => {
            setComparisonLoading(true);
            Promise.allSettled(ids.map((id) => organizerAnalyticsService.getEventAnalytics(id)))
                .then((results) => {
                    if (cancelled) return;
                    setComparisonDetails(results.flatMap((result) => (result.status === 'fulfilled' ? [result.value] : [])));
                })
                .finally(() => {
                    if (!cancelled) setComparisonLoading(false);
                });
        }, 0);
        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [selectedIds]);

    const totals = overview?.totals;
    const last30d = overview?.last30d;
    const overviewVelocity7d = useMemo(() => avgLast7(last30d?.ticketsByDay || [], 'count'), [last30d]);

    const funnelData = useMemo(() => {
        if (!eventDetail) return [];
        return [
            { stage: 'Sold', value: eventDetail.funnel.sold },
            { stage: 'Scanned', value: eventDetail.funnel.scanned },
            { stage: 'Posted media', value: eventDetail.funnel.postedMedia },
        ];
    }, [eventDetail]);

    if (viewMode === 'live-ops') {
        return <LiveScanDashboard isLiveEvent={isLiveEvent} />;
    }

    const isComparing = selectedIds.length > 1;

    return (
        <div className="mx-auto max-w-7xl space-y-6 md:space-y-8">
            <div className="px-1">
                <p className="flex items-center gap-2.5 text-[13px] font-medium text-zinc-500">
                    Analytics
                    {isLiveEvent ? (
                        <Link
                            href="/dashboard/analytics?view=live-ops"
                            className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-200 transition hover:bg-emerald-400/15"
                        >
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />
                            Live now
                        </Link>
                    ) : null}
                </p>
                <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-white md:text-[28px]">See what moved the room</h1>
            </div>

            <EventPicker events={eventOptions} selectedIds={selectedIds} onToggle={handleToggleEvent} loading={eventsLoading} />

            {isComparing ? (
                <>
                    <EventComparisonChart details={comparisonDetails} loading={comparisonLoading} />
                    <MarketingPanel />
                </>
            ) : !selectedEventId ? (
                <div className="rounded-2xl bg-white/[0.035] p-6 text-sm text-zinc-400">Select an event above to see its full analytics.</div>
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
                    <InsightsPanel
                        insights={eventDetail.insights}
                        eyebrow="What we noticed at this event"
                        onCta={() => document.getElementById('top-moments-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                    />

                    <AnalyticsSectionLabel
                        eyebrow="Before doors"
                        title="Sell the room"
                        copy="Pace toward the date and where buyers stall on the way in."
                    />

                    <SalesVelocityChart
                        byDay={eventDetail.sales.byDay}
                        velocityPerDay7d={eventDetail.sales.velocityPerDay7d}
                        totalSold={eventDetail.sales.total}
                        grossCents={eventDetail.sales.revenue.grossCents}
                        netCents={eventDetail.sales.revenue.netCents}
                        eventStartDate={eventDetail.event?.startDate}
                        isMobile={isMobile}
                    />

                    <SectionCard title="Attendance path" className="!rounded-[1.25rem]">
                        <FunnelChart data={funnelData} />
                    </SectionCard>

                    <AnalyticsSectionLabel
                        eyebrow="Doors open"
                        title="Run the night"
                        copy="Energy through the hours and where it happened on the floor."
                    />

                    <HypePanel behavior={eventDetail.behavior} capture={eventDetail.media?.capture} isMobile={isMobile} />

                    <SectionCard title="Spatial intelligence" className="!rounded-[1.25rem]">
                        <VenueHeatMap eventId={selectedEventId} />
                    </SectionCard>

                    <AnalyticsSectionLabel
                        eyebrow="Afterglow"
                        title="Turn the night into the next one"
                        copy="The scrapbook era: crowd content and moments that market whatever you run next."
                    />

                    <div id="top-moments-panel" className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
                        <AudienceLeaderboardsPanel media={eventDetail.media} behavior={eventDetail.behavior} />
                        <TopMomentsPanel
                            moments={eventDetail.behavior?.topMoments}
                            onPromote={() => setMarketingKitOpen(true)}
                            onRemoved={(mediaId) =>
                                setEventDetail((prev) =>
                                    prev
                                        ? {
                                              ...prev,
                                              behavior: {
                                                  ...prev.behavior,
                                                  topMoments: (prev.behavior?.topMoments || []).filter((m) => m.mediaId !== mediaId),
                                              },
                                          }
                                        : prev
                                )
                            }
                        />
                    </div>

                    <MarketingPanel selectedEventId={selectedEventId} />

                    <div className="flex flex-wrap items-center justify-between gap-4 rounded-[1.25rem] bg-white/[0.035] p-5">
                        <div>
                            <p className="text-sm font-bold text-white">Ready for the sequel?</p>
                            <p className="mt-1 max-w-xl text-sm leading-6 text-zinc-500">
                                This event&apos;s audience, content, and timings feed the next one — spin it up and push a send to the people who were here.
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Link href="/dashboard/events" className="pill-solid px-4 py-2 text-xs">Plan the next event</Link>
                            <Link href="/dashboard/campaigns" className="pill-ghost px-4 py-2 text-xs font-bold tracking-[0.02em]">Message past attendees</Link>
                        </div>
                    </div>

                    <MarketingKitModal
                        open={marketingKitOpen}
                        onClose={() => setMarketingKitOpen(false)}
                        moments={eventDetail.behavior?.topMoments || []}
                        event={{
                            ...eventDetail.event,
                            venueName: eventOptions.find((option) => option.id === eventDetail.event?.id)?.venueName || '',
                        }}
                    />
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
