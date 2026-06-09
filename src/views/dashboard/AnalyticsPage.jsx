'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
    Area,
    AreaChart,
    CartesianGrid,
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import SectionCard from '@/components/dashboard/SectionCard';
import { TimeSeriesChartShell } from '@/components/dashboard/ChartFrame';
import SpatialHeatMap from '@/components/dashboard/SpatialHeatMap';
import FunnelChart from '@/components/dashboard/FunnelChart';
import { getSingleShadeDonutCellProps, getTimeSeriesProps } from '@/components/dashboard/chartStyles';
import { buildAnalyticsMock, normalizeAnalyticsEvents } from '@/services/analyticsMock';
import { eventsService } from '@/services/events';
import { useDashboardShellStore } from '@/lib/dashboardShellStore';
import LiveScanDashboard from '@/views/dashboard/LiveScanDashboard';

const DAY_MS = 24 * 60 * 60 * 1000;
const FILTER_SHORTCUTS = [
    { id: 'all', label: 'All' },
    { id: 'week', label: 'Past week', days: 7 },
    { id: 'month', label: 'Past month', days: 30 },
    { id: 'year', label: 'Past year', days: 365 },
];

function formatNumber(value) {
    return Number(value || 0).toLocaleString('en-US');
}

function sameIdSet(left = [], right = []) {
    if (left.length !== right.length) return false;
    const rightSet = new Set(right);
    return left.every((id) => rightSet.has(id));
}

function idsForShortcut(events, shortcut) {
    if (shortcut.id === 'all') return events.map((event) => event.id);
    const now = Date.now();
    const minDate = now - shortcut.days * DAY_MS;
    return events
        .filter((event) => typeof event.dateMs === 'number' && event.dateMs >= minDate && event.dateMs <= now)
        .map((event) => event.id);
}

function HypeTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    const point = payload[0].payload || {};
    return (
        <div className="dashboard-glow-popover min-w-[220px] rounded-2xl bg-zinc-950 p-3.5 shadow-2xl">
            <p className="text-[11px] font-semibold tracking-wide text-zinc-300">{label}</p>
            <p className="mt-1 text-base font-black text-white">Hype {point.current}</p>
            <p className="mt-1 text-xs font-semibold text-zinc-400">Previous period {point.previous}</p>
            <p className="mt-1.5 text-xs text-zinc-200">
                {formatNumber(point.reactions)} reactions · {formatNumber(point.scans)} scans · {formatNumber(point.posts)} posts
            </p>
        </div>
    );
}

function HypeActivityLayer({ points = [] }) {
    const maxHype = Math.max(...points.map((point) => point.current || point.hype || 0), 1);
    const pulses = points.flatMap((point, pointIndex) => {
        const hype = point.current || point.hype || 0;
        const density = hype >= maxHype - 3 ? 4 : hype >= 84 ? 3 : hype >= 72 ? 2 : 1;
        const left = points.length > 1 ? 4 + (pointIndex / (points.length - 1)) * 92 : 50;
        const top = 78 - (hype / 100) * 58;
        return Array.from({ length: density }).map((_, pulseIndex) => {
            const type = ['msg', 'flash', 'rxn', 'scan'][(pointIndex + pulseIndex) % 4];
            return {
                id: `${point.time}-${pulseIndex}`,
                type,
                left: Math.min(96, Math.max(4, left + (pulseIndex - density / 2) * 2.8)),
                top: Math.min(86, Math.max(12, top + ((pulseIndex % 2) ? 5 : -4))),
                delay: `${(pointIndex * 0.18 + pulseIndex * 0.34).toFixed(2)}s`,
                duration: `${2.8 + (pulseIndex % 3) * 0.45}s`,
                emphasis: hype >= maxHype - 3,
            };
        });
    });

    return (
        <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden rounded-2xl">
            {pulses.map((pulse) => (
                <span
                    key={pulse.id}
                    className={`absolute inline-flex items-center justify-center rounded-full border text-[8px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(216,74,255,0.28)] animate-pulse ${
                        pulse.type === 'flash'
                            ? 'h-5 w-5 border-white/40 bg-white/10 text-white'
                            : pulse.type === 'scan'
                                ? 'h-7 w-7 border-cyan-300/35 bg-cyan-300/10 text-cyan-100'
                                : pulse.type === 'rxn'
                                    ? 'h-6 w-6 border-fuchsia-300/35 bg-fuchsia-400/10 text-fuchsia-100'
                                    : 'h-7 min-w-9 border-pxi-purple/35 bg-pxi-purple/12 px-2 text-purple-100'
                    }`}
                    style={{
                        left: `${pulse.left}%`,
                        top: `${pulse.top}%`,
                        animationDelay: pulse.delay,
                        animationDuration: pulse.duration,
                        opacity: pulse.emphasis ? 0.82 : 0.48,
                    }}
                >
                    {pulse.type}
                </span>
            ))}
        </div>
    );
}

function HypeIndexChart({ series, isMobile, hasSelection, currentLabel, previousLabel }) {
    const latest = series[series.length - 1] || { current: 0, previous: 0 };
    const delta = latest.previous ? Math.round(((latest.current - latest.previous) / latest.previous) * 100) : 0;
    const change = {
        label: hasSelection ? `${delta >= 0 ? '+' : ''}${delta}%` : '-',
        tone: delta >= 0 ? 'positive' : 'negative',
    };

    return (
        <TimeSeriesChartShell
            title="Hype Index"
            subheading="Selected event energy compared across albums."
            liveValue={hasSelection ? latest.current : '-'}
            unit="index"
            change={change}
            chartClassName="relative h-[320px] md:h-[390px]"
        >
            <div className="relative h-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={series} margin={{ top: 18, right: 14, left: isMobile ? -14 : 4, bottom: 8 }}>
                        <defs>
                            <linearGradient id="analyticsHypeGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#f4f4f5" stopOpacity={0.32} />
                                <stop offset="100%" stopColor="#18181b" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid stroke="rgba(255,255,255,0.08)" strokeDasharray="3 8" vertical={false} />
                        <XAxis
                            dataKey="time"
                            stroke="rgba(255,255,255,0.24)"
                            tick={{ fill: 'rgba(255,255,255,0.72)', fontSize: isMobile ? 10 : 11 }}
                            interval={isMobile ? 2 : 0}
                            label={{ value: 'Time', position: 'insideBottom', offset: -4, fill: 'rgba(255,255,255,0.48)', fontSize: 11 }}
                        />
                        <YAxis
                            domain={[0, 100]}
                            stroke="rgba(255,255,255,0.24)"
                            tick={{ fill: 'rgba(255,255,255,0.68)', fontSize: isMobile ? 10 : 11 }}
                            width={isMobile ? 34 : 48}
                            label={{ value: 'Hype index', angle: -90, position: 'insideLeft', fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                        />
                        <Tooltip content={<HypeTooltip />} />
                        <Legend
                            verticalAlign="top"
                            align="right"
                            iconType="circle"
                            wrapperStyle={{ fontSize: 11, color: '#d4d4d8', paddingBottom: 8 }}
                        />
                        <Area
                            type="monotone"
                            {...getTimeSeriesProps('previous')}
                            name={previousLabel}
                            strokeWidth={1.8}
                            dot={false}
                            activeDot={false}
                            isAnimationActive={false}
                        />
                        <Area
                            type="monotone"
                            {...getTimeSeriesProps('current')}
                            name={currentLabel}
                            fill="url(#analyticsHypeGradient)"
                            strokeWidth={2.6}
                            dot={false}
                            activeDot={{ r: 5, fill: '#ffffff', stroke: '#09090b' }}
                            isAnimationActive={false}
                        />
                        <Area
                            type="monotone"
                            dataKey="scanIndex"
                            name="Scan activity"
                            stroke="rgba(255,255,255,0.36)"
                            fill="rgba(255,255,255,0.055)"
                            strokeWidth={1.4}
                            dot={false}
                            activeDot={false}
                            isAnimationActive={false}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </TimeSeriesChartShell>
    );
}

function EventFilterBar({ events, selectedEventIds, onChange, loading, spatialNote }) {
    const allIds = events.map((event) => event.id);
    const allSelected = selectedEventIds.length > 0 && selectedEventIds.length === allIds.length;
    const activeShortcutId = [...FILTER_SHORTCUTS]
        .reverse()
        .find((shortcut) => selectedEventIds.length > 0 && sameIdSet(idsForShortcut(events, shortcut), selectedEventIds))?.id;

    const toggleEvent = (eventId) => {
        onChange((current) => {
            if (current.includes(eventId)) {
                return current.filter((id) => id !== eventId);
            }
            return [...current, eventId];
        });
    };

    const applyShortcut = (shortcut) => {
        const nextIds = idsForShortcut(events, shortcut);
        if (nextIds.length) onChange(nextIds);
    };

    return (
        <div className="glass-panel rounded-2xl p-4">
            <div className="flex flex-wrap items-center gap-2 pb-3 shadow-[inset_0_-1px_0_rgba(255,255,255,0.035)]">
                {FILTER_SHORTCUTS.map((shortcut) => {
                    const ids = idsForShortcut(events, shortcut);
                    const disabled = !ids.length;
                    const active = shortcut.id === 'all' ? allSelected : activeShortcutId === shortcut.id;
                    return (
                        <button
                            key={shortcut.id}
                            type="button"
                            onClick={() => applyShortcut(shortcut)}
                            disabled={disabled}
                            aria-pressed={active}
                            className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-widest transition ${
                                active ? 'bg-white text-black' : 'glow-chip text-zinc-300 hover:text-white'
                            } ${disabled ? 'cursor-not-allowed opacity-35' : ''}`}
                            title={disabled ? 'No events in this range' : undefined}
                        >
                            {shortcut.label}
                        </button>
                    );
                })}
                {loading ? <span className="px-2 text-xs font-semibold text-zinc-500">Syncing events</span> : null}
                <button
                    type="button"
                    onClick={() => onChange([])}
                    className="pill-ghost px-4 py-2 text-xs font-black uppercase tracking-widest"
                >
                    Clear
                </button>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
                {events.map((event) => {
                    const selected = selectedEventIds.includes(event.id);
                    return (
                        <button
                            key={event.id}
                            type="button"
                            onClick={() => toggleEvent(event.id)}
                            aria-pressed={selected}
                            className={`rounded-2xl px-4 py-3 text-left text-xs font-bold transition ${
                                selected ? 'pill-solid' : 'pill-ghost text-zinc-400 hover:text-white'
                            }`}
                        >
                            <span className="block">{event.name}</span>
                            <span className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] uppercase tracking-widest text-zinc-500">
                                <span>{event.dateLabel}</span>
                                <span className="rounded-full bg-white/[0.07] px-2 py-0.5 text-zinc-300">{event.venue}</span>
                            </span>
                        </button>
                    );
                })}
            </div>

            <p className="mt-3 text-xs font-semibold text-zinc-500">
                {selectedEventIds.length === 0 ? '- selected.' : selectedEventIds.length === 1 ? 'Single-event mode.' : `${selectedEventIds.length} events selected.`}
                {spatialNote ? ` ${spatialNote}` : ''}
            </p>
        </div>
    );
}

function AudienceComposition({ composition, insights, isMobile }) {
    const [activeIndex, setActiveIndex] = useState(null);
    const total = composition.reduce((sum, segment) => sum + segment.value, 0);

    return (
        <div className="space-y-5">
            <div className="glow-surface-soft rounded-2xl p-4">
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(260px,0.9fr)_minmax(220px,0.65fr)] lg:items-center">
                    <div className="h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={composition}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={isMobile ? 66 : 88}
                                    outerRadius={isMobile ? 112 : 138}
                                    cornerRadius={12}
                                    paddingAngle={2}
                                    isAnimationActive={false}
                                    onMouseEnter={(_, index) => setActiveIndex(index)}
                                    onMouseLeave={() => setActiveIndex(null)}
                                >
                                    {composition.map((segment, index) => (
                                        <Cell key={segment.name} {...getSingleShadeDonutCellProps(index)} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="space-y-3" onMouseLeave={() => setActiveIndex(null)}>
                        {composition.map((segment, index) => {
                            const active = activeIndex === index;
                            const percent = total ? Math.round((segment.value / total) * 100) : 0;
                            return (
                                <button
                                    key={segment.name}
                                    type="button"
                                    onMouseEnter={() => setActiveIndex(index)}
                                    onFocus={() => setActiveIndex(index)}
                                    className="flex w-full items-center justify-between gap-4 rounded-xl px-1 py-2 text-left"
                                >
                                    <span className={`text-sm font-black transition ${active ? 'text-white' : 'text-zinc-300'}`}>{segment.name}</span>
                                    <span className={`text-xs font-bold transition ${active ? 'text-white' : 'text-zinc-500'}`}>
                                        {formatNumber(segment.value)} · {percent}%
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                {insights.map((insight) => (
                    <div key={insight.name} className="glow-surface-soft rounded-2xl p-4">
                        <p className="text-sm font-black text-white">{insight.name}</p>
                        <p className="mt-2 min-h-12 text-sm leading-5 text-zinc-400">{insight.insight}</p>
                        <Link href={insight.href} className="mt-4 inline-flex rounded-full bg-white/[0.08] px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white hover:bg-white hover:text-black">
                            {insight.cta}
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    );
}

function TopMoments({ moments }) {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {moments.map((moment) => (
                <a key={moment.id} href={moment.href} className="glow-interactive glow-surface-soft block overflow-hidden rounded-2xl" aria-label={`Open ${moment.title} moment`}>
                    <img src={moment.image} alt="" className="aspect-square w-full object-cover" />
                    <div className="p-4">
                        <p className="text-base font-black text-white">{moment.title}</p>
                        <p className="mt-1 text-sm text-zinc-400">{moment.cluster}</p>
                        <div className="mt-4 flex items-center justify-between gap-3">
                            <span className="text-xs font-bold text-zinc-500">{moment.eventName}</span>
                            <span className="rounded-full bg-white/[0.08] px-3 py-1 text-xs font-black text-white">
                                {formatNumber(moment.reactions)} reactions
                            </span>
                        </div>
                    </div>
                </a>
            ))}
        </div>
    );
}

function AnalyticsPageContent() {
    const searchParams = useSearchParams();
    const viewMode = searchParams.get('view') === 'live-ops' ? 'live-ops' : 'analytics';
    const isLiveEvent = useDashboardShellStore((store) => store.isLiveEvent);

    const [events, setEvents] = useState([]);
    const [selectedEventIds, setSelectedEventIds] = useState([]);
    const [isMobile, setIsMobile] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                const res = await eventsService.getMyEvents({ limit: 100, offset: 0 });
                if (!cancelled) setEvents(res?.events || []);
            } catch {
                if (!cancelled) setEvents([]);
            } finally {
                if (!cancelled) setLoading(false);
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

    const eventOptions = useMemo(() => normalizeAnalyticsEvents(events), [events]);

    useEffect(() => {
        if (!eventOptions.length) return;
        setSelectedEventIds((current) => {
            const validIds = new Set(eventOptions.map((event) => event.id));
            return current.filter((id) => validIds.has(id));
        });
    }, [eventOptions]);

    const analytics = useMemo(
        () => buildAnalyticsMock(eventOptions, selectedEventIds),
        [eventOptions, selectedEventIds]
    );
    const hasSelection = selectedEventIds.length > 0;
    const currentLabel = analytics.selectedEvents.length === 1
        ? analytics.selectedEvents[0].name
        : analytics.selectedEvents.length > 1
            ? `${analytics.selectedEvents[0].name} + ${analytics.selectedEvents.length - 1}`
            : 'Selected albums';
    const previousLabel = analytics.selectedEvents.length === 1 ? 'Prior album' : 'Comparison baseline';

    const spatialVenues = useMemo(
        () => Array.from(new Set(analytics.selectedEvents.map((event) => event.venue).filter(Boolean))),
        [analytics.selectedEvents]
    );
    const spatialDisabledReason = spatialVenues.length > 1
        ? `Mixed venue selection: ${spatialVenues.join(', ')}. Spatial intelligence is enabled only when every selected event shares the same venue.`
        : '';
    const spatialNote = spatialDisabledReason
        ? 'Spatial intel disabled for mixed venues.'
        : analytics.selectedEvents.length > 1
            ? `Spatial intel compares ${analytics.selectedEvents.length} same-venue events.`
            : 'Spatial intel in single-event mode.';

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

            <EventFilterBar
                events={eventOptions}
                selectedEventIds={selectedEventIds}
                onChange={setSelectedEventIds}
                loading={loading}
                spatialNote={spatialNote}
            />

            <HypeIndexChart
                series={analytics.hypeSeries}
                isMobile={isMobile}
                hasSelection={hasSelection}
                currentLabel={currentLabel}
                previousLabel={previousLabel}
            />

            <SectionCard title="Spatial Intelligence">
                <SpatialHeatMap
                    rooms={analytics.spatial.rooms}
                    timeSlices={analytics.spatial.timeSlices}
                    eventComparisons={analytics.spatial.eventComparisons}
                    disabledReason={spatialDisabledReason}
                />
            </SectionCard>

            <SectionCard title="Audience Composition">
                <AudienceComposition
                    composition={analytics.audience.composition}
                    insights={analytics.audience.insights}
                    isMobile={isMobile}
                />
            </SectionCard>

            <SectionCard title="Attendee Lifecycle">
                <FunnelChart data={analytics.funnel} singleSelection={analytics.selectedEvents.length <= 1} />
            </SectionCard>

            <SectionCard title="Top Moments">
                <TopMoments moments={analytics.moments} />
            </SectionCard>
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
