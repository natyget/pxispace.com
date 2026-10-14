'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, DataTable, EmptyState, Panel } from '@/components/dashboard/ui/kit';
import { count, money } from '@/lib/dashFormat';
import { api } from '@/services/api';
import { listAdCampaigns, getAdPerformance } from '@/services/ads';

const PAID_AD_STATUSES = new Set(['SCHEDULED', 'ACTIVE', 'PAUSED', 'COMPLETED']);
const MAX_ATTRIBUTED = 5;

/**
 * Marketing spend and what it sold, on real attribution: ad conversions come from the click-to-purchase window,
 * campaign conversions from the recipient-to-purchase window. With an event id it only counts spend tied to that
 * night (a campaign's eventId, or an ad promoting it); without one it is the whole portfolio.
 */
export default function MarketingSection({ selectedEventId = null }) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [credits, setCredits] = useState(0);
    const [rows, setRows] = useState([]); // { id, channel, name, spendCents, conversions, revenueCents, attributionReady, when }

    useEffect(() => {
        let cancelled = false;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLoading(true);
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
    }, [selectedEventId]);

    const totals = useMemo(() => {
        const spend = rows.reduce((s, r) => s + r.spendCents, 0);
        const revenue = rows.reduce((s, r) => s + r.revenueCents, 0);
        const conversions = rows.reduce((s, r) => s + r.conversions, 0);
        return { spend, revenue, conversions, roi: spend > 0 ? revenue / spend : null };
    }, [rows]);

    const strip = [
        { label: 'Spent', value: money(totals.spend) },
        { label: 'Tickets', value: count(totals.conversions) },
        { label: 'Revenue', value: money(totals.revenue) },
        { label: 'Return', value: totals.roi != null ? `${totals.roi.toFixed(1)}x` : '-' },
    ];

    const columns = [
        { key: 'channel', label: 'Channel', width: '90px', render: (row) => <span className="text-[13px] text-white/60">{row.channel}</span> },
        { key: 'name', label: 'Name', render: (row) => <p className="truncate text-[14px] font-semibold text-white">{row.name}</p> },
        { key: 'spend', label: 'Spent', width: '110px', align: 'right', render: (row) => <span className="text-[14px] tabular-nums text-white">{money(row.spendCents)}</span> },
        {
            key: 'tickets',
            label: 'Tickets',
            width: '100px',
            align: 'right',
            render: (row) => <span className="text-[14px] tabular-nums text-white">{row.attributionReady ? count(row.conversions) : '-'}</span>,
        },
        {
            key: 'revenue',
            label: 'Revenue',
            width: '120px',
            align: 'right',
            render: (row) => (
                <span className={`text-[14px] tabular-nums ${row.revenueCents > 0 ? 'text-emerald-300' : 'text-white'}`}>{row.attributionReady ? money(row.revenueCents) : '-'}</span>
            ),
        },
    ];

    return (
        <Panel
            title="Marketing"
            subtitle={credits > 0 ? `${money(credits)} in credits` : null}
            action={(
                <div className="flex items-center gap-1">
                    <Button variant="quiet" size="sm" onClick={() => router.push('/dashboard/campaigns')}>Email and SMS</Button>
                    <Button variant="quiet" size="sm" onClick={() => router.push('/dashboard/ads')}>Ad boosts</Button>
                </div>
            )}
        >
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-white/[0.08] sm:grid-cols-4">
                {strip.map((item) => (
                    <div key={item.label} className="min-w-0 bg-pxi-field px-4 py-3">
                        <p className="truncate text-[12px] text-white/45">{item.label}</p>
                        <p className="mt-1 truncate text-[18px] font-semibold tabular-nums text-white">{loading ? '...' : item.value}</p>
                    </div>
                ))}
            </div>
            <div className="mt-4">
                <DataTable
                    columns={columns}
                    rows={rows}
                    loading={loading}
                    empty={<EmptyState title={selectedEventId ? 'No marketing on this night yet' : 'No marketing yet'} />}
                />
            </div>
        </Panel>
    );
}
