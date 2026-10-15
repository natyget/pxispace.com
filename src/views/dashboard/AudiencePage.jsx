'use client';

// Audience: the CRM and the list builder in one place. Pick who (filters or a saved list), see how many, then
// "Message them" goes to Campaigns with the audience already chosen. Privacy rules are the API's and are kept:
// names only for people who allow it, a count and no names for targeting filters, no emails or phone numbers.

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, DataTable, EmptyState, Field, Notice, PageHeader, Panel, PersonLine, Skeleton, StateText } from '@/components/dashboard/ui/kit';
import { api } from '@/services/api';
import { eventsService } from '@/services/events';
import { deleteAudienceSegment, fetchAudienceAttendees, listAudienceSegments, saveAudienceSegment } from '@/services/audienceSegments';
import { count, shortDate } from '@/lib/dashFormat';
import { errorText, useRequest } from '@/views/dashboard/audience/useRequest';
import FilterSelect from '@/views/dashboard/audience/FilterSelect';
import {
    ENGAGEMENT_OPTIONS,
    FILTER_DEFAULTS,
    REACH_OPTIONS,
    TAKE,
    TICKET_OPTIONS,
    cityOptions,
    composeHref,
    filtersMatchSegment,
    hasActiveFilters,
    nightOptions,
    normalizeFilters,
    peopleWord,
    reachFields,
    reachValue,
} from '@/views/dashboard/audience/audienceFilters';

function PersonCell({ row }) {
    const person = { ...row, name: row.name || (row.username ? null : 'Unnamed') };
    const meta = [
        `${count(row.eventsAttended)} ${Number(row.eventsAttended) === 1 ? 'night' : 'nights'}`,
        row.lastCheckInAt ? `last came ${shortDate(row.lastCheckInAt)}` : null,
        row.ticketTier === 'PAID' ? 'paid' : 'free',
        row.engagementTier?.label || 'Wanderer',
    ]
        .filter(Boolean)
        .join(', ');
    return (
        <div className="min-w-0">
            <PersonLine person={person} />
            <p className="mt-2 truncate text-[12px] text-white/45 md:hidden">{meta}</p>
        </div>
    );
}

const COLUMNS = [
    { key: 'person', label: 'Person', width: 'minmax(0,2fr)', render: (row) => <PersonCell row={row} /> },
    {
        key: 'nights',
        label: 'Nights',
        width: '72px',
        hideOnMobile: true,
        render: (row) => <span className="text-[14px] tabular-nums text-white">{count(row.eventsAttended)}</span>,
    },
    {
        key: 'last',
        label: 'Last came',
        width: '112px',
        hideOnMobile: true,
        render: (row) => <span className="text-[14px] text-white/70">{row.lastCheckInAt ? shortDate(row.lastCheckInAt) : '-'}</span>,
    },
    {
        key: 'ticket',
        label: 'Ticket',
        width: '84px',
        hideOnMobile: true,
        render: (row) => <StateText tone={row.ticketTier === 'PAID' ? 'good' : 'muted'}>{row.ticketTier === 'PAID' ? 'Paid' : 'Free'}</StateText>,
    },
    {
        key: 'engagement',
        label: 'Engagement',
        width: '140px',
        hideOnMobile: true,
        render: (row) => <span className="text-[13px] text-white/70">{row.engagementTier?.label || 'Wanderer'}</span>,
    },
];

/** The one count line under the filters, plain words. */
function CountLine({ night, nightName, nightCount, list, loading }) {
    const strong = 'font-semibold text-white';
    if (night) {
        if (nightCount === null) return <p className="text-[14px] text-white/60">Names are not listed for one night.</p>;
        return (
            <p className="text-[14px] text-white/60">
                <span className={strong}>
                    {count(nightCount)} {peopleWord(nightCount)}
                </span>{' '}
                {nightCount === 1 ? 'has' : 'have'} a ticket to {nightName}. Names are not listed for one night.
            </p>
        );
    }
    if (!list) return <p className="text-[14px] text-white/50">{loading ? 'Counting people...' : ' '}</p>;
    const total = list.total || 0;
    const shown = list.identifiedTotal ?? total;
    if (total === 0) return <p className="text-[14px] text-white/60">No one matches these filters.</p>;
    const lead = (
        <span className={strong}>
            {count(total)} {peopleWord(total)}
        </span>
    );
    if (list.namesHidden) {
        return (
            <p className="text-[14px] text-white/60">
                {lead} {total === 1 ? 'matches' : 'match'}. Names are not listed when you narrow by reach or city.
            </p>
        );
    }
    if (shown === 0) {
        return (
            <p className="text-[14px] text-white/60">
                {lead} {total === 1 ? 'matches' : 'match'}. They keep their names private.
            </p>
        );
    }
    if (shown >= total) {
        return (
            <p className="text-[14px] text-white/60">
                {lead} {total === 1 ? 'matches' : 'match'}. {total === 1 ? 'They show' : 'All show'} their name.
            </p>
        );
    }
    return (
        <p className="text-[14px] text-white/60">
            {lead} {total === 1 ? 'matches' : 'match'}. {count(shown)} {shown === 1 ? 'shows' : 'show'} their name; the rest keep it private.
        </p>
    );
}

/** The bar at the bottom of the panel: how many, and what to do with them. Sticks to the bottom of the screen while the list is long. */
function ActionBar({ summary, sticky, canSave, naming, nameDraft, onNameChange, busy, saved, canMessage, onSave, onMessage, onSubmitName, onCancelName }) {
    return (
        <div
            className={`${sticky ? 'sticky bottom-0 z-10 ' : ''}-mx-5 -mb-5 mt-5 rounded-b-3xl border-t border-white/[0.08] bg-pxi-surface px-5 pb-5 pt-4 md:-mx-6 md:-mb-6 md:px-6 md:pb-6`}
        >
            {naming ? (
                <form onSubmit={onSubmitName} className="flex flex-col gap-3 md:flex-row md:items-center">
                    <Field
                        aria-label="Name for this list"
                        value={nameDraft}
                        onChange={(e) => onNameChange(e.target.value)}
                        onFocus={(e) => e.target.select()}
                        onKeyDown={(e) => {
                            if (e.key === 'Escape') onCancelName();
                        }}
                        maxLength={200}
                        autoFocus
                        className="min-w-0 flex-1"
                    />
                    <div className="flex items-center gap-2">
                        <Button type="submit" variant="primary" disabled={busy || !nameDraft.trim()} className="flex-1 md:flex-none">
                            {busy ? 'Saving...' : naming === 'message' ? 'Save and message' : 'Save list'}
                        </Button>
                        <Button variant="quiet" onClick={onCancelName} disabled={busy}>
                            Cancel
                        </Button>
                    </div>
                </form>
            ) : (
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
                    <p className="min-w-0 truncate text-[15px] font-semibold text-white">
                        {summary}
                        {saved ? <span className="ml-3 text-[13px] font-semibold text-emerald-300">Saved</span> : null}
                    </p>
                    <div className="ml-auto flex items-center gap-2">
                        {canSave ? (
                            <Button variant="secondary" onClick={onSave}>
                                Save as list
                            </Button>
                        ) : null}
                        <Button variant="primary" onClick={onMessage} disabled={!canMessage}>
                            Message them
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function AudiencePage() {
    const router = useRouter();
    const overviewReq = useRequest('overview', () => api.get('/api/analytics/audience'));
    const eventsReq = useRequest('events', () => eventsService.getMyEvents({ limit: 100, offset: 0 }));
    const segmentsReq = useRequest('segments', () => listAudienceSegments());

    const [filters, setFilters] = useState(FILTER_DEFAULTS);
    const [night, setNight] = useState('');
    const [page, setPage] = useState(1);
    const [naming, setNaming] = useState(null); // null | 'save' | 'message'
    const [nameDraft, setNameDraft] = useState('');
    const [busy, setBusy] = useState(false);
    const [actionError, setActionError] = useState('');
    const [saved, setSaved] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);

    const listKey = night ? null : JSON.stringify([normalizeFilters(filters), page]);
    const listReq = useRequest(listKey, () => fetchAudienceAttendees(filters, { skip: (page - 1) * TAKE, take: TAKE }));

    const overview = overviewReq.data;
    const events = useMemo(() => (Array.isArray(eventsReq.data?.events) ? eventsReq.data.events : []), [eventsReq.data]);
    const segments = useMemo(() => (Array.isArray(segmentsReq.data?.segments) ? segmentsReq.data.segments : []), [segmentsReq.data]);
    const list = listReq.data;
    const filtersOn = hasActiveFilters(filters);

    const activeSegment = useMemo(
        () => (night || !filtersOn ? null : segments.find((s) => filtersMatchSegment(filters, s.filterJson)) || null),
        [night, filtersOn, segments, filters]
    );
    const nightEvent = night ? events.find((e) => e.id === night) || null : null;
    const nightCount = nightEvent && Number.isFinite(Number(nightEvent.attendeeCount)) ? Number(nightEvent.attendeeCount) : null;
    const total = night ? nightCount ?? 0 : list?.total || 0;
    const summary = night
        ? nightCount === null
            ? nightEvent?.name || 'This night'
            : `${count(total)} ${peopleWord(total)}`
        : !list
          ? listReq.error
              ? ''
              : 'Counting people...'
          : `${count(total)} ${peopleWord(total)}`;

    const rows = useMemo(() => (night ? [] : list?.rows || []), [night, list]);
    const identifiedTotal = list?.identifiedTotal ?? list?.total ?? 0;
    const totalPages = Math.max(1, Math.ceil(identifiedTotal / TAKE));

    const kpis = [
        { label: 'People', value: overview ? count(overview.totalAttendees) : '-' },
        { label: 'Reach by email', value: overview ? count(overview.marketing?.emailOptIn) : '-' },
        { label: 'Reach by text', value: overview ? count(overview.marketing?.smsOptIn) : '-' },
        {
            label: 'Come back',
            value: overview ? `${Math.round((overview.repeat?.repeatRate || 0) * 100)}%` : '-',
            hint: 'More than one night',
        },
    ];

    function settle() {
        setNaming(null);
        setSaved(false);
        setActionError('');
        setConfirmDelete(false);
    }

    function changeFilter(patch) {
        // Account tier and passport points are not in the row; only a list saved earlier carries them. Changing a
        // filter by hand starts a new set, so nothing is applied that the row does not show.
        setFilters((current) => ({ ...current, accountTier: '', minOdysseyXp: '', ...patch }));
        setPage(1);
        settle();
    }

    function pickNight(id) {
        setNight(id);
        setFilters(FILTER_DEFAULTS);
        setPage(1);
        settle();
    }

    function pickList(id) {
        const segment = segments.find((s) => s.id === id);
        setNight('');
        setFilters(segment ? { ...FILTER_DEFAULTS, ...(segment.filterJson || {}) } : FILTER_DEFAULTS);
        setPage(1);
        settle();
    }

    function clearAll() {
        setNight('');
        setFilters(FILTER_DEFAULTS);
        setPage(1);
        settle();
    }

    function go(target) {
        router.push(composeHref(target));
    }

    function startNaming(mode) {
        setActionError('');
        setSaved(false);
        setNameDraft(`List from ${shortDate(new Date())}`);
        setNaming(mode);
    }

    function messageThem() {
        if (night) return go({ audience: 'ATTENDEES', eventId: night });
        if (activeSegment) return go({ audience: 'SEGMENT', segmentId: activeSegment.id });
        if (!filtersOn) return go({ audience: 'ALL_PAST' });
        return startNaming('message');
    }

    async function submitName(event) {
        event.preventDefault();
        const name = nameDraft.trim();
        if (!name) return;
        setBusy(true);
        setActionError('');
        try {
            const res = await saveAudienceSegment({ name, filterJson: normalizeFilters(filters) });
            const id = res?.segment?.id;
            if (naming === 'message' && id) {
                go({ audience: 'SEGMENT', segmentId: id });
                return;
            }
            setNaming(null);
            setSaved(true);
            segmentsReq.reload();
        } catch (error) {
            setActionError(errorText(error, 'Could not save the list.'));
        } finally {
            setBusy(false);
        }
    }

    async function deleteList() {
        if (!activeSegment) return;
        setBusy(true);
        setActionError('');
        try {
            await deleteAudienceSegment(activeSegment.id);
            segmentsReq.reload();
            clearAll();
        } catch (error) {
            setActionError(errorText(error, 'Could not delete the list.'));
        } finally {
            setBusy(false);
        }
    }

    const noAudience = overview && overview.totalAttendees === 0;
    const listLoading = !night && listReq.loading;
    const cities = overview?.topCities || [];
    const listOptions = [
        { value: '', label: segments.length ? 'Saved lists' : 'No saved lists' },
        ...segments.map((s) => ({ value: s.id, label: s.name })),
    ];
    const reach = reachValue(filters);
    const reachOptions = reach === 'both' ? [...REACH_OPTIONS, { value: 'both', label: 'Reach by email and text' }] : REACH_OPTIONS;
    const canSave = filtersOn && !activeSegment && !night;
    const canMessage = night ? Boolean(nightEvent) : total > 0 && !(listLoading && !list);
    const clearButton =
        filtersOn || night ? (
            <Button variant="quiet" size="sm" onClick={clearAll} className="!px-0 md:!px-3.5">
                Clear
            </Button>
        ) : null;

    return (
        <div className="space-y-5 md:space-y-6">
            <PageHeader title="Audience" subtitle="Emails and phone numbers are never shown." kpis={kpis} />

            {overviewReq.error ? <Notice tone="error">{overviewReq.error}</Notice> : null}

            <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
                <Panel title="People">
                    {noAudience ? (
                        <EmptyState
                            title="No one yet."
                            line="People show up here after they get a ticket to one of your nights."
                            action={
                                <Button variant="primary" onClick={() => router.push('/dashboard/events/new')}>
                                    Create event
                                </Button>
                            }
                        />
                    ) : (
                        <>
                            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                                <FilterSelect
                                    ariaLabel="Saved lists"
                                    value={activeSegment?.id || ''}
                                    onChange={(e) => pickList(e.target.value)}
                                    options={listOptions}
                                    disabled={!segments.length}
                                />
                                <FilterSelect ariaLabel="Night" value={night} onChange={(e) => pickNight(e.target.value)} options={nightOptions(events)} />
                                <FilterSelect
                                    ariaLabel="Ticket"
                                    value={filters.ticketTier}
                                    onChange={(e) => changeFilter({ ticketTier: e.target.value })}
                                    options={TICKET_OPTIONS}
                                    disabled={Boolean(night)}
                                />
                                <FilterSelect
                                    ariaLabel="Engagement"
                                    value={filters.minEngagementTier}
                                    onChange={(e) => changeFilter({ minEngagementTier: e.target.value })}
                                    options={ENGAGEMENT_OPTIONS}
                                    disabled={Boolean(night)}
                                />
                                <FilterSelect
                                    ariaLabel="Reach"
                                    value={reach}
                                    onChange={(e) => changeFilter(reachFields(e.target.value))}
                                    options={reachOptions}
                                    disabled={Boolean(night)}
                                />
                                <FilterSelect
                                    ariaLabel="City"
                                    value={filters.city}
                                    onChange={(e) => changeFilter({ city: e.target.value })}
                                    options={cityOptions(cities, filters.city)}
                                    disabled={Boolean(night)}
                                />
                            </div>

                            <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                                <div className={`min-w-0 transition-opacity ${listLoading && list ? 'opacity-60' : ''}`}>
                                    <CountLine night={night} nightName={nightEvent?.name || 'this night'} nightCount={nightCount} list={list} loading={listLoading} />
                                </div>
                                <div className="flex items-center gap-1">
                                    {activeSegment ? (
                                        confirmDelete ? (
                                            <>
                                                <span className="text-[12px] text-white/50">Delete this list?</span>
                                                <Button variant="danger" size="sm" onClick={deleteList} disabled={busy}>
                                                    Delete
                                                </Button>
                                                <Button variant="quiet" size="sm" onClick={() => setConfirmDelete(false)}>
                                                    Keep
                                                </Button>
                                            </>
                                        ) : (
                                            <Button variant="quiet" size="sm" onClick={() => setConfirmDelete(true)} className="!px-0 md:!px-3.5">
                                                Delete list
                                            </Button>
                                        )
                                    ) : null}
                                    {clearButton}
                                </div>
                            </div>

                            {listReq.error && !night ? (
                                <Notice tone="error" className="mt-4">
                                    {listReq.error}
                                </Notice>
                            ) : null}

                            {!night && !list?.namesHidden && (rows.length > 0 || listLoading || listReq.error || (list && list.total === 0)) ? (
                                <div className={`mt-4 transition-opacity ${listLoading && list ? 'opacity-60' : ''}`}>
                                    <DataTable
                                        columns={COLUMNS}
                                        rows={rows}
                                        loading={listLoading && !list}
                                        empty={
                                            list && list.total === 0 && !listReq.error ? (
                                                <EmptyState
                                                    title="No one matches."
                                                    line="Try fewer filters."
                                                    action={filtersOn ? <Button variant="primary" onClick={clearAll}>Clear filters</Button> : null}
                                                />
                                            ) : null
                                        }
                                    />
                                </div>
                            ) : null}

                            {!night && !list?.namesHidden && totalPages > 1 ? (
                                <div className="mt-4 flex items-center justify-between gap-3">
                                    <p className="text-[12px] text-white/45">
                                        Page {page} of {totalPages}
                                    </p>
                                    <div className="flex gap-2">
                                        <Button variant="secondary" size="sm" disabled={listLoading || page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                                            Previous
                                        </Button>
                                        <Button variant="secondary" size="sm" disabled={listLoading || page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                                            Next
                                        </Button>
                                    </div>
                                </div>
                            ) : null}

                            {actionError ? (
                                <Notice tone="error" className="mt-4">
                                    {actionError}
                                </Notice>
                            ) : null}

                            <ActionBar
                                summary={summary}
                                sticky={rows.length > 8}
                                canSave={canSave}
                                naming={naming}
                                nameDraft={nameDraft}
                                onNameChange={setNameDraft}
                                busy={busy}
                                saved={saved}
                                canMessage={canMessage}
                                onSave={() => startNaming('save')}
                                onMessage={messageThem}
                                onSubmitName={submitName}
                                onCancelName={() => setNaming(null)}
                            />
                        </>
                    )}
                </Panel>

                <Panel title="Where they are from">
                    {!overview && !overviewReq.error ? (
                        <Skeleton className="h-40" />
                    ) : cities.length ? (
                        <ul className="divide-y divide-white/[0.08]">
                            {cities.map((c) => (
                                <li key={c.city} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                                    <span className="min-w-0 truncate text-[14px] text-white">{String(c.city).startsWith('other') ? 'Other cities' : c.city}</span>
                                    <span className="shrink-0 text-[14px] font-semibold tabular-nums text-white">{count(c.count)}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-[13px] text-white/50">
                            {overview?.demographicsWithheld && overview.totalAttendees > 0 ? 'Cities show once 10 or more people have come.' : 'No cities yet.'}
                        </p>
                    )}
                </Panel>
            </div>
        </div>
    );
}
