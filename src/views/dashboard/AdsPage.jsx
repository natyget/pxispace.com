'use client';

// Ads Manager (W12): promote one or more events as "Sponsored" creatives across
// the mobile feed, mobile discovery, web discovery, and the web featured hero —
// plus an optional email blast. Targeting → live reach; per-surface intensity →
// live quote; credits apply first, Stripe covers any remainder.

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import SectionCard from '@/components/dashboard/SectionCard';
import MetricCard, { StatRow } from '@/components/dashboard/MetricCard';
import SegmentedToggle from '@/components/dashboard/SegmentedToggle';
import { TimeSeriesChartShell, RechartsChart } from '@/components/dashboard/ChartFrame';
import { StripePaymentModal } from '@/components/checkout/StripePaymentModal';
import { useAdCampaigns, useEvents } from '@/lib/dashboardStore';
import {
    AD_AGE_BRACKETS,
    AD_INTENSITIES,
    AD_SURFACES,
    AD_XP_TIERS,
    adReachEstimate,
    cancelAdCampaign,
    createAdCampaign,
    getAdPerformance,
    pauseAdCampaign,
    payAdCampaign,
    quoteAd,
    resumeAdCampaign,
} from '@/services/ads';

const inputCls =
    'dashboard-input min-h-12 w-full px-4 py-3 text-sm font-semibold text-white placeholder:text-white/35';

const statusStyle = {
    DRAFT: 'bg-white/5 text-white/60',
    PENDING_PAYMENT: 'bg-amber-500/10 text-amber-300',
    SCHEDULED: 'bg-sky-500/10 text-sky-300',
    ACTIVE: 'bg-emerald-500/10 text-emerald-300',
    PAUSED: 'bg-orange-500/10 text-orange-300',
    COMPLETED: 'bg-white/10 text-white/70',
    CANCELLED: 'bg-white/5 text-white/40',
};

const SURFACE_LABELS = Object.fromEntries(AD_SURFACES.map((s) => [s.id, s.label]));

function formatUsd(cents) {
    return `$${(Number(cents || 0) / 100).toFixed(2)}`;
}

function formatDay(iso) {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
        return '—';
    }
}

function formatCtr(impressions, clicks) {
    if (!impressions) return '0%';
    return `${((clicks / impressions) * 100).toFixed(1)}%`;
}

function toDateInputValue(date) {
    return date.toISOString().slice(0, 10);
}

function adsErrorMessage(error, fallback) {
    const raw = error?.data?.error || error?.data?.message || error?.message || '';
    if (error?.status === 404 || /not found/i.test(raw)) {
        return 'The ads service is not available in this environment yet.';
    }
    return raw || fallback;
}

/** Multi-select chip row used across the wizard steps. */
function ChipPicker({ options, selected, onToggle }) {
    return (
        <div className="flex flex-wrap gap-2">
            {options.map((option) => {
                const active = selected.includes(option.id);
                return (
                    <button
                        key={option.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => onToggle(option.id)}
                        className={`rounded-full px-3.5 py-2 text-xs font-bold transition ${
                            active
                                ? 'bg-white text-black'
                                : 'bg-white/[0.06] text-zinc-300 hover:bg-white/[0.12]'
                        }`}
                    >
                        {option.label}
                    </button>
                );
            })}
        </div>
    );
}

/** Cover-art event cards for Ads Manager step 0 (upcoming events only). */
function EventCoverPicker({ events, selected, onToggle }) {
    return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {events.map((ev) => {
                const id = String(ev.id);
                const active = selected.includes(id);
                const dateLabel = (() => {
                    try {
                        return new Date(ev.startDate).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                        });
                    } catch {
                        return '—';
                    }
                })();
                return (
                    <button
                        key={id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => onToggle(id)}
                        className={`group overflow-hidden rounded-2xl text-left transition ${
                            active
                                ? 'ring-2 ring-white ring-offset-2 ring-offset-black'
                                : 'ring-1 ring-white/10 hover:ring-white/25'
                        }`}
                    >
                        <div className="relative aspect-[3/4] bg-zinc-900">
                            {ev.coverImage ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={ev.coverImage}
                                    alt=""
                                    className="h-full w-full object-cover"
                                    loading="lazy"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center bg-white/[0.04] text-xs font-bold text-zinc-600">
                                    No cover
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                            {active ? (
                                <span className="absolute right-2 top-2 rounded-full bg-white px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-black">
                                    Selected
                                </span>
                            ) : null}
                            <div className="absolute bottom-0 left-0 right-0 p-3">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-300">
                                    {dateLabel}
                                </p>
                                <p className="mt-0.5 line-clamp-2 text-sm font-black uppercase leading-tight text-white">
                                    {ev.name}
                                </p>
                            </div>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}

function isUpcomingAdEvent(ev, now = Date.now()) {
    if (!ev) return false;
    const status = String(ev.status || ev.effectiveStatus || '').toUpperCase();
    if (status === 'ARCHIVED' || status === 'CANCELLED') return false;
    const endMs = ev.endDate ? new Date(ev.endDate).getTime() : NaN;
    const startMs = ev.startDate ? new Date(ev.startDate).getTime() : NaN;
    if (Number.isFinite(endMs)) return endMs >= now;
    if (Number.isFinite(startMs)) return startMs >= now;
    return false;
}

/** Free-text tag input (cities, genres): Enter/comma adds a chip. */
function TagInput({ tags, onChange, placeholder }) {
    const [draft, setDraft] = useState('');
    const commit = () => {
        const value = draft.trim().replace(/,+$/, '');
        if (value && !tags.some((t) => t.toLowerCase() === value.toLowerCase())) {
            onChange([...tags, value]);
        }
        setDraft('');
    };
    return (
        <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.08] px-3 py-1.5 text-xs font-bold text-white">
                        {tag}
                        <button
                            type="button"
                            aria-label={`Remove ${tag}`}
                            onClick={() => onChange(tags.filter((t) => t !== tag))}
                            className="text-white/50 hover:text-white"
                        >
                            ×
                        </button>
                    </span>
                ))}
            </div>
            <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault();
                        commit();
                    }
                }}
                onBlur={commit}
                placeholder={placeholder}
                className={inputCls}
            />
        </div>
    );
}

const WIZARD_STEPS = ['Events', 'Audience', 'Channels', 'Schedule', 'Review'];

const emptyDraft = () => ({
    name: '',
    eventIds: [],
    cities: [],
    ageBrackets: [],
    genres: [],
    xpTiers: [],
    attendance: '',
    frequencyCapPerDay: 3,
    placements: { FEED: 'STANDARD' },
    emailEnabled: false,
    emailSubject: '',
    emailBody: '',
    startAt: toDateInputValue(new Date()),
    endAt: toDateInputValue(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
});

function draftTargeting(draft) {
    return {
        cities: draft.cities,
        ageBrackets: draft.ageBrackets,
        genres: draft.genres,
        xpTiers: draft.xpTiers,
        attendance: draft.attendance === 'ANY_PAST' ? 'ANY_PAST' : null,
    };
}

function draftPlacements(draft) {
    return Object.entries(draft.placements).map(([surface, intensity]) => ({ surface, intensity }));
}

export default function AdsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { campaigns, loading, refresh, invalidate } = useAdCampaigns();
    const { events } = useEvents();

    const upcomingEvents = useMemo(
        () =>
            (events || [])
                .filter((ev) => isUpcomingAdEvent(ev))
                .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()),
        [events],
    );
    const upcomingIds = useMemo(
        () => new Set(upcomingEvents.map((ev) => String(ev.id))),
        [upcomingEvents],
    );

    const [error, setError] = useState(null);
    const [wizardOpen, setWizardOpen] = useState(false);
    const [step, setStep] = useState(0);
    const [draft, setDraft] = useState(emptyDraft);
    const [reach, setReach] = useState(null);
    const [quote, setQuote] = useState(null);
    const [busy, setBusy] = useState(false);
    const [payState, setPayState] = useState(null); // { campaignId, clientSecret }
    const [actionBusyId, setActionBusyId] = useState(null);
    const [perfCampaignId, setPerfCampaignId] = useState(null);
    const [perfDays, setPerfDays] = useState(30);
    const [performance, setPerformance] = useState(null);

    const patchDraft = useCallback((patch) => setDraft((prev) => ({ ...prev, ...patch })), []);

    // Deep-link prefill from the AudiencePage planner / mobile boost:
    // ?create=1&mix=feed,email&budget=…&events=a,b — preserve preselection until
    // events load, then drop stale (past/archived) IDs.
    useEffect(() => {
        if (searchParams.get('create') !== '1') return;
        const mix = (searchParams.get('mix') || '').split(',').filter(Boolean);
        const requestedIds = (searchParams.get('events') || '').split(',').filter(Boolean);
        const placements = {};
        if (mix.includes('feedPosts') || mix.includes('feed')) placements.FEED = 'STANDARD';
        if (mix.includes('discoveryRanking') || mix.includes('discovery')) {
            placements.DISCOVERY = 'STANDARD';
            placements.WEB_DISCOVERY = 'STANDARD';
        }
        if (mix.includes('featured')) placements.WEB_FEATURED = 'STANDARD';
        setDraft((prev) => ({
            ...prev,
            // Keep raw IDs for now; the cleanup effect filters once events are known.
            eventIds: requestedIds.length > 0 ? requestedIds : prev.eventIds,
            emailEnabled: mix.includes('email'),
            placements: Object.keys(placements).length > 0 ? placements : prev.placements,
        }));
        setWizardOpen(true);
        router.replace('/dashboard/ads', { scroll: false });
    }, [router, searchParams]);

    // Drop stale selected IDs once events load (past / archived / deleted).
    useEffect(() => {
        if (!events?.length) return;
        setDraft((prev) => {
            const next = prev.eventIds.filter((id) => upcomingIds.has(id));
            if (next.length === prev.eventIds.length) return prev;
            return { ...prev, eventIds: next };
        });
    }, [events, upcomingIds]);

    // Live reach estimate while targeting changes (debounced).
    useEffect(() => {
        if (!wizardOpen) return;
        let cancelled = false;
        const timer = setTimeout(() => {
            adReachEstimate(draftTargeting(draft))
                .then((counts) => {
                    if (!cancelled) setReach(counts);
                })
                .catch(() => {
                    if (!cancelled) setReach(null);
                });
        }, 400);
        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [wizardOpen, draft.cities, draft.ageBrackets, draft.genres, draft.xpTiers, draft.attendance]); // eslint-disable-line react-hooks/exhaustive-deps

    // Live quote while channels/schedule change (debounced).
    useEffect(() => {
        if (!wizardOpen) return;
        let cancelled = false;
        const timer = setTimeout(() => {
            quoteAd({
                placements: draftPlacements(draft),
                startAt: new Date(`${draft.startAt}T00:00:00`).toISOString(),
                endAt: new Date(`${draft.endAt}T23:59:59`).toISOString(),
                emailEnabled: draft.emailEnabled,
                targeting: draftTargeting(draft),
            })
                .then((q) => {
                    if (!cancelled) setQuote(q);
                })
                .catch(() => {
                    if (!cancelled) setQuote(null);
                });
        }, 400);
        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [wizardOpen, draft.placements, draft.startAt, draft.endAt, draft.emailEnabled, draft.cities, draft.ageBrackets, draft.genres, draft.xpTiers, draft.attendance]); // eslint-disable-line react-hooks/exhaustive-deps

    // Performance panel loads for the selected campaign.
    useEffect(() => {
        if (!perfCampaignId) {
            setPerformance(null);
            return;
        }
        let cancelled = false;
        getAdPerformance(perfCampaignId, perfDays)
            .then((res) => {
                if (!cancelled) setPerformance(res.performance);
            })
            .catch((err) => {
                if (!cancelled) setError(adsErrorMessage(err, 'Failed to load performance'));
            });
        return () => {
            cancelled = true;
        };
    }, [perfCampaignId, perfDays]);

    const totals = useMemo(() => {
        const active = campaigns.filter((c) => c.status === 'ACTIVE').length;
        const paidStatuses = new Set(['SCHEDULED', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED']);
        const spendCents = campaigns
            .filter((c) => paidStatuses.has(c.status))
            .reduce((sum, c) => sum + (c.creditAppliedCents || 0) + (c.stripeAmountCents || 0), 0);
        const impressions = campaigns.reduce((sum, c) => sum + (c.stats?.impressions || 0), 0);
        const clicks = campaigns.reduce((sum, c) => sum + (c.stats?.clicks || 0), 0);
        return { active, spendCents, impressions, clicks };
    }, [campaigns]);

    const toggleListValue = (key) => (id) =>
        setDraft((prev) => {
            const list = prev[key];
            return { ...prev, [key]: list.includes(id) ? list.filter((v) => v !== id) : [...list, id] };
        });

    const toggleSurface = (surface) =>
        setDraft((prev) => {
            const placements = { ...prev.placements };
            if (placements[surface]) delete placements[surface];
            else placements[surface] = 'STANDARD';
            return { ...prev, placements };
        });

    const setIntensity = (surface, intensity) =>
        setDraft((prev) => ({ ...prev, placements: { ...prev.placements, [surface]: intensity } }));

    const stepValid = useMemo(() => {
        if (step === 0) return draft.name.trim().length > 0 && draft.eventIds.length > 0;
        if (step === 2) {
            if (draft.emailEnabled && (!draft.emailSubject.trim() || !draft.emailBody.trim())) return false;
            return Object.keys(draft.placements).length > 0 || draft.emailEnabled;
        }
        if (step === 3) return draft.startAt && draft.endAt && draft.endAt > draft.startAt;
        return true;
    }, [step, draft]);

    const launchCampaign = async () => {
        setBusy(true);
        setError(null);
        try {
            const { campaign } = await createAdCampaign({
                name: draft.name.trim(),
                eventIds: draft.eventIds,
                startAt: new Date(`${draft.startAt}T00:00:00`).toISOString(),
                endAt: new Date(`${draft.endAt}T23:59:59`).toISOString(),
                placements: draftPlacements(draft),
                emailEnabled: draft.emailEnabled,
                ...(draft.emailEnabled
                    ? { emailSubject: draft.emailSubject.trim(), emailBody: draft.emailBody.trim() }
                    : {}),
                targeting: draftTargeting(draft),
                frequencyCapPerDay: draft.frequencyCapPerDay,
            });
            const pay = await payAdCampaign(campaign.id);
            if (pay.paid) {
                closeWizard();
                invalidate();
                refresh({ force: true });
            } else {
                setPayState({ campaignId: campaign.id, clientSecret: pay.clientSecret });
            }
        } catch (err) {
            setError(adsErrorMessage(err, 'Failed to launch campaign'));
        } finally {
            setBusy(false);
        }
    };

    const closeWizard = () => {
        setWizardOpen(false);
        setStep(0);
        setDraft(emptyDraft());
        setQuote(null);
        setReach(null);
    };

    const runAction = async (campaignId, action) => {
        setActionBusyId(campaignId);
        setError(null);
        try {
            if (action === 'pause') await pauseAdCampaign(campaignId);
            if (action === 'resume') await resumeAdCampaign(campaignId);
            if (action === 'cancel') await cancelAdCampaign(campaignId);
            invalidate();
            await refresh({ force: true });
        } catch (err) {
            setError(adsErrorMessage(err, `Failed to ${action} campaign`));
        } finally {
            setActionBusyId(null);
        }
    };

    const perfCampaign = campaigns.find((c) => c.id === perfCampaignId) || null;

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            <section className="dashboard-surface-b rounded-[1.25rem] px-5 py-6 md:px-7">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-2xl">
                        <p className="text-[11px] font-medium tracking-[0.02em] text-zinc-500">Growth</p>
                        <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-white md:text-[28px]">Ads Manager</h1>
                        <p className="mt-2 text-sm leading-6 text-zinc-400">
                            Promote your events across the PXI mobile feed, discovery, the web featured hero, and email —
                            targeted by city, age, music taste, and attendance. Credits apply first; cards cover the rest.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/dashboard/campaigns" className="pill-ghost px-4 py-2.5 text-xs font-bold text-zinc-300">
                            Email Campaigns →
                        </Link>
                        <button
                            type="button"
                            onClick={() => (wizardOpen ? closeWizard() : setWizardOpen(true))}
                            className="pill-solid min-h-12 px-6 text-sm"
                        >
                            {wizardOpen ? 'Close' : 'New campaign'}
                        </button>
                    </div>
                </div>
            </section>

            {error ? (
                <div className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm font-semibold leading-6 text-red-100">{error}</div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard title="Active campaigns" value={loading ? '—' : totals.active} description="Serving now" trend="neutral" />
                <MetricCard title="Total spend" value={loading ? '—' : formatUsd(totals.spendCents)} description="Credits + card" trend="neutral" />
                <MetricCard title="Impressions" value={loading ? '—' : totals.impressions.toLocaleString()} description="All campaigns" trend="up" />
                <MetricCard title="CTR" value={loading ? '—' : formatCtr(totals.impressions, totals.clicks)} description={`${totals.clicks.toLocaleString()} clicks`} trend="neutral" />
            </div>

            {wizardOpen ? (
                <SectionCard
                    title={`New campaign — ${WIZARD_STEPS[step]}`}
                    dense
                    className="dashboard-surface-b !shadow-[0_22px_70px_rgba(0,0,0,0.28)]"
                    actions={
                        <div className="dashboard-segmented-toggle" aria-label="Wizard steps">
                            {WIZARD_STEPS.map((label, index) => (
                                <button
                                    key={label}
                                    type="button"
                                    className="dashboard-segmented-toggle__item"
                                    data-active={index === step}
                                    onClick={() => index < step && setStep(index)}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    }
                >
                    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
                        <div className="space-y-5">
                            {step === 0 ? (
                                <>
                                    <label className="block space-y-2">
                                        <span className="px-1 text-[11px] font-medium tracking-[0.02em] text-zinc-500">Campaign name</span>
                                        <input
                                            value={draft.name}
                                            onChange={(e) => patchDraft({ name: e.target.value })}
                                            placeholder="Summer rooftop push"
                                            className={inputCls}
                                        />
                                    </label>
                                    <div className="space-y-2">
                                        <span className="px-1 text-[11px] font-medium tracking-[0.02em] text-zinc-500">
                                            Events to promote ({draft.eventIds.length} selected)
                                        </span>
                                        {upcomingEvents.length === 0 ? (
                                            <p className="rounded-2xl bg-white/[0.035] px-4 py-4 text-sm text-zinc-500">
                                                No upcoming events to promote — create a future event first, or wait
                                                until one is scheduled.
                                            </p>
                                        ) : (
                                            <EventCoverPicker
                                                events={upcomingEvents}
                                                selected={draft.eventIds}
                                                onToggle={toggleListValue('eventIds')}
                                            />
                                        )}
                                    </div>
                                </>
                            ) : null}

                            {step === 1 ? (
                                <>
                                    <div className="space-y-2">
                                        <span className="px-1 text-[11px] font-medium tracking-[0.02em] text-zinc-500">Cities</span>
                                        <TagInput
                                            tags={draft.cities}
                                            onChange={(cities) => patchDraft({ cities })}
                                            placeholder="Add a city and press Enter (empty = everywhere)"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <span className="px-1 text-[11px] font-medium tracking-[0.02em] text-zinc-500">Age brackets</span>
                                        <ChipPicker
                                            options={AD_AGE_BRACKETS.map((b) => ({ id: b, label: b }))}
                                            selected={draft.ageBrackets}
                                            onToggle={toggleListValue('ageBrackets')}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <span className="px-1 text-[11px] font-medium tracking-[0.02em] text-zinc-500">Music genres</span>
                                        <TagInput
                                            tags={draft.genres}
                                            onChange={(genres) => patchDraft({ genres })}
                                            placeholder="e.g. house, afrobeats — matches listeners' taste profiles"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <span className="px-1 text-[11px] font-medium tracking-[0.02em] text-zinc-500">Passport tier</span>
                                        <ChipPicker options={AD_XP_TIERS} selected={draft.xpTiers} onToggle={toggleListValue('xpTiers')} />
                                    </div>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <label className="space-y-2">
                                            <span className="px-1 text-[11px] font-medium tracking-[0.02em] text-zinc-500">Attendance</span>
                                            <select
                                                value={draft.attendance}
                                                onChange={(e) => patchDraft({ attendance: e.target.value })}
                                                className={`${inputCls} appearance-none`}
                                            >
                                                <option value="">Anyone</option>
                                                <option value="ANY_PAST">Has attended a PXI event</option>
                                            </select>
                                        </label>
                                        <label className="space-y-2">
                                            <span className="px-1 text-[11px] font-medium tracking-[0.02em] text-zinc-500">Frequency cap / day</span>
                                            <input
                                                type="number"
                                                min={1}
                                                max={20}
                                                value={draft.frequencyCapPerDay}
                                                onChange={(e) => patchDraft({ frequencyCapPerDay: Math.max(1, Math.min(20, Number(e.target.value) || 3)) })}
                                                className={inputCls}
                                            />
                                        </label>
                                    </div>
                                    <p className="rounded-2xl bg-white/[0.035] px-4 py-3 text-xs leading-5 text-zinc-500">
                                        Any filter limits delivery to signed-in members who match. Leave everything empty to
                                        also reach logged-out visitors on the web surfaces.
                                    </p>
                                </>
                            ) : null}

                            {step === 2 ? (
                                <>
                                    <div className="space-y-3">
                                        {AD_SURFACES.map((surface) => {
                                            const enabled = Boolean(draft.placements[surface.id]);
                                            return (
                                                <div key={surface.id} className="rounded-2xl bg-white/[0.045] p-4">
                                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                                        <button
                                                            type="button"
                                                            aria-pressed={enabled}
                                                            onClick={() => toggleSurface(surface.id)}
                                                            className={`rounded-full px-4 py-2 text-xs font-bold tracking-[0.02em] transition ${
                                                                enabled ? 'bg-white text-black' : 'bg-white/[0.07] text-zinc-400 hover:bg-white/[0.12]'
                                                            }`}
                                                        >
                                                            {surface.label}
                                                        </button>
                                                        {enabled ? (
                                                            <SegmentedToggle
                                                                items={AD_INTENSITIES.map((i) => ({ id: i.id, label: i.label }))}
                                                                value={draft.placements[surface.id]}
                                                                onChange={(intensity) => setIntensity(surface.id, intensity)}
                                                                ariaLabel={`${surface.label} intensity`}
                                                            />
                                                        ) : null}
                                                    </div>
                                                    <p className="mt-2 text-xs text-zinc-500">{surface.hint}</p>
                                                </div>
                                            );
                                        })}
                                        <div className="rounded-2xl bg-white/[0.03] p-4 opacity-60">
                                            <div className="flex items-center justify-between gap-3">
                                                <span className="rounded-full bg-white/[0.06] px-4 py-2 text-xs font-bold tracking-[0.02em] text-zinc-500">
                                                    SMS
                                                </span>
                                                <span className="rounded-full bg-white/[0.06] px-3 py-1.5 text-[11px] font-medium tracking-[0.02em] text-zinc-500">
                                                    Coming soon
                                                </span>
                                            </div>
                                            <p className="mt-2 text-xs text-zinc-600">Last-call texts to opted-in guests.</p>
                                        </div>
                                    </div>
                                    <div className="rounded-2xl bg-white/[0.045] p-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <button
                                                type="button"
                                                aria-pressed={draft.emailEnabled}
                                                onClick={() => patchDraft({ emailEnabled: !draft.emailEnabled })}
                                                className={`rounded-full px-4 py-2 text-xs font-bold tracking-[0.02em] transition ${
                                                    draft.emailEnabled ? 'bg-white text-black' : 'bg-white/[0.07] text-zinc-400 hover:bg-white/[0.12]'
                                                }`}
                                            >
                                                Email blast
                                            </button>
                                            <span className="text-xs text-zinc-500">
                                                {reach ? `${reach.emailOptInMatched.toLocaleString()} opted-in recipients` : 'Sent once at launch'}
                                            </span>
                                        </div>
                                        {draft.emailEnabled ? (
                                            <div className="mt-4 space-y-3">
                                                <input
                                                    value={draft.emailSubject}
                                                    onChange={(e) => patchDraft({ emailSubject: e.target.value })}
                                                    placeholder="Subject line"
                                                    className={inputCls}
                                                />
                                                <textarea
                                                    value={draft.emailBody}
                                                    onChange={(e) => patchDraft({ emailBody: e.target.value })}
                                                    rows={5}
                                                    placeholder={'Write your message...\n\nLabeled "Sponsored"; unsubscribe link added automatically.'}
                                                    className={`${inputCls} resize-y rounded-[1.25rem]`}
                                                />
                                            </div>
                                        ) : null}
                                    </div>
                                </>
                            ) : null}

                            {step === 3 ? (
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <label className="space-y-2">
                                        <span className="px-1 text-[11px] font-medium tracking-[0.02em] text-zinc-500">Starts</span>
                                        <input
                                            type="date"
                                            value={draft.startAt}
                                            onChange={(e) => patchDraft({ startAt: e.target.value })}
                                            className={inputCls}
                                        />
                                    </label>
                                    <label className="space-y-2">
                                        <span className="px-1 text-[11px] font-medium tracking-[0.02em] text-zinc-500">Ends</span>
                                        <input
                                            type="date"
                                            value={draft.endAt}
                                            min={draft.startAt}
                                            onChange={(e) => patchDraft({ endAt: e.target.value })}
                                            className={inputCls}
                                        />
                                    </label>
                                    {quote?.lineItems?.length ? (
                                        <div className="sm:col-span-2 space-y-2">
                                            {quote.lineItems.map((li) => (
                                                <div key={li.surface} className="flex items-center justify-between rounded-2xl bg-white/[0.045] px-4 py-3 text-sm">
                                                    <span className="font-bold text-white">
                                                        {SURFACE_LABELS[li.surface] || li.surface}
                                                        <span className="ml-2 text-xs font-semibold text-zinc-500">
                                                            {li.intensity.toLowerCase()} · {li.days}d
                                                        </span>
                                                    </span>
                                                    <span className="font-bold tabular-nums text-white">{formatUsd(li.priceCents)}</span>
                                                </div>
                                            ))}
                                            {draft.emailEnabled ? (
                                                <div className="flex items-center justify-between rounded-2xl bg-white/[0.045] px-4 py-3 text-sm">
                                                    <span className="font-bold text-white">
                                                        Email blast
                                                        <span className="ml-2 text-xs font-semibold text-zinc-500">
                                                            {quote.emailRecipientCount} recipients
                                                        </span>
                                                    </span>
                                                    <span className="font-bold tabular-nums text-white">{formatUsd(quote.emailPriceCents)}</span>
                                                </div>
                                            ) : null}
                                        </div>
                                    ) : null}
                                </div>
                            ) : null}

                            {step === 4 ? (
                                <div className="space-y-3">
                                    <StatRow
                                        items={[
                                            { label: 'Events', value: draft.eventIds.length },
                                            { label: 'Reach', value: reach ? reach.totalMatched.toLocaleString() : '—' },
                                            { label: 'Total', value: quote ? formatUsd(quote.totalCents) : '—' },
                                        ]}
                                    />
                                    <div className="rounded-2xl bg-white/[0.045] px-4 py-4 text-sm leading-6 text-zinc-400">
                                        <p>
                                            <span className="font-bold text-white">{draft.name || 'Untitled campaign'}</span> ·{' '}
                                            {formatDay(draft.startAt)} → {formatDay(draft.endAt)}
                                        </p>
                                        <p className="mt-1">
                                            Surfaces:{' '}
                                            <span className="font-bold text-white">
                                                {Object.entries(draft.placements)
                                                    .map(([surface, intensity]) => `${SURFACE_LABELS[surface]} (${intensity.toLowerCase()})`)
                                                    .join(', ') || 'none'}
                                            </span>
                                            {draft.emailEnabled ? ' + Email blast' : ''}
                                        </p>
                                        {quote ? (
                                            <p className="mt-1">
                                                Credits cover <span className="font-bold text-white">{formatUsd(quote.creditAppliedCents)}</span>
                                                {quote.stripeRemainderCents > 0 ? (
                                                    <>
                                                        {' '}· card pays{' '}
                                                        <span className="font-bold text-white">{formatUsd(quote.stripeRemainderCents)}</span>
                                                    </>
                                                ) : (
                                                    ' — no card needed'
                                                )}
                                            </p>
                                        ) : null}
                                    </div>
                                </div>
                            ) : null}

                            <div className="flex items-center justify-between gap-3 pt-1">
                                <button
                                    type="button"
                                    onClick={() => (step === 0 ? closeWizard() : setStep(step - 1))}
                                    className="pill-ghost px-5 py-2.5 text-xs font-bold text-zinc-300"
                                >
                                    {step === 0 ? 'Cancel' : 'Back'}
                                </button>
                                {step < WIZARD_STEPS.length - 1 ? (
                                    <button
                                        type="button"
                                        disabled={!stepValid}
                                        onClick={() => setStep(step + 1)}
                                        className="pill-solid min-h-11 px-6 text-sm disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        Continue
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        disabled={busy || !quote || quote.totalCents <= 0}
                                        onClick={launchCampaign}
                                        className="pill-solid min-h-11 px-6 text-sm disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        {busy
                                            ? 'Launching...'
                                            : quote?.stripeRemainderCents > 0
                                                ? `Pay ${formatUsd(quote.stripeRemainderCents)} & launch`
                                                : 'Launch with credits'}
                                    </button>
                                )}
                            </div>
                        </div>

                        <aside className="flex h-fit flex-col gap-4 rounded-[1rem] bg-white/[0.045] p-5">
                            <div>
                                <p className="text-[11px] font-medium tracking-[0.02em] text-zinc-500">Estimated reach</p>
                                <p className="mt-2 text-3xl font-bold tabular-nums text-white">
                                    {reach ? reach.totalMatched.toLocaleString() : '—'}
                                </p>
                                <p className="mt-1 text-xs text-zinc-500">
                                    {reach ? `${reach.emailOptInMatched.toLocaleString()} reachable by email` : 'Matching audience…'}
                                </p>
                            </div>
                            <div>
                                <p className="text-[11px] font-medium tracking-[0.02em] text-zinc-500">Quote</p>
                                <p className="mt-2 text-3xl font-bold tabular-nums text-white">
                                    {quote ? formatUsd(quote.totalCents) : '—'}
                                </p>
                                {quote ? (
                                    <p className="mt-1 text-xs text-zinc-500">
                                        {formatUsd(quote.creditAppliedCents)} credits · {formatUsd(quote.stripeRemainderCents)} card
                                    </p>
                                ) : (
                                    <p className="mt-1 text-xs text-zinc-500">Enable a surface to price the run.</p>
                                )}
                            </div>
                            <p className="rounded-2xl bg-white/[0.035] px-3 py-3 text-xs leading-5 text-zinc-500">
                                Creatives are always labeled “Sponsored”. PXI staff can pause any campaign that breaks
                                the guidelines; unserved days refund as credits if you cancel.
                            </p>
                        </aside>
                    </div>
                </SectionCard>
            ) : null}

            <SectionCard title="Campaigns" dense className="dashboard-surface !shadow-[0_18px_54px_rgba(0,0,0,0.24)]">
                {loading ? (
                    <p className="px-2 py-4 text-sm text-zinc-500">Loading...</p>
                ) : campaigns.length === 0 ? (
                    <div className="rounded-2xl bg-white/[0.035] px-5 py-8 text-center">
                        <p className="text-sm font-bold text-white">No ad campaigns yet.</p>
                        <p className="mt-2 text-sm text-zinc-500">
                            Launch your first campaign to pin your event on the featured hero and drop sponsored cards in the feed.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {campaigns.map((c) => {
                            const stats = c.stats || { impressions: 0, clicks: 0 };
                            const busyRow = actionBusyId === c.id;
                            return (
                                <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-3.5">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="truncate text-sm font-bold text-white">{c.name}</p>
                                            <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium tracking-[0.02em] ${statusStyle[c.status] || statusStyle.DRAFT}`}>
                                                {String(c.status).replaceAll('_', ' ')}
                                            </span>
                                            {c.pausedByAdmin ? (
                                                <span className="inline-flex rounded-full bg-red-500/10 px-2.5 py-1 text-[11px] font-medium tracking-[0.02em] text-red-300">
                                                    Staff hold
                                                </span>
                                            ) : null}
                                        </div>
                                        <p className="mt-1 truncate text-xs text-zinc-500">
                                            {formatDay(c.startAt)} → {formatDay(c.endAt)} · {formatUsd(c.priceCents)} ·{' '}
                                            {(c.placements || []).map((p) => SURFACE_LABELS[p.surface] || p.surface).join(', ') || 'No surfaces'}
                                            {c.emailEnabled ? ' · Email' : ''} · {stats.impressions.toLocaleString()} impr ·{' '}
                                            {stats.clicks.toLocaleString()} clicks · {formatCtr(stats.impressions, stats.clicks)} CTR
                                        </p>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-2">
                                        {c.status === 'DRAFT' || c.status === 'PENDING_PAYMENT' ? (
                                            <button
                                                type="button"
                                                disabled={busyRow}
                                                onClick={async () => {
                                                    setActionBusyId(c.id);
                                                    setError(null);
                                                    try {
                                                        const pay = await payAdCampaign(c.id);
                                                        if (pay.paid) {
                                                            invalidate();
                                                            await refresh({ force: true });
                                                        } else {
                                                            setPayState({ campaignId: c.id, clientSecret: pay.clientSecret });
                                                        }
                                                    } catch (err) {
                                                        setError(adsErrorMessage(err, 'Failed to start payment'));
                                                    } finally {
                                                        setActionBusyId(null);
                                                    }
                                                }}
                                                className="pill-solid px-3.5 py-2 text-xs disabled:opacity-40"
                                            >
                                                Pay &amp; launch
                                            </button>
                                        ) : null}
                                        <button
                                            type="button"
                                            onClick={() => setPerfCampaignId(perfCampaignId === c.id ? null : c.id)}
                                            className="pill-ghost px-3.5 py-2 text-xs font-bold text-zinc-300"
                                        >
                                            {perfCampaignId === c.id ? 'Hide' : 'Performance'}
                                        </button>
                                        {c.status === 'ACTIVE' || c.status === 'SCHEDULED' ? (
                                            <button
                                                type="button"
                                                disabled={busyRow}
                                                onClick={() => runAction(c.id, 'pause')}
                                                className="pill-ghost px-3.5 py-2 text-xs font-bold text-zinc-300 disabled:opacity-40"
                                            >
                                                Pause
                                            </button>
                                        ) : null}
                                        {c.status === 'PAUSED' && !c.pausedByAdmin ? (
                                            <button
                                                type="button"
                                                disabled={busyRow}
                                                onClick={() => runAction(c.id, 'resume')}
                                                className="pill-ghost px-3.5 py-2 text-xs font-bold text-zinc-300 disabled:opacity-40"
                                            >
                                                Resume
                                            </button>
                                        ) : null}
                                        {['DRAFT', 'PENDING_PAYMENT', 'SCHEDULED', 'ACTIVE', 'PAUSED'].includes(c.status) ? (
                                            <button
                                                type="button"
                                                disabled={busyRow}
                                                onClick={() => runAction(c.id, 'cancel')}
                                                className="pill-ghost px-3.5 py-2 text-xs font-bold text-red-300/90 disabled:opacity-40"
                                            >
                                                Cancel
                                            </button>
                                        ) : null}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </SectionCard>

            {perfCampaign && performance ? (
                <>
                    <TimeSeriesChartShell
                        title={`${perfCampaign.name} — delivery`}
                        subheading="Impressions and clicks per day"
                        liveValue={performance.totals.impressions.toLocaleString()}
                        unit="impressions"
                        change={{
                            label: `${formatCtr(performance.totals.impressions, performance.totals.clicks)} CTR`,
                            tone: performance.totals.clicks > 0 ? 'positive' : 'neutral',
                        }}
                        timeframe={`${perfDays}D`}
                        timeframes={['7D', '30D', '90D']}
                        onTimeframeChange={(value) => setPerfDays(parseInt(value, 10) || 30)}
                    >
                        <RechartsChart>
                            {({ ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid }) => (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={performance.series} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
                                        <defs>
                                            <linearGradient id="adsImpr" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="rgba(255,255,255,0.28)" />
                                                <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                                        <XAxis dataKey="date" tick={{ fill: 'rgba(161,161,170,0.7)', fontSize: 11 }} tickLine={false} axisLine={false} />
                                        <YAxis tick={{ fill: 'rgba(161,161,170,0.7)', fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                                        <Tooltip
                                            contentStyle={{
                                                background: 'rgba(12,12,14,0.94)',
                                                border: '1px solid rgba(255,255,255,0.08)',
                                                borderRadius: 14,
                                                fontSize: 12,
                                            }}
                                        />
                                        <Area type="monotone" dataKey="impressions" stroke="#ffffff" strokeWidth={2} fill="url(#adsImpr)" />
                                        <Area type="monotone" dataKey="clicks" stroke="rgba(216,74,255,0.9)" strokeWidth={2} fill="transparent" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </RechartsChart>
                    </TimeSeriesChartShell>

                    <div className="grid gap-4 lg:grid-cols-2">
                        <SectionCard title="By surface" dense className="dashboard-surface">
                            {performance.bySurface.length === 0 ? (
                                <p className="px-2 py-3 text-sm text-zinc-500">No delivery yet.</p>
                            ) : (
                                <div className="space-y-2">
                                    {performance.bySurface.map((row) => (
                                        <div key={row.surface} className="flex items-center justify-between rounded-2xl bg-white/[0.045] px-4 py-3 text-sm">
                                            <span className="font-bold text-white">{SURFACE_LABELS[row.surface] || row.surface}</span>
                                            <span className="text-xs font-semibold text-zinc-400">
                                                {row.impressions.toLocaleString()} impr · {row.clicks.toLocaleString()} clicks ·{' '}
                                                {formatCtr(row.impressions, row.clicks)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </SectionCard>
                        <SectionCard title="Results" dense className="dashboard-surface">
                            <StatRow
                                items={[
                                    { label: 'Conversions', value: performance.totals.conversions, detail: 'Tickets within 7d of a click' },
                                    { label: 'Attributed revenue', value: formatUsd(performance.totals.conversionRevenueCents) },
                                    {
                                        label: 'Email',
                                        value: performance.email.enabled ? performance.email.recipientCount.toLocaleString() : 'Off',
                                        detail: performance.email.sentAt ? `Sent ${formatDay(performance.email.sentAt)}` : undefined,
                                    },
                                ]}
                            />
                        </SectionCard>
                    </div>
                </>
            ) : null}

            <StripePaymentModal
                open={Boolean(payState)}
                clientSecret={payState?.clientSecret}
                returnUrl={typeof window !== 'undefined' ? `${window.location.origin}/dashboard/ads` : undefined}
                onSuccess={() => {
                    setPayState(null);
                    closeWizard();
                    invalidate();
                    refresh({ force: true });
                }}
                onCancel={() => setPayState(null)}
            />
        </div>
    );
}
