'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
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
import {
    Alert02Icon,
    ArrowRight02Icon,
    Image02Icon,
    Location01Icon,
    Megaphone01Icon,
} from '@hugeicons/core-free-icons';
import SectionCard from '@/components/dashboard/SectionCard';
import MetricCard from '@/components/dashboard/MetricCard';
import DataSourceBadge from '@/components/dashboard/DataSourceBadge';
import { eventsService } from '@/services/events';
import { loadOrganizerAnalytics } from '@/services/organizerAnalytics';
import { useDashboardShellStore } from '@/lib/dashboardShellStore';
import LiveScanDashboard from '@/views/dashboard/LiveScanDashboard';

const TIER_COLORS = ['#d4d4d8', '#c084fc', '#60a5fa', '#f59e0b', '#34d399'];
const PILLARS = [
    { id: 'overall', label: 'Overall Events' },
    { id: 'spatial', label: 'Spatial Intelligence' },
    { id: 'audience', label: 'Audience Composition' },
    { id: 'moments', label: 'Top Moments' },
];

const VENUE_ROOMS = [
    { id: 'main', label: 'Main Stage', occupancy: 82, hotspots: 3, uploads: 314 },
    { id: 'vip', label: 'VIP Lounge', occupancy: 54, hotspots: 2, uploads: 204 },
    { id: 'entry', label: 'Entry Corridor', occupancy: 67, hotspots: 4, uploads: 118 },
];

const FUNNEL_STAGES = [
    { stage: 'Ticket Purchased', value: 1000, cta: 'Boost awareness' },
    { stage: 'Intent To Attend', value: 840, cta: 'Send reminder' },
    { stage: 'Gate Scan', value: 690, cta: 'Last-call SMS' },
    { stage: 'Retained', value: 522, cta: 'Loyalty campaign' },
];

const TOP_MOMENTS = [
    { id: 'm-1', title: 'Headliner Drop', hearts: 482, cluster: 'Main Stage', event: 'Neon Nights' },
    { id: 'm-2', title: 'VIP Toast', hearts: 301, cluster: 'VIP Lounge', event: 'Neon Nights' },
    { id: 'm-3', title: 'Gate Surge', hearts: 188, cluster: 'Entry Corridor', event: 'Warehouse Pulse' },
    { id: 'm-4', title: 'Encore Crowd', hearts: 166, cluster: 'Main Stage', event: 'Neon Nights' },
];

function buildHypeSeries(seed = 0) {
    return Array.from({ length: 24 }, (_, i) => {
        const hour = String((18 + i) % 24).padStart(2, '0');
        const chat = 22 + ((i * 5 + seed) % 18);
        const reactions = 30 + ((i * 7 + seed) % 22);
        const scans = 18 + ((i * 3 + seed) % 24);
        const hype = Math.min(100, Math.round((chat * 0.35) + (reactions * 0.4) + (scans * 0.25)));
        return { time: `${hour}:00`, hype, chat, reactions, scans };
    });
}

function AnalyticsTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    const point = payload[0].payload;
    return (
        <div className="dashboard-glow-popover min-w-[220px] rounded-2xl bg-zinc-950 p-3.5 shadow-2xl">
            <p className="text-[11px] font-semibold tracking-wide text-zinc-300">{label}</p>
            <p className="mt-1 text-base font-black text-white">Hype Index {point.hype}</p>
            <p className="mt-1.5 text-xs text-zinc-200">Chat {point.chat} · Reactions {point.reactions} · Gate scans {point.scans}</p>
        </div>
    );
}

function SurfaceTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="dashboard-glow-popover min-w-[170px] rounded-2xl bg-zinc-950 p-3.5 shadow-2xl">
            {label ? <p className="text-[11px] font-semibold tracking-wide text-zinc-300">{label}</p> : null}
            <p className="mt-1 text-sm font-bold text-white">
                {payload[0].name || payload[0].dataKey}: {payload[0].value}
            </p>
        </div>
    );
}

function Speedometer({ value, label }) {
    const clamped = Math.max(0, Math.min(100, value));
    const rotation = -90 + (clamped / 100) * 180;
    return (
        <div className="relative mx-auto h-[180px] w-[220px]">
            <svg viewBox="0 0 220 120" className="h-full w-full">
                <path d="M 30 110 A 80 80 0 0 1 190 110" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="14" strokeLinecap="round" />
                <path
                    d="M 30 110 A 80 80 0 0 1 190 110"
                    fill="none"
                    stroke="#d84aff"
                    strokeWidth="14"
                    strokeLinecap="round"
                    strokeDasharray={`${(clamped / 100) * 251} 251`}
                />
                <line x1="110" y1="110" x2="110" y2="42" stroke="#fff" strokeWidth="3" strokeLinecap="round" transform={`rotate(${rotation} 110 110)`} />
                <circle cx="110" cy="110" r="6" fill="#fff" />
            </svg>
            <div className="absolute inset-x-0 bottom-2 text-center">
                <p className="text-3xl font-black text-white">{clamped}</p>
                <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">{label}</p>
            </div>
        </div>
    );
}

function VenueRoomMap({ rooms }) {
    return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {rooms.map((room) => (
                <div key={room.id} className="glow-surface-soft relative overflow-hidden rounded-2xl p-4">
                    <div
                        className="absolute inset-0 opacity-30"
                        style={{
                            background: `radial-gradient(circle at 50% 60%, rgba(216,74,255,${room.occupancy / 200}) 0%, transparent 70%)`,
                        }}
                    />
                    <div className="relative">
                        <p className="text-sm font-bold text-white">{room.label}</p>
                        <p className="mt-1 text-xs text-zinc-400">{room.hotspots} hotspots · {room.uploads} uploads</p>
                        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                            <div className="h-full rounded-full bg-pxi-purple" style={{ width: `${room.occupancy}%` }} />
                        </div>
                        <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{room.occupancy}% density</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

function AnalyticsPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const viewMode = searchParams.get('view') === 'live-ops' ? 'live-ops' : 'analytics';
    const isLiveEvent = useDashboardShellStore((store) => store.isLiveEvent);

    const [events, setEvents] = useState([]);
    const [selectedEventId, setSelectedEventId] = useState('all');
    const [compareMode, setCompareMode] = useState('aggregate');
    const [pillar, setPillar] = useState('overall');
    const [eventScope, setEventScope] = useState('live');
    const [isMobile, setIsMobile] = useState(false);
    const [loading, setLoading] = useState(true);
    const [analyticsLoading, setAnalyticsLoading] = useState(false);
    const [analyticsPayload, setAnalyticsPayload] = useState(null);
    const [momentsFilter, setMomentsFilter] = useState('scrapbook');

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                const res = await eventsService.getMyEvents({ limit: 100, offset: 0 });
                if (cancelled) return;
                const nextEvents = res?.events || [];
                setEvents(nextEvents);
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

    const scopedEvents = useMemo(() => {
        const live = [];
        const archived = [];
        events.forEach((event) => {
            const status = String(event?.status || '').toUpperCase();
            if (status === 'LIVE' || status === 'ACTIVE') live.push(event);
            else archived.push(event);
        });
        return eventScope === 'live' ? live : archived;
    }, [events, eventScope]);

    const selectedEvent = useMemo(() => {
        if (selectedEventId === 'all') return null;
        return events.find((event) => event.id === selectedEventId) || null;
    }, [events, selectedEventId]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            if (selectedEventId === 'all' || !selectedEvent?.id) {
                setAnalyticsPayload(null);
                return;
            }
            setAnalyticsLoading(true);
            const payload = await loadOrganizerAnalytics(selectedEvent.id);
            if (!cancelled) {
                setAnalyticsPayload(payload);
                setAnalyticsLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [selectedEvent?.id, selectedEventId]);

    const hypeSeries = useMemo(
        () => buildHypeSeries(selectedEvent?.id?.length || events.length || 1),
        [selectedEvent?.id, events.length]
    );

    const aggregateHype = useMemo(() => {
        if (!hypeSeries.length) return 0;
        return Math.round(hypeSeries.reduce((sum, point) => sum + point.hype, 0) / hypeSeries.length);
    }, [hypeSeries]);

    const tierMix = useMemo(() => {
        const soldTickets = Math.max(50, selectedEvent?._count?.tickets || events.reduce((s, e) => s + (e._count?.tickets || 0), 0));
        return [
            { name: 'Wanderers', value: Math.round(soldTickets * 0.34) },
            { name: 'Pathfinders', value: Math.round(soldTickets * 0.28) },
            { name: 'Voyagers', value: Math.round(soldTickets * 0.2) },
            { name: 'Sentinels', value: Math.round(soldTickets * 0.12) },
            { name: 'Legends', value: Math.round(soldTickets * 0.06) },
        ];
    }, [selectedEvent?._count?.tickets, events]);

    const partialAttendeeRate = useMemo(() => {
        const base = analyticsPayload?.funnel?.[2]?.value || 690;
        const top = analyticsPayload?.funnel?.[0]?.value || 1000;
        return Math.round((base / top) * 100);
    }, [analyticsPayload]);

    const filteredMoments = useMemo(() => {
        if (momentsFilter === 'event' && selectedEvent) {
            return TOP_MOMENTS.filter((m) => m.event === selectedEvent.name);
        }
        return TOP_MOMENTS;
    }, [momentsFilter, selectedEvent]);

    const moduleSource = analyticsPayload?.source === 'live' ? 'Live' : 'Mock';
    const funnelData = analyticsPayload?.funnel || FUNNEL_STAGES;

    if (viewMode === 'live-ops') {
        if (!isLiveEvent) {
            return (
                <div className="mx-auto max-w-6xl space-y-6">
                    <div className="glow-surface rounded-2xl p-8 text-center">
                        <p className="text-sm font-semibold text-white">Live Operations unlock when an event is live.</p>
                        <button
                            type="button"
                            onClick={() => router.replace('/dashboard/analytics')}
                            className="mt-4 rounded-xl bg-pxi-purple px-4 py-2 text-sm font-bold text-white"
                        >
                            Back to Analytics
                        </button>
                    </div>
                </div>
            );
        }
        return (
            <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={() => router.replace('/dashboard/analytics')}
                        className="rounded-full glow-chip px-4 py-2 text-xs font-bold uppercase tracking-widest text-zinc-300 hover:text-white"
                    >
                        Analytics
                    </button>
                    <span className="rounded-full bg-white px-4 py-2 text-xs font-bold uppercase tracking-widest text-black">
                        Live Operations
                    </span>
                </div>
                <LiveScanDashboard />
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-6xl space-y-7 md:space-y-8">
            <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-pxi-purple">Organizer Intelligence</p>
                    <h1 className="mt-1 text-2xl font-black tracking-tight text-white md:text-3xl">Analytics</h1>
                    <p className="mt-1 text-sm text-zinc-500">Four intelligence pillars with aggregate and per-event comparison.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <DataSourceBadge source={events.length > 0 ? 'Live' : 'Mock'} />
                    <DataSourceBadge source={moduleSource} />
                    {isLiveEvent ? (
                        <Link
                            href="/dashboard/analytics?view=live-ops"
                            className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-300"
                        >
                            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300" />
                            Live Ops
                        </Link>
                    ) : null}
                </div>
            </header>

            <div className="flex flex-wrap gap-2">
                {PILLARS.map((item) => (
                    <button
                        key={item.id}
                        type="button"
                        onClick={() => setPillar(item.id)}
                        className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-widest transition ${
                            pillar === item.id ? 'bg-white text-black' : 'glow-chip text-zinc-400 hover:text-white'
                        }`}
                    >
                        {item.label}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard dense title="Hype Index" value={`${aggregateHype}/100`} description="Overall events composite" trend="up" source="Derived" loading={loading} />
                <MetricCard dense title="Active Events" value={String(scopedEvents.length)} description={eventScope === 'live' ? 'Live scope' : 'Archived scope'} trend="neutral" source="Live" loading={loading} />
                <MetricCard dense title="Partial Attendee" value={`${partialAttendeeRate}%`} description="Gate scan vs purchase" trend={partialAttendeeRate > 60 ? 'up' : 'down'} source={moduleSource} loading={loading || analyticsLoading} />
                <MetricCard dense title="Top Zone" value={VENUE_ROOMS[0].label} description={`${VENUE_ROOMS[0].occupancy}% density`} trend="up" source="Derived" loading={loading} />
            </div>

            <SectionCard title="Event Context" subtitle="Toggle aggregate portfolio vs individual event comparison." source={events.length > 0 ? 'Live' : 'Mock'} dense>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                    <select value={eventScope} onChange={(e) => setEventScope(e.target.value)} className="rounded-xl glow-surface-soft bg-black/40 px-3 py-2 text-sm text-white">
                        <option value="live">Live Events</option>
                        <option value="archived">Archived Events</option>
                    </select>
                    <select value={compareMode} onChange={(e) => setCompareMode(e.target.value)} className="rounded-xl glow-surface-soft bg-black/40 px-3 py-2 text-sm text-white">
                        <option value="aggregate">Aggregate portfolio</option>
                        <option value="individual">Individual event</option>
                    </select>
                    <select
                        value={selectedEventId}
                        onChange={(e) => setSelectedEventId(e.target.value)}
                        disabled={compareMode === 'aggregate'}
                        className="rounded-xl glow-surface-soft bg-black/40 px-3 py-2 text-sm text-white disabled:opacity-50 md:col-span-2"
                    >
                        <option value="all">All events (aggregate)</option>
                        {scopedEvents.map((event) => (
                            <option key={event.id} value={event.id}>{event.name}</option>
                        ))}
                    </select>
                </div>
            </SectionCard>

            {(pillar === 'overall' || pillar === 'spatial') && (
                <SectionCard
                    title="Temporal Hype Index"
                    subtitle="Default Overall Events view — composite chat, reactions, and gate scans."
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
                                <XAxis dataKey="time" stroke="rgba(255,255,255,0.28)" tick={{ fill: 'rgba(255,255,255,0.8)', fontSize: isMobile ? 10 : 11 }} interval={isMobile ? 3 : 1} />
                                <YAxis stroke="rgba(255,255,255,0.28)" tick={{ fill: 'rgba(255,255,255,0.8)', fontSize: isMobile ? 10 : 11 }} width={isMobile ? 28 : 40} />
                                <Tooltip content={<AnalyticsTooltip />} />
                                <Area type="monotone" dataKey="hype" stroke="#ffffff" strokeWidth={2} fill="url(#hypeGradient)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </SectionCard>
            )}

            {pillar === 'spatial' && (
                <SectionCard title="Spatial Intelligence" subtitle="Three-room venue mock with density hotspots." source={moduleSource}>
                    <VenueRoomMap rooms={VENUE_ROOMS} />
                </SectionCard>
            )}

            {pillar === 'audience' && (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <SectionCard title="Odyssey Speedometer" subtitle="Passport tier momentum with Partial Attendee metric." source="Derived">
                        <Speedometer value={partialAttendeeRate} label="Partial Attendee %" />
                        <p className="mt-4 text-center text-xs text-zinc-500">
                            Guests who scanned in vs total ticket purchases across selected scope.
                        </p>
                    </SectionCard>
                    <SectionCard title="Tier Mix" subtitle="Crowd split by global passport tiers." source="Derived">
                        <div className="h-[280px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={tierMix} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={isMobile ? 88 : 100} innerRadius={isMobile ? 44 : 55}>
                                        {tierMix.map((tier, idx) => (
                                            <Cell key={tier.name} fill={TIER_COLORS[idx % TIER_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<SurfaceTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </SectionCard>
                </div>
            )}

            {pillar === 'moments' && (
                <SectionCard
                    title="Top Moments"
                    subtitle="Ranked by engagement — Wilson score removed; filter by scrapbook or specific event."
                    source={moduleSource}
                    actions={(
                        <div className="flex gap-2">
                            <button type="button" onClick={() => setMomentsFilter('scrapbook')} className={`rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-widest ${momentsFilter === 'scrapbook' ? 'bg-white text-black' : 'glow-chip text-zinc-300'}`}>
                                Scrapbook View
                            </button>
                            <button type="button" onClick={() => setMomentsFilter('event')} className={`rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-widest ${momentsFilter === 'event' ? 'bg-white text-black' : 'glow-chip text-zinc-300'}`}>
                                Specific Event
                            </button>
                        </div>
                    )}
                >
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {filteredMoments.map((moment) => (
                            <div key={moment.id} className="glow-surface-soft rounded-xl p-3">
                                <div className="flex h-24 w-full items-center justify-center rounded-lg bg-zinc-800/80">
                                    <HugeiconsIcon icon={Image02Icon} size={20} className="text-zinc-500" />
                                </div>
                                <p className="mt-2 text-sm font-semibold text-white">{moment.title}</p>
                                <p className="mt-1 text-xs text-zinc-400">{moment.hearts} hearts · {moment.cluster}</p>
                                <p className="mt-1 text-xs text-zinc-500">{moment.event}</p>
                            </div>
                        ))}
                    </div>
                </SectionCard>
            )}

            <SectionCard title="Attendance Lifecycle Funnel" subtitle="Drop-off stages with CTAs into Campaigns." source={moduleSource}>
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
                <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    {funnelData.map((stage) => (
                        <Link
                            key={stage.stage}
                            href={`/dashboard/audience?view=campaigns&stage=${encodeURIComponent(stage.stage)}`}
                            className="glow-interactive glow-surface-soft flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold text-zinc-300 hover:text-white"
                        >
                            <span className="flex items-center gap-2">
                                <HugeiconsIcon icon={Megaphone01Icon} size={14} className="text-pxi-purple" />
                                {stage.cta || 'Open Campaigns'}
                            </span>
                            <HugeiconsIcon icon={ArrowRight02Icon} size={14} />
                        </Link>
                    ))}
                </div>
            </SectionCard>

            {(loading || analyticsLoading) && (
                <div className="glow-surface rounded-xl p-4 text-sm text-zinc-400">Loading analytics context…</div>
            )}

            <div className="glow-surface-soft rounded-2xl p-4">
                <p className="flex items-center gap-2 text-sm text-zinc-400">
                    <HugeiconsIcon icon={Alert02Icon} size={15} className="text-pxi-purple" />
                    Spatial and moment rankings use intelligent mock outputs until backend aggregates finalize.
                </p>
            </div>
        </div>
    );
}

export default function AnalyticsPage() {
    return (
        <Suspense fallback={<div className="mx-auto max-w-6xl p-8 text-zinc-500">Loading analytics…</div>}>
            <AnalyticsPageContent />
        </Suspense>
    );
}
