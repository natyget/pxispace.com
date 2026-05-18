'use client';

import { useEffect, useMemo, useState } from 'react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { HugeiconsIcon } from '@hugeicons/react';
import { Alert02Icon, Image02Icon, Location01Icon } from '@hugeicons/core-free-icons';
import SectionCard from '@/components/dashboard/SectionCard';
import DataSourceBadge from '@/components/dashboard/DataSourceBadge';
import { eventsService } from '@/services/events';
import { loadOrganizerAnalytics } from '@/services/organizerAnalytics';

const TIER_COLORS = ['#d4d4d8', '#c084fc', '#60a5fa', '#f59e0b', '#34d399'];

function buildHypeSeries(seed = 0) {
    return Array.from({ length: 24 }, (_, i) => {
        const hour = String((18 + i) % 24).padStart(2, '0');
        const chat = 22 + ((i * 5 + seed) % 18);
        const reactions = 30 + ((i * 7 + seed) % 22);
        const scans = 18 + ((i * 3 + seed) % 24);
        const hype = Math.min(100, Math.round((chat * 0.35) + (reactions * 0.4) + (scans * 0.25)));
        return {
            time: `${hour}:00`,
            hype,
            chat,
            reactions,
            scans,
        };
    });
}

const FUNNEL_STAGES = [
    { stage: 'Ticket Purchased', value: 1000 },
    { stage: 'Intent To Attend', value: 840 },
    { stage: 'Gate Scan', value: 690 },
    { stage: 'Retained', value: 522 },
];

const CLUSTER_BASE = [
    { id: 'c-1', zone: 'Main Stage', peakTime: '11:20 PM', noiseRatio: '4.8%', uploads: 314 },
    { id: 'c-2', zone: 'VIP Bar', peakTime: '10:45 PM', noiseRatio: '3.2%', uploads: 204 },
    { id: 'c-3', zone: 'Entry Corridor', peakTime: '9:32 PM', noiseRatio: '7.4%', uploads: 118 },
];

const WILSON_TOP_MOMENTS = [
    { id: 'm-1', title: 'Headliner Drop', score: 0.91, hearts: 482, cluster: 'Main Stage' },
    { id: 'm-2', title: 'VIP Toast', score: 0.87, hearts: 301, cluster: 'VIP Bar' },
    { id: 'm-3', title: 'Gate Surge', score: 0.79, hearts: 188, cluster: 'Entry Corridor' },
    { id: 'm-4', title: 'Encore Crowd', score: 0.76, hearts: 166, cluster: 'Main Stage' },
];

function AnalyticsTooltip({ active, payload, label }) {
    if (!active || !payload || !payload.length) return null;
    const point = payload[0].payload;
    return (
        <div className="bg-zinc-950 border border-white/15 p-3.5 rounded-2xl shadow-2xl min-w-[220px]">
            <p className="text-[11px] text-zinc-300 font-semibold tracking-wide">{label}</p>
            <p className="text-white font-black text-base mt-1">Hype Index {point.hype}</p>
            <p className="text-zinc-200 text-xs mt-1.5">Chat {point.chat} · Reactions {point.reactions} · Gate scans {point.scans}</p>
        </div>
    );
}

function SurfaceTooltip({ active, payload, label }) {
    if (!active || !payload || !payload.length) return null;
    return (
        <div className="bg-zinc-950 border border-white/15 p-3.5 rounded-2xl shadow-2xl min-w-[170px]">
            {label ? <p className="text-[11px] text-zinc-300 font-semibold tracking-wide">{label}</p> : null}
            <p className="text-white text-sm font-bold mt-1">
                {payload[0].name || payload[0].dataKey}: {payload[0].value}
            </p>
        </div>
    );
}

export default function AnalyticsPage() {
    const [events, setEvents] = useState([]);
    const [selectedEventId, setSelectedEventId] = useState('');
    const [eventMode, setEventMode] = useState('live');
    const [isMobile, setIsMobile] = useState(false);
    const [loading, setLoading] = useState(true);
    const [analyticsLoading, setAnalyticsLoading] = useState(false);
    const [analyticsPayload, setAnalyticsPayload] = useState(null);
    const [heatmapOpen, setHeatmapOpen] = useState(false);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                const res = await eventsService.getMyEvents({ limit: 100, offset: 0 });
                if (cancelled) return;
                const nextEvents = res?.events || [];
                setEvents(nextEvents);
                if (nextEvents.length > 0) setSelectedEventId(nextEvents[0].id);
            } catch {
                if (!cancelled) setEvents([]);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return undefined;
        const mq = window.matchMedia('(max-width: 768px)');
        const onChange = () => setIsMobile(mq.matches);
        onChange();
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, []);

    const selectedEvent = useMemo(
        () => events.find((event) => event.id === selectedEventId) || events[0] || null,
        [events, selectedEventId]
    );

    useEffect(() => {
        let cancelled = false;
        (async () => {
            if (!selectedEvent?.id) return;
            setAnalyticsLoading(true);
            const payload = await loadOrganizerAnalytics(selectedEvent.id);
            if (!cancelled) {
                setAnalyticsPayload(payload);
                setAnalyticsLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [selectedEvent?.id]);

    const eventOptions = useMemo(() => {
        const live = [];
        const archived = [];
        events.forEach((event) => {
            const status = String(event?.status || '').toUpperCase();
            if (status === 'LIVE' || status === 'ACTIVE') {
                live.push(event);
            } else {
                archived.push(event);
            }
        });
        return { live, archived };
    }, [events]);

    const visibleEventOptions = eventMode === 'live' ? eventOptions.live : eventOptions.archived;
    const hypeSeries = useMemo(() => buildHypeSeries(selectedEvent?.id?.length || 1), [selectedEvent?.id]);
    const clusterData = analyticsPayload?.clusters || CLUSTER_BASE;
    const funnelData = analyticsPayload?.funnel || FUNNEL_STAGES;
    const momentsData = analyticsPayload?.moments || WILSON_TOP_MOMENTS;
    const moduleSource = analyticsPayload?.source === 'live' ? 'Live' : 'Mock';

    const tierMix = useMemo(() => {
        const soldTickets = Math.max(50, selectedEvent?._count?.tickets || 0);
        return [
            { name: 'Wanderers', value: Math.round(soldTickets * 0.34) },
            { name: 'Pathfinders', value: Math.round(soldTickets * 0.28) },
            { name: 'Voyagers', value: Math.round(soldTickets * 0.2) },
            { name: 'Sentinels', value: Math.round(soldTickets * 0.12) },
            { name: 'Legends', value: Math.round(soldTickets * 0.06) },
        ];
    }, [selectedEvent?._count?.tickets]);

    return (
        <div className="max-w-6xl mx-auto space-y-7 md:space-y-8">
            <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                    <p className="text-xs font-bold tracking-widest uppercase text-pxi-purple">Organizer Intelligence</p>
                    <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight mt-1">Analytics Command Center</h1>
                    <p className="text-zinc-500 text-sm mt-1">Behavioral + spatial insights for live and archived events.</p>
                </div>
                <div className="flex items-center gap-2">
                    <DataSourceBadge source={events.length > 0 ? 'Live' : 'Mock'} />
                    <DataSourceBadge source={moduleSource} />
                    <DataSourceBadge source="Derived" />
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                <div className="rounded-[1.6rem] border border-white/10 bg-zinc-950/80 px-5 py-4">
                    <p className="text-[11px] uppercase tracking-widest font-bold text-zinc-400">Current Context</p>
                    <p className="text-white font-black text-base md:text-lg mt-1 line-clamp-2">{selectedEvent?.name || 'No event selected'}</p>
                    <p className="text-zinc-300 text-xs mt-1">{eventMode === 'live' ? 'Live event mode' : 'Archived event mode'}</p>
                </div>
                <div className="rounded-[1.6rem] border border-white/10 bg-zinc-950/80 px-5 py-4">
                    <p className="text-[11px] uppercase tracking-widest font-bold text-zinc-400">Peak Hype Window</p>
                    <p className="text-white font-black text-lg mt-1">{hypeSeries.reduce((best, point) => point.hype > best.hype ? point : best, hypeSeries[0] || { time: '—', hype: 0 }).time}</p>
                    <p className="text-zinc-300 text-xs mt-1">Composite chat + reactions + scans</p>
                </div>
                <div className="rounded-[1.6rem] border border-white/10 bg-zinc-950/80 px-5 py-4">
                    <p className="text-[11px] uppercase tracking-widest font-bold text-zinc-400">Noise Filtered</p>
                    <p className="text-white font-black text-lg mt-1">{clusterData[0]?.noiseRatio || '0%'}</p>
                    <p className="text-zinc-300 text-xs mt-1">Primary DBSCAN cluster ratio</p>
                </div>
            </div>

            <SectionCard
                title="Event Context"
                subtitle="Switch between live and archived events."
                source={events.length > 0 ? 'Live' : 'Mock'}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <select
                        value={eventMode}
                        onChange={(event) => setEventMode(event.target.value)}
                        className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                    >
                        <option value="live">Live Events</option>
                        <option value="archived">Archived Events</option>
                    </select>
                    <select
                        value={selectedEventId}
                        onChange={(event) => setSelectedEventId(event.target.value)}
                        className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                    >
                        {visibleEventOptions.map((event) => (
                            <option key={event.id} value={event.id}>
                                {event.name} ({eventMode === 'live' ? 'Live' : 'Archived'})
                            </option>
                        ))}
                        {visibleEventOptions.length === 0 && <option value="">No events in this scope</option>}
                    </select>
                </div>
            </SectionCard>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SectionCard
                    title="4D Spatial Intelligence (DBSCAN)"
                    subtitle="Density clusters, peak times, and filtered noise."
                    source={moduleSource}
                    actions={(
                        <button
                            type="button"
                            onClick={() => setHeatmapOpen(true)}
                            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold uppercase tracking-widest text-white hover:bg-white/10"
                        >
                            View Heatmap Map
                        </button>
                    )}
                >
                    <ul className="space-y-3">
                        {clusterData.map((cluster) => (
                            <li key={cluster.id} className="rounded-xl border border-white/10 bg-black/30 px-4 py-3">
                                <p className="text-sm font-semibold text-white flex items-center gap-2">
                                    <HugeiconsIcon icon={Location01Icon} size={14} className="text-pxi-purple" />
                                    {cluster.zone}
                                </p>
                                <p className="text-xs text-zinc-400 mt-1">Peak {cluster.peakTime} · Noise {cluster.noiseRatio}</p>
                                <p className="text-xs text-zinc-500 mt-1">{cluster.uploads} uploads sourced from cluster</p>
                            </li>
                        ))}
                    </ul>
                </SectionCard>

                <SectionCard
                    title="Attendance Lifecycle Funnel"
                    subtitle="Drop-off from purchase through retained engagement."
                    source={moduleSource}
                >
                    <div className="h-[280px] md:h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={funnelData} layout="vertical" margin={{ top: 6, right: 10, left: isMobile ? 4 : 20, bottom: 6 }}>
                                <XAxis type="number" stroke="rgba(255,255,255,0.28)" tick={{ fill: 'rgba(255,255,255,0.75)', fontSize: isMobile ? 10 : 11 }} />
                                <YAxis type="category" dataKey="stage" stroke="rgba(255,255,255,0.28)" tick={{ fill: 'rgba(255,255,255,0.85)', fontSize: isMobile ? 10 : 11 }} width={isMobile ? 95 : 130} />
                                <Tooltip content={<SurfaceTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                                <Bar dataKey="value" radius={[8, 8, 8, 8]} fill="#c084fc" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </SectionCard>
            </div>

            <SectionCard
                title="Temporal Hype Index"
                subtitle="Composite of chat volume, reaction velocity, and gate scans."
                source="Derived"
            >
                <div className="h-[300px] md:h-[360px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={hypeSeries}>
                            <defs>
                                <linearGradient id="hypeGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#a855f7" stopOpacity={0.45} />
                                    <stop offset="100%" stopColor="#000000" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis
                                dataKey="time"
                                stroke="rgba(255,255,255,0.28)"
                                tick={{ fill: 'rgba(255,255,255,0.8)', fontSize: isMobile ? 10 : 11 }}
                                interval={isMobile ? 3 : 1}
                                minTickGap={isMobile ? 18 : 10}
                            />
                            <YAxis
                                stroke="rgba(255,255,255,0.28)"
                                tick={{ fill: 'rgba(255,255,255,0.8)', fontSize: isMobile ? 10 : 11 }}
                                width={isMobile ? 28 : 40}
                            />
                            <Tooltip content={<AnalyticsTooltip />} />
                            <Area type="monotone" dataKey="hype" stroke="#ffffff" strokeWidth={2} fill="url(#hypeGradient)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </SectionCard>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SectionCard
                    title="Audience Composition (Odyssey Tier Mix)"
                    subtitle="Crowd split by global passport tiers."
                    source="Derived"
                >
                    <div className="h-[280px] md:h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={tierMix} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={isMobile ? 88 : 105} innerRadius={isMobile ? 44 : 55}>
                                    {tierMix.map((tier, idx) => (
                                        <Cell key={tier.name} fill={TIER_COLORS[idx % TIER_COLORS.length]} />
                                    ))}
                                </Pie>
                            <Tooltip content={<SurfaceTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                        {tierMix.map((tier, idx) => (
                            <p key={tier.name} className="text-xs text-zinc-200 flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: TIER_COLORS[idx % TIER_COLORS.length] }} />
                                {tier.name}: {tier.value}
                            </p>
                        ))}
                    </div>
                </SectionCard>

                <SectionCard
                    title="Top Moments (Wilson Score)"
                    subtitle="Best UGC moments ranked by Wilson confidence."
                    source={moduleSource}
                    actions={(
                        <button
                            type="button"
                            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold uppercase tracking-widest text-white hover:bg-white/10"
                        >
                            Export ZIP
                        </button>
                    )}
                >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {momentsData.map((moment) => (
                            <div key={moment.id} className="rounded-xl border border-white/10 bg-black/30 p-3">
                                <div className="w-full h-24 rounded-lg bg-zinc-800/80 border border-white/10 flex items-center justify-center">
                                    <HugeiconsIcon icon={Image02Icon} size={20} className="text-zinc-500" />
                                </div>
                                <p className="text-sm font-semibold text-white mt-2">{moment.title}</p>
                                <p className="text-xs text-zinc-400 mt-1">
                                    Score {moment.score.toFixed(2)} · {moment.hearts} hearts
                                </p>
                                <p className="text-xs text-zinc-500 mt-1">Cluster {moment.cluster}</p>
                            </div>
                        ))}
                    </div>
                </SectionCard>
            </div>

            {(loading || analyticsLoading) && (
                <div className="rounded-xl border border-white/10 bg-zinc-900/40 p-4 text-sm text-zinc-400">
                    Loading analytics context...
                </div>
            )}

            {heatmapOpen && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70">
                    <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-zinc-950 p-6">
                        <h3 className="text-white font-bold text-lg flex items-center gap-2">
                            <HugeiconsIcon icon={Location01Icon} size={18} className="text-pxi-purple" />
                            Heatmap Overlay
                        </h3>
                        <p className="text-zinc-400 text-sm mt-2">
                            Map integration is staged. This modal reserves the interaction flow for Mapbox/venue overlay wiring.
                        </p>
                        <div className="mt-5 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setHeatmapOpen(false)}
                                className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-300 hover:bg-white/5"
                            >
                                Close
                            </button>
                            <button
                                type="button"
                                onClick={() => setHeatmapOpen(false)}
                                className="rounded-xl bg-pxi-purple px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                            >
                                Continue
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
                <p className="text-sm text-red-200 flex items-center gap-2">
                    <HugeiconsIcon icon={Alert02Icon} size={15} />
                    Wilson/DBSCAN metrics are surfaced as intelligent mock outputs until backend aggregates are finalized.
                </p>
            </div>
        </div>
    );
}
