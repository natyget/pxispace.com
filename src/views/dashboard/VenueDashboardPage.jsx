'use client';

// VEN-8: the venue dashboard, to Brandon's design (Figma "Venues Dashboard", 2026-10). One product for a venue
// partner, in four screens: Home (tonight at a glance), Overview (how nights build), Audience (who came, VEN-4)
// and Guarantees (VEN-7). Plan a night (VEN-6) stays as a fifth screen for whoever may see forecasts.
//
// Rules this page follows:
//   - Only the approved columns in the audience list (name, handle, avatar, events here, last check-in, ticket
//     kind, engagement tier). No email, phone, city, age or spend.
//   - The venue API carries no money (CEO, 2026-09-17). The one money card, Net Payout, reads the signed-in
//     account's own payments from the organizer tools and nothing else: see venue/PayoutCard.jsx.
//   - Who else hosts a night is not shown. A night card says "Host: You" for the venue's own nights only.
//   - Forecasts are always a range. The page never shows a single expected number.
//   - Every card says what it has: a figure, "Limited History" on one or two nights, or its empty line. It
//     never draws a number it does not have.
//   - Colours come from chartStyles.js only.
//
// Admins can open any venue they may read with ?venueId=, which is how a salesperson demos a room and how shadow
// mode is reviewed. The backend decides access on every request.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import SegmentedToggle from '@/components/dashboard/SegmentedToggle';
import { getDashboardChartShade } from '@/components/dashboard/chartStyles';
import ActivityCard from '@/components/dashboard/venue/ActivityCard';
import AlbumsCard from '@/components/dashboard/venue/AlbumsCard';
import AudiencePanel from '@/components/dashboard/venue/AudiencePanel';
import ComeBackCard from '@/components/dashboard/venue/ComeBackCard';
import DoorCard from '@/components/dashboard/venue/DoorCard';
import ForecastCard from '@/components/dashboard/venue/ForecastCard';
import GuaranteesView from '@/components/dashboard/venue/GuaranteesView';
import InsightsCard from '@/components/dashboard/venue/InsightsCard';
import NightByNightCard from '@/components/dashboard/venue/NightByNightCard';
import NightsCard from '@/components/dashboard/venue/NightsCard';
import PayoutCard from '@/components/dashboard/venue/PayoutCard';
import PlanANight from '@/components/dashboard/venue/PlanANight';
import SpatialCard from '@/components/dashboard/venue/SpatialCard';
import { VenueCard } from '@/components/dashboard/venue/VenueCard';
import { formatInteger, formatNightDate, venueDayRange, venuePlace } from '@/lib/venueDashboard';
import {
    fetchMyVenues,
    fetchVenueActivity,
    fetchVenueAnalytics,
    fetchVenueHeatmap,
    fetchVenueHome,
} from '@/services/venues';

const TABS = [
    { value: 'home', label: 'Home' },
    { value: 'overview', label: 'Overview' },
    { value: 'audience', label: 'Audience' },
    { value: 'plan', label: 'Plan a night' },
    { value: 'guarantees', label: 'Guarantees' },
];

// The design's column widths, row by row, so the right-hand cards line up down the page.
const HOME_ROW_1 = 'grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,380fr)_minmax(0,588fr)_minmax(0,380fr)_minmax(0,481fr)]';
const HOME_ROW_2 = 'grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,277fr)_minmax(0,277fr)_minmax(0,779fr)_minmax(0,481fr)]';
const HOME_ROW_3 = 'grid gap-3 xl:grid-cols-[minmax(0,1057fr)_minmax(0,778fr)]';
const OVERVIEW_ROW_1 = 'grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,352fr)_minmax(0,278fr)_minmax(0,202fr)_minmax(0,506fr)]';
const OVERVIEW_ROW_2 = 'grid gap-3 xl:grid-cols-[minmax(0,648fr)_minmax(0,694fr)]';
const OVERVIEW_ROW_3 = 'grid gap-3 xl:grid-cols-2';

const selectCls = 'rounded-full bg-white/[0.055] px-4 py-2 text-[13px] text-white outline-none focus:bg-white/[0.075]';

function Notice({ tone = 'neutral', children }) {
    const tones = {
        neutral: 'bg-white/[0.04] text-white/60',
        error: 'bg-red-500/10 text-red-200',
    };
    return <div className={`rounded-2xl px-5 py-4 text-sm leading-6 ${tones[tone]}`}>{children}</div>;
}

/** Everything the Home and Overview screens share, loaded once per venue. */
function useVenueData(venueId) {
    const [loaded, setLoaded] = useState({ venueId: null });

    useEffect(() => {
        if (!venueId) return undefined;
        let cancelled = false;
        const settle = (key) => (value) => {
            if (!cancelled) setLoaded((prev) => ({ ...(prev.venueId === venueId ? prev : { venueId }), [key]: value }));
        };
        fetchVenueHome(venueId).then((res) => settle('home')(res.home)).catch((err) => settle('homeError')(err));
        fetchVenueAnalytics(venueId).then((res) => settle('analytics')(res.analytics)).catch((err) => settle('analyticsError')(err));
        fetchVenueHeatmap(venueId).then((res) => settle('heatmap')(res.heatmap)).catch((err) => settle('heatmapError')(err));
        return () => { cancelled = true; };
    }, [venueId]);

    return loaded.venueId === venueId ? loaded : { venueId };
}

// ————— The chart's filter (Overview) —————

function ActivityFilter({ nights, timeZone, selection, onChange }) {
    const [open, setOpen] = useState(false);
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const options = [
        { mode: 'average', label: 'Avg Night' },
        { mode: 'night', label: 'Individual Night' },
        { mode: 'range', label: 'Date Range' },
    ];
    const current = options.find((o) => o.mode === selection.mode);

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                className="flex items-center gap-2 rounded-full bg-white/[0.1] px-3 py-1 text-[11px] font-semibold text-white ring-1 ring-white/[0.14]"
            >
                {current ? current.label : 'Filter'}
                <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none" aria-hidden="true">
                    <path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>
            {open ? (
                <div className="dashboard-popover-surface absolute bottom-full right-0 z-20 mb-1.5 w-[230px] rounded-xl p-2 text-[12px]">
                    {options.map((o) => (
                        <button
                            key={o.mode}
                            type="button"
                            onClick={() => {
                                if (o.mode === 'average') { onChange({ mode: 'average' }); setOpen(false); }
                                else if (o.mode === 'night') onChange({ mode: 'night', eventId: selection.eventId || nights[0]?.eventId || '' });
                                else onChange({ mode: 'range', from: selection.from || null, to: selection.to || null });
                            }}
                            aria-pressed={selection.mode === o.mode}
                            className={`block w-full rounded-lg px-3 py-1.5 text-center ${selection.mode === o.mode ? 'bg-white/[0.12] font-semibold text-white' : 'text-white/75 hover:bg-white/[0.06]'}`}
                        >
                            {o.label}
                        </button>
                    ))}
                    {selection.mode === 'night' ? (
                        nights.length ? (
                            <select
                                value={selection.eventId || ''}
                                onChange={(e) => onChange({ mode: 'night', eventId: e.target.value })}
                                aria-label="Night"
                                className="mt-2 w-full rounded-lg bg-white/[0.06] px-2.5 py-1.5 text-[12px] text-white outline-none"
                            >
                                {nights.map((n) => <option key={n.eventId} value={n.eventId}>{formatNightDate(n.startDate, n.timeZone || timeZone)} · {n.name}</option>)}
                            </select>
                        ) : <p className="mt-2 px-1 text-[11px] text-white/45">No night with door scans yet.</p>
                    ) : null}
                    {selection.mode === 'range' ? (
                        <div className="mt-2 space-y-1.5">
                            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="From" className="w-full rounded-lg bg-white/[0.06] px-2.5 py-1.5 text-[12px] text-white outline-none" />
                            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} aria-label="To" className="w-full rounded-lg bg-white/[0.06] px-2.5 py-1.5 text-[12px] text-white outline-none" />
                            <button
                                type="button"
                                disabled={!from && !to}
                                onClick={() => { onChange({ mode: 'range', ...venueDayRange(from, to, timeZone) }); setOpen(false); }}
                                className="w-full rounded-full bg-white px-3 py-1 text-[11px] font-bold text-black disabled:opacity-40"
                            >
                                Apply
                            </button>
                        </div>
                    ) : null}
                    <button
                        type="button"
                        onClick={() => { onChange({ mode: 'default' }); setOpen(false); }}
                        className="mt-2 block w-full rounded-lg px-3 py-1 text-center text-[11px] text-white/50 hover:text-white"
                    >
                        Back to the latest night
                    </button>
                </div>
            ) : null}
        </div>
    );
}

/** The chart on the Overview, with whichever nights the filter chose. */
function RoomFills({ venueId, home, loading }) {
    const [selection, setSelection] = useState({ mode: 'default' });
    const [picked, setPicked] = useState(null);
    const timeZone = home?.venue?.timeZone || null;

    const request = useMemo(() => {
        if (selection.mode === 'average') return {};
        if (selection.mode === 'night') return selection.eventId ? { eventId: selection.eventId } : null;
        if (selection.mode === 'range') return selection.from || selection.to ? { from: selection.from || undefined, to: selection.to || undefined } : null;
        return null;
    }, [selection]);
    const requestKey = request ? JSON.stringify(request) : null;

    useEffect(() => {
        if (!request) return undefined;
        let cancelled = false;
        fetchVenueActivity(venueId, request)
            .then((res) => { if (!cancelled) setPicked({ key: requestKey, activity: res.activity, error: null }); })
            .catch((err) => { if (!cancelled) setPicked({ key: requestKey, activity: null, error: err.message || 'Failed to load' }); });
        return () => { cancelled = true; };
    }, [venueId, request, requestKey]);

    const usingPicked = Boolean(request);
    const ready = usingPicked ? picked?.key === requestKey : true;
    const activity = usingPicked ? (ready ? picked.activity : null) : home?.activity || null;
    const door = home?.door || null;
    const live = Boolean(activity?.night && door?.state === 'LIVE' && door.eventId === activity.night.eventId);

    return (
        <ActivityCard
            title="When the Room Fills"
            activity={activity}
            live={live}
            // A range the venue chose is averaged however few nights are in it, so it is not "limited".
            level={selection.mode === 'range' && activity?.average ? 'FULL' : home?.history?.level || 'NONE'}
            loading={loading || !ready}
            error={usingPicked && ready ? picked.error : null}
            filter={<ActivityFilter nights={home?.nights || []} timeZone={timeZone} selection={selection} onChange={setSelection} />}
        />
    );
}

// ————— All nights (Overview) —————

/** The room's totals over every night, and who comes: VEN-3's approved figures, in the design's card. */
function AllNightsCard({ analytics, loading }) {
    const figures = analytics ? [
        ['People through the door', analytics.totalAttendance],
        ['Tickets', analytics.ticketsSold],
        ['Photos and videos', analytics.captureVolume],
        ['Nights', analytics.eventCount],
    ] : [];
    return (
        <VenueCard title="All Nights" data-venue-card="all-nights">
            {loading || !analytics ? <div className="h-40 w-full animate-pulse rounded-2xl bg-white/[0.035]" /> : (
                <>
                    <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {figures.map(([label, value]) => (
                            <div key={label} className="rounded-xl bg-white/[0.04] px-3 py-2.5">
                                <dt className="text-[10px] font-medium text-white/45">{label}</dt>
                                <dd className="mt-1 text-[20px] font-bold leading-none text-white tabular-nums">{formatInteger(value)}</dd>
                            </div>
                        ))}
                    </dl>
                    <h3 className="mt-4 text-[13px] font-semibold text-white/85">Who comes</h3>
                    {analytics.demographics.withheld ? (
                        <p className="mt-2 text-[12px] leading-5 text-white/55">
                            {analytics.demographics.reason || 'Shown once enough people have come, so nobody can be singled out.'}
                        </p>
                    ) : (
                        <div className="mt-2 grid gap-4 sm:grid-cols-2">
                            {[['Age', analytics.demographics.ageBands.map((b) => [b.band, b.count])], ['From', analytics.demographics.cities.map((c) => [c.city, c.count])]].map(([title, rows]) => (
                                <div key={title}>
                                    <p className="mb-2 text-[11px] font-medium text-white/40">{title}</p>
                                    <ul className="space-y-1.5">
                                        {rows.map(([label, count], i) => (
                                            <li key={label} className="flex items-center gap-2 text-[12px] text-white/70">
                                                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: getDashboardChartShade(i) }} />
                                                <span className="min-w-0 flex-1 truncate">{label}</span>
                                                <span className="tabular-nums text-white/50">{formatInteger(count)}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </VenueCard>
    );
}

// ————— Page —————

export default function VenueDashboardPage() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const requestedId = searchParams.get('venueId');
    const requestedTab = searchParams.get('tab');
    const [mine, setMine] = useState(null);
    const [loadError, setLoadError] = useState(null);

    useEffect(() => {
        let cancelled = false;
        fetchMyVenues()
            .then((res) => { if (!cancelled) setMine(res); })
            .catch((err) => { if (!cancelled) setLoadError(err.message || 'Failed to load your venues'); });
        return () => { cancelled = true; };
    }, []);

    const venues = useMemo(() => mine?.venues ?? [], [mine]);
    const ownsRequested = requestedId ? venues.some((v) => v.id === requestedId) : false;
    // An admin opening a venue they do not own: the backend decides whether they may read it.
    const adminView = Boolean(requestedId && mine && !ownsRequested);
    const venueId = requestedId || venues[0]?.id || null;
    const owned = venues.find((v) => v.id === venueId) || null;

    useEffect(() => {
        if (mine && !requestedId && venues.length === 0) router.replace('/dashboard');
    }, [mine, requestedId, venues.length, router]);

    const data = useVenueData(mine ? venueId : null);
    const { home, analytics, heatmap } = data;
    const venueEventIds = useMemo(() => (analytics?.perEvent || []).map((e) => e.eventId), [analytics]);

    /**
     * The screen and the venue live in the address, so a link or a reload lands where it was. They are this
     * page's own state, so the address is updated in place with the History API, which the App Router keeps
     * useSearchParams in step with. router.replace is not used: for a change of query only, Next 16 reuses
     * the route it already knows together with the address it first saw it at, and the change is lost.
     */
    const go = useCallback((next) => {
        const params = new URLSearchParams(window.location.search);
        Object.entries(next).forEach(([key, value]) => {
            if (value === null || value === undefined || value === '') params.delete(key);
            else params.set(key, value);
        });
        const q = params.toString();
        window.history.replaceState(null, '', q ? `${pathname}?${q}` : pathname);
    }, [pathname]);

    if (loadError) return <Notice tone="error">{loadError}</Notice>;
    if (!mine || !venueId) return <div className="flex min-h-[40vh] items-center justify-center text-sm text-white/60">Loading...</div>;
    // An admin view of a venue the backend will not let them read.
    if (adminView && data.homeError && (data.homeError.status === 403 || data.homeError.status === 404)) {
        return <Notice tone="error">You do not have access to this venue.</Notice>;
    }

    const features = mine.features || {};
    const tabs = TABS.filter((t) => {
        if (t.value === 'audience') return features.crm || adminView;
        if (t.value === 'plan') return features.forecast || adminView;
        return true;
    });
    const tab = tabs.some((t) => t.value === requestedTab) ? requestedTab : 'home';
    const venue = home?.venue || owned || { id: venueId, name: 'Venue', cityCode: null, address: null };
    const timeZone = home?.venue?.timeZone || null;
    const level = home?.history?.level || 'NONE';
    const homeLoading = home === undefined && !data.homeError;
    const analyticsLoading = analytics === undefined && !data.analyticsError;
    const heatmapLoading = heatmap === undefined && !data.heatmapError;
    const canAudience = tabs.some((t) => t.value === 'audience');
    const canPlan = tabs.some((t) => t.value === 'plan');
    const place = venuePlace(venue);
    const live = home?.comparison?.night?.state === 'LIVE';

    const cards = {
        door: <DoorCard door={home?.door || null} loading={homeLoading} />,
        nights: <NightsCard tonight={home?.tonight || []} upcoming={home?.upcoming || []} hasHistory={level !== 'NONE'} loading={homeLoading} />,
        comeBack: <ComeBackCard analytics={analytics} level={level} loading={analyticsLoading} />,
        albums: <AlbumsCard albums={home?.albums || []} loading={homeLoading} />,
        spatial: <SpatialCard heatmap={heatmap} venueName={venue.name} loading={heatmapLoading} error={data.heatmapError?.message || null} />,
    };

    return (
        <div className="mx-auto max-w-7xl space-y-3" data-venue-level={level}>
            <header className="flex flex-col gap-4 pb-2 lg:flex-row lg:items-end lg:justify-between">
                <div className="min-w-0">
                    <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-white">Venue Dashboard</h1>
                    <p className="mt-0.5 truncate text-[14px] text-white/45">
                        {adminView ? <span className="mr-2 rounded-full bg-sky-500/10 px-2 py-0.5 text-[11px] font-medium text-sky-300">Admin view</span> : null}
                        <span className="text-white/70">{venue.name}</span>
                        {place ? <span> · {place}</span> : null}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {venues.length > 1 && !adminView ? (
                        <select value={venueId} onChange={(e) => go({ venueId: e.target.value, tab: null })} className={selectCls} aria-label="Venue">
                            {venues.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                        </select>
                    ) : null}
                    <SegmentedToggle items={tabs} value={tab} onChange={(value) => go({ tab: value === 'home' ? null : value })} ariaLabel="Venue sections" />
                </div>
            </header>

            {(tab === 'home' || tab === 'overview') && data.homeError ? (
                <Notice tone="error">
                    {/* A 404 for the venue's own account means the server does not have this screen's data yet. */}
                    {data.homeError.status === 404
                        ? 'The venue dashboard is being updated. Try again in a few minutes.'
                        : data.homeError.message || 'Could not load this venue.'}
                </Notice>
            ) : null}
            {(tab === 'home' || tab === 'overview') && data.analyticsError ? (
                <Notice tone="error">{data.analyticsError.message || 'Could not load the venue totals.'}</Notice>
            ) : null}

            {tab === 'home' && !data.homeError ? (
                <div className="space-y-3" key={venueId}>
                    <div className={HOME_ROW_1}>
                        {cards.door}
                        <ActivityCard title="Recent Night Activity" activity={home?.activity || null} live={live} level={level} loading={homeLoading} />
                        <ForecastCard venueId={venueId} available={canPlan} adminView={adminView} onPlan={canPlan ? () => go({ tab: 'plan' }) : null} />
                        {cards.nights}
                    </div>
                    <div className={HOME_ROW_2}>
                        {cards.comeBack}
                        <InsightsCard home={home} analytics={analytics} heatmap={heatmap} loading={homeLoading || analyticsLoading} />
                        <PayoutCard venueEventIds={venueEventIds} timeZone={timeZone} adminView={adminView} />
                        {cards.albums}
                    </div>
                    <div className={HOME_ROW_3}>
                        {canAudience ? (
                            <AudiencePanel
                                variant="compact"
                                venueId={venueId}
                                crmEnabled={features.crm}
                                adminView={adminView}
                                events={analytics?.perEvent || []}
                                timeZone={timeZone}
                                level={level}
                                onOpenFull={() => go({ tab: 'audience' })}
                            />
                        ) : (
                            <VenueCard title="Audience" data-venue-card="audience">
                                <p className="m-auto max-w-[40ch] px-2 py-6 text-center text-[12px] leading-5 text-white/55">
                                    Audience lists are not switched on for venues yet.
                                </p>
                            </VenueCard>
                        )}
                        {cards.spatial}
                    </div>
                </div>
            ) : null}

            {tab === 'overview' && !data.homeError ? (
                <div className="space-y-3" key={venueId}>
                    <div className={OVERVIEW_ROW_1}>
                        {cards.nights}
                        {cards.door}
                        {cards.comeBack}
                        {cards.albums}
                    </div>
                    <div className={OVERVIEW_ROW_2}>
                        <RoomFills venueId={venueId} home={home} loading={homeLoading} />
                        <NightByNightCard comparison={home?.comparison || null} level={level} loading={homeLoading} />
                    </div>
                    <div className={OVERVIEW_ROW_3}>
                        {cards.spatial}
                        <AllNightsCard analytics={analytics} loading={analyticsLoading} />
                    </div>
                </div>
            ) : null}

            {tab === 'audience' ? (
                <AudiencePanel
                    key={venueId}
                    variant="full"
                    venueId={venueId}
                    crmEnabled={features.crm}
                    adminView={adminView}
                    events={analytics?.perEvent || []}
                    timeZone={timeZone}
                    level={level}
                />
            ) : null}
            {tab === 'plan' ? <PlanANight key={venueId} venueId={venueId} adminView={adminView} forecastVisible={features.forecast} /> : null}
            {tab === 'guarantees' ? <GuaranteesView key={venueId} venueId={venueId} timeZone={timeZone} /> : null}
        </div>
    );
}
