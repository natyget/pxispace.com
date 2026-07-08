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
import MetricCard, { MicroChart, StatRow } from '@/components/dashboard/MetricCard';
import FunnelChart from '@/components/dashboard/FunnelChart';
import { getDashboardChartShade } from '@/components/dashboard/chartStyles';
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
    { id: 'media', label: 'Uploads' },
];

const HYPE_SERIES = {
    messages: { label: 'Messages', color: '#f4f4f5' },
    reactions: { label: 'Reactions', color: '#a1a1aa' },
    media: { label: 'Uploads', color: '#71717a' },
};

const HYPE_MODES = [
    { id: 'stacked', label: 'Stacked' },
    { id: 'lines', label: 'Lines' },
];

/**
 * Hype: engagement-per-attendee composite + chat/reaction/upload velocity.
 * Data comes from `eventDetail.behavior` (real Mongo aggregates, not samples).
 */
function HypePanel({ behavior, isMobile }) {
    const [channel, setChannel] = useState('all');
    const [mode, setMode] = useState('stacked');
    if (!behavior) return null;
    const series = (behavior.byHour || []).map((d) => ({
        hourIso: d.hourIso,
        messages: d.messages,
        reactions: d.reactions,
        media: d.media,
    }));
    const activeKeys = channel === 'all' ? ['messages', 'reactions', 'media'] : [channel];
    const hasActivity = series.some((d) => activeKeys.some((key) => Number(d[key]) > 0));
    const totalsByKey = Object.keys(HYPE_SERIES).map((key) => ({
        key,
        ...HYPE_SERIES[key],
        value: Number(behavior.totals?.[key]) || 0,
        active: activeKeys.includes(key),
    }));
    const activeTotal = totalsByKey
        .filter((item) => item.active)
        .reduce((sum, item) => sum + item.value, 0);
    const maxHypeChannelTotal = Math.max(1, ...totalsByKey.map((entry) => entry.value));
    const peakHour = series.reduce((peak, point) => {
        const pointTotal = activeKeys.reduce((sum, key) => sum + (Number(point[key]) || 0), 0);
        return pointTotal > peak.total ? { hourIso: point.hourIso, total: pointTotal } : peak;
    }, { hourIso: null, total: 0 });

    const actions = (
        <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
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
            <div className="dashboard-segmented-toggle max-w-full" aria-label="Hype chart mode">
                {HYPE_MODES.map((item) => (
                    <button
                        key={item.id}
                        type="button"
                        className="dashboard-segmented-toggle__item"
                        data-active={mode === item.id}
                        aria-pressed={mode === item.id}
                        onClick={() => setMode(item.id)}
                    >
                        {item.label}
                    </button>
                ))}
            </div>
        </div>
    );

    return (
        <SectionCard
            title="Hype index"
            actions={actions}
            className="!rounded-[1.75rem]"
            bodyClassName="!p-0"
        >
            <div className="relative overflow-hidden px-5 py-5 md:px-6 md:py-6">
                <div className="relative grid grid-cols-1 gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
                    <div className="rounded-[1.5rem] bg-white/[0.035] p-5 md:p-6">
                        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">Engagement pulse</p>
                        <p className="mt-3 text-6xl font-black leading-none tracking-normal text-white md:text-7xl">{formatNumber(behavior.hypeIndex)}</p>
                        <p className="mt-1 text-sm font-bold text-zinc-400">out of 100</p>
                        <p className="mt-4 text-sm leading-6 text-zinc-400">
                            A blended signal from chat, reactions, comments, and uploads per attendee.
                        </p>
                        <div className="mt-6 grid grid-cols-2 gap-2">
                            <div className="rounded-2xl bg-white/[0.045] p-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-white/35">Selected volume</p>
                                <p className="mt-1 text-sm font-black text-white">{formatNumber(activeTotal)}</p>
                            </div>
                            <div className="rounded-2xl bg-white/[0.045] p-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-white/35">Peak hour</p>
                                <p className="mt-1 text-sm font-black text-white">
                                    {peakHour.hourIso ? formatHourTick(peakHour.hourIso) : 'No activity'}
                                </p>
                            </div>
                        </div>
                        <div className="mt-2 rounded-2xl bg-white/[0.045] p-3">
                            <p className="text-[10px] font-black uppercase tracking-widest text-white/35">Peak volume</p>
                            <p className="mt-1 text-sm font-black text-white">{formatNumber(peakHour.total)}</p>
                        </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {totalsByKey.map((item) => (
                            <div key={item.key} className="rounded-2xl bg-white/[0.045] p-3">
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-white/35">{item.label}</p>
                                    <span className={`h-2 w-2 rounded-full ${item.active ? 'opacity-100' : 'opacity-35'}`} style={{ backgroundColor: item.color }} />
                                </div>
                                <p className="mt-3 text-3xl font-black tracking-normal text-white">{formatNumber(item.value)}</p>
                                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.055]">
                                    <div
                                        className="h-full rounded-full bg-white/70"
                                        style={{ width: `${clampPercent(item.value, maxHypeChannelTotal)}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                        <div className="rounded-2xl bg-white/[0.045] p-3">
                            <p className="text-[10px] font-black uppercase tracking-widest text-white/35">Comments</p>
                            <p className="mt-3 text-3xl font-black tracking-normal text-white">{formatNumber(behavior.totals?.comments)}</p>
                            <p className="mt-3 text-xs font-semibold leading-5 text-zinc-500">Conversation depth outside quick reactions.</p>
                        </div>
                    </div>
                </div>
                {hasActivity ? (
                    <div className="relative mt-5 h-[380px] rounded-[1.5rem] bg-white/[0.025] p-3 md:h-[520px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={series} margin={{ top: 12, right: 14, bottom: 0, left: isMobile ? -18 : 0 }}>
                                <defs>
                                    {Object.entries(HYPE_SERIES).map(([key, config]) => (
                                        <linearGradient key={key} id={`hypeGradient-${key}`} x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor={config.color} stopOpacity={0.18} />
                                            <stop offset="100%" stopColor={config.color} stopOpacity={0.02} />
                                        </linearGradient>
                                    ))}
                                </defs>
                                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
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
                                <Tooltip
                                    labelFormatter={formatHourTick}
                                    contentStyle={{
                                        background: '#09090b',
                                        border: 0,
                                        borderRadius: 14,
                                        fontSize: 12,
                                    }}
                                />
                                {activeKeys.map((key) => (
                                    <Area
                                        key={key}
                                        type="monotone"
                                        dataKey={key}
                                        name={HYPE_SERIES[key].label}
                                        stackId={channel === 'all' && mode === 'stacked' ? 'hype' : undefined}
                                        stroke={HYPE_SERIES[key].color}
                                        fill={`url(#hypeGradient-${key})`}
                                        fillOpacity={mode === 'lines' ? 0.18 : 1}
                                        strokeWidth={2.4}
                                        dot={false}
                                        activeDot={{ r: 4, fill: '#fff', stroke: '#09090b' }}
                                        isAnimationActive={false}
                                    />
                                ))}
                            </AreaChart>
                        </ResponsiveContainer>
                        <div className="absolute bottom-3 left-4 flex flex-wrap items-center gap-4 text-[11px] font-bold text-zinc-500">
                            {activeKeys.map((key) => (
                                <span key={key} className="inline-flex items-center gap-1.5">
                                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: HYPE_SERIES[key].color }} />
                                    {HYPE_SERIES[key].label}
                                </span>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="relative mt-5 rounded-2xl bg-white/[0.035] p-6 text-sm text-zinc-500">
                        No {channel === 'all' ? 'chat, reaction, or upload' : HYPE_CHANNELS.find((item) => item.id === channel)?.label.toLowerCase()} activity in the event window yet.
                    </div>
                )}
            </div>
        </SectionCard>
    );
}

/** Most-reacted media with host moderation (remove = backend Bouncer endpooint permissions). */
function TopMomentsPanel({ moments, onRemoved }) {
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
        <SectionCard title="Top moments">
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
                                className="shrink-0 rounded-full bg-red-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-red-300 opacity-0 transition group-hover:opacity-100 disabled:opacity-60"
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
                <div className="h-16 shrink-0 rounded-2xl bg-black/15 px-2 py-2">
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

function AnalyticsHero({ totals, last30d, velocity7d, loading, isLiveEvent }) {
    const heroMetrics = [
        {
            label: 'Net revenue',
            value: formatMoney(totals?.netCents),
            detail: 'After platform fees',
            sparkline: (last30d?.revenueByDay || []).map((d) => d.netCents ?? d.grossCents),
        },
        {
            label: 'Tickets sold',
            value: formatNumber(totals?.ticketsSold),
            detail: `${formatNumber(round1(velocity7d))}/day over 7 days`,
            sparkline: (last30d?.ticketsByDay || []).map((d) => d.count),
        },
        {
            label: 'Attendees',
            value: formatNumber(totals?.attendees),
            detail: 'Distinct ticket holders',
            sparkline: null,
        },
        {
            label: 'Media uploads',
            value: formatNumber(totals?.mediaCount),
            detail: 'Guest generated content',
            sparkline: (last30d?.mediaByDay || []).map((d) => d.count),
        },
    ];

    return (
        <section className="dashboard-surface-b relative overflow-hidden rounded-[2rem] px-5 py-6 md:px-7 md:py-7">
            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-2xl">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-widest text-black">
                            Organizer Analytics
                        </span>
                        {isLiveEvent ? (
                            <Link
                                href="/dashboard/analytics?view=live-ops"
                                className="inline-flex items-center gap-2 rounded-full bg-emerald-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-200"
                            >
                                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300" />
                                Live operations
                            </Link>
                        ) : null}
                    </div>
                    <h1 className="max-w-xl text-3xl font-black leading-[0.95] tracking-normal text-white normal-case md:text-5xl">
                        See what moved the room.
                    </h1>
                    <p className="mt-4 max-w-xl text-sm leading-6 text-zinc-300 md:text-base">
                        Revenue, attendance, hype, and shareable moments in one clean read.
                    </p>
                </div>
                <div className="grid grid-cols-2 gap-2 lg:w-[430px]">
                    {heroMetrics.map((metric) => (
                        <div key={metric.label} className="min-h-[118px] rounded-2xl bg-white/[0.055] p-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-white/45">{metric.label}</p>
                            {loading ? (
                                <div className="mt-4 h-8 w-20 animate-pulse rounded-lg bg-white/10" />
                            ) : (
                                <p className="mt-3 truncate text-2xl font-black tracking-normal text-white">{metric.value}</p>
                            )}
                            <p className="mt-2 text-xs font-semibold leading-4 text-zinc-400">{metric.detail}</p>
                            {metric.sparkline?.length ? (
                                <MicroChart points={metric.sparkline} color="#ffffff" className="mt-3 opacity-70" />
                            ) : null}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function EventPicker({ events, selectedEventId, comparisonIds = [], onSelect, onToggleCompare, loading }) {
    return (
        <div className="rounded-[1.75rem] bg-white/[0.035] p-4">
            <div className="flex flex-col gap-1 pb-4 md:flex-row md:items-end md:justify-between">
                <div>
                    <p className="text-xs font-black uppercase tracking-widest text-white/40">Choose events</p>
                    <p className="mt-1 text-sm text-zinc-500">Open one event for detail, or compare up to four at once.</p>
                </div>
                {loading ? <span className="text-xs font-semibold text-zinc-500">Syncing events</span> : null}
            </div>
            {events.length === 0 && !loading ? (
                <p className="text-sm text-zinc-400">Create an event to see its analytics here.</p>
            ) : (
                <div className="dashboard-scrollbar-none flex gap-2 overflow-x-auto pb-1">
                    {events.map((event) => {
                        const selected = event.id === selectedEventId;
                        const comparing = comparisonIds.includes(event.id);
                        return (
                            <div
                                key={event.id}
                                className={`min-w-[190px] rounded-2xl p-2 transition ${
                                    selected
                                        ? 'bg-white text-black shadow-[0_14px_36px_rgba(255,255,255,0.12)]'
                                        : 'bg-white/[0.055] text-zinc-300 hover:bg-white/[0.09] hover:text-white'
                                }`}
                            >
                                <button
                                    type="button"
                                    onClick={() => onSelect(event.id)}
                                    aria-pressed={selected}
                                    className="block w-full rounded-xl px-2 py-1.5 text-left text-xs font-bold"
                                >
                                    <span className="block truncate">{event.name}</span>
                                    <span className={`mt-1 block text-[10px] uppercase tracking-widest ${selected ? 'text-black/55' : 'text-zinc-500'}`}>{event.dateLabel}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onToggleCompare(event.id)}
                                    aria-pressed={comparing}
                                    className={`mt-1 w-full rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition ${
                                        comparing
                                            ? selected ? 'bg-black text-white' : 'bg-white text-black'
                                            : selected ? 'bg-black/10 text-black/60 hover:bg-black/15' : 'bg-white/[0.06] text-white/45 hover:bg-white/[0.1] hover:text-white'
                                    }`}
                                >
                                    {comparing ? 'Comparing' : 'Compare'}
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function CompareMetric({ label, value, barValue, maxValue }) {
    return (
        <div className="rounded-2xl bg-white/[0.035] px-3 py-3">
            <div className="flex items-center justify-between gap-3">
                <p className="truncate text-[10px] font-black uppercase tracking-widest text-white/35">{label}</p>
                <p className="shrink-0 text-sm font-black text-white tabular-nums">{value}</p>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.055]" aria-hidden="true">
                <div className="h-full rounded-full bg-white/70" style={{ width: `${clampPercent(barValue, maxValue)}%` }} />
            </div>
        </div>
    );
}

function EventComparisonPanel({ details = [], loading }) {
    if (loading) {
        return (
            <div className="rounded-[1.75rem] bg-white/[0.035] p-5">
                <p className="text-xs font-black uppercase tracking-widest text-white/35">Comparison</p>
                <div className="mt-4 grid gap-3 lg:grid-cols-3">
                    {[0, 1, 2].map((item) => (
                        <div key={item} className="h-32 animate-pulse rounded-2xl bg-white/[0.035]" />
                    ))}
                </div>
            </div>
        );
    }

    if (!details.length) {
        return (
            <div className="rounded-[1.75rem] bg-white/[0.035] p-5">
                <p className="text-xs font-black uppercase tracking-widest text-white/35">Comparison</p>
                <p className="mt-2 text-sm leading-6 text-zinc-500">Select Compare on one or more event chips to build a side-by-side read.</p>
            </div>
        );
    }

    const rows = details.map((detail) => ({
        id: detail.event?.id,
        name: detail.event?.name || 'Event',
        tickets: Number(detail.sales?.total || detail.funnel?.sold || 0),
        gross: Number(detail.sales?.revenue?.grossCents || 0),
        scanRate: Number(detail.attendance?.scanRate || 0),
        hype: Number(detail.behavior?.hypeIndex || 0),
    }));
    const maxTickets = Math.max(1, ...rows.map((row) => row.tickets));
    const maxGross = Math.max(1, ...rows.map((row) => row.gross));
    const maxHype = Math.max(100, ...rows.map((row) => row.hype));

    return (
        <section className="rounded-[1.75rem] bg-white/[0.035] p-5">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-xs font-black uppercase tracking-widest text-white/35">Comparison</p>
                    <h2 className="mt-2 text-xl font-black tracking-normal text-white">Event side-by-side</h2>
                </div>
                <p className="text-xs font-semibold text-zinc-500">{rows.length} selected</p>
            </div>
            <div className="mt-5 grid gap-3 xl:grid-cols-2">
                {rows.map((row) => (
                    <article key={row.id || row.name} className="rounded-[1.25rem] bg-white/[0.035] p-4">
                        <h3 className="truncate text-base font-black text-white">{row.name}</h3>
                        <div className="mt-4 grid gap-2 sm:grid-cols-2">
                            <CompareMetric label="Tickets" value={formatNumber(row.tickets)} barValue={row.tickets} maxValue={maxTickets} />
                            <CompareMetric label="Gross" value={formatMoney(row.gross)} barValue={row.gross} maxValue={maxGross} />
                            <CompareMetric label="Scan rate" value={percent(row.scanRate)} barValue={row.scanRate} maxValue={1} />
                            <CompareMetric label="Hype" value={formatNumber(row.hype)} barValue={row.hype} maxValue={maxHype} />
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
}

function InsightMetric({ label, value, detail, sparkline, tone = 'default' }) {
    const toneClass = tone === 'muted' ? 'text-zinc-300' : 'text-white';
    return (
        <div className="rounded-2xl bg-white/[0.045] p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/40">{label}</p>
            <p className={`mt-2 truncate text-2xl font-black tracking-normal ${toneClass}`}>{value}</p>
            {detail ? <p className="mt-1 text-xs font-semibold leading-5 text-zinc-500">{detail}</p> : null}
            {sparkline ? <MicroChart points={sparkline} color="#ffffff" className="mt-3 opacity-65" /> : null}
        </div>
    );
}

function EventSummaryPanel({ eventDetail }) {
    const scanRate = percent(eventDetail.attendance.scanRate);
    return (
        <SectionCard title="Event snapshot" className="!rounded-[1.75rem]" bodyClassName="!p-4 md:!p-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <InsightMetric
                    label="Gross revenue"
                    value={formatMoney(eventDetail.sales.revenue.grossCents)}
                    detail="Total ticket revenue"
                    sparkline={eventDetail.sales.revenue.byDay.map((d) => d.grossCents)}
                    tone="warm"
                />
                <InsightMetric
                    label="Net revenue"
                    value={formatMoney(eventDetail.sales.revenue.netCents)}
                    detail="After platform fees"
                    sparkline={eventDetail.sales.revenue.byDay.map((d) => d.netCents)}
                />
                <InsightMetric
                    label="Scan rate"
                    value={scanRate}
                    detail={`${formatNumber(eventDetail.attendance.scanned)} of ${formatNumber(eventDetail.attendance.sold)} scanned`}
                    sparkline={eventDetail.attendance.scansByHour.map((d) => d.count)}
                    tone="good"
                />
                <InsightMetric
                    label="Media uploads"
                    value={formatNumber(eventDetail.media.count)}
                    detail={`${formatNumber(eventDetail.media.reactions)} reactions`}
                    sparkline={eventDetail.media.byHour.map((d) => d.count)}
                />
            </div>
        </SectionCard>
    );
}

function MediaPanel({ media }) {
    return (
        <SectionCard title="Content engine" className="h-full !rounded-[1.75rem]">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                <div className="space-y-3">
                    <InsightMetric
                        label="Uploads"
                        value={formatNumber(media.count)}
                        detail="Photos and videos posted"
                        sparkline={media.byHour.map((d) => d.count)}
                    />
                    <StatRow
                        className="!rounded-2xl"
                        items={[
                            { label: 'Reactions', value: formatNumber(media.reactions) },
                            { label: 'Comments', value: formatNumber(media.comments) },
                            { label: 'Face tags', value: formatNumber(media.faceTags) },
                        ]}
                    />
                </div>
                <TopUploadersList uploaders={media.topUploaders} />
            </div>
        </SectionCard>
    );
}

function AnalyticsSectionLabel({ eyebrow, title, copy }) {
    return (
        <div className="px-1">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">{eyebrow}</p>
            <h2 className="mt-2 text-xl font-black tracking-normal text-white normal-case md:text-2xl">{title}</h2>
            {copy ? <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-500">{copy}</p> : null}
        </div>
    );
}

function TopUploadersList({ uploaders = [] }) {
    if (!uploaders.length) {
        return <div className="rounded-2xl bg-white/[0.035] p-4 text-sm text-zinc-400">No uploads yet.</div>;
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
            <div className="rounded-2xl bg-white/[0.035] p-6 text-sm text-zinc-400">
                No geotagged photos yet for this event.
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {clusters.length === 0 ? (
                <div className="rounded-2xl bg-white/[0.035] p-4 text-sm text-zinc-400">
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
    const [comparisonEventIds, setComparisonEventIds] = useState([]);
    const [comparisonDetails, setComparisonDetails] = useState([]);
    const [comparisonLoading, setComparisonLoading] = useState(false);
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
        })),
        [events]
    );

    useEffect(() => {
        if (eventsLoading || selectedEventId || !eventOptions.length) return;
        const timer = setTimeout(() => {
            setSelectedEventId(eventOptions[0].id);
            setComparisonEventIds([eventOptions[0].id]);
        }, 0);
        return () => clearTimeout(timer);
    }, [eventOptions, eventsLoading, selectedEventId]);

    const handleSelectEvent = (eventId) => {
        setSelectedEventId(eventId);
        setComparisonEventIds((current) => (current.length ? current : [eventId]));
    };

    const handleToggleCompare = (eventId) => {
        setComparisonEventIds((current) => {
            if (current.includes(eventId)) {
                const next = current.filter((id) => id !== eventId);
                return next.length ? next : [eventId];
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

    useEffect(() => {
        const ids = comparisonEventIds.filter(Boolean).slice(0, 4);
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
    }, [comparisonEventIds]);

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
        <div className="mx-auto max-w-7xl space-y-6 md:space-y-8">
            <AnalyticsHero
                totals={totals}
                last30d={last30d}
                velocity7d={overviewVelocity7d}
                loading={overviewLoading}
                isLiveEvent={isLiveEvent}
            />

            <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
                <EventPicker
                    events={eventOptions}
                    selectedEventId={selectedEventId}
                    comparisonIds={comparisonEventIds}
                    onSelect={handleSelectEvent}
                    onToggleCompare={handleToggleCompare}
                    loading={eventsLoading}
                />
                <div className="rounded-[1.75rem] bg-white/[0.035] p-4">
                    <p className="text-xs font-black uppercase tracking-widest text-white/40">Portfolio totals</p>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                        {[
                            { label: 'Events', value: formatNumber(totals?.events) },
                            { label: 'Scanned', value: formatNumber(totals?.ticketsScanned) },
                            { label: 'Gross', value: formatMoney(totals?.grossCents) },
                            { label: 'Velocity', value: `${formatNumber(round1(overviewVelocity7d))}/day` },
                        ].map((item) => (
                            <div key={item.label} className="rounded-2xl bg-white/[0.045] px-3 py-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{item.label}</p>
                                <p className="mt-1 truncate text-lg font-black text-white">{overviewLoading ? '...' : item.value}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <EventComparisonPanel details={comparisonDetails} loading={comparisonLoading} />

            {!selectedEventId ? (
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
                    <AnalyticsSectionLabel
                        eyebrow="Selected event"
                        title={eventDetail.event?.name || 'Event performance'}
                        copy="Start with sales and revenue, then move through attendance, engagement, content, and location signals."
                    />

                    <SalesVelocityChart
                        byDay={eventDetail.sales.byDay}
                        velocityPerDay7d={eventDetail.sales.velocityPerDay7d}
                        totalSold={eventDetail.sales.total}
                        isMobile={isMobile}
                    />

                    <EventSummaryPanel eventDetail={eventDetail} />

                    <HypePanel behavior={eventDetail.behavior} isMobile={isMobile} />

                    <SectionCard title="Attendance path" className="!rounded-[1.75rem]">
                        <FunnelChart data={funnelData} singleSelection />
                    </SectionCard>

                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
                        <MediaPanel media={eventDetail.media} />
                        <TopMomentsPanel
                            moments={eventDetail.behavior?.topMoments}
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

                    <SectionCard title="Where the night happened" className="!rounded-[1.75rem]">
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
