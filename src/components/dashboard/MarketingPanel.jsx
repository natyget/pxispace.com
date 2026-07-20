'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { api } from '@/services/api';
import { listAdCampaigns, getAdPerformance } from '@/services/ads';

function fmtUsd(cents) {
    return `$${((Number(cents) || 0) / 100).toFixed(2)}`;
}

function fmtInt(value) {
    return Number(value || 0).toLocaleString('en-US');
}

const PAID_AD_STATUSES = new Set(['SCHEDULED', 'ACTIVE', 'PAUSED', 'COMPLETED']);
const MAX_ATTRIBUTED = 5;

/**
 * Marketing spend → results, on real attribution: ad conversions come from the
 * click→purchase window, campaign conversions from the recipient→purchase
 * window. Shows the levers (credits, campaigns, ads) next to the outcomes so
 * spending and seeing the return live in one place.
 *
 * `selectedEventId` scopes the rows to spend actually tied to that one event
 * (a campaign's `eventId`, or an ad campaign promoting it) — "how much did I
 * spend marketing THIS event and what did it sell" instead of a portfolio
 * total that mixes everything together. Portfolio-wide sends (ALL_PAST /
 * untargeted ads) show under a separate divider rather than being silently
 * counted into one event's spend. Omit the prop for the portfolio-wide view.
 */
export default function MarketingPanel({ selectedEventId = null }) {
    const [loading, setLoading] = useState(true);
    const [credits, setCredits] = useState(0);
    const [rows, setRows] = useState([]); // { id, channel, name, spendCents, conversions, revenueCents, attributionReady, when, eventScoped }

    useEffect(() => {
        let cancelled = false;
        const timer = setTimeout(async () => {
            try {
                const [creditsRes, campaignsRes, adsRes] = await Promise.all([
                    api.get('/api/promos/credits').catch(() => ({ balanceCents: 0 })),
                    api.get('/api/campaigns').catch(() => ({ campaigns: [] })),
                    listAdCampaigns().catch(() => ({ campaigns: [] })),
                ]);
                if (cancelled) return;
                setCredits(creditsRes.balanceCents || 0);

                let sentCampaigns = (campaignsRes.campaigns || []).filter((c) => c.status === 'SENT');
                let paidAds = (adsRes.campaigns || []).filter((c) => PAID_AD_STATUSES.has(c.status));
                if (selectedEventId) {
                    sentCampaigns = sentCampaigns.filter((c) => c.eventId === selectedEventId);
                    paidAds = paidAds.filter((c) => (c.events || []).some((e) => e.event?.id === selectedEventId));
                }
                sentCampaigns = sentCampaigns.slice(0, MAX_ATTRIBUTED);
                paidAds = paidAds.slice(0, MAX_ATTRIBUTED);

                const [campaignPerfs, adPerfs] = await Promise.all([
                    Promise.allSettled(sentCampaigns.map((c) => api.get(`/api/campaigns/${c.id}/performance`))),
                    Promise.allSettled(paidAds.map((c) => getAdPerformance(c.id, 30))),
                ]);
                if (cancelled) return;

                const next = [];
                sentCampaigns.forEach((c, i) => {
                    const perf = campaignPerfs[i].status === 'fulfilled' ? campaignPerfs[i].value?.performance : null;
                    next.push({
                        id: `campaign-${c.id}`,
                        channel: c.channel === 'SMS' ? 'SMS' : 'Email',
                        name: c.name,
                        spendCents: c.priceCents || 0,
                        conversions: perf?.conversions ?? 0,
                        revenueCents: perf?.conversionRevenueCents ?? 0,
                        attributionReady: Boolean(perf?.attributionReady),
                        when: c.sentAt,
                    });
                });
                paidAds.forEach((c, i) => {
                    const perf = adPerfs[i].status === 'fulfilled' ? (adPerfs[i].value?.performance || adPerfs[i].value) : null;
                    const totals = perf?.totals || perf;
                    next.push({
                        id: `ad-${c.id}`,
                        channel: 'Ads',
                        name: c.name,
                        spendCents: (c.creditAppliedCents || 0) + (c.stripeAmountCents || 0),
                        conversions: totals?.conversions ?? 0,
                        revenueCents: totals?.conversionRevenueCents ?? 0,
                        attributionReady: totals != null,
                        when: c.startAt || c.createdAt,
                    });
                });
                next.sort((a, b) => new Date(b.when || 0) - new Date(a.when || 0));
                setRows(next);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }, 0);
        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, []);

    const totals = useMemo(() => {
        const spend = rows.reduce((s, r) => s + r.spendCents, 0);
        const revenue = rows.reduce((s, r) => s + r.revenueCents, 0);
        const conversions = rows.reduce((s, r) => s + r.conversions, 0);
        return { spend, revenue, conversions, roi: spend > 0 ? revenue / spend : null };
    }, [rows]);

    return (
        <section className="rounded-[1.25rem] bg-white/[0.035] p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <p className="text-xs font-bold tracking-[0.02em] text-white/40">Marketing</p>
                    <h2 className="mt-2 text-xl font-bold tracking-normal text-white">
                        {selectedEventId ? 'Spend on this event' : 'Spend → tickets, attributed'}
                    </h2>
                    <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-500">
                        {selectedEventId
                            ? 'Only campaigns and ad boosts tied to this event — not your portfolio total.'
                            : 'Conversions are tickets bought within 7 days of an ad click or a campaign send — real attribution, not vibes.'}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#d84aff]/10 px-3.5 py-1.5 text-xs font-semibold text-[#e9a1ff]">
                        {fmtUsd(credits)} credits available
                    </span>
                    <Link href="/dashboard/campaigns" className="rounded-full bg-white/[0.07] px-3.5 py-1.5 text-xs font-medium text-zinc-200 transition hover:bg-white/[0.12] hover:text-white">
                        Email / SMS
                    </Link>
                    <Link href="/dashboard/ads" className="rounded-full bg-white/[0.07] px-3.5 py-1.5 text-xs font-medium text-zinc-200 transition hover:bg-white/[0.12] hover:text-white">
                        Ad boosts
                    </Link>
                </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-white/[0.06] ring-1 ring-white/[0.07] sm:grid-cols-4">
                {[
                    { label: 'Marketing spend', value: fmtUsd(totals.spend) },
                    { label: 'Attributed tickets', value: fmtInt(totals.conversions) },
                    { label: 'Attributed revenue', value: fmtUsd(totals.revenue) },
                    { label: 'Return on spend', value: totals.roi != null ? `${totals.roi.toFixed(1)}x` : '—' },
                ].map((item) => (
                    <div key={item.label} className="bg-[#0e0e13] px-4 py-3">
                        <p className="text-[11px] font-medium text-zinc-500">{item.label}</p>
                        <p className="mt-1 truncate text-lg font-semibold tabular-nums text-white">{loading ? '...' : item.value}</p>
                    </div>
                ))}
            </div>

            <div className="mt-4 space-y-2">
                {loading ? (
                    <div className="h-16 animate-pulse rounded-2xl bg-white/[0.035]" />
                ) : rows.length === 0 ? (
                    <div className="rounded-2xl bg-white/[0.035] px-4 py-6 text-center">
                        <p className="text-sm font-semibold text-white">{selectedEventId ? 'No marketing spend on this event yet.' : 'No marketing runs yet.'}</p>
                        <p className="mt-1 text-xs text-zinc-500">
                            Your credits cover email/SMS campaigns and ad boosts in full before your card is touched — results land here with attributed tickets and revenue.
                        </p>
                    </div>
                ) : (
                    rows.map((row) => (
                        <div key={row.id} className="grid gap-3 rounded-2xl bg-white/[0.035] px-4 py-3 md:grid-cols-[90px_1.4fr_110px_130px_130px] md:items-center">
                            <span className="w-fit rounded-full bg-white/[0.07] px-2.5 py-1 text-[11px] font-medium tracking-[0.02em] text-zinc-300">{row.channel}</span>
                            <p className="min-w-0 truncate text-sm font-bold text-white">{row.name}</p>
                            <div className="md:text-right">
                                <p className="text-[11px] font-medium text-zinc-500">Spend</p>
                                <p className="font-mono text-sm font-bold text-white">{fmtUsd(row.spendCents)}</p>
                            </div>
                            <div className="md:text-right">
                                <p className="text-[11px] font-medium text-zinc-500">Tickets</p>
                                <p className="font-mono text-sm font-bold text-white">{row.attributionReady ? fmtInt(row.conversions) : '—'}</p>
                            </div>
                            <div className="md:text-right">
                                <p className="text-[11px] font-medium text-zinc-500">Revenue</p>
                                <p className={`font-mono text-sm font-bold ${row.revenueCents > 0 ? 'text-emerald-300' : 'text-white'}`}>
                                    {row.attributionReady ? fmtUsd(row.revenueCents) : '—'}
                                </p>
                            </div>
                        </div>
                    ))
                )}
                {rows.some((row) => !row.attributionReady) ? (
                    <p className="px-1 text-[11px] font-medium text-zinc-600">
                        — means no attribution data: sends from before recipient tracking shipped can&apos;t be measured retroactively.
                    </p>
                ) : null}
            </div>
        </section>
    );
}
