'use client';

// Campaigns: what was sent first, then a three-step composer. The address decides which one shows
// (?compose=1 opens the composer; audience, eventId and segmentId choose who gets it), so Audience can send a
// person straight into a message with the audience already chosen. The old ?segmentId= link still works.

import { Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, DataTable, Drawer, EmptyState, KpiStrip, Notice, PageHeader, Panel, Skeleton, StateText } from '@/components/dashboard/ui/kit';
import { usePageAction } from '@/components/dashboard/shell/usePageAction';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import { eventsService } from '@/services/events';
import { listAudienceSegments } from '@/services/audienceSegments';
import { count, dateTime, money, shortDate } from '@/lib/dashFormat';
import { useRequest } from '@/views/dashboard/audience/useRequest';
import { composeHref } from '@/views/dashboard/audience/audienceFilters';
import CampaignComposer from './CampaignComposer';
import { MessageCard } from './CampaignPreview';
import { audienceLabel, channelWord, statusOf } from './campaignText';

const AUDIENCES = ['ALL_PAST', 'ATTENDEES', 'SEGMENT'];

/** Who the composer starts with, from the address. null when the address is not asking for the composer. */
function composeFromParams(params) {
    const segmentId = params.get('segmentId') || '';
    if (params.get('compose') !== '1' && !segmentId) return null;
    const asked = params.get('audience');
    return {
        audience: AUDIENCES.includes(asked) ? asked : segmentId ? 'SEGMENT' : 'ALL_PAST',
        eventId: params.get('eventId') || '',
        segmentId,
    };
}

function loadError(status, message) {
    if (status === 404) return 'Campaigns are not available here yet.';
    if (status >= 500) return 'Campaigns are having trouble right now. Try again in a moment.';
    return message || 'Could not load your campaigns.';
}

const sum = (rows, key) => rows.reduce((n, row) => n + (Number(row[key]) || 0), 0);

function Numbers({ rows }) {
    return (
        <dl className="rounded-2xl bg-pxi-field px-4">
            {rows.map(([label, value, tone], i) => (
                <div key={label} className={`flex items-center justify-between gap-4 py-3 text-[14px] ${i ? 'border-t border-white/[0.08]' : ''}`}>
                    <dt className="text-white/60">{label}</dt>
                    <dd className={`min-w-0 truncate text-right tabular-nums ${tone === 'good' ? 'text-emerald-300' : 'text-white'}`}>{value}</dd>
                </div>
            ))}
        </dl>
    );
}

/** The quick view of one campaign: the message as it was sent, then its numbers. */
function CampaignDetails({ campaign, events, segments, sender }) {
    const status = statusOf(campaign);
    const sent = campaign.status === 'SENT';
    const perfReq = useRequest(sent ? `performance:${campaign.id}` : null, () => api.get(`/api/campaigns/${campaign.id}/performance`).then((r) => r.performance || null));
    const perf = sent ? perfReq.data : null;
    const rows = [
        ['To', audienceLabel(campaign, events, segments)],
        ['Channel', channelWord(campaign.channel)],
        ['People', count(campaign.recipientCount)],
        ['Cost', money(campaign.priceCents)],
    ];
    if (campaign.creditAppliedCents > 0) rows.push(['Credits applied', `-${money(campaign.creditAppliedCents)}`, 'good']);
    if (campaign.stripeAmountCents > 0) rows.push(['Paid by card', money(campaign.stripeAmountCents)]);
    return (
        <div className="space-y-5 pt-2">
            <div className="flex items-center justify-between gap-3">
                <StateText tone={status.tone}>{status.label}</StateText>
                <span className="text-[12px] text-white/45">{dateTime(campaign.sentAt || campaign.createdAt)}</span>
            </div>
            {campaign.status === 'FAILED' && campaign.failReason ? <Notice tone="error">{campaign.failReason}</Notice> : null}
            <MessageCard channel={campaign.channel} subject={campaign.subject} body={campaign.body} senderName={sender} placeholder={false} />
            <Numbers rows={rows} />
            {sent && perfReq.loading ? <Skeleton className="h-24" /> : null}
            {perf?.attributionReady ? (
                <div>
                    <p className="mb-2 text-[13px] font-semibold text-white">After the send</p>
                    <Numbers rows={[['Tickets after', count(perf.conversions)], ['Sales after', money(perf.conversionRevenueCents)]]} />
                    <p className="mt-2 text-[12px] text-white/40">Tickets bought by the people who got it, within 7 days.</p>
                </div>
            ) : null}
        </div>
    );
}

function CampaignsHome() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuth();
    const campaignsReq = useRequest('campaigns', () => api.get('/api/campaigns'));
    const eventsReq = useRequest('events', () => eventsService.getMyEvents({ limit: 100, offset: 0 }));
    const segmentsReq = useRequest('segments', () => listAudienceSegments().catch(() => ({ segments: [] })));
    const [selected, setSelected] = useState(null);
    const [flash, setFlash] = useState('');

    const campaigns = useMemo(() => (Array.isArray(campaignsReq.data?.campaigns) ? campaignsReq.data.campaigns : []), [campaignsReq.data]);
    const events = useMemo(() => (Array.isArray(eventsReq.data?.events) ? eventsReq.data.events : []), [eventsReq.data]);
    const segments = useMemo(() => (Array.isArray(segmentsReq.data?.segments) ? segmentsReq.data.segments : []), [segmentsReq.data]);

    const initial = composeFromParams(searchParams);
    const composing = Boolean(initial);

    const newCampaign = useMemo(
        () =>
            composing ? null : (
                <Button
                    variant="primary"
                    onClick={() => {
                        setFlash('');
                        router.push(composeHref({ audience: 'ALL_PAST' }));
                    }}
                >
                    New campaign
                </Button>
            ),
        [composing, router]
    );
    usePageAction(newCampaign);

    const delivered = campaigns.filter((c) => c.status === 'SENT' || c.status === 'SENDING');
    const allSent = campaigns.filter((c) => c.status === 'SENT');
    const sentIds = allSent.slice(0, 20).map((c) => c.id);
    const perfReq = useRequest(sentIds.length ? JSON.stringify(sentIds) : null, () =>
        Promise.all(sentIds.map((id) => api.get(`/api/campaigns/${id}/performance`).then((r) => r.performance || null).catch(() => null)))
    );
    const tracked = (sentIds.length ? perfReq.data || [] : []).filter((p) => p?.attributionReady);

    function done(kind) {
        setFlash(kind === 'credits' ? 'Sent with credits. Delivery is underway.' : 'Paid. Your message is on its way.');
        campaignsReq.reload();
        router.replace('/dashboard/campaigns', { scroll: false });
    }

    if (composing) {
        // The composer starts from the address (a night, a list), so it opens once both lists are known.
        if (eventsReq.loading || segmentsReq.loading) {
            return (
                <div className="space-y-5 md:space-y-6">
                    <Skeleton className="h-16" />
                    <Skeleton className="h-96" />
                </div>
            );
        }
        return (
            <CampaignComposer
                key={searchParams.toString()}
                initial={initial}
                events={events}
                segments={segments}
                onBack={() => router.push('/dashboard/campaigns')}
                onDone={done}
            />
        );
    }

    const loading = campaignsReq.loading && !campaignsReq.data;
    const unknown = loading || Boolean(campaignsReq.error);
    const kpis = [
        { label: 'Sent', value: unknown ? '-' : count(delivered.length) },
        { label: 'People reached', value: unknown ? '-' : count(sum(delivered, 'recipientCount')) },
        ...(tracked.length ? [{ label: 'Tickets after', value: count(sum(tracked, 'conversions')), hint: allSent.length > sentIds.length ? 'Latest 20 sends' : 'Within 7 days of a send' }] : []),
        { label: 'Spent', value: unknown ? '-' : money(sum(delivered, 'priceCents')) },
    ];

    const columns = [
        {
            key: 'name',
            label: 'Campaign',
            width: 'minmax(0,2fr)',
            render: (c) => {
                const status = statusOf(c);
                return (
                    <div className="min-w-0">
                        <div className="flex items-start justify-between gap-3">
                            <p className="truncate text-[14px] font-semibold text-white">{c.name}</p>
                            <span className="shrink-0 md:hidden">
                                <StateText tone={status.tone}>{status.label}</StateText>
                            </span>
                        </div>
                        <p className="mt-0.5 truncate text-[12px] text-white/45">{audienceLabel(c, events, segments)}</p>
                        <p className="mt-1 truncate text-[12px] text-white/45 md:hidden">
                            {[shortDate(c.sentAt || c.createdAt), channelWord(c.channel), `${count(c.recipientCount)} ${Number(c.recipientCount) === 1 ? 'person' : 'people'}`, money(c.priceCents)].join(', ')}
                        </p>
                    </div>
                );
            },
        },
        { key: 'when', label: 'When', width: '100px', hideOnMobile: true, render: (c) => <span className="text-[14px] text-white/70">{shortDate(c.sentAt || c.createdAt)}</span> },
        { key: 'channel', label: 'Channel', width: '76px', hideOnMobile: true, render: (c) => <span className="text-[14px] text-white/70">{channelWord(c.channel)}</span> },
        { key: 'people', label: 'People', width: '76px', hideOnMobile: true, render: (c) => <span className="text-[14px] tabular-nums text-white">{count(c.recipientCount)}</span> },
        { key: 'cost', label: 'Cost', width: '84px', hideOnMobile: true, render: (c) => <span className="text-[14px] tabular-nums text-white">{money(c.priceCents)}</span> },
        {
            key: 'status',
            label: 'Status',
            width: '150px',
            hideOnMobile: true,
            render: (c) => {
                const status = statusOf(c);
                return <StateText tone={status.tone}>{status.label}</StateText>;
            },
        },
    ];

    return (
        <div className="space-y-5 md:space-y-6">
            {/* Three numbers fill the strip's two columns on a phone with the last one across the full width. */}
            <PageHeader
                title="Campaigns"
                aside={<KpiStrip items={kpis} className="[&>div:last-child:nth-child(odd)]:col-span-2 sm:[&>div:last-child:nth-child(odd)]:col-span-1" />}
            />

            {flash ? <Notice tone="good">{flash}</Notice> : null}

            <Panel title="Sent">
                {campaignsReq.error ? (
                    <Notice tone="error">{loadError(campaignsReq.status, campaignsReq.error)}</Notice>
                ) : (
                    <DataTable
                        columns={columns}
                        rows={campaigns}
                        loading={loading}
                        onRowClick={setSelected}
                        selectedKey={selected?.id}
                        empty={
                            <EmptyState
                                title="No campaigns yet."
                                line="Message the people who came to your nights."
                                action={
                                    <Button variant="primary" onClick={() => router.push(composeHref({ audience: 'ALL_PAST' }))}>
                                        New campaign
                                    </Button>
                                }
                            />
                        }
                    />
                )}
            </Panel>

            <Drawer open={Boolean(selected)} onClose={() => setSelected(null)} title={selected?.name || 'Campaign'}>
                {selected ? (
                    <CampaignDetails campaign={selected} events={events} segments={segments} sender={user?.name || (user?.username ? `@${user.username}` : '')} />
                ) : null}
            </Drawer>
        </div>
    );
}

export default function CampaignsView() {
    return (
        <Suspense
            fallback={
                <div className="space-y-5 md:space-y-6">
                    <Skeleton className="h-24" />
                    <Skeleton className="h-64" />
                </div>
            }
        >
            <CampaignsHome />
        </Suspense>
    );
}
