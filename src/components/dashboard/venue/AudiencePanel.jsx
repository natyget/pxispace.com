'use client';

// VEN-8, "Audience": the people who came to nights in this room (VEN-4), in the design's layout: a count, a
// search, a filter, and saved segments.
//
// The wall is the backend's, not this file's:
//   - Only the approved columns exist in a row: name, handle, photo, nights here, last check-in, ticket kind,
//     engagement tier. No email, phone, city, age or spend.
//   - Filtering by a night or a weekday is a targeting filter: it returns a count and no names, and the list
//     says so.
//   - People who have not agreed to be shown are counted, not listed.
// The home card holds back the list until there are ten people, as designed. The full list is the Audience tab.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { deleteVenueSegment, fetchVenueAudience, fetchVenueSegments, saveVenueSegment } from '@/services/venues';
import {
    AUDIENCE_MIN_PEOPLE,
    AUDIENCE_PRESETS,
    EMPTY_AUDIENCE_FILTERS,
    audienceQuery,
    formatInteger,
    formatNightDate,
    hasListOnlyFilter,
    matchesPreset,
    savableFilters,
} from '@/lib/venueDashboard';
import { CardError, CardSkeleton, EmptyNote, HistoryTag } from './VenueCard';

const COMPACT_ROWS = 6;
const PAGE_SIZE = 50;

const ENGAGEMENT_OPTIONS = [
    { value: '', label: 'Any engagement' },
    { value: 'SEEKER', label: 'Seeker and above' },
    { value: 'VOYAGER', label: 'Voyager and above' },
    { value: 'PATHFINDER', label: 'Pathfinder and above' },
    { value: 'LUMINARY', label: 'Luminary and above' },
    { value: 'ODYSSEY', label: 'Odyssey' },
];

const FREQUENCY_OPTIONS = [
    { value: '', label: 'Any number of nights', filters: { minEvents: '', maxEvents: '' } },
    { value: 'once', label: 'One night', filters: { minEvents: '', maxEvents: 1 } },
    { value: '2', label: '2 or more nights', filters: { minEvents: 2, maxEvents: '' } },
    { value: '3', label: '3 or more nights', filters: { minEvents: 3, maxEvents: '' } },
    { value: '5', label: '5 or more nights', filters: { minEvents: 5, maxEvents: '' } },
];

const WEEKDAY_NAMES = ['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays'];

const pillCls = 'rounded-full bg-white/[0.09] px-4 py-1.5 text-[13px] font-medium text-white ring-1 ring-white/[0.14]';
const fieldCls = 'w-full rounded-lg bg-white/[0.06] px-2.5 py-1.5 text-[12px] text-white outline-none focus:bg-white/[0.1]';

function frequencyValue(filters) {
    if (String(filters.maxEvents) === '1' && !filters.minEvents) return 'once';
    if (filters.minEvents && !filters.maxEvents) return String(filters.minEvents);
    return '';
}

/** A check-in is read in the venue's own time: a door scan at 10 pm there is 10 pm, wherever it is read from. */
function formatDate(iso, timeZone) {
    if (!iso) return 'Never';
    const options = { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' };
    try {
        return new Date(iso).toLocaleString('en-US', timeZone ? { ...options, timeZone } : options);
    } catch {
        return new Date(iso).toLocaleString('en-US', options);
    }
}

function Avatar({ row, size = 'h-8 w-8' }) {
    return row.avatarUrl
        ? <img src={row.avatarUrl} alt="" className={`${size} shrink-0 rounded-full object-cover`} />
        : <span className={`${size} flex shrink-0 items-center justify-center rounded-full bg-white/[0.14] text-[12px] text-white/70`}>{(row.name || row.username || '?').slice(0, 1).toUpperCase()}</span>;
}

export default function AudiencePanel({
    venueId,
    variant = 'full',
    crmEnabled = false,
    adminView = false,
    events = [],
    timeZone = null,
    level = 'NONE',
    onOpenFull = null,
    className = '',
}) {
    const compact = variant === 'compact';
    const pageSize = compact ? COMPACT_ROWS : PAGE_SIZE;
    const [filters, setFilters] = useState(EMPTY_AUDIENCE_FILTERS);
    const [searchText, setSearchText] = useState('');
    const [page, setPage] = useState(1);
    const [result, setResult] = useState(null);
    const [filterOpen, setFilterOpen] = useState(false);
    const [segments, setSegments] = useState([]);
    const [segmentName, setSegmentName] = useState('');
    const [segmentBusy, setSegmentBusy] = useState(false);
    const [segmentError, setSegmentError] = useState(null);

    // A night or weekday filter hides the names, and a name search with it would let a count answer "did this
    // person come that night?". The API ignores the search then; the box is switched off so it does not look live.
    const searchOff = filters.eventId !== '' || filters.weekday !== '';
    const params = useMemo(() => audienceQuery(searchOff ? { ...filters, q: '' } : filters, page, pageSize), [filters, searchOff, page, pageSize]);
    const requestKey = JSON.stringify(params);

    useEffect(() => {
        let cancelled = false;
        fetchVenueAudience(venueId, params)
            .then((res) => { if (!cancelled) setResult({ key: requestKey, data: res, error: null }); })
            .catch((err) => {
                if (cancelled) return;
                setResult({
                    key: requestKey,
                    data: null,
                    error: err.status === 404 && !hasListOnlyFilter(params) ? 'Audience lists are not switched on for venues yet.' : err.message || 'Failed to load the audience',
                });
            });
        return () => { cancelled = true; };
    }, [venueId, params, requestKey]);

    const loadSegments = useCallback(() => {
        fetchVenueSegments(venueId)
            .then((res) => setSegments(res.segments || []))
            .catch(() => setSegments([]));
    }, [venueId]);

    useEffect(() => {
        const t = setTimeout(loadSegments, 0);
        return () => clearTimeout(t);
    }, [loadSegments]);

    // Typing settles for a moment before it becomes a search, so each keystroke is not a request.
    useEffect(() => {
        const t = setTimeout(() => {
            setFilters((f) => (f.q === searchText.trim() ? f : { ...f, q: searchText.trim() }));
            setPage(1);
        }, 300);
        return () => clearTimeout(t);
    }, [searchText]);

    const loading = !result || result.key !== requestKey;
    const data = result?.data || null;
    const error = result?.error || null;
    const filtered = Object.entries(filters).some(([, value]) => value !== '' && value !== null && value !== undefined);
    // The floor is on the whole audience, so it is only judged when no filter is narrowing the count.
    const tooFew = compact && !filtered && data && data.total < AUDIENCE_MIN_PEOPLE;
    const totalPages = Math.max(1, Math.ceil((data?.identifiedTotal ?? 0) / pageSize));
    const savable = savableFilters(filters);
    const activeSegment = !hasListOnlyFilter(filters)
        ? segments.find((s) => (s.filterJson?.ticketTier || '') === filters.ticketTier && (s.filterJson?.minEngagementTier || '') === filters.minEngagementTier && (filters.ticketTier || filters.minEngagementTier)) || null
        : null;

    const apply = (next) => { setFilters({ ...EMPTY_AUDIENCE_FILTERS, q: filters.q, ...next }); setPage(1); };
    const patch = (next) => { setFilters((f) => ({ ...f, ...next })); setPage(1); };
    const clear = () => { setFilters(EMPTY_AUDIENCE_FILTERS); setSearchText(''); setPage(1); };

    const saveSegment = async () => {
        setSegmentBusy(true);
        setSegmentError(null);
        try {
            await saveVenueSegment(venueId, segmentName.trim(), savable);
            setSegmentName('');
            loadSegments();
        } catch (err) {
            setSegmentError(err.message || 'Could not save the segment');
        } finally {
            setSegmentBusy(false);
        }
    };

    const removeSegment = async (segmentId) => {
        setSegmentBusy(true);
        try {
            await deleteVenueSegment(venueId, segmentId);
            loadSegments();
        } catch (err) {
            setSegmentError(err.message || 'Could not delete the segment');
        } finally {
            setSegmentBusy(false);
        }
    };

    const activeLabels = [
        filters.eventId ? `Night: ${events.find((e) => e.eventId === filters.eventId)?.name || 'one night'}` : null,
        filters.weekday !== '' ? WEEKDAY_NAMES[Number(filters.weekday)] : null,
        frequencyValue(filters) ? FREQUENCY_OPTIONS.find((o) => o.value === frequencyValue(filters))?.label : null,
        filters.ticketTier ? (filters.ticketTier === 'PAID' ? 'Paid tickets' : 'Free tickets') : null,
        filters.minEngagementTier ? ENGAGEMENT_OPTIONS.find((o) => o.value === filters.minEngagementTier)?.label : null,
    ].filter(Boolean);

    return (
        <section className={`glass-panel flex min-w-0 flex-col rounded-[1.25rem] p-4 ${className}`.trim()} data-venue-card="audience">
            <h2 className="text-[15px] font-semibold tracking-tight text-white/85">Audience</h2>
            <div className="mt-2 flex min-h-0 flex-1 flex-col rounded-xl p-3 ring-1 ring-white/[0.1]">
                {adminView && !crmEnabled ? (
                    <p className="mb-3 rounded-lg bg-sky-500/10 px-3 py-2 text-[12px] leading-5 text-sky-200">
                        Admin preview. Venue owners do not see this list until venue audiences are switched on.
                    </p>
                ) : null}

                {/* The design's layout: count, search and filter across the top with the list under them, and the
                    saved segments down the right. On a phone the segments sit between the controls and the list. */}
                <div className="grid min-h-0 flex-1 gap-x-5 gap-y-3 md:grid-cols-[minmax(0,1fr)_minmax(150px,190px)] md:grid-rows-[auto_1fr]">
                    <div className="grid gap-3 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)] sm:items-start md:col-start-1 md:row-start-1">
                        <p className="pt-1 text-[14px] font-medium text-white">
                            Attendance Count: <span className="font-bold tabular-nums" data-audience-total>{data ? formatInteger(data.total) : loading ? '' : '0'}</span>
                        </p>

                        <label className="block">
                            <span className="sr-only">Search by name or handle</span>
                            <input
                                type="search"
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                placeholder="Search"
                                disabled={Boolean(tooFew) || searchOff}
                                title={searchOff ? 'Search is off while a night filter is on, because names are hidden.' : undefined}
                                className={`${pillCls} w-full placeholder:text-white/85 focus:placeholder:text-white/35 disabled:opacity-50`}
                            />
                        </label>

                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setFilterOpen((open) => !open)}
                                aria-expanded={filterOpen}
                                disabled={Boolean(tooFew)}
                                className={`${pillCls} w-full text-center disabled:opacity-50`}
                            >
                                Filter{activeLabels.length ? ` (${activeLabels.length})` : ''}
                            </button>
                            {filterOpen ? (
                                <div className="dashboard-popover-surface absolute left-0 right-0 z-20 mt-1.5 min-w-[220px] space-y-2 rounded-xl p-3">
                                    <label className="block text-[11px] text-white/55">
                                        Date/Night
                                        <select value={filters.eventId} onChange={(e) => patch({ eventId: e.target.value, weekday: '' })} className={`${fieldCls} mt-1`}>
                                            <option value="">Any night</option>
                                            {events.map((e) => (
                                                <option key={e.eventId} value={e.eventId}>{formatNightDate(e.startDate, timeZone)}, {e.name}</option>
                                            ))}
                                        </select>
                                    </label>
                                    <label className="block text-[11px] text-white/55">
                                        Attendance Frequency
                                        <select
                                            value={frequencyValue(filters)}
                                            onChange={(e) => patch(FREQUENCY_OPTIONS.find((o) => o.value === e.target.value)?.filters || {})}
                                            className={`${fieldCls} mt-1`}
                                        >
                                            {FREQUENCY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                        </select>
                                    </label>
                                    <label className="block text-[11px] text-white/55">
                                        Ticket
                                        <select value={filters.ticketTier} onChange={(e) => patch({ ticketTier: e.target.value })} className={`${fieldCls} mt-1`}>
                                            <option value="">All tickets</option>
                                            <option value="PAID">Paid tickets</option>
                                            <option value="FREE">Free tickets</option>
                                        </select>
                                    </label>
                                    <label className="block text-[11px] text-white/55">
                                        Engagement
                                        <select value={filters.minEngagementTier} onChange={(e) => patch({ minEngagementTier: e.target.value })} className={`${fieldCls} mt-1`}>
                                            {ENGAGEMENT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                        </select>
                                    </label>
                                    <div className="flex justify-between pt-1">
                                        <button type="button" onClick={clear} className="text-[11px] font-semibold text-white/55 hover:text-white">Clear all</button>
                                        <button type="button" onClick={() => setFilterOpen(false)} className="rounded-full bg-white px-3 py-1 text-[11px] font-bold text-black">Done</button>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </div>

                    <div className="md:col-start-2 md:row-span-2 md:row-start-1">
                        <p className={`${pillCls} text-center`}>Saved Segments</p>
                        <ul className="mt-1.5 flex flex-wrap justify-center gap-1.5">
                            {AUDIENCE_PRESETS.map((preset) => {
                                const active = matchesPreset(filters, preset);
                                return (
                                    <li key={preset.key}>
                                        <button
                                            type="button"
                                            title={preset.hint}
                                            aria-pressed={active}
                                            disabled={Boolean(tooFew)}
                                            onClick={() => apply(active ? {} : preset.filters)}
                                            className={`rounded-full px-3 py-1 text-[12px] font-bold transition disabled:opacity-50 ${active ? 'bg-pxi-purple text-white' : 'bg-white/85 text-black hover:bg-white'}`}
                                        >
                                            {preset.label}
                                        </button>
                                    </li>
                                );
                            })}
                            {segments.map((s) => {
                                const active = activeSegment?.id === s.id;
                                return (
                                    <li key={s.id} className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-bold ${active ? 'bg-pxi-purple text-white' : 'bg-white/85 text-black'}`}>
                                        <button
                                            type="button"
                                            aria-pressed={active}
                                            title={`${formatInteger(s.size?.total)} people`}
                                            onClick={() => apply(active ? {} : { ticketTier: s.filterJson?.ticketTier || '', minEngagementTier: s.filterJson?.minEngagementTier || '' })}
                                        >
                                            {s.name}
                                        </button>
                                        {!compact ? (
                                            <button type="button" disabled={segmentBusy} onClick={() => removeSegment(s.id)} aria-label={`Delete ${s.name}`} className="opacity-60 hover:opacity-100">
                                                ×
                                            </button>
                                        ) : null}
                                    </li>
                                );
                            })}
                        </ul>
                    </div>

                    <div className="flex min-w-0 flex-col md:col-start-1 md:row-start-2">
                        {!compact && (savable.ticketTier || savable.minEngagementTier) ? (
                            <div className="flex flex-col gap-2 md:flex-row md:items-center">
                                <input
                                    value={segmentName}
                                    onChange={(e) => setSegmentName(e.target.value)}
                                    placeholder="Name these filters to save them as a segment"
                                    className="rounded-full bg-white/[0.055] px-4 py-2 text-[13px] text-white placeholder:text-white/35 outline-none focus:bg-white/[0.075] md:flex-1"
                                />
                                <button
                                    type="button"
                                    disabled={segmentBusy || !segmentName.trim() || Boolean(activeSegment) || hasListOnlyFilter(filters)}
                                    onClick={saveSegment}
                                    className="rounded-full bg-white px-5 py-2 text-[13px] font-bold text-black disabled:opacity-40"
                                >
                                    Save segment
                                </button>
                            </div>
                        ) : null}
                        {!compact && activeSegment ? <p className="mt-2 text-[12px] text-white/40">These filters are already saved as {activeSegment.name}.</p> : null}
                        {!compact && (savable.ticketTier || savable.minEngagementTier) && hasListOnlyFilter(filters) ? (
                            <p className="mt-2 text-[12px] text-white/40">A saved segment keeps the ticket and engagement filters only. Clear the others to save it.</p>
                        ) : null}
                        {segmentError ? <p className="mt-2 text-[12px] text-red-300">{segmentError}</p> : null}

                        {activeLabels.length ? (
                            <p className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px] text-white/55">
                                {activeLabels.map((label) => <span key={label} className="rounded-full bg-white/[0.07] px-2.5 py-1">{label}</span>)}
                                <button type="button" onClick={clear} className="font-semibold text-white/70 underline-offset-2 hover:underline">Clear</button>
                            </p>
                        ) : null}

                        <div className="mt-1 flex min-h-[120px] flex-1 flex-col">
                            {error ? <CardError>{error}</CardError> : loading && !data ? <CardSkeleton className="h-28" /> : tooFew ? (
                                <>
                                    <EmptyNote detail={`Audience insights appear once there are at least ${AUDIENCE_MIN_PEOPLE} people.`}>
                                        Not enough people to show audience details.
                                    </EmptyNote>
                                    {onOpenFull && data.total > 0 ? (
                                        <button type="button" onClick={onOpenFull} className="mx-auto mb-1 w-fit text-[11px] font-semibold text-white/60 underline-offset-2 hover:text-white hover:underline">
                                            Open the audience list
                                        </button>
                                    ) : null}
                                </>
                            ) : data.namesHidden ? (
                                <div data-audience-hidden>
                                    <p className="text-[13px] font-medium text-white">{formatInteger(data.total)} {data.total === 1 ? 'person matches' : 'people match'} this audience</p>
                                    <p className="mt-0.5 text-[12px] text-white/60">Names are hidden while targeting filters are active.</p>
                                </div>
                            ) : data.total === 0 ? (
                                <EmptyNote detail={filtered ? 'Nobody matches these filters.' : 'People appear here after they hold a ticket to a night at your venue.'}>
                                    {filtered ? 'No one matches' : 'No Attendance History'}
                                </EmptyNote>
                            ) : (
                                <>
                                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                                        <p className="text-[12px] text-white/50">
                                            {data.hiddenCount ? `${formatInteger(data.hiddenCount)} ${data.hiddenCount === 1 ? 'is' : 'are'} counted but not listed, because they have not agreed to be shown to venues.` : ''}
                                        </p>
                                        {level === 'LIMITED' ? <HistoryTag /> : null}
                                    </div>
                                    {compact ? (
                                        <ul className="grid gap-x-6 gap-y-2 sm:grid-cols-2" data-audience-rows>
                                            {data.rows.map((row) => (
                                                <li key={row.id} className="flex min-w-0 items-center gap-3">
                                                    <Avatar row={row} />
                                                    <span className="min-w-0 truncate text-[13px] text-white">
                                                        {row.username ? `@${row.username}` : row.name || 'PXI member'}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full min-w-[640px] text-left text-[13px]" data-audience-rows>
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
                                                                    <Avatar row={row} />
                                                                    <span className="min-w-0">
                                                                        <span className="block truncate font-semibold text-white">{row.name || row.username || 'PXI member'}</span>
                                                                        {row.username ? <span className="block truncate text-[12px] text-white/45">@{row.username}</span> : null}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="px-3 py-2.5 tabular-nums text-white/70">{formatInteger(row.eventsAttended)}</td>
                                                            <td className="px-3 py-2.5 text-white/60">{formatDate(row.lastCheckInAt, timeZone)}</td>
                                                            <td className="px-3 py-2.5 text-white/70">{row.ticketTier === 'PAID' ? 'Paid' : 'Free'}</td>
                                                            <td className="px-3 py-2.5 text-white/70">{row.engagementTier?.label}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                    {compact && onOpenFull && data.identifiedTotal > data.rows.length ? (
                                        <button type="button" onClick={onOpenFull} className="mt-3 w-fit text-[12px] font-semibold text-white/60 underline-offset-2 hover:text-white hover:underline">
                                            See all {formatInteger(data.identifiedTotal)}
                                        </button>
                                    ) : null}
                                    {!compact && totalPages > 1 ? (
                                        <div className="mt-4 flex items-center justify-end gap-2 text-[12px] text-white/60">
                                            <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-full bg-white/[0.065] px-3 py-1.5 disabled:opacity-40">Previous</button>
                                            <span>Page {page} of {totalPages}</span>
                                            <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-full bg-white/[0.065] px-3 py-1.5 disabled:opacity-40">Next</button>
                                        </div>
                                    ) : null}
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {!compact ? (
                    <p className="mt-4 text-[12px] leading-5 text-white/35">
                        Contact details are never shown. Reaching these people goes through PXI. Segments are private to you and this venue.
                    </p>
                ) : null}
            </div>
        </section>
    );
}
