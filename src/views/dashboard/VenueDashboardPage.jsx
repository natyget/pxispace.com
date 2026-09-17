'use client';

// VEN-8: the venue dashboard. One product for a venue partner: what happened in the room (VEN-3 analytics), who
// came (VEN-4 CRM, behind the same privacy wall as organizers), what to host next (VEN-6 forecast and audience,
// once out of shadow mode) and any attendance guarantee (VEN-7).
//
// Rules this page follows:
//   - Only the approved columns in the audience table (name, handle, avatar, events here, last check-in, ticket
//     kind, engagement tier). No email, phone, city, age or spend.
//   - No revenue anywhere: venues are separate from revenue (CEO, 2026-09-17).
//   - Forecasts are always a range. The page never shows a single expected number.
//   - Colours come from chartStyles.js only.
//
// Admins can open any venue they may read with ?venueId=, which is how a salesperson demos a room and how shadow
// mode is reviewed. The backend decides access on every request.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import SectionCard from '@/components/dashboard/SectionCard';
import { RechartsChart } from '@/components/dashboard/ChartFrame';
import {
    DASHBOARD_AXIS_TICK,
    DASHBOARD_GRID_STROKE,
    DASHBOARD_TOOLTIP_PROPS,
    getDashboardChartShade,
} from '@/components/dashboard/chartStyles';
import {
    fetchMyVenues,
    fetchVenueAnalytics,
    fetchVenueAudience,
    fetchVenueForecast,
    fetchVenueGuarantees,
    fetchVenueSuggestions,
} from '@/services/venues';
import { cityLabel } from '@/lib/dashboardNavConfig';

const TABS = [
    { key: 'overview', label: 'Overview' },
    { key: 'audience', label: 'Audience' },
    { key: 'plan', label: 'Plan a night' },
    { key: 'guarantees', label: 'Guarantees' },
];

const inputCls = 'rounded-full bg-white/[0.055] px-4 py-2 text-[13px] text-white placeholder:text-white/35 outline-none focus:bg-white/[0.075]';

function formatInteger(value) {
    return Number(value || 0).toLocaleString();
}

function formatDate(iso, withTime = false) {
    if (!iso) return 'Never';
    try {
        return new Date(iso).toLocaleString(undefined, withTime
            ? { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }
            : { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
        return '';
    }
}

function formatCents(cents) {
    return `$${(Number(cents || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function Tile({ label, value, hint }) {
    return (
        <div className="rounded-2xl bg-white/[0.04] p-5">
            <p className="text-[11px] font-medium tracking-[0.02em] text-white/40">{label}</p>
            <p className="mt-3 text-[28px] font-bold leading-none text-white tabular-nums">{value}</p>
            {hint ? <p className="mt-2 text-xs font-semibold leading-5 text-white/45">{hint}</p> : null}
        </div>
    );
}

function Notice({ tone = 'neutral', children }) {
    const tones = {
        neutral: 'bg-white/[0.04] text-white/60',
        error: 'bg-red-500/10 text-red-200',
        info: 'bg-sky-500/10 text-sky-200',
    };
    return <div className={`rounded-2xl px-5 py-4 text-sm leading-6 ${tones[tone]}`}>{children}</div>;
}

// ————— Overview (VEN-3) —————

function EmptyRoom({ venueName, eventCount }) {
    return (
        <SectionCard title={eventCount ? 'Your first nights are on the way' : 'Your venue is set up'}>
            <div className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
                <div className="space-y-3 text-sm leading-6 text-white/60">
                    <p>
                        {eventCount
                            ? `${venueName} has ${eventCount} ${eventCount === 1 ? 'event' : 'events'} on PXI. Once doors open and tickets are scanned, this page fills in on its own.`
                            : `As events at ${venueName} run on PXI, this page fills in on its own. There is nothing to set up.`}
                    </p>
                    <p>Every figure comes from tickets scanned at your door, so it counts people who actually came.</p>
                </div>
                <ul className="space-y-2 text-sm text-white/70">
                    {[
                        ['Attendance and peak hours', 'when your room fills, night by night'],
                        ['First-timers and regulars', 'how many come back'],
                        ['Your audience', 'the people who came, with their permission'],
                        ['Plan a night', 'who to reach for a genre, and a realistic range'],
                    ].map(([title, detail]) => (
                        <li key={title} className="rounded-xl bg-white/[0.035] px-4 py-3">
                            <span className="font-semibold text-white">{title}</span>
                            <span className="text-white/45">: {detail}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </SectionCard>
    );
}

function Overview({ venueId, venueName }) {
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;
        fetchVenueAnalytics(venueId)
            .then((res) => { if (!cancelled) { setData(res.analytics); setError(null); } })
            .catch((err) => { if (!cancelled) setError(err.message || 'Failed to load analytics'); });
        return () => { cancelled = true; };
    }, [venueId]);

    if (error) return <Notice tone="error">{error}</Notice>;
    if (!data) return <Notice>Loading...</Notice>;

    const measured = data.totalAttendance > 0;
    const repeat = data.firstTimeVsRepeat;
    const peak = data.peakCheckInHours.reduce((best, h) => (h.checkIns > (best?.checkIns ?? 0) ? h : best), null);
    const hourLabel = (h) => `${((h + 11) % 12) + 1}${h < 12 ? 'am' : 'pm'}`;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Tile label="People through the door" value={formatInteger(data.totalAttendance)} hint={`${formatInteger(data.eventCount)} events`} />
                <Tile label="Tickets" value={formatInteger(data.ticketsSold)} hint={`${formatInteger(data.upcomingEventCount)} upcoming events`} />
                <Tile
                    label="Came back"
                    value={repeat.repeatRate === null ? 'n/a' : `${Math.round(repeat.repeatRate * 100)}%`}
                    hint={`${formatInteger(repeat.repeat)} regulars, ${formatInteger(repeat.firstTime)} first-timers`}
                />
                <Tile label="Photos and videos" value={formatInteger(data.captureVolume)} hint={peak?.checkIns ? `Busiest at ${hourLabel(peak.hour)}` : 'Captured at your events'} />
            </div>

            {!measured ? (
                <EmptyRoom venueName={venueName} eventCount={data.eventCount} />
            ) : (
                <>
                    <SectionCard title="When the room fills">
                        <RechartsChart className="h-[220px]">
                            {/* The lint config does not count JSX use of render-prop components. */}
                            {/* eslint-disable-next-line no-unused-vars */}
                            {({ ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip }) => (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={data.peakCheckInHours.map((h) => ({ ...h, label: hourLabel(h.hour) }))} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                                        <CartesianGrid stroke={DASHBOARD_GRID_STROKE} vertical={false} />
                                        <XAxis dataKey="label" tick={DASHBOARD_AXIS_TICK} axisLine={false} tickLine={false} interval={2} />
                                        <YAxis allowDecimals={false} tick={DASHBOARD_AXIS_TICK} axisLine={false} tickLine={false} />
                                        <Tooltip {...DASHBOARD_TOOLTIP_PROPS} formatter={(v) => [v, 'Check-ins']} />
                                        <Bar dataKey="checkIns" fill={getDashboardChartShade(0)} radius={[6, 6, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </RechartsChart>
                    </SectionCard>

                    <div className="grid gap-6 lg:grid-cols-2">
                        <SectionCard title="Night by night">
                            <ul className="space-y-2">
                                {data.perEvent.slice(0, 12).map((e) => (
                                    <li key={e.eventId} className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.035] px-4 py-2.5">
                                        <span className="min-w-0">
                                            <span className="block truncate text-[14px] font-semibold text-white">{e.name}</span>
                                            <span className="block text-[12px] text-white/45">{formatDate(e.startDate)}</span>
                                        </span>
                                        <span className="shrink-0 text-right text-[12px] text-white/60 tabular-nums">
                                            {formatInteger(e.attendance)} in · {formatInteger(e.captureVolume)} captures
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </SectionCard>
                        <SectionCard title="Who comes">
                            {data.demographics.withheld ? (
                                <p className="text-sm leading-6 text-white/55">{data.demographics.reason || 'Shown once enough people have come, so nobody can be singled out.'}</p>
                            ) : (
                                <div className="grid gap-4 sm:grid-cols-2">
                                    {[['Age', data.demographics.ageBands.map((b) => [b.band, b.count])], ['From', data.demographics.cities.map((c) => [c.city, c.count])]].map(([title, rows]) => (
                                        <div key={title}>
                                            <p className="mb-2 text-[11px] font-medium text-white/40">{title}</p>
                                            <ul className="space-y-1.5">
                                                {rows.map(([label, count], i) => (
                                                    <li key={label} className="flex items-center gap-2 text-[13px] text-white/70">
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
                        </SectionCard>
                    </div>
                </>
            )}
        </div>
    );
}

// ————— Audience (VEN-4) —————

const PAGE_SIZE = 50;

function Audience({ venueId, crmEnabled, adminView }) {
    const [ticketTier, setTicketTier] = useState('');
    const [page, setPage] = useState(1);
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;
        fetchVenueAudience(venueId, { ticketTier: ticketTier || undefined, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE })
            .then((res) => { if (!cancelled) { setData(res); setError(null); } })
            .catch((err) => {
                if (cancelled) return;
                setError(err.status === 404 ? 'Audience lists are not switched on for venues yet.' : err.message || 'Failed to load the audience');
            });
        return () => { cancelled = true; };
    }, [venueId, ticketTier, page]);

    const totalPages = Math.max(1, Math.ceil((data?.identifiedTotal ?? 0) / PAGE_SIZE));

    return (
        <SectionCard
            title="People who came to your events"
            actions={
                <select value={ticketTier} onChange={(e) => { setTicketTier(e.target.value); setPage(1); }} className={inputCls} aria-label="Ticket">
                    <option value="">All tickets</option>
                    <option value="PAID">Paid tickets</option>
                    <option value="FREE">Free tickets</option>
                </select>
            }
        >
            {adminView && !crmEnabled ? (
                <div className="mb-4"><Notice tone="info">Admin preview. Venue owners do not see this list until venue audiences are switched on.</Notice></div>
            ) : null}
            {error ? <Notice tone="error">{error}</Notice> : !data ? <Notice>Loading...</Notice> : (
                <>
                    <p className="mb-3 text-[13px] text-white/50">
                        {formatInteger(data.total)} people.{' '}
                        {data.hiddenCount ? `${formatInteger(data.hiddenCount)} are counted but not listed, because they have not agreed to be shown to venues.` : ''}
                    </p>
                    {data.rows.length === 0 ? (
                        <Notice>Nobody to list yet. People appear here after they hold a ticket to an event at your venue.</Notice>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[640px] text-left text-[13px]">
                                <thead>
                                    <tr className="text-[11px] text-white/40">
                                        <th className="px-3 py-2 font-medium">Person</th>
                                        <th className="px-3 py-2 font-medium">Events here</th>
                                        <th className="px-3 py-2 font-medium">Last check-in</th>
                                        <th className="px-3 py-2 font-medium">Ticket</th>
                                        <th className="px-3 py-2 font-medium">Engagement</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.rows.map((row) => (
                                        <tr key={row.id} className="border-t border-white/[0.05]">
                                            <td className="px-3 py-2.5">
                                                <div className="flex items-center gap-3">
                                                    {row.avatarUrl
                                                        ? <img src={row.avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
                                                        : <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.08] text-[12px] text-white/60">{(row.name || row.username || '?').slice(0, 1).toUpperCase()}</span>}
                                                    <span className="min-w-0">
                                                        <span className="block truncate font-semibold text-white">{row.name || row.username || 'PXI member'}</span>
                                                        {row.username ? <span className="block truncate text-[12px] text-white/45">@{row.username}</span> : null}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-3 py-2.5 tabular-nums text-white/70">{formatInteger(row.eventsAttended)}</td>
                                            <td className="px-3 py-2.5 text-white/60">{formatDate(row.lastCheckInAt, true)}</td>
                                            <td className="px-3 py-2.5 text-white/70">{row.ticketTier === 'PAID' ? 'Paid' : 'Free'}</td>
                                            <td className="px-3 py-2.5 text-white/70">{row.engagementTier?.label}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {totalPages > 1 ? (
                        <div className="mt-4 flex items-center justify-end gap-2 text-[12px] text-white/60">
                            <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-full bg-white/[0.065] px-3 py-1.5 disabled:opacity-40">Previous</button>
                            <span>Page {page} of {totalPages}</span>
                            <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-full bg-white/[0.065] px-3 py-1.5 disabled:opacity-40">Next</button>
                        </div>
                    ) : null}
                    <p className="mt-4 text-[12px] leading-5 text-white/35">
                        Contact details are never shown. Reaching these people goes through PXI.
                    </p>
                </>
            )}
        </SectionCard>
    );
}

// ————— Plan a night (VEN-6) —————

function PlanANight({ venueId, adminView, forecastVisible }) {
    const [genres, setGenres] = useState(null);
    const [genre, setGenre] = useState('');
    const [date, setDate] = useState('');
    const [forecast, setForecast] = useState(null);
    const [suggestion, setSuggestion] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let cancelled = false;
        fetchVenueSuggestions(venueId)
            .then((res) => { if (!cancelled) setGenres(res.genres || []); })
            .catch((err) => { if (!cancelled) setError(err.status === 404 ? 'Planning tools are not available for venues yet.' : err.message); });
        return () => { cancelled = true; };
    }, [venueId]);

    const run = useCallback(async () => {
        if (!genre) return;
        setLoading(true);
        setError(null);
        try {
            const [f, s] = await Promise.all([
                fetchVenueForecast(venueId, { genre, date: date ? new Date(`${date}T21:00:00`).toISOString() : undefined }),
                fetchVenueSuggestions(venueId, genre),
            ]);
            setForecast(f);
            setSuggestion(s.suggestion);
        } catch (err) {
            setError(err.message || 'Failed to plan');
        } finally {
            setLoading(false);
        }
    }, [venueId, genre, date]);

    return (
        <div className="space-y-6">
            {adminView && !forecastVisible ? (
                <Notice tone="info">Shadow mode. Venue owners do not see forecasts until they have been checked against enough real nights.</Notice>
            ) : null}
            <SectionCard title="Plan a night">
                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                    <select value={genre} onChange={(e) => setGenre(e.target.value)} className={`${inputCls} md:min-w-[220px]`} aria-label="Genre">
                        <option value="">Choose a genre</option>
                        {(genres || []).map((g) => (
                            <option key={g.genre} value={g.genre}>{g.genre} ({formatInteger(g.people)} nearby)</option>
                        ))}
                    </select>
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} aria-label="Date" />
                    <button type="button" disabled={!genre || loading} onClick={run} className="rounded-full bg-white px-5 py-2 text-[13px] font-bold text-black disabled:opacity-40">
                        {loading ? 'Working...' : 'See the numbers'}
                    </button>
                </div>
                {genres && genres.length === 0 ? (
                    <p className="mt-3 text-[13px] text-white/45">Genres appear once enough people nearby have shared their music taste.</p>
                ) : null}
            </SectionCard>

            {error ? <Notice tone="error">{error}</Notice> : null}

            {forecast ? (
                <SectionCard title="Expected attendance">
                    {forecast.forecast ? (
                        <div className="space-y-3">
                            <p className="text-[32px] font-bold text-white tabular-nums">
                                {formatInteger(forecast.forecast.low)} to {formatInteger(forecast.forecast.high)} people
                            </p>
                            <p className="text-[13px] leading-6 text-white/55">
                                {forecast.forecast.calibrated
                                    ? `A range we expect to hold about ${Math.round((forecast.forecast.confidence || 0) * 100)}% of the time, based on how past forecasts compared with real nights.`
                                    : 'A wide range for now: there are not yet enough measured nights to size it more tightly.'}
                            </p>
                            <p className="text-[12px] leading-5 text-white/40">
                                From your last {forecast.forecast.basis.historyEvents} nights
                                {forecast.forecast.basis.genre ? `, how much ${forecast.forecast.basis.genre} is liked nearby compared with your usual nights` : ''}
                                {forecast.forecast.basis.recency < 1 ? ', and the time since your last event' : ''}.
                            </p>
                        </div>
                    ) : (
                        <p className="text-sm leading-6 text-white/55">
                            Not enough history yet. A range appears after three nights at your venue with scanned tickets
                            ({forecast.historyEvents} so far).
                        </p>
                    )}
                </SectionCard>
            ) : null}

            {suggestion ? (
                <SectionCard title={`Who to reach for ${suggestion.genre}`}>
                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                        <Tile label="Nearby fans" value={formatInteger(suggestion.audienceSize)} hint="Like this genre" />
                        <Tile label="Reachable" value={formatInteger(suggestion.reachable)} hint="Agreed to hear about events" />
                        <Tile label="Already your regulars" value={formatInteger(suggestion.regulars)} hint="Came to your venue before" />
                        <Tile label="Friends of regulars" value={formatInteger(suggestion.connectedToRegulars)} hint="Connected on PXI" />
                    </div>
                    {suggestion.composition.withheld ? (
                        <p className="mt-4 text-[13px] text-white/45">{suggestion.composition.reason}</p>
                    ) : (
                        <div className="mt-5 grid gap-6 md:grid-cols-2">
                            <div>
                                <p className="mb-2 text-[11px] font-medium text-white/40">Age</p>
                                <ul className="space-y-1.5">
                                    {suggestion.composition.ageBands.map((b, i) => (
                                        <li key={b.band} className="flex items-center gap-2 text-[13px] text-white/70">
                                            <span className="h-2 w-2 rounded-full" style={{ background: getDashboardChartShade(i) }} />
                                            <span className="flex-1">{b.band}</span>
                                            <span className="tabular-nums text-white/50">{formatInteger(b.count)}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <p className="mb-2 text-[11px] font-medium text-white/40">They also like</p>
                                <div className="flex flex-wrap gap-2">
                                    {suggestion.composition.alsoLikes.length
                                        ? suggestion.composition.alsoLikes.map((g) => (
                                            <span key={g.genre} className="rounded-full bg-white/[0.06] px-3 py-1 text-[12px] text-white/70">{g.genre}</span>
                                        ))
                                        : <span className="text-[13px] text-white/45">Nothing that stands out yet.</span>}
                                </div>
                            </div>
                        </div>
                    )}
                    <p className="mt-5 text-[12px] leading-5 text-white/35">
                        Counts only. PXI never shares who these people are, and only includes people who allow it.
                    </p>
                </SectionCard>
            ) : null}
        </div>
    );
}

// ————— Guarantees (VEN-7) —————

function Guarantees({ venueId }) {
    const [rows, setRows] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;
        fetchVenueGuarantees(venueId)
            .then((res) => { if (!cancelled) setRows(res.guarantees || []); })
            .catch((err) => { if (!cancelled) setError(err.message || 'Failed to load guarantees'); });
        return () => { cancelled = true; };
    }, [venueId]);

    if (error) return <Notice tone="error">{error}</Notice>;
    if (!rows) return <Notice>Loading...</Notice>;
    if (!rows.length) {
        return (
            <SectionCard title="Attendance guarantees">
                <p className="text-sm leading-6 text-white/55">
                    No guarantees on this venue. When PXI offers one, the promise, how it is measured and any settlement show here.
                </p>
            </SectionCard>
        );
    }
    return (
        <SectionCard title="Attendance guarantees">
            <ul className="space-y-2">
                {rows.map((g) => (
                    <li key={g.id} className="rounded-xl bg-white/[0.035] px-4 py-3 text-[13px] text-white/70">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-semibold text-white">{g.event?.name}</span>
                            <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[11px]">{g.status}</span>
                        </div>
                        <p className="mt-1 text-white/55">
                            {formatInteger(g.guaranteedAttendees)} people guaranteed, {formatCents(g.refundPerShortfallCents)} in credits per missing person, up to {formatCents(g.maxPayoutCents)}.
                            {g.measuredAttendees !== null ? ` Counted at the door: ${formatInteger(g.measuredAttendees)}.` : ''}
                            {g.settledPayoutCents !== null ? ` Settled: ${formatCents(g.settledPayoutCents)}.` : ''}
                        </p>
                    </li>
                ))}
            </ul>
        </SectionCard>
    );
}

// ————— Page —————

export default function VenueDashboardPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const requestedId = searchParams.get('venueId');
    const [mine, setMine] = useState(null);
    const [tab, setTab] = useState('overview');
    const [selectedId, setSelectedId] = useState(null);
    const [loadError, setLoadError] = useState(null);
    const [adminVenueName, setAdminVenueName] = useState(null);

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
    const venueId = requestedId || selectedId || venues[0]?.id || null;
    const venue = venues.find((v) => v.id === venueId) || (adminView ? { id: requestedId, name: adminVenueName || 'Venue', cityCode: null } : null);

    useEffect(() => {
        if (mine && !requestedId && venues.length === 0) router.replace('/dashboard');
    }, [mine, requestedId, venues.length, router]);

    // For an admin view the venue is not in /mine; its name comes from the analytics the backend lets them read.
    useEffect(() => {
        if (!adminView) return undefined;
        let cancelled = false;
        fetchVenueAnalytics(requestedId)
            .then((res) => { if (!cancelled) setAdminVenueName(res.analytics?.venue?.name ?? null); })
            .catch((err) => { if (!cancelled) setLoadError(err.status === 403 || err.status === 404 ? 'You do not have access to this venue.' : err.message); });
        return () => { cancelled = true; };
    }, [adminView, requestedId]);

    if (loadError) return <Notice tone="error">{loadError}</Notice>;
    if (!mine || !venue) return <div className="flex min-h-[40vh] items-center justify-center text-sm text-white/60">Loading...</div>;

    const features = mine.features || {};
    const tabs = TABS.filter((t) => {
        if (t.key === 'audience') return features.crm || adminView;
        if (t.key === 'plan') return features.forecast || adminView;
        return true;
    });

    return (
        <div className="max-w-7xl space-y-6">
            <section className="dashboard-surface-b rounded-[1.25rem] px-5 py-7 md:px-8">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                            <span className="text-[11px] font-medium tracking-[0.02em] text-zinc-500">{adminView ? 'Admin view' : 'Your venue'}</span>
                            {venue.cityCode ? <span className="rounded-full bg-sky-500/10 px-2.5 py-1 text-[11px] font-medium text-sky-300">{cityLabel(venue.cityCode)}</span> : null}
                        </div>
                        <h1 className="text-2xl font-semibold tracking-tight text-white md:text-[28px]">{venue.name}</h1>
                        {venue.address ? <p className="mt-2 text-sm text-zinc-400">{venue.address}</p> : null}
                    </div>
                    {venues.length > 1 && !adminView ? (
                        <select value={venueId} onChange={(e) => { setSelectedId(e.target.value); setTab('overview'); }} className={inputCls} aria-label="Venue">
                            {venues.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                        </select>
                    ) : null}
                </div>
                <nav className="mt-6 flex flex-wrap gap-2" aria-label="Venue sections">
                    {tabs.map((t) => (
                        <button
                            key={t.key}
                            type="button"
                            onClick={() => setTab(t.key)}
                            className={`rounded-full px-4 py-1.5 text-[13px] font-semibold ${tab === t.key ? 'bg-white text-black' : 'bg-white/[0.065] text-white/70 hover:bg-white/[0.1]'}`}
                        >
                            {t.label}
                        </button>
                    ))}
                </nav>
            </section>

            {tab === 'overview' && <Overview key={venueId} venueId={venueId} venueName={venue.name} />}
            {tab === 'audience' && <Audience key={venueId} venueId={venueId} crmEnabled={features.crm} adminView={adminView} />}
            {tab === 'plan' && <PlanANight key={venueId} venueId={venueId} adminView={adminView} forecastVisible={features.forecast} />}
            {tab === 'guarantees' && <Guarantees key={venueId} venueId={venueId} />}
        </div>
    );
}
