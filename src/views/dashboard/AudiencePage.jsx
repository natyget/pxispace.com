'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import SectionCard from '@/components/dashboard/SectionCard';
import { RechartsChart, SparkDonutChart } from '@/components/dashboard/ChartFrame';
import { DASHBOARD_BRAND_COLOR, DASHBOARD_TOOLTIP_PROPS, getDashboardChartShade } from '@/components/dashboard/chartStyles';
import FunnelChart from '@/components/dashboard/FunnelChart';
import {
    deleteAudienceSegment,
    fetchAudienceAttendees,
    listAudienceSegments,
    saveAudienceSegment,
} from '@/services/audienceSegments';
import { api } from '@/services/api';
import { accessTierLabel, accessTierOf } from '@/lib/accountTier';

/** Real attendee demographics from GET /api/analytics/audience (not sample data). */
function RealAudienceOverview() {
    const [data, setData] = useState(null);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        let cancelled = false;
        api.get('/api/analytics/audience')
            .then((res) => { if (!cancelled) setData(res); })
            .catch(() => { if (!cancelled) setFailed(true); });
        return () => { cancelled = true; };
    }, []);

    const retentionStages = useMemo(() => {
        if (!data) return [];
        const total = Number(data.totalAttendees) || 0;
        const passport = Math.min(total, Number(data.tiers?.citizen) || 0);
        const repeatGuests = Math.min(passport, Math.round((Number(data.repeat?.repeatRate) || 0) * total));
        return [
            { stage: 'All attendees', value: total },
            { stage: 'Passport holders', value: passport },
            { stage: 'Repeat guests', value: repeatGuests },
        ];
    }, [data]);

    // Plain-language read of the numbers — the "so what" before the charts.
    const story = useMemo(() => {
        if (!data || !data.totalAttendees) return [];
        const items = [];
        const topBracket = [...(data.ageBrackets || [])].sort((a, b) => b.count - a.count)[0];
        if (topBracket?.count > 0) items.push(`Your crowd skews ${topBracket.label}.`);
        const topCity = data.topCities?.[0];
        if (topCity) items.push(`${topCity.city} is your strongest city (${topCity.count} attendees).`);
        const emailPct = Math.round(((data.marketing?.emailOptIn || 0) / data.totalAttendees) * 100);
        items.push(`${(data.marketing?.emailOptIn || 0).toLocaleString('en-US')} people (${emailPct}%) opted into email — reachable right now from Campaigns.`);
        const repeatPct = Math.round((data.repeat?.repeatRate || 0) * 100);
        items.push(`${repeatPct}% come back for another event${repeatPct >= 20 ? ' — strong loyalty.' : ' — a win-back send usually lifts this.'}`);
        return items;
    }, [data]);

    if (failed || (data && data.totalAttendees === 0)) return null;

    return (
        <SectionCard title="Your real audience" dense>
            {!data ? (
                <p className="px-2 py-3 text-sm text-zinc-500">Loading live demographics...</p>
            ) : (
                <div className="space-y-4">
                    {story.length ? (
                        <div className="rounded-2xl bg-white/[0.035] px-4 py-3.5">
                            <p className="text-[11px] font-medium tracking-[0.02em] text-zinc-500">What this means</p>
                            <ul className="mt-2 space-y-1.5">
                                {story.map((line) => (
                                    <li key={line} className="flex items-start gap-2 text-sm leading-6 text-zinc-300">
                                        <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#d84aff]/70" aria-hidden="true" />
                                        {line}
                                    </li>
                                ))}
                            </ul>
                            <p className="mt-2 text-xs leading-5 text-zinc-600">
                                Includes attendees from events you host or co-host — co-hosting grows the network you can see.
                            </p>
                        </div>
                    ) : null}
                    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-white/[0.06] ring-1 ring-white/[0.07] sm:grid-cols-4">
                        {[
                            { label: 'Attendees', value: data.totalAttendees },
                            { label: 'Passport holders', value: data.tiers.citizen },
                            { label: 'Email reachable', value: data.marketing.emailOptIn },
                            { label: 'Repeat guests', value: `${Math.round((data.repeat.repeatRate || 0) * 100)}%` },
                        ].map((t) => (
                            <div key={t.label} className="bg-[#0e0e13] px-4 py-3.5">
                                <p className="text-[12px] font-medium text-zinc-500">{t.label}</p>
                                <p className="mt-1.5 text-[22px] font-semibold leading-none tracking-tight tabular-nums text-white">{t.value}</p>
                            </div>
                        ))}
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        {data.topCities.length > 0 && (
                            <div className="glow-surface-soft rounded-xl px-4 py-3">
                                <p className="mb-3 text-[11px] font-medium tracking-[0.02em] text-zinc-500">Top cities</p>
                                <div className="flex items-center gap-4">
                                    <SparkDonutChart
                                        points={data.topCities.slice(0, 5).map((c) => c.count)}
                                        labels={data.topCities.slice(0, 5).map((c) => c.city)}
                                        size={104}
                                        name="Attendees"
                                        className="shrink-0"
                                    />
                                    <div className="min-w-0 flex-1 space-y-1.5">
                                        {data.topCities.slice(0, 5).map((c, index) => (
                                            <div key={c.city} className="flex items-center justify-between gap-2 py-0.5 text-sm">
                                                <span className="flex min-w-0 items-center gap-2">
                                                    <span
                                                        className="h-2 w-2 shrink-0 rounded-full"
                                                        style={{ backgroundColor: index === 0 ? DASHBOARD_BRAND_COLOR : getDashboardChartShade(index) }}
                                                    />
                                                    <span className="truncate text-zinc-300">{c.city}</span>
                                                </span>
                                                <span className="shrink-0 font-bold tabular-nums text-white">{c.count}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                        {data.ageBrackets.some((b) => b.count > 0) && (
                            <div className="glow-surface-soft rounded-xl px-4 py-3">
                                <p className="mb-2 text-[11px] font-medium tracking-[0.02em] text-zinc-500">Age brackets (opted-in ages)</p>
                                <div className="h-[200px]">
                                    <RechartsChart className="h-[200px]">
                                        {({ ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip }) => (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={data.ageBrackets} margin={{ top: 8, right: 8, left: -18, bottom: 0 }} barCategoryGap="28%">
                                                    <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                                                    <XAxis
                                                        dataKey="label"
                                                        tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
                                                        axisLine={false}
                                                        tickLine={false}
                                                    />
                                                    <YAxis
                                                        allowDecimals={false}
                                                        tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                                                        axisLine={false}
                                                        tickLine={false}
                                                        width={28}
                                                    />
                                                    <Tooltip
                                                        {...DASHBOARD_TOOLTIP_PROPS}
                                                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                                        formatter={(value) => [Number(value).toLocaleString('en-US'), 'Attendees']}
                                                    />
                                                    <Bar dataKey="count" name="Attendees" fill={DASHBOARD_BRAND_COLOR} radius={[4, 4, 0, 0]} isAnimationActive={false} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        )}
                                    </RechartsChart>
                                </div>
                            </div>
                        )}
                    </div>
                    {retentionStages.some((stage) => stage.value > 0) ? (
                        <div className="glow-surface-soft rounded-xl px-4 py-4">
                            <p className="mb-1 text-[11px] font-medium tracking-[0.02em] text-zinc-500">Retention funnel</p>
                            <p className="mb-3 text-xs leading-5 text-zinc-500">
                                Three real signals read top to bottom — reachable audience size, Passport depth, then repeat rate.
                            </p>
                            <FunnelChart data={retentionStages} />
                        </div>
                    ) : null}
                </div>
            )}
        </SectionCard>
    );
}

const TAKE = 50;

const FILTER_DEFAULTS = {
    emailOptIn: null, // null | true | false
    smsOptIn: null,
    city: '',
    accountTier: '',
    minOdysseyXp: '',
};

const TRI_STATE_OPTIONS = [
    { value: '', label: 'Any' },
    { value: 'true', label: 'Yes' },
    { value: 'false', label: 'No' },
];

// The KYC ladder, not the passport LEVEL (Wanderer→Odyssey) — that's the
// separate `minOdysseyXp` filter below. Diplomat resolves server-side to
// isVendor, since it's a derived rung rather than a stored tier value.
const ACCOUNT_TIER_OPTIONS = [
    { value: '', label: 'Any tier' },
    { value: 'PARTIAL', label: 'Partial — web only' },
    { value: 'CITIZEN', label: 'Citizen — has passport' },
    { value: 'DIPLOMAT', label: 'Diplomat — verified seller' },
];

const AUDIENCE_SECTION_CLASS =
    'dashboard-surface-b !border-0 shadow-[0_22px_80px_rgba(0,0,0,0.28)] [&>header]:!border-0 [&>header]:pb-3';
const AUDIENCE_SECTION_BODY_CLASS = 'pt-4';
const AUDIENCE_INPUT_CLASS =
    'dashboard-input min-h-12 w-full rounded-2xl px-4 py-3 text-sm font-semibold text-white placeholder:text-zinc-500';
const AUDIENCE_SELECT_CLASS = `${AUDIENCE_INPUT_CLASS} appearance-none pr-10`;
const AUDIENCE_SCROLLBAR_CLASS =
    '[scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.18)_transparent] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/15 [&::-webkit-scrollbar-thumb:hover]:bg-white/25';

function formatLastAttended(value) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** Deep-equal on the FILTER_DEFAULTS shape only — ignores unknown keys a segment might carry. */
function filtersMatchSegment(filters, filterJson) {
    const applied = { ...FILTER_DEFAULTS, ...(filterJson || {}) };
    return Object.keys(FILTER_DEFAULTS).every((key) => filters[key] === applied[key]);
}

function parseTriState(value) {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return null;
}

function triStateValue(value) {
    if (value === true) return 'true';
    if (value === false) return 'false';
    return '';
}

function OptBadge({ label, active }) {
    return (
        <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-medium tracking-[0.02em] ${
                active ? 'bg-emerald-500/15 text-emerald-300' : 'bg-white/5 text-zinc-500'
            }`}
        >
            {label}
        </span>
    );
}

function AudienceAvatar({ row }) {
    const initial = (row.name || row.username || '?').trim().slice(0, 1).toUpperCase() || '?';
    if (row.avatarUrl) {
        return <img src={row.avatarUrl} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />;
    }
    return (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-zinc-300">
            {initial}
        </span>
    );
}

function PassportSignals({ row }) {
    const hasAny = row.hasPaidTicket || (row.musicConnected && row.topGenres?.length);
    if (!hasAny) return <span className="text-xs text-zinc-600">—</span>;
    return (
        <div className="flex flex-wrap items-center gap-1.5">
            {row.hasPaidTicket ? (
                <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-[11px] font-medium tracking-[0.02em] text-amber-300">
                    Paid
                </span>
            ) : null}
            {row.musicConnected && row.topGenres?.length
                ? row.topGenres.map((genre) => (
                    <span key={genre} className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-zinc-400">
                        {genre}
                    </span>
                ))
                : null}
        </div>
    );
}

export default function AudiencePage() {
    const [filters, setFilters] = useState(FILTER_DEFAULTS);
    const [rows, setRows] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [selectedRowIds, setSelectedRowIds] = useState([]);

    const [segments, setSegments] = useState([]);
    const [segmentsLoading, setSegmentsLoading] = useState(true);
    const [savingSegment, setSavingSegment] = useState(false);
    const [segmentNameDraft, setSegmentNameDraft] = useState('');
    const [segmentActionBusy, setSegmentActionBusy] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');

    const activeSegment = useMemo(
        () => segments.find((seg) => filtersMatchSegment(filters, seg.filterJson)) || null,
        [segments, filters]
    );

    const totalPages = Math.max(1, Math.ceil(total / TAKE));

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setLoadError('');
        fetchAudienceAttendees(filters, { skip: (page - 1) * TAKE, take: TAKE })
            .then((res) => {
                if (cancelled) return;
                setRows(res.rows || []);
                setTotal(res.total || 0);
            })
            .catch((error) => {
                if (cancelled) return;
                setLoadError(error?.data?.error || error?.message || 'Failed to load audience.');
                setRows([]);
                setTotal(0);
            })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [filters, page]);

    const loadSegments = useCallback(() => {
        setSegmentsLoading(true);
        return listAudienceSegments()
            .then((res) => setSegments(res.segments || []))
            .catch(() => setSegments([]))
            .finally(() => setSegmentsLoading(false));
    }, []);

    useEffect(() => {
        loadSegments();
    }, [loadSegments]);

    function updateFilter(key, value) {
        setFilters((current) => ({ ...current, [key]: value }));
        setPage(1);
        setStatusMessage('');
    }

    function resetFilters() {
        setFilters(FILTER_DEFAULTS);
        setPage(1);
        setSelectedRowIds([]);
        setSavingSegment(false);
        setSegmentNameDraft('');
        setStatusMessage('Filters reset.');
    }

    function toggleRow(rowId) {
        setSelectedRowIds((current) =>
            current.includes(rowId) ? current.filter((id) => id !== rowId) : [...current, rowId]
        );
    }

    function toggleVisibleRows() {
        const visibleIds = rows.map((row) => row.id);
        const allVisibleSelected = visibleIds.every((id) => selectedRowIds.includes(id));
        setSelectedRowIds((current) =>
            allVisibleSelected
                ? current.filter((id) => !visibleIds.includes(id))
                : [...new Set([...current, ...visibleIds])]
        );
    }

    async function handleSaveSegment() {
        if (!segmentNameDraft.trim()) return;
        setSegmentActionBusy(true);
        setStatusMessage('');
        try {
            await saveAudienceSegment({ name: segmentNameDraft.trim(), filterJson: filters });
            setSegmentNameDraft('');
            setSavingSegment(false);
            await loadSegments();
            setStatusMessage('Segment saved — use it below or send a campaign to it.');
        } catch (error) {
            setStatusMessage(error?.data?.error || error?.message || 'Failed to save segment.');
        } finally {
            setSegmentActionBusy(false);
        }
    }

    function handleToggleSegment(segment) {
        // Click applies it; clicking the already-active segment clears back to no filters.
        if (activeSegment?.id === segment.id) {
            setFilters(FILTER_DEFAULTS);
            setStatusMessage('');
        } else {
            setFilters({ ...FILTER_DEFAULTS, ...(segment.filterJson || {}) });
            setStatusMessage(`Applied "${segment.name}".`);
        }
        setPage(1);
        setSelectedRowIds([]);
    }

    async function handleDeleteSegment(segmentId) {
        setSegmentActionBusy(true);
        setStatusMessage('');
        try {
            await deleteAudienceSegment(segmentId);
            await loadSegments();
        } catch (error) {
            setStatusMessage(error?.data?.error || error?.message || 'Failed to delete segment.');
        } finally {
            setSegmentActionBusy(false);
        }
    }

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            <div className="px-1">
                <p className="text-[13px] font-medium text-zinc-500">Audience</p>
                <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-white md:text-[28px]">Know your crowd</h1>
                <p className="mt-1.5 max-w-2xl text-sm leading-6 text-zinc-500">
                    Real attendee intel — Passport signal, music taste, and engagement — beyond email and phone.
                </p>
            </div>

            <div className="space-y-6">
                <RealAudienceOverview />

                <SectionCard
                    title="Audience"
                    className={AUDIENCE_SECTION_CLASS}
                    bodyClassName={AUDIENCE_SECTION_BODY_CLASS}
                >
                    <div className="space-y-6">
                        {loadError ? (
                            <div className="rounded-2xl bg-red-500/10 px-4 py-3 text-xs font-semibold text-red-200">{loadError}</div>
                        ) : null}

                        {segments.length || segmentsLoading ? (
                            <div className="space-y-2.5">
                                <p className="px-1 text-[11px] font-medium tracking-[0.02em] text-zinc-500">Saved segments</p>
                                {segmentsLoading ? (
                                    <p className="rounded-2xl glass-field px-4 py-3 text-sm leading-6 text-zinc-500">Loading segments...</p>
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {segments.map((segment) => {
                                            const active = activeSegment?.id === segment.id;
                                            return (
                                                <div
                                                    key={segment.id}
                                                    className={`flex items-center gap-1.5 rounded-full py-1 pl-1 pr-1.5 transition ${
                                                        active ? 'bg-[#d84aff]/15 ring-1 ring-[#d84aff]/40' : 'glass-field'
                                                    }`}
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleSegment(segment)}
                                                        aria-pressed={active}
                                                        className={`rounded-full px-3 py-1.5 text-xs font-bold tracking-[0.02em] ${active ? 'text-white' : 'text-zinc-300'}`}
                                                    >
                                                        {segment.name}
                                                    </button>
                                                    <Link
                                                        href={`/dashboard/campaigns?segmentId=${segment.id}`}
                                                        title={`Send a campaign to "${segment.name}"`}
                                                        className="rounded-full px-2 py-1.5 text-[11px] font-semibold text-zinc-500 transition hover:bg-white/[0.08] hover:text-white"
                                                    >
                                                        Send →
                                                    </Link>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteSegment(segment.id)}
                                                        disabled={segmentActionBusy}
                                                        aria-label={`Delete ${segment.name}`}
                                                        className="rounded-full px-2 py-1.5 text-xs font-bold text-zinc-500 transition hover:bg-red-500/15 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-40"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        ) : null}

                        <div className="dashboard-surface-b rounded-[1.25rem] !border-0 p-4 sm:p-5">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                                <div>
                                    <p className="text-[11px] font-medium tracking-[0.02em] text-zinc-500">Filter audience</p>
                                    <p className="mt-1 text-sm leading-6 text-zinc-400">Real per-attendee data — opt-in, Passport signal, and engagement.</p>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <p className="rounded-full bg-white/[0.06] px-3 py-1.5 text-xs font-bold tracking-[0.02em] text-zinc-300">
                                        {total.toLocaleString()} attendees
                                    </p>
                                    {savingSegment ? (
                                        <div className="flex items-center gap-1.5">
                                            <input
                                                type="text"
                                                autoFocus
                                                value={segmentNameDraft}
                                                onChange={(event) => setSegmentNameDraft(event.target.value)}
                                                onKeyDown={(event) => { if (event.key === 'Enter') handleSaveSegment(); if (event.key === 'Escape') setSavingSegment(false); }}
                                                placeholder="Segment name"
                                                className="dashboard-input min-h-9 w-40 rounded-full px-3.5 py-1.5 text-xs font-semibold text-white placeholder:text-zinc-500"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleSaveSegment}
                                                disabled={!segmentNameDraft.trim() || segmentActionBusy}
                                                className="pill-solid px-3.5 py-1.5 text-xs font-bold tracking-[0.02em] disabled:cursor-not-allowed disabled:opacity-40"
                                            >
                                                Save
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => { setSavingSegment(false); setSegmentNameDraft(''); }}
                                                className="rounded-full px-2.5 py-1.5 text-xs font-bold text-zinc-500 hover:text-white"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => setSavingSegment(true)}
                                            className="pill-ghost px-3.5 py-1.5 text-xs font-bold tracking-[0.02em]"
                                        >
                                            Save as segment
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={resetFilters}
                                        className="rounded-full px-3.5 py-1.5 text-xs font-bold tracking-[0.02em] text-zinc-500 hover:text-white"
                                    >
                                        Reset
                                    </button>
                                </div>
                            </div>
                            {statusMessage ? <p className="mt-2 text-xs font-semibold text-zinc-400">{statusMessage}</p> : null}

                            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                                <div className="space-y-2 rounded-2xl glass-field p-3">
                                    <p className="px-1 text-[11px] font-medium tracking-[0.02em] text-zinc-500">Email opt-in</p>
                                    <select
                                        value={triStateValue(filters.emailOptIn)}
                                        onChange={(event) => updateFilter('emailOptIn', parseTriState(event.target.value))}
                                        className={AUDIENCE_SELECT_CLASS}
                                    >
                                        {TRI_STATE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                                    </select>
                                </div>

                                <div className="space-y-2 rounded-2xl glass-field p-3">
                                    <p className="px-1 text-[11px] font-medium tracking-[0.02em] text-zinc-500">SMS opt-in</p>
                                    <select
                                        value={triStateValue(filters.smsOptIn)}
                                        onChange={(event) => updateFilter('smsOptIn', parseTriState(event.target.value))}
                                        className={AUDIENCE_SELECT_CLASS}
                                    >
                                        {TRI_STATE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                                    </select>
                                </div>

                                <label className="space-y-2 rounded-2xl glass-field p-3">
                                    <span className="px-1 text-[11px] font-medium tracking-[0.02em] text-zinc-500">City</span>
                                    <input
                                        type="text"
                                        value={filters.city}
                                        onChange={(event) => updateFilter('city', event.target.value)}
                                        placeholder="Any city"
                                        className={AUDIENCE_INPUT_CLASS}
                                    />
                                </label>

                                <div className="space-y-2 rounded-2xl glass-field p-3">
                                    <p className="px-1 text-[11px] font-medium tracking-[0.02em] text-zinc-500">Account tier</p>
                                    <select
                                        value={filters.accountTier}
                                        onChange={(event) => updateFilter('accountTier', event.target.value)}
                                        className={AUDIENCE_SELECT_CLASS}
                                    >
                                        {ACCOUNT_TIER_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                                    </select>
                                </div>

                                <label className="space-y-2 rounded-2xl glass-field p-3">
                                    <span className="px-1 text-[11px] font-medium tracking-[0.02em] text-zinc-500">Min Odyssey XP</span>
                                    <input
                                        type="number"
                                        min="0"
                                        value={filters.minOdysseyXp}
                                        onChange={(event) => updateFilter('minOdysseyXp', event.target.value)}
                                        placeholder="0"
                                        className={AUDIENCE_INPUT_CLASS}
                                    />
                                </label>
                            </div>
                        </div>

                        <div className="dashboard-surface-b overflow-hidden rounded-[1.25rem] !border-0 p-2">
                            {loading ? (
                                <p className="px-3 py-2 text-xs font-bold tracking-[0.02em] text-zinc-500">Loading audience...</p>
                            ) : null}
                            <div className="space-y-3 p-2 md:hidden">
                                <div className="flex items-center justify-between gap-3 px-1">
                                    <p className="text-[11px] font-medium tracking-[0.02em] text-zinc-500">
                                        {rows.length} of {total.toLocaleString()} attendees
                                    </p>
                                    <button
                                        type="button"
                                        onClick={toggleVisibleRows}
                                        className="rounded-full bg-white/[0.06] px-3 py-1.5 text-[11px] font-medium tracking-[0.02em] text-zinc-300"
                                    >
                                        Select all
                                    </button>
                                </div>
                                {rows.map((row) => {
                                    const selected = selectedRowIds.includes(row.id);
                                    return (
                                        <button
                                            key={row.id}
                                            type="button"
                                            onClick={() => toggleRow(row.id)}
                                            className={`w-full rounded-2xl px-4 py-4 text-left transition ${
                                                selected ? 'bg-white/[0.09]' : 'bg-white/[0.035]'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex min-w-0 items-center gap-3">
                                                    <AudienceAvatar row={row} />
                                                    <div className="min-w-0">
                                                        <p className="truncate text-base font-bold leading-6 text-white">{row.name || row.username || 'Unnamed'}</p>
                                                        <p className="mt-1 truncate text-xs leading-5 text-zinc-500">
                                                            {row.city || 'Unknown city'} · {accessTierLabel(accessTierOf(row))}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className={`mt-1 h-4 w-4 shrink-0 rounded-md ${selected ? 'bg-white' : 'bg-white/12'}`} aria-hidden="true" />
                                            </div>
                                            <div className="mt-3">
                                                <PassportSignals row={row} />
                                            </div>
                                            <div className="mt-4 grid grid-cols-2 gap-2">
                                                <div className="rounded-xl bg-white/[0.04] px-3 py-2">
                                                    <p className="text-[11px] font-medium tracking-[0.02em] text-zinc-500">Odyssey XP</p>
                                                    <p className="mt-1 font-mono text-sm font-bold text-zinc-100">{row.odysseyXp?.toLocaleString?.() ?? row.odysseyXp}</p>
                                                </div>
                                                <div className="rounded-xl bg-white/[0.04] px-3 py-2">
                                                    <p className="text-[11px] font-medium tracking-[0.02em] text-zinc-500">Events</p>
                                                    <p className="mt-1 font-mono text-sm font-bold text-zinc-100">{row.eventsAttended}</p>
                                                </div>
                                            </div>
                                            <div className="mt-3 flex flex-wrap gap-1.5">
                                                <OptBadge label="Email" active={row.emailMarketingOptIn} />
                                                <OptBadge label="SMS" active={row.smsMarketingOptIn} />
                                            </div>
                                            <p className="mt-3 text-xs font-semibold text-zinc-500">Last attended {formatLastAttended(row.lastAttendedAt)}</p>
                                        </button>
                                    );
                                })}
                            </div>
                            <div className={`hidden overflow-x-auto pb-1 md:block ${AUDIENCE_SCROLLBAR_CLASS}`}>
                                <table className="w-full min-w-[1240px] text-left">
                                    <thead>
                                        <tr className="text-[11px] font-medium text-zinc-500">
                                            <th className="w-14 border-b border-white/[0.07] px-4 py-2.5">
                                                <button
                                                    type="button"
                                                    onClick={toggleVisibleRows}
                                                    className="rounded-full bg-white/[0.06] px-3 py-1 text-[11px] font-medium text-zinc-300 transition hover:bg-white/[0.1]"
                                                >
                                                    All
                                                </button>
                                            </th>
                                            <th className="border-b border-white/[0.07] px-4 py-2.5 font-medium">Attendee</th>
                                            <th className="border-b border-white/[0.07] px-4 py-2.5 font-medium">City</th>
                                            <th className="border-b border-white/[0.07] px-4 py-2.5 font-medium">Age</th>
                                            <th className="border-b border-white/[0.07] px-4 py-2.5 font-medium">Tier</th>
                                            <th className="border-b border-white/[0.07] px-4 py-2.5 font-medium">Opt-in</th>
                                            <th className="border-b border-white/[0.07] px-4 py-2.5 font-medium">Passport signal</th>
                                            <th className="border-b border-white/[0.07] px-4 py-2.5 text-right font-medium">Odyssey XP</th>
                                            <th className="border-b border-white/[0.07] px-4 py-2.5 text-right font-medium">Events</th>
                                            <th className="border-b border-white/[0.07] px-4 py-2.5 font-medium">Last attended</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.map((row) => {
                                            const selected = selectedRowIds.includes(row.id);
                                            const rowSurface = selected ? 'bg-[#d84aff]/[0.06]' : 'hover:bg-white/[0.03]';
                                            return (
                                                <tr key={row.id} className={`border-b border-white/[0.04] transition-colors ${rowSurface}`}>
                                                    <td className="px-4 py-3.5 align-middle">
                                                        <input
                                                            type="checkbox"
                                                            checked={selected}
                                                            onChange={() => toggleRow(row.id)}
                                                            className="h-4 w-4 rounded-md bg-white/10 accent-[#d84aff] [border:0] focus:outline-none"
                                                            aria-label={`Select ${row.name || row.username || row.id}`}
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3.5 align-middle">
                                                        <div className="flex items-center gap-3">
                                                            <AudienceAvatar row={row} />
                                                            <div className="min-w-0">
                                                                <p className="truncate text-sm font-semibold text-white">{row.name || row.username || 'Unnamed'}</p>
                                                                {row.username ? <p className="truncate text-xs text-zinc-500">@{row.username}</p> : null}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3.5 align-middle text-sm text-zinc-300">
                                                        {row.city || '—'}
                                                    </td>
                                                    <td className="px-4 py-3.5 align-middle text-sm text-zinc-300">
                                                        {row.ageBracket || '—'}
                                                    </td>
                                                    <td className="px-4 py-3.5 align-middle">
                                                        <span className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-medium text-zinc-300">
                                                            {accessTierLabel(accessTierOf(row))}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3.5 align-middle">
                                                        <div className="flex flex-wrap gap-1.5">
                                                            <OptBadge label="Email" active={row.emailMarketingOptIn} />
                                                            <OptBadge label="SMS" active={row.smsMarketingOptIn} />
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3.5 align-middle">
                                                        <PassportSignals row={row} />
                                                    </td>
                                                    <td className="px-4 py-3.5 text-right align-middle text-sm font-semibold tabular-nums text-zinc-100">
                                                        {row.odysseyXp?.toLocaleString?.() ?? row.odysseyXp}
                                                    </td>
                                                    <td className="px-4 py-3.5 text-right align-middle text-sm font-semibold tabular-nums text-zinc-100">
                                                        {row.eventsAttended}
                                                    </td>
                                                    <td className="px-4 py-3.5 align-middle text-sm text-zinc-400">
                                                        {formatLastAttended(row.lastAttendedAt)}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            {!loading && rows.length === 0 ? (
                                <div className="px-5 py-8 text-center text-sm leading-6 text-zinc-500">
                                    No attendees match the current filters.
                                </div>
                            ) : null}
                        </div>

                        {totalPages > 1 ? (
                            <div className="flex items-center justify-between gap-4 px-2">
                                <p className="text-xs font-semibold text-zinc-500">
                                    Page {page} of {totalPages} · {total.toLocaleString()} total
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        disabled={loading || page <= 1}
                                        onClick={() => setPage((current) => Math.max(1, current - 1))}
                                        className="pill-ghost px-4 py-2 text-xs font-bold tracking-[0.02em] disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        type="button"
                                        disabled={loading || page >= totalPages}
                                        onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                                        className="pill-solid px-4 py-2 text-xs font-bold tracking-[0.02em] disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        ) : null}
                    </div>
                </SectionCard>
            </div>
        </div>
    );
}
