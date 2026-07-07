'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import ActionMenu from '@/components/dashboard/ActionMenu';
import SectionCard from '@/components/dashboard/SectionCard';
import SegmentedToggle from '@/components/dashboard/SegmentedToggle';
import Modal from '@/components/ui/Modal';
import { useEvents, useNotifications } from '@/lib/dashboardStore';
import {
    buildAudienceRows,
    exportSegmentToCampaignDraft,
    deleteAudienceSegment,
    listAudienceSegments,
    saveAudienceSegment,
} from '@/services/audienceSegments';
import {
    createCampaignDraftFromInsights,
    deleteCampaignDraft,
    listCampaignDrafts,
    resumeCampaignDraft,
} from '@/services/campaignDrafts';
import { api } from '@/services/api';

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

    if (failed || (data && data.totalAttendees === 0)) return null;

    return (
        <SectionCard title="Your real audience" dense>
            {!data ? (
                <p className="px-2 py-3 text-sm text-zinc-500">Loading live demographics...</p>
            ) : (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {[
                            { label: 'Attendees', value: data.totalAttendees },
                            { label: 'Passport holders', value: data.tiers.citizen },
                            { label: 'Email reachable', value: data.marketing.emailOptIn },
                            { label: 'Repeat guests', value: `${Math.round((data.repeat.repeatRate || 0) * 100)}%` },
                        ].map((t) => (
                            <div key={t.label} className="glow-surface-soft rounded-xl px-4 py-3">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t.label}</p>
                                <p className="mt-1 text-xl font-black tabular-nums text-white">{t.value}</p>
                            </div>
                        ))}
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        {data.topCities.length > 0 && (
                            <div className="glow-surface-soft rounded-xl px-4 py-3">
                                <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Top cities</p>
                                {data.topCities.slice(0, 5).map((c) => (
                                    <div key={c.city} className="flex items-center justify-between py-0.5 text-sm">
                                        <span className="text-zinc-300">{c.city}</span>
                                        <span className="font-bold tabular-nums text-white">{c.count}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                        {data.ageBrackets.some((b) => b.count > 0) && (
                            <div className="glow-surface-soft rounded-xl px-4 py-3">
                                <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Age brackets (opted-in ages)</p>
                                {data.ageBrackets.map((b) => (
                                    <div key={b.label} className="flex items-center justify-between py-0.5 text-sm">
                                        <span className="text-zinc-300">{b.label}</span>
                                        <span className="font-bold tabular-nums text-white">{b.count}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </SectionCard>
    );
}

const INVITE_TYPES = ['ALBUM_INVITE', 'STAFF_INVITE', 'LINEUP_INVITE'];
const ACTIVE_CAMPAIGN_STORAGE_KEY = 'pxi_active_campaign_status_v1';
const MONEY_FORMATTER = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

const FILTER_DEFAULTS = {
    search: '',
    pricePaid: 'all',
    odysseyScore: 'all',
    eventCountOperator: 'gte',
    eventCountValue: '',
};
const DEFAULT_CAMPAIGN_MIX = {
    sms: true,
    email: true,
    feedPosts: true,
    discoveryRanking: false,
    budget: 350,
};
const CAMPAIGN_TABS = [
    { id: 'active', label: 'Active' },
    { id: 'drafts', label: 'Drafts' },
    { id: 'past', label: 'Past' },
];
const MIX_CONTROLS = [
    {
        id: 'sms',
        label: 'SMS',
        description: 'Urgent last-call sends for high-intent guests.',
    },
    {
        id: 'email',
        label: 'Email',
        description: 'Longer copy for Passport, gallery, and lineup context.',
    },
    {
        id: 'feedPosts',
        label: 'Feed Post',
        description: 'Organic social proof inside the PXI feed.',
    },
    {
        id: 'discoveryRanking',
        label: 'Discovery Ranking Boost',
        description: 'Promote the event in discovery when budget is available.',
    },
];
const PRICE_FILTERS = [
    { value: 'all', label: 'Price Paid' },
    { value: 'free', label: 'Free / RSVP' },
    { value: 'under50', label: 'Under $50' },
    { value: '50to100', label: '$50 - $100' },
    { value: 'over100', label: '$100+' },
];
const SCORE_FILTERS = [
    { value: 'all', label: 'Odyssey Score' },
    { value: '2000', label: '2,000+' },
    { value: '5000', label: '5,000+' },
    { value: '10000', label: '10,000+' },
];
const EVENT_COUNT_OPERATORS = [
    { value: 'gte', label: 'Events ≥' },
    { value: 'lte', label: 'Events ≤' },
    { value: 'eq', label: 'Events =' },
];
const AUDIENCE_SECTION_CLASS =
    'dashboard-surface-b !border-0 shadow-[0_22px_80px_rgba(0,0,0,0.28)] [&>header]:!border-0 [&>header]:pb-3';
const AUDIENCE_SECTION_BODY_CLASS = 'pt-4';
const AUDIENCE_INPUT_CLASS =
    'dashboard-input min-h-12 w-full rounded-2xl px-4 py-3 text-sm font-semibold text-white placeholder:text-zinc-500';
const AUDIENCE_SELECT_CLASS = `${AUDIENCE_INPUT_CLASS} appearance-none pr-10`;
const AUDIENCE_SCROLLBAR_CLASS =
    '[scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.18)_transparent] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/15 [&::-webkit-scrollbar-thumb:hover]:bg-white/25';

function soldTickets(event) {
    return Math.max(0, (event?._count?.tickets ?? 0) - 1);
}

function isPastEvent(event) {
    const status = String(event?.status || '').toLowerCase();
    return status === 'ended' || status === 'past' || status === 'completed' || status === 'archived';
}

function eventTimeLabel(event) {
    if (!event?.startDate) return 'Timing TBD';
    const start = new Date(event.startDate);
    if (Number.isNaN(start.getTime())) return 'Timing TBD';
    return start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric' });
}

function formatUpdatedAt(value) {
    if (!value) return 'Saved';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Saved';
    return `Updated ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
}

function mixChannelLabel(mix = {}) {
    const channels = [];
    if (mix.sms) channels.push('SMS');
    if (mix.email) channels.push('Email');
    if (mix.feedPosts) channels.push('Feed');
    if (mix.discoveryRanking) channels.push('Discovery');
    return channels.length ? channels.join(' + ') : 'No channels selected';
}

function readActiveCampaignStates() {
    if (typeof window === 'undefined') return {};
    try {
        const raw = window.localStorage.getItem(ACTIVE_CAMPAIGN_STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}

function writeActiveCampaignStates(states) {
    if (typeof window !== 'undefined') {
        window.localStorage.setItem(ACTIVE_CAMPAIGN_STORAGE_KEY, JSON.stringify(states));
    }
    return states;
}

function activeCampaignStatusLabel(status) {
    if (status === 'paused') return 'Paused';
    if (status === 'cancelled') return 'Cancelled';
    return 'Active';
}

function CampaignList({ items, emptyTitle, emptyCopy, selectedDraftId, onOpenDraft, onUseDraft, onDeleteDraft, onManageActive }) {
    if (items.length === 0) {
        return (
            <div className="glow-surface-soft rounded-2xl px-5 py-8 text-center">
                <p className="text-sm font-semibold text-zinc-200">{emptyTitle}</p>
                <p className="mt-2 text-sm text-zinc-500">{emptyCopy}</p>
            </div>
        );
    }

    return (
        <ul className="space-y-3">
            {items.map((campaign) => (
                <li
                    key={campaign.id}
                    className={`glow-surface-soft rounded-2xl px-4 py-4 transition ${
                        selectedDraftId === campaign.id ? 'bg-white/[0.08]' : ''
                    }`}
                >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <button
                            type="button"
                            onClick={() => (campaign.type === 'draft' ? onOpenDraft?.(campaign.id) : onManageActive?.(campaign))}
                            className="min-w-0 flex-1 text-left"
                        >
                            <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-bold text-white">{campaign.title}</p>
                                <span className="glow-chip rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-zinc-300">
                                    {campaign.statusLabel}
                                </span>
                            </div>
                            <p className="mt-1 text-xs text-zinc-500">{campaign.audience}</p>
                            <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold text-zinc-400">
                                <span className="rounded-full bg-white/5 px-2.5 py-1">{campaign.channels}</span>
                                <span className="rounded-full bg-white/5 px-2.5 py-1">{campaign.schedule}</span>
                                <span className="rounded-full bg-white/5 px-2.5 py-1">${campaign.budget} budget</span>
                            </div>
                        </button>
                        {campaign.type === 'draft' ? (
                            <ActionMenu
                                size="sm"
                                ariaLabel={`Actions for ${campaign.title}`}
                                items={[
                                    { id: 'use', label: 'Use draft', onSelect: () => onUseDraft?.(campaign.id) },
                                    { id: 'delete', label: 'Delete draft', tone: 'danger', onSelect: () => onDeleteDraft?.(campaign.id) },
                                ]}
                            />
                        ) : campaign.type === 'active' ? (
                            <ActionMenu
                                size="sm"
                                ariaLabel={`Actions for ${campaign.title}`}
                                items={[
                                    { id: 'details', label: 'Open details', onSelect: () => onManageActive?.(campaign) },
                                ]}
                            />
                        ) : null}
                    </div>
                </li>
            ))}
        </ul>
    );
}

function formatMoney(value) {
    return MONEY_FORMATTER.format(Number(value) || 0);
}

function matchesPriceFilter(row, filter) {
    if (filter === 'free') return row.pricePaid === 0;
    if (filter === 'under50') return row.pricePaid > 0 && row.pricePaid < 50;
    if (filter === '50to100') return row.pricePaid >= 50 && row.pricePaid <= 100;
    if (filter === 'over100') return row.pricePaid > 100;
    return true;
}

function matchesScoreFilter(row, filter) {
    if (filter === 'all') return true;
    return row.odysseyScore >= Number(filter || 0);
}

function matchesEventCountFilter(row, operator, rawValue) {
    if (rawValue === '' || rawValue == null) return true;
    const value = Number(rawValue);
    if (!Number.isFinite(value)) return true;
    if (operator === 'lte') return row.eventsAttendedCount <= value;
    if (operator === 'eq') return row.eventsAttendedCount === value;
    return row.eventsAttendedCount >= value;
}

export default function AudiencePage() {
    const searchParams = useSearchParams();
    const view = searchParams.get('view') === 'campaigns' ? 'campaigns' : 'crm';
    const { events, loading: eventsLoading } = useEvents({ limit: 100, offset: 0 });
    const { notifications, loading: notificationsLoading } = useNotifications(100);
    const loading = eventsLoading || notificationsLoading;
    const [activeCampaignTab, setActiveCampaignTab] = useState('active');
    const [campaignMix, setCampaignMix] = useState(DEFAULT_CAMPAIGN_MIX);
    const [campaignDrafts, setCampaignDrafts] = useState([]);
    const [selectedDraftId, setSelectedDraftId] = useState(null);
    const [audienceFilters, setAudienceFilters] = useState(FILTER_DEFAULTS);
    const [selectedAudienceRows, setSelectedAudienceRows] = useState([]);
    const [segmentName, setSegmentName] = useState('');
    const [segmentDrafts, setSegmentDrafts] = useState(() => listAudienceSegments());
    const [selectedSegmentId, setSelectedSegmentId] = useState(null);
    const [handoffStatus, setHandoffStatus] = useState('');
    const [activeCampaignModal, setActiveCampaignModal] = useState(null);
    const [activeCampaignStates, setActiveCampaignStates] = useState(() => readActiveCampaignStates());

    useEffect(() => {
        let cancelled = false;
        listCampaignDrafts().then((drafts) => {
            if (!cancelled) setCampaignDrafts(drafts);
        });
        return () => {
            cancelled = true;
        };
    }, []);

    const inviteNotifications = useMemo(
        () => notifications.filter((item) => INVITE_TYPES.includes(item.type)),
        [notifications]
    );
    const inviteCounts = useMemo(() => {
        return inviteNotifications.reduce(
            (acc, item) => {
                const response = String(item?.data?.inviteResponse || '').toLowerCase();
                if (response === 'accepted' || item?.data?.acceptedAt) acc.accepted += 1;
                else if (response === 'declined') acc.declined += 1;
                else acc.pending += 1;
                return acc;
            },
            { accepted: 0, declined: 0, pending: 0 }
        );
    }, [inviteNotifications]);

    const totalTickets = useMemo(
        () => events.reduce((sum, event) => sum + soldTickets(event), 0),
        [events]
    );
    const audienceRows = useMemo(
        () => buildAudienceRows(events, notifications),
        [events, notifications]
    );
    const filteredAudienceRows = useMemo(() => {
        const search = audienceFilters.search.trim().toLowerCase();
        return audienceRows.filter((row) => {
            const matchesSearch =
                !search ||
                [row.audienceName, row.sourceEvent, row.rowType, row.stampTypes.join(' ')]
                    .join(' ')
                    .toLowerCase()
                    .includes(search);
            return (
                matchesSearch &&
                matchesPriceFilter(row, audienceFilters.pricePaid) &&
                matchesScoreFilter(row, audienceFilters.odysseyScore) &&
                matchesEventCountFilter(row, audienceFilters.eventCountOperator, audienceFilters.eventCountValue)
            );
        });
    }, [audienceFilters, audienceRows]);
    const selectedRows = useMemo(
        () => audienceRows.filter((row) => selectedAudienceRows.includes(row.id)),
        [audienceRows, selectedAudienceRows]
    );
    const rowsForSegment = selectedRows.length ? selectedRows : filteredAudienceRows;
    const segmentStats = useMemo(() => {
        const rows = rowsForSegment;
        const stampCounts = new Map();
        rows.forEach((row) => {
            row.stampTypes.forEach((stamp) => {
                stampCounts.set(stamp, (stampCounts.get(stamp) || 0) + 1);
            });
        });
        const topStamps = [...stampCounts.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([stamp]) => stamp);
        const averagePrice = rows.length ? rows.reduce((sum, row) => sum + row.pricePaid, 0) / rows.length : 0;
        const averageOdyssey = rows.length ? Math.round(rows.reduce((sum, row) => sum + row.odysseyScore, 0) / rows.length) : 0;

        return { topStamps, averagePrice, averageOdyssey };
    }, [rowsForSegment]);
    const segmentIsActive = selectedAudienceRows.length > 0;

    const upcomingEvents = useMemo(
        () => events.filter((event) => !isPastEvent(event)),
        [events]
    );
    const pastEvents = useMemo(
        () => events.filter((event) => isPastEvent(event)),
        [events]
    );
    const activeCampaigns = useMemo(() => {
        const eventCampaigns = upcomingEvents.slice(0, 3).map((event, index) => ({
            id: `event-${event.id}`,
            title: `${event.name || 'Untitled event'} last-call reminder`,
            audience: inviteCounts.pending > 0 ? `${inviteCounts.pending} pending invitees` : 'Ticket holders and Passport followers',
            budget: index === 0 ? campaignMix.budget : Math.max(120, campaignMix.budget - 140),
            channels: index === 0 ? mixChannelLabel(campaignMix) : 'Email + Feed',
            schedule: eventTimeLabel(event),
            statusLabel: index === 0 && inviteCounts.pending > 0 ? 'Ready to schedule' : 'Planned',
            type: 'active',
        }));

        if (eventCampaigns.length === 0) {
            eventCampaigns.push({
                id: 'fallback-passport-reactivation',
                title: 'Passport reactivation campaign',
                audience: 'Best-fit Passport segment',
                budget: campaignMix.budget,
                channels: mixChannelLabel(campaignMix),
                schedule: 'Draft send window',
                statusLabel: 'Planned',
                type: 'active',
            });
        }

        return eventCampaigns.map((campaign) => {
            const storedStatus = activeCampaignStates[campaign.id] || 'active';
            return {
                ...campaign,
                status: storedStatus,
                statusLabel: activeCampaignStatusLabel(storedStatus),
            };
        });
    }, [activeCampaignStates, campaignMix, inviteCounts.pending, upcomingEvents]);
    const draftCampaigns = useMemo(
        () => campaignDrafts
            .filter((draft) => draft.status !== 'archived')
            .map((draft) => ({
                id: draft.id,
                title: draft.title,
                audience: draft.audience,
                budget: Number(draft.mix?.budget || 0),
                channels: mixChannelLabel(draft.mix),
                schedule: `${draft.stage} · ${formatUpdatedAt(draft.updatedAt)}`,
                statusLabel: 'Draft',
                type: 'draft',
            })),
        [campaignDrafts]
    );
    const pastCampaigns = useMemo(() => {
        const archivedDrafts = campaignDrafts
            .filter((draft) => draft.status === 'archived')
            .map((draft) => ({
                id: draft.id,
                title: draft.title,
                audience: draft.audience,
                budget: Number(draft.mix?.budget || 0),
                channels: mixChannelLabel(draft.mix),
                schedule: formatUpdatedAt(draft.updatedAt),
                statusLabel: 'Archived',
                type: 'past',
            }));
        const eventRecaps = pastEvents.slice(0, 2).map((event) => ({
            id: `past-${event.id}`,
            title: `${event.name || 'Recent event'} recap campaign`,
            audience: 'Recent attendees',
            budget: 180,
            channels: 'Email + Feed',
            schedule: eventTimeLabel(event),
            statusLabel: 'Completed',
            type: 'past',
        }));

        return [...archivedDrafts, ...eventRecaps];
    }, [campaignDrafts, pastEvents]);
    const campaignItemsByTab = {
        active: activeCampaigns,
        drafts: draftCampaigns,
        past: pastCampaigns,
    };
    const selectedDraft = campaignDrafts.find((draft) => draft.id === selectedDraftId);
    const campaignAudience =
        inviteCounts.pending > 0
            ? `${inviteCounts.pending} pending invitees`
            : `${Math.max(totalTickets, 120).toLocaleString()} Passport-qualified guests`;
    const insightRecommendations = [
        inviteCounts.pending > 0
            ? 'Pending invitees are the fastest conversion segment; use SMS only for the final reminder window.'
            : 'No pending invite pressure detected; favor email and feed posts to warm the next event audience.',
        campaignMix.discoveryRanking
            ? 'Discovery ranking is enabled, so reserve at least 40% of budget for public reach.'
            : 'Discovery ranking is off; this mix is better suited for owned audience reactivation.',
        campaignMix.budget >= 500
            ? 'Budget supports a broader mix with ranked discovery plus a second feed post.'
            : 'Budget is lean; prioritize email and feed, then add SMS close to doors.',
    ];

    function toggleCampaignChannel(channel) {
        setCampaignMix((current) => ({ ...current, [channel]: !current[channel] }));
    }

    function updateCampaignBudget(value) {
        setCampaignMix((current) => ({ ...current, budget: Number(value) }));
    }

    async function refreshCampaignDrafts(nextSelectedId) {
        const drafts = await listCampaignDrafts();
        setCampaignDrafts(drafts);
        if (nextSelectedId !== undefined) setSelectedDraftId(nextSelectedId);
    }

    async function handleGenerateCampaignDraft() {
        const draft = await createCampaignDraftFromInsights({
            title: upcomingEvents[0]?.name ? `${upcomingEvents[0].name} campaign mix` : 'Campaign draft',
            audience: campaignAudience,
            schedule: upcomingEvents[0] ? eventTimeLabel(upcomingEvents[0]) : 'Next best send window',
            mix: campaignMix,
            insights: insightRecommendations,
        });
        setCampaignDrafts((current) => [draft, ...current]);
        setSelectedDraftId(draft.id);
        setActiveCampaignTab('drafts');
    }

    function handleOpenDraft(id) {
        const draft = campaignDrafts.find((item) => item.id === id);
        if (draft?.mix) setCampaignMix({ ...DEFAULT_CAMPAIGN_MIX, ...draft.mix });
        setSelectedDraftId(id);
    }

    async function handleUseDraft(id) {
        const draft = campaignDrafts.find((item) => item.id === id);
        if (draft?.mix) setCampaignMix({ ...DEFAULT_CAMPAIGN_MIX, ...draft.mix });
        await resumeCampaignDraft(id);
        await refreshCampaignDrafts(id);
    }

    async function handleDeleteDraft(id) {
        await deleteCampaignDraft(id);
        await refreshCampaignDrafts(selectedDraftId === id ? null : selectedDraftId);
    }

    function handleActiveCampaignStatus(status) {
        if (!activeCampaignModal?.id) return;
        const nextStates = writeActiveCampaignStates({
            ...activeCampaignStates,
            [activeCampaignModal.id]: status,
        });
        setActiveCampaignStates(nextStates);
        setActiveCampaignModal((current) => current ? {
            ...current,
            status,
            statusLabel: activeCampaignStatusLabel(status),
        } : current);
    }

    function updateAudienceFilter(key, value) {
        setAudienceFilters((current) => ({ ...current, [key]: value }));
        setSelectedSegmentId(null);
    }

    function toggleAudienceRow(rowId) {
        setSelectedAudienceRows((current) =>
            current.includes(rowId) ? current.filter((id) => id !== rowId) : [...current, rowId]
        );
        setSelectedSegmentId(null);
        setHandoffStatus('');
    }

    function toggleVisibleAudienceRows() {
        const visibleIds = filteredAudienceRows.map((row) => row.id);
        const allVisibleSelected = visibleIds.every((id) => selectedAudienceRows.includes(id));
        setSelectedAudienceRows((current) =>
            allVisibleSelected
                ? current.filter((id) => !visibleIds.includes(id))
                : [...new Set([...current, ...visibleIds])]
        );
        setSelectedSegmentId(null);
        setHandoffStatus('');
    }

    function handleSaveSegment() {
        if (!segmentName.trim()) {
            setHandoffStatus('Add a segment name before saving.');
            return;
        }
        const rows = rowsForSegment;
        const saved = saveAudienceSegment({
            name: segmentName.trim(),
            filters: audienceFilters,
            rowIds: rows.map((row) => row.id),
            rowCount: rows.length,
        });
        setSegmentDrafts(saved);
        setSelectedSegmentId(saved[0]?.id || null);
        setHandoffStatus('Segment draft saved.');
    }

    function resetSegmentDraft() {
        setSegmentName('');
        setAudienceFilters(FILTER_DEFAULTS);
        setSelectedAudienceRows([]);
        setSelectedSegmentId(null);
        setHandoffStatus('Segment draft reset.');
    }

    async function handleExportSegment() {
        const rowsForExport = rowsForSegment;
        const draft = exportSegmentToCampaignDraft({
            name: segmentName.trim() || 'Audience CRM handoff',
            filters: audienceFilters,
            rowIds: rowsForExport.map((row) => row.id),
            rowCount: rowsForExport.length,
        });
        await refreshCampaignDrafts(draft.id);
        setActiveCampaignTab('drafts');
        setHandoffStatus(`${rowsForExport.length} audience rows staged for Campaigns.`);
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="mx-auto max-w-2xl space-y-3 text-center">
                <h1 className="text-3xl font-black tracking-[-0.02em] text-white md:text-4xl">Audience</h1>
                <p className="text-sm leading-6 text-zinc-400">
                    Shape CRM segments and campaign handoffs from one focused workspace.
                </p>
            </div>

            <div className="flex justify-center">
                <SegmentedToggle
                    value={view}
                    ariaLabel="Audience view"
                    items={[
                        { value: 'crm', label: 'CRM', href: '/dashboard/audience?view=crm' },
                        { value: 'campaigns', label: 'Campaigns', href: '/dashboard/audience?view=campaigns' },
                    ]}
                />
            </div>

            {view === 'crm' ? (
                <>
                    <div className="space-y-7">
                        <RealAudienceOverview />
                        <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-xs font-semibold text-amber-200">
                            Sample data — rows below model likely audience segments from your real ticket and invite
                            counts. They are not a literal roster of individual attendees. Live totals are in the
                            &quot;Your real audience&quot; panel above.
                        </div>
                        <SectionCard
                            title={segmentIsActive ? 'Segment Draft Active' : 'Segment Draft'}
                            className={`${AUDIENCE_SECTION_CLASS} ${
                                segmentIsActive ? 'shadow-[0_24px_90px_rgba(216,74,255,0.14)]' : ''
                            }`}
                            bodyClassName={AUDIENCE_SECTION_BODY_CLASS}
                        >
                            <div className="space-y-6">
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                    <div className="min-w-0 flex-1">
                                        <p className="max-w-2xl text-sm leading-6 text-zinc-400">
                                            Build a segment from the CRM selection. With no rows selected, the draft keeps previewing the filtered audience.
                                        </p>
                                        <input
                                            type="text"
                                            value={segmentName}
                                            onChange={(event) => setSegmentName(event.target.value)}
                                            className={`${AUDIENCE_INPUT_CLASS} mt-4 max-w-xl`}
                                            placeholder="Segment name"
                                        />
                                    </div>
                                    <div className={`rounded-3xl px-4 py-3 text-sm glass-field ${
                                        segmentIsActive ? 'bg-white/[0.09] text-white border-white/20' : 'text-zinc-400'
                                    }`}>
                                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                                            {segmentIsActive ? 'Selection active' : 'Selection standby'}
                                        </p>
                                        <p className="mt-1 font-semibold">
                                            {segmentIsActive ? `${selectedAudienceRows.length} rows selected` : 'Select CRM rows below to activate.'}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid gap-3 md:grid-cols-3">
                                    <div className="rounded-2xl glass-field px-5 py-4">
                                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                                            {segmentIsActive ? 'Selected rows' : 'Filtered rows'}
                                        </p>
                                        <p className="mt-2 text-3xl font-black text-white">{rowsForSegment.length}</p>
                                    </div>
                                    <div className="rounded-2xl glass-field px-5 py-4">
                                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">Avg. price paid</p>
                                        <p className="mt-2 text-3xl font-black text-white">{formatMoney(segmentStats.averagePrice)}</p>
                                    </div>
                                    <div className="rounded-2xl glass-field px-5 py-4">
                                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">Avg. Odyssey</p>
                                        <p className="mt-2 text-3xl font-black text-white">{segmentStats.averageOdyssey.toLocaleString()}</p>
                                    </div>
                                </div>

                                <div className="rounded-2xl glass-field px-5 py-5">
                                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">In this segment</p>
                                    <div className="mt-3 flex flex-wrap gap-2.5">
                                        {segmentStats.topStamps.length ? (
                                            segmentStats.topStamps.map((stamp) => (
                                                <span key={stamp} className="rounded-full glow-chip px-3.5 py-1.5 text-xs font-bold text-zinc-300">
                                                    {stamp}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-sm leading-6 text-zinc-500">Select CRM rows or adjust filters to build a segment.</span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex flex-wrap gap-2.5">
                                        <button
                                            type="button"
                                            onClick={handleSaveSegment}
                                            disabled={!segmentName.trim()}
                                            className="pill-solid px-5 py-2.5 text-xs font-bold uppercase tracking-widest disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                            Save Segment
                                        </button>
                                        <button
                                            type="button"
                                            onClick={resetSegmentDraft}
                                            className="pill-ghost px-5 py-2.5 text-xs font-bold uppercase tracking-widest"
                                        >
                                            Reset Draft
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleExportSegment}
                                            disabled={!rowsForSegment.length}
                                            className="glow-chip rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-zinc-300 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                            Send to Campaign Draft
                                        </button>
                                    </div>
                                    {handoffStatus ? <p className="text-sm font-semibold text-zinc-400">{handoffStatus}</p> : null}
                                </div>

                                <div className="space-y-3">
                                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">Saved segments</p>
                                    {segmentDrafts.length ? (
                                        <div className="grid gap-2.5 md:grid-cols-2">
                                            {segmentDrafts.map((segment) => (
                                                <div
                                                    key={segment.id}
                                                    className={`flex items-center justify-between gap-3 rounded-2xl px-4 py-3 ${
                                                        selectedSegmentId === segment.id ? 'glow-active' : 'glow-surface-soft'
                                                    }`}
                                                >
                                                    <div className="min-w-0 text-left">
                                                        <p className="truncate text-sm font-bold text-zinc-100">{segment.name}</p>
                                                        <p className="mt-1 text-xs leading-5 text-zinc-500">{segment.rowCount} rows · {formatUpdatedAt(segment.savedAt)}</p>
                                                    </div>
                                                    <div className="flex shrink-0 gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                deleteAudienceSegment(segment.id);
                                                                setSegmentDrafts(listAudienceSegments());
                                                                if (selectedSegmentId === segment.id) setSelectedSegmentId(null);
                                                            }}
                                                            className="rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-red-400 whitespace-nowrap"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="rounded-2xl glass-field px-4 py-3 text-sm leading-6 text-zinc-500">No segments saved.</p>
                                    )}
                                </div>
                            </div>
                        </SectionCard>

                        <SectionCard
                            title="Audience Pipeline"
                            className={AUDIENCE_SECTION_CLASS}
                            bodyClassName={AUDIENCE_SECTION_BODY_CLASS}
                        >
                            <div className="space-y-6">
                                {loading ? (
                                    <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Loading audience rows</p>
                                ) : null}
                                <div className="dashboard-surface-b rounded-[1.75rem] !border-0 p-4 sm:p-5">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Filter audience</p>
                                            <p className="mt-1 text-sm leading-6 text-zinc-400">Group guests by spend, Odyssey behavior, and event history.</p>
                                        </div>
                                        <p className="rounded-full bg-white/[0.06] px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-zinc-300">
                                            {filteredAudienceRows.length} rows
                                        </p>
                                    </div>

                                    <div className="mt-5 grid gap-3 lg:grid-cols-[1.3fr_1fr_1fr_0.9fr]">
                                        <label className="space-y-2 rounded-2xl glass-field p-3">
                                            <span className="px-1 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">Find</span>
                                            <input
                                                type="search"
                                                value={audienceFilters.search}
                                                onChange={(event) => updateAudienceFilter('search', event.target.value)}
                                                placeholder="Search audience, events, stamps"
                                                className={AUDIENCE_INPUT_CLASS}
                                            />
                                        </label>

                                        <div className="space-y-2 rounded-2xl glass-field p-3">
                                            <p className="px-1 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">Spend</p>
                                            <select
                                                value={audienceFilters.pricePaid}
                                                onChange={(event) => updateAudienceFilter('pricePaid', event.target.value)}
                                                className={AUDIENCE_SELECT_CLASS}
                                            >
                                                {PRICE_FILTERS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                                            </select>
                                        </div>

                                        <div className="space-y-2 rounded-2xl glass-field p-3">
                                            <p className="px-1 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">Odyssey</p>
                                            <select
                                                value={audienceFilters.odysseyScore}
                                                onChange={(event) => updateAudienceFilter('odysseyScore', event.target.value)}
                                                className={AUDIENCE_SELECT_CLASS}
                                            >
                                                {SCORE_FILTERS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                                            </select>
                                        </div>

                                        <div className="space-y-2 rounded-2xl glass-field p-3">
                                            <p className="px-1 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">Events attended</p>
                                            <div className="grid grid-cols-[1fr_88px] gap-2">
                                                <select
                                                    value={audienceFilters.eventCountOperator}
                                                    onChange={(event) => updateAudienceFilter('eventCountOperator', event.target.value)}
                                                    className={AUDIENCE_SELECT_CLASS}
                                                >
                                                    {EVENT_COUNT_OPERATORS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                                                </select>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={audienceFilters.eventCountValue}
                                                    onChange={(event) => updateAudienceFilter('eventCountValue', event.target.value)}
                                                    className={AUDIENCE_INPUT_CLASS}
                                                    placeholder="0"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="dashboard-surface-b overflow-hidden rounded-[1.75rem] !border-0 p-2">
                                    <div className={`overflow-x-auto pb-1 ${AUDIENCE_SCROLLBAR_CLASS}`}>
                                        <table className="w-full min-w-[960px] border-separate [border-spacing:0_0.5rem] text-left">
                                            <thead className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
                                                <tr>
                                                    <th className="w-14 px-4 py-2">
                                                        <button
                                                            type="button"
                                                            onClick={toggleVisibleAudienceRows}
                                                            className="rounded-full glow-chip px-3 py-1.5 text-[10px] font-bold text-zinc-300 transition hover:bg-white/[0.1]"
                                                        >
                                                            All
                                                        </button>
                                                    </th>
                                                    <th className="px-4 py-2">Audience</th>
                                                    <th className="px-4 py-2">Price Paid</th>
                                                    <th className="px-4 py-2">Odyssey</th>
                                                    <th className="px-4 py-2">Events</th>
                                                    <th className="px-4 py-2">Invite</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredAudienceRows.map((row) => {
                                                    const selected = selectedAudienceRows.includes(row.id);
                                                    const rowSurface = selected ? 'bg-white/[0.09]' : 'bg-white/[0.02] backdrop-blur-md hover:bg-white/[0.055]';
                                                    return (
                                                        <tr key={row.id} className="group">
                                                            <td className={`rounded-l-2xl px-4 py-5 align-top transition-colors ${rowSurface}`}>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selected}
                                                                    onChange={() => toggleAudienceRow(row.id)}
                                                                    className="h-4 w-4 rounded-md bg-white/10 accent-zinc-200 [border:0] focus:outline-none"
                                                                    aria-label={`Select ${row.audienceName}`}
                                                                />
                                                            </td>
                                                            <td className={`px-4 py-5 align-top transition-colors ${rowSurface}`}>
                                                                <p className="text-base font-bold leading-6 text-white">{row.audienceName}</p>
                                                                <p className="mt-1 text-xs leading-5 text-zinc-500">{row.sourceEvent} · {row.rowType}</p>
                                                            </td>
                                                            <td className={`px-4 py-5 align-top font-mono text-sm font-bold text-zinc-200 transition-colors ${rowSurface}`}>
                                                                {formatMoney(row.pricePaid)}
                                                            </td>
                                                            <td className={`px-4 py-5 align-top transition-colors ${rowSurface}`}>
                                                                <p className="font-mono text-sm font-bold text-zinc-100">{row.odysseyScore.toLocaleString()}</p>
                                                                <p className="mt-1 text-[11px] leading-5 text-zinc-500">{row.stampTier}</p>
                                                            </td>
                                                            <td className={`px-4 py-5 align-top transition-colors ${rowSurface}`}>
                                                                <p className="font-mono text-sm font-bold text-zinc-100">{row.eventsAttendedCount}</p>
                                                            </td>
                                                            <td className={`rounded-r-2xl px-4 py-5 align-top text-sm font-semibold text-zinc-300 transition-colors ${rowSurface}`}>{row.inviteState}</td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                    {filteredAudienceRows.length === 0 ? (
                                        <div className="px-5 py-8 text-center text-sm leading-6 text-zinc-500">
                                            No audience rows match the current filters.
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        </SectionCard>
                    </div>
                </>
            ) : (
                <>
                    <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-xs font-semibold text-emerald-200">
                        Email campaigns are LIVE — send real emails to your opted-in attendees from{' '}
                        <a href="/dashboard/campaigns" className="underline">Email Campaigns</a>. The planner below is
                        for drafting your mix; SMS and feed placements are still coming.
                    </div>
                    <SectionCard
                        title="Campaign Management"
                        className={AUDIENCE_SECTION_CLASS}
                        bodyClassName={AUDIENCE_SECTION_BODY_CLASS}
                        actions={
                            <SegmentedToggle
                                value={activeCampaignTab}
                                onChange={setActiveCampaignTab}
                                ariaLabel="Campaign status"
                                items={CAMPAIGN_TABS.map((tab) => ({ value: tab.id, label: tab.label }))}
                            />
                        }
                    >
                        <CampaignList
                            items={campaignItemsByTab[activeCampaignTab]}
                            emptyTitle={`No ${activeCampaignTab} campaigns`}
                            emptyCopy="Save a segment or generate a draft."
                            selectedDraftId={selectedDraftId}
                            onOpenDraft={handleOpenDraft}
                            onUseDraft={handleUseDraft}
                            onDeleteDraft={handleDeleteDraft}
                            onManageActive={setActiveCampaignModal}
                        />
                    </SectionCard>

                    <div className="space-y-6">
                        <SectionCard
                            title="Marketing Mix Builder"
                            className={AUDIENCE_SECTION_CLASS}
                            bodyClassName={AUDIENCE_SECTION_BODY_CLASS}
                        >
                            <div className="space-y-5">
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    {MIX_CONTROLS.map((control) => {
                                        const active = Boolean(campaignMix[control.id]);
                                        return (
                                            <button
                                                key={control.id}
                                                type="button"
                                                onClick={() => toggleCampaignChannel(control.id)}
                                                className={`rounded-2xl px-4 py-4 text-left transition-colors ${
                                                    active ? 'glow-active' : 'glow-surface-soft hover:bg-white/[0.07]'
                                                }`}
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <p className="text-sm font-bold text-white">{control.label}</p>
                                                        <p className="mt-1 text-xs leading-5 text-zinc-500">{control.description}</p>
                                                    </div>
                                                    <span className={`mt-1 h-3 w-3 rounded-full ${active ? 'bg-zinc-100' : 'bg-white/15'}`} />
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="glow-surface-soft rounded-2xl px-4 py-4">
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <p className="text-sm font-bold text-white">Budget Allocation</p>
                                            <p className="mt-1 text-xs text-zinc-500">Set how much this campaign can spend across selected tools.</p>
                                        </div>
                                        <p className="text-2xl font-black text-white">${campaignMix.budget}</p>
                                    </div>
                                    <input
                                        type="range"
                                        min="100"
                                        max="1000"
                                        step="25"
                                        value={campaignMix.budget}
                                        onChange={(event) => updateCampaignBudget(event.target.value)}
                                        className="mt-4 h-2 w-full accent-zinc-200"
                                        aria-label="Budget allocation"
                                    />
                                    <div className="mt-2 flex justify-between text-[11px] font-semibold text-zinc-600">
                                        <span>$100</span>
                                        <span>$1,000</span>
                                    </div>
                                </div>

                                {selectedDraft ? (
                                    <div className="glow-surface-soft rounded-2xl px-4 py-4">
                                        <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Selected Draft</p>
                                        <p className="mt-2 text-sm font-bold text-white">{selectedDraft.title}</p>
                                        <p className="mt-1 text-xs text-zinc-500">{selectedDraft.stage} · {mixChannelLabel(selectedDraft.mix)}</p>
                                        {selectedDraft.insights?.length ? (
                                            <div className="mt-3 space-y-2">
                                                {selectedDraft.insights.slice(0, 2).map((insight) => (
                                                    <p key={insight} className="rounded-xl glass-field px-3 py-2 text-xs text-zinc-400">
                                                        {insight}
                                                    </p>
                                                ))}
                                            </div>
                                        ) : null}
                                    </div>
                                ) : null}
                            </div>
                        </SectionCard>

                        <SectionCard
                            title="Insights"
                            className={AUDIENCE_SECTION_CLASS}
                            bodyClassName={AUDIENCE_SECTION_BODY_CLASS}
                        >
                            <div className="space-y-4">
                                <div className="grid gap-3 md:grid-cols-3">
                                    {insightRecommendations.map((insight) => (
                                        <div key={insight} className="glow-surface-soft rounded-2xl px-4 py-4 text-sm leading-6 text-zinc-300">
                                            {insight}
                                        </div>
                                    ))}
                                </div>
                                <div className="flex flex-col gap-3 rounded-2xl glass-field px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-sm font-bold text-white">Recommendation</p>
                                        <p className="mt-1 text-xs text-zinc-500">Generate a campaign draft from the current audience and tool mix.</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleGenerateCampaignDraft}
                                        className="rounded-full bg-white px-5 py-3 text-xs font-black uppercase tracking-widest text-black transition hover:bg-zinc-200 whitespace-nowrap"
                                    >
                                        Generate Draft
                                    </button>
                                </div>
                            </div>
                        </SectionCard>
                    </div>
                </>
            )}
            <Modal
                open={!!activeCampaignModal}
                onClose={() => setActiveCampaignModal(null)}
                title={activeCampaignModal?.title || 'Campaign'}
                maxWidth="max-w-lg"
                footer={(
                    <>
                        <button
                            type="button"
                            onClick={() => handleActiveCampaignStatus('paused')}
                            disabled={activeCampaignModal?.status === 'paused' || activeCampaignModal?.status === 'cancelled'}
                            className="flex-1 rounded-xl glass-field px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/12 disabled:cursor-not-allowed disabled:opacity-40 whitespace-nowrap"
                        >
                            Pause
                        </button>
                        <button
                            type="button"
                            onClick={() => handleActiveCampaignStatus('active')}
                            disabled={activeCampaignModal?.status === 'active' || activeCampaignModal?.status === 'cancelled'}
                            className="flex-1 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40 whitespace-nowrap"
                        >
                            Resume
                        </button>
                        <button
                            type="button"
                            onClick={() => handleActiveCampaignStatus('cancelled')}
                            disabled={activeCampaignModal?.status === 'cancelled'}
                            className="flex-1 rounded-xl bg-red-500/20 px-4 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/30 disabled:cursor-not-allowed disabled:opacity-40 whitespace-nowrap"
                        >
                            Cancel
                        </button>
                    </>
                )}
            >
                <div className="space-y-4">
                    <div className="rounded-2xl glass-field px-4 py-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Status</p>
                        <p className="mt-2 text-sm font-bold text-white">{activeCampaignModal?.statusLabel || 'Active'}</p>
                        <p className="mt-1 text-xs text-zinc-500">{activeCampaignModal?.audience}</p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl glass-field px-4 py-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Tools</p>
                            <p className="mt-2 text-sm font-bold text-white">{activeCampaignModal?.channels}</p>
                        </div>
                        <div className="rounded-2xl glass-field px-4 py-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Budget</p>
                            <p className="mt-2 text-sm font-bold text-white">${activeCampaignModal?.budget || 0}</p>
                        </div>
                    </div>
                    <div className="rounded-2xl glass-field px-4 py-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Schedule</p>
                        <p className="mt-2 text-sm font-bold text-white">{activeCampaignModal?.schedule}</p>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
