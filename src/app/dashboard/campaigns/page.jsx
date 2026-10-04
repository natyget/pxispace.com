'use client';

// Real email campaigns: draft → live recipient quote → pay (Stripe) → PXI sends
// to the organizer's opted-in attendees. Consent is enforced server-side.

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import SectionCard from '@/components/dashboard/SectionCard';
import { StripePaymentModal } from '@/components/checkout/StripePaymentModal';
import { api } from '@/services/api';
import { eventsService } from '@/services/events';
import { listAudienceSegments } from '@/services/audienceSegments';

function formatUsd(cents) {
    return `$${(Number(cents || 0) / 100).toFixed(2)}`;
}

function formatNumber(value) {
    return Number(value || 0).toLocaleString('en-US');
}

function formatDate(iso) {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
        return '—';
    }
}

const statusStyle = {
    DRAFT: 'bg-white/5 text-white/60',
    PENDING_PAYMENT: 'bg-amber-500/10 text-amber-300',
    SENDING: 'bg-sky-500/10 text-sky-300',
    SENT: 'bg-emerald-500/10 text-emerald-300',
    FAILED: 'bg-red-500/10 text-red-300',
    CANCELLED: 'bg-white/5 text-white/40',
};

function campaignErrorMessage(error, fallback = 'Campaign tools are unavailable right now.') {
    const raw = error?.data?.error || error?.data?.message || error?.message || '';
    if (error?.status === 404 || /not found/i.test(raw)) {
        return 'Campaign sending is not available in this environment yet. Draft your send here, then try again once the campaign service is connected.';
    }
    if (error?.status >= 500) {
        return 'Campaign tools are having trouble right now. Your draft fields are safe on this page.';
    }
    return raw || fallback;
}

function CampaignsPageContent() {
    const searchParams = useSearchParams();
    const [campaigns, setCampaigns] = useState([]);
    const [events, setEvents] = useState([]);
    const [segments, setSegments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [name, setName] = useState('');
    const [channel, setChannel] = useState('EMAIL');
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [audience, setAudience] = useState('ALL_PAST');
    const [eventId, setEventId] = useState('');
    const [segmentId, setSegmentId] = useState('');
    const [quote, setQuote] = useState(null);
    const [busy, setBusy] = useState(false);
    const isSms = channel === 'SMS';
    // What a text can hold depends on who sends it. PXI puts "Sent via PXI on behalf of
    // {name}: " in front of the body and the STOP line after it, and the API refuses anything
    // that does not fit once they are added. The quote carries the sender's name and the exact
    // room left; they are kept from the last quote so the limit does not jump back while a new
    // one loads. 320 is only the assumption before the first quote arrives.
    const [relay, setRelay] = useState({ senderName: '', smsBudget: null });
    const bodyMaxLength = isSms ? (relay.smsBudget ?? 320) : 10000;

    const [payState, setPayState] = useState(null); // { campaignId, clientSecret }
    const [sentWithCredits, setSentWithCredits] = useState(false);

    // Deep link from the Audience page's "Send campaign" chip: ?segmentId=...
    useEffect(() => {
        const fromUrl = searchParams.get('segmentId');
        if (fromUrl) {
            setAudience('SEGMENT');
            setSegmentId(fromUrl);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const load = useCallback(async () => {
        try {
            const [c, e, s] = await Promise.all([
                api.get('/api/campaigns'),
                eventsService.getMyEvents ? eventsService.getMyEvents() : Promise.resolve({ events: [] }),
                listAudienceSegments().catch(() => ({ segments: [] })),
            ]);
            setCampaigns(c.campaigns || []);
            setEvents(e.events || e || []);
            setSegments(s.segments || []);
            setError(null);
        } catch (err) {
            setError(campaignErrorMessage(err, 'Failed to load campaigns'));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => load(), 0);
        return () => clearTimeout(timer);
    }, [load]);

    // Live quote as the audience/channel selection changes.
    useEffect(() => {
        let cancelled = false;
        const params = new URLSearchParams({ audience, channel });
        if (audience === 'ATTENDEES' && eventId) params.set('eventId', eventId);
        if (audience === 'SEGMENT' && segmentId) params.set('segmentId', segmentId);
        if ((audience === 'ATTENDEES' && !eventId) || (audience === 'SEGMENT' && !segmentId)) {
            const timer = setTimeout(() => setQuote(null), 0);
            return () => clearTimeout(timer);
        }
        const timer = setTimeout(() => {
            api.get(`/api/campaigns/quote?${params}`)
                .then((q) => {
                    if (cancelled) return;
                    setQuote(q);
                    setRelay((prev) => ({
                        senderName: q?.sentOnBehalfOf || prev.senderName,
                        smsBudget: typeof q?.smsBodyBudget === 'number' ? q.smsBodyBudget : prev.smsBudget,
                    }));
                })
                .catch(() => { if (!cancelled) setQuote(null); });
        }, 0);
        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [audience, eventId, segmentId, channel]);

    const createAndPay = async () => {
        setBusy(true);
        setError(null);
        setSentWithCredits(false);
        try {
            const { campaign } = await api.post('/api/campaigns', {
                name: name.trim(),
                channel,
                ...(isSms ? {} : { subject: subject.trim() }),
                body: body.trim(),
                audience,
                ...(audience === 'ATTENDEES' ? { eventId } : {}),
                ...(audience === 'SEGMENT' ? { segmentId } : {}),
            });
            const pay = await api.post(`/api/campaigns/${campaign.id}/pay`, {});
            if (pay.paid) {
                // Fully covered by credits — settled and sending, no card step.
                setSentWithCredits(true);
                setName('');
                setSubject('');
                setBody('');
                setLoading(true);
                load();
                return;
            }
            setPayState({ campaignId: campaign.id, clientSecret: pay.clientSecret });
        } catch (err) {
            setError(campaignErrorMessage(err, 'Failed to create campaign'));
        } finally {
            setBusy(false);
        }
    };

    const smsNotReady = isSms && quote?.smsChannelReady === false;
    // Typing is capped at the limit, but a long email body carried over to SMS is not.
    const bodyTooLong = body.length > bodyMaxLength;
    const canSubmit = name.trim() && (isSms || subject.trim()) && body.trim() && !bodyTooLong && quote?.recipientCount > 0
        && (audience !== 'ATTENDEES' || eventId) && (audience !== 'SEGMENT' || segmentId) && !smsNotReady;
    const creditApplied = quote?.creditAppliedCents || 0;
    const cardRemainder = quote?.stripeRemainderCents ?? (quote ? quote.priceCents - creditApplied : 0);
    const fullyCredits = Boolean(quote) && quote.priceCents > 0 && cardRemainder === 0;

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            <section className="flex flex-col gap-5 px-1 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-2xl">
                    <p className="text-[13px] font-medium text-zinc-500">Campaigns</p>
                    <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-white md:text-[28px]">Reach your attendees</h1>
                    <p className="mt-1.5 text-sm leading-6 text-zinc-500">
                        Email and SMS to opted-in attendees — pricing, consent, and unsubscribe handled by PXI.
                        Want sponsored placements?{' '}
                        <a href="/dashboard/ads" className="font-medium text-zinc-300 underline decoration-white/25 underline-offset-2 transition hover:text-white">
                            Promote with Ads →
                        </a>
                    </p>
                </div>
                <div className="grid shrink-0 grid-cols-3 gap-px overflow-hidden rounded-2xl bg-pxi-field sm:min-w-[330px]">
                    {[
                        { label: 'Reach', value: quote?.recipientCount ?? '—' },
                        { label: 'Cost', value: quote ? formatUsd(quote.priceCents) : '—' },
                        { label: 'Sent', value: loading ? '—' : campaigns.length },
                    ].map((item) => (
                        <div key={item.label} className="bg-pxi-surface px-4 py-3">
                            <p className="text-[12px] font-medium text-zinc-500">{item.label}</p>
                            <p className="mt-1 truncate text-lg font-semibold tabular-nums tracking-tight text-white">{item.value}</p>
                        </div>
                    ))}
                </div>
            </section>

            {error && (
                <div className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm font-semibold leading-6 text-red-100">{error}</div>
            )}
            {sentWithCredits && (
                <div className="rounded-2xl bg-emerald-500/10 px-4 py-3 text-sm font-semibold leading-6 text-emerald-200">
                    Sent with credits — no card needed. Delivery is underway; watch the status in History below.
                </div>
            )}

            <SectionCard title="Compose send" dense className="dashboard-surface-b !shadow-[0_22px_70px_rgba(0,0,0,0.28)]">
                <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
                    <div className="space-y-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="dashboard-segmented-toggle" role="tablist" aria-label="Send channel">
                                {[{ id: 'EMAIL', label: 'Email' }, { id: 'SMS', label: 'SMS' }].map((c) => (
                                    <button
                                        key={c.id}
                                        type="button"
                                        className="dashboard-segmented-toggle__item"
                                        data-active={channel === c.id}
                                        aria-pressed={channel === c.id}
                                        onClick={() => setChannel(c.id)}
                                    >
                                        {c.label}
                                    </button>
                                ))}
                            </div>
                            <input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Internal name (only you see this)"
                                aria-label="Internal campaign name"
                                className="dashboard-input min-h-10 w-full px-4 py-2 text-sm font-semibold text-white placeholder:text-white/35 sm:max-w-[280px]"
                            />
                        </div>

                        {/* The message itself, framed like the email/SMS the attendee receives. */}
                        <div className="overflow-hidden rounded-[1.25rem] bg-pxi-field">
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-white/[0.06] px-4 py-3 sm:px-5">
                                <span className="w-14 shrink-0 text-[11px] font-medium tracking-[0.02em] text-zinc-500">To</span>
                                <span className="relative min-w-0 flex-1">
                                    <select
                                        value={audience}
                                        onChange={(e) => setAudience(e.target.value)}
                                        aria-label="Audience"
                                        className="w-full cursor-pointer appearance-none rounded-2xl bg-transparent py-1 pl-1 pr-7 text-sm font-bold text-white outline-none transition focus-visible:ring-1 focus-visible:ring-white/20 [&>option]:bg-zinc-950"
                                    >
                                        <option value="ALL_PAST">All past attendees (opted-in)</option>
                                        <option value="ATTENDEES">One event&apos;s attendees (opted-in)</option>
                                        {segments.length ? <option value="SEGMENT">A saved segment</option> : null}
                                    </select>
                                    <svg viewBox="0 0 10 10" className="pointer-events-none absolute right-2 top-1/2 h-2.5 w-2.5 -translate-y-1/2 text-zinc-500" aria-hidden="true">
                                        <path d="M1 3l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </span>
                                {quote?.recipientCount > 0 ? (
                                    <span className="shrink-0 rounded-full bg-pxi-field px-2.5 py-1 text-[11px] font-medium tabular-nums text-zinc-300">
                                        {formatNumber(quote.recipientCount)}
                                    </span>
                                ) : null}
                            </div>
                            {audience === 'ATTENDEES' ? (
                                <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3 sm:px-5">
                                    <span className="w-14 shrink-0 text-[11px] font-medium tracking-[0.02em] text-zinc-500">Event</span>
                                    <span className="relative min-w-0 flex-1">
                                        <select
                                            value={eventId}
                                            onChange={(e) => setEventId(e.target.value)}
                                            aria-label="Event"
                                            className="w-full cursor-pointer appearance-none rounded-2xl bg-transparent py-1 pl-1 pr-7 text-sm font-bold text-white outline-none transition focus-visible:ring-1 focus-visible:ring-white/20 [&>option]:bg-zinc-950"
                                        >
                                            <option value="">Choose event...</option>
                                            {events.map((ev) => (
                                                <option key={ev.id} value={ev.id}>{ev.name}</option>
                                            ))}
                                        </select>
                                        <svg viewBox="0 0 10 10" className="pointer-events-none absolute right-2 top-1/2 h-2.5 w-2.5 -translate-y-1/2 text-zinc-500" aria-hidden="true">
                                            <path d="M1 3l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </span>
                                </div>
                            ) : null}
                            {audience === 'SEGMENT' ? (
                                <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3 sm:px-5">
                                    <span className="w-14 shrink-0 text-[11px] font-medium tracking-[0.02em] text-zinc-500">Segment</span>
                                    <span className="relative min-w-0 flex-1">
                                        <select
                                            value={segmentId}
                                            onChange={(e) => setSegmentId(e.target.value)}
                                            aria-label="Segment"
                                            className="w-full cursor-pointer appearance-none rounded-2xl bg-transparent py-1 pl-1 pr-7 text-sm font-bold text-white outline-none transition focus-visible:ring-1 focus-visible:ring-white/20 [&>option]:bg-zinc-950"
                                        >
                                            <option value="">Choose segment...</option>
                                            {segments.map((seg) => (
                                                <option key={seg.id} value={seg.id}>{seg.name}</option>
                                            ))}
                                        </select>
                                        <svg viewBox="0 0 10 10" className="pointer-events-none absolute right-2 top-1/2 h-2.5 w-2.5 -translate-y-1/2 text-zinc-500" aria-hidden="true">
                                            <path d="M1 3l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </span>
                                </div>
                            ) : null}
                            {!isSms ? (
                                <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3 sm:px-5">
                                    <span className="w-14 shrink-0 text-[11px] font-medium tracking-[0.02em] text-zinc-500">Subject</span>
                                    <input
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        placeholder="Tonight's details are live"
                                        aria-label="Subject line"
                                        className="min-w-0 flex-1 bg-transparent py-1 pl-1 text-sm font-bold text-white outline-none placeholder:font-semibold placeholder:text-white/30"
                                    />
                                </div>
                            ) : null}
                            <textarea
                                value={body}
                                onChange={(e) => setBody(e.target.value.slice(0, bodyMaxLength))}
                                rows={isSms ? 5 : 9}
                                placeholder={isSms
                                    ? "Tonight's set starts at 9. See you there!"
                                    : 'Write your message...\n\nBlank lines become paragraphs. An unsubscribe link is added automatically.'}
                                aria-label="Message body"
                                className="block w-full resize-y bg-transparent px-4 py-4 text-sm font-medium leading-6 text-white outline-none placeholder:text-white/30 sm:px-5"
                            />
                            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] bg-pxi-field px-4 py-2.5 sm:px-5">
                                <span className="text-[11px] font-semibold text-zinc-500">
                                    {isSms
                                        ? relay.senderName
                                            ? `Starts "Sent via PXI on behalf of ${relay.senderName}:" and ends "Reply STOP to unsubscribe." Both are added automatically.`
                                            : '"Reply STOP to unsubscribe." is appended automatically.'
                                        : relay.senderName
                                            ? `"Sent via PXI on behalf of ${relay.senderName}" and an unsubscribe link are added automatically.`
                                            : 'An unsubscribe link is added automatically.'}
                                </span>
                                <span className={`text-[11px] font-bold tabular-nums ${bodyTooLong ? 'text-red-400' : body.length >= bodyMaxLength ? 'text-amber-300' : 'text-zinc-500'}`}>
                                    {formatNumber(body.length)}/{formatNumber(bodyMaxLength)}
                                </span>
                            </div>
                        </div>

                        {smsNotReady ? (
                            <div className="rounded-2xl bg-amber-500/10 px-4 py-3 text-xs font-semibold leading-5 text-amber-200">
                                SMS is pending carrier registration — this channel isn&apos;t sendable yet. Draft here; it&apos;ll unlock once a live number is configured.
                            </div>
                        ) : null}
                    </div>
                    <aside className="flex flex-col justify-between rounded-[1rem] bg-pxi-field p-5">
                        <div>
                            <p className="text-[11px] font-medium tracking-[0.02em] text-zinc-500">Send quote</p>
                            <p className="mt-2 text-3xl font-bold tabular-nums text-white">
                                {quote ? formatUsd(quote.priceCents) : '—'}
                            </p>
                            <p className="mt-2 text-sm leading-6 text-zinc-400">
                                {quote
                                    ? quote.recipientCount > 0
                                        ? `${quote.recipientCount} opted-in ${quote.recipientCount === 1 ? 'recipient' : 'recipients'} matched.`
                                        : 'No opted-in recipients yet.'
                                    : audience === 'ATTENDEES' && !eventId
                                        ? 'Choose an event to price the send.'
                                        : 'Pricing audience...'}
                            </p>
                            {quote && creditApplied > 0 ? (
                                <p className="mt-3 rounded-xl bg-pxi-purple/10 px-3 py-2 text-xs font-semibold leading-5 text-white">
                                    {fullyCredits
                                        ? `Credits cover the full ${formatUsd(quote.priceCents)} — no card needed.`
                                        : `Credits cover ${formatUsd(creditApplied)} · ${formatUsd(cardRemainder)} on card.`}
                                </p>
                            ) : null}
                            {quote && quote.creditBalanceCents > 0 && creditApplied === 0 ? (
                                <p className="mt-3 text-xs font-semibold text-zinc-500">
                                    Credit balance: {formatUsd(quote.creditBalanceCents)}
                                </p>
                            ) : null}
                        </div>
                        <div className="mt-6 space-y-3">
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="rounded-2xl bg-pxi-field px-3 py-3">
                                    <p className="text-[11px] font-medium tracking-[0.02em] text-zinc-500">Consent</p>
                                    <p className="mt-1 font-bold text-white">Enforced</p>
                                </div>
                                <div className="rounded-2xl bg-pxi-field px-3 py-3">
                                    <p className="text-[11px] font-medium tracking-[0.02em] text-zinc-500">Unsubscribe</p>
                                    <p className="mt-1 font-bold text-white">Automatic</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={createAndPay}
                                disabled={busy || !canSubmit}
                                className="pill-solid min-h-12 w-full px-6 text-sm disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                {busy
                                    ? 'Preparing...'
                                    : fullyCredits
                                        ? 'Send with credits'
                                        : cardRemainder > 0 && creditApplied > 0
                                            ? `Pay ${formatUsd(cardRemainder)} & send`
                                            : `Pay ${quote?.priceCents ? formatUsd(quote.priceCents) : ''} & send`}
                            </button>
                        </div>
                    </aside>
                </div>
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-pxi-field px-4 py-3">
                    <p className="text-sm text-zinc-400">
                        {bodyTooLong
                            ? `That is ${formatNumber(body.length - bodyMaxLength)} over what ${isSms ? 'a text' : 'an email'} can hold. Shorten the message to send it.`
                            : quote
                            ? quote.recipientCount > 0
                                ? <>Reaches <span className="font-bold text-white">{quote.recipientCount}</span> opted-in {quote.recipientCount === 1 ? 'person' : 'people'} · <span className="font-bold text-white">{formatUsd(quote.priceCents)}</span></>
                                : 'No opted-in recipients yet — attendees enable event updates in their PXI settings.'
                            : audience === 'ATTENDEES' && !eventId
                                ? 'Pick an event to see the audience.'
                                : 'Calculating audience...'}
                    </p>
                    <p className="text-xs font-semibold text-zinc-500">Payment opens after the send is ready.</p>
                </div>
            </SectionCard>

            <SectionCard title="History" dense className="dashboard-surface !shadow-[0_18px_54px_rgba(0,0,0,0.24)]">
                {loading ? (
                    <p className="px-2 py-4 text-sm text-zinc-500">Loading...</p>
                ) : campaigns.length === 0 ? (
                    <div className="rounded-2xl bg-pxi-field px-5 py-8 text-center">
                        <p className="text-sm font-bold text-white">No campaigns yet.</p>
                        <p className="mt-2 text-sm text-zinc-500">Your first paid send will appear here with status, reach, and receipt detail.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {campaigns.map((c) => (
                            <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-bold text-white">{c.name}</p>
                                    <p className="truncate text-xs text-zinc-500">
                                        {/* A text has no subject line, so the row would start with a stray separator. */}
                                        {c.channel === 'SMS' ? 'Text message' : c.subject} · {c.recipientCount} {c.recipientCount === 1 ? 'recipient' : 'recipients'} · {formatUsd(c.priceCents)}
                                        {c.creditAppliedCents > 0 ? ` (${formatUsd(c.creditAppliedCents)} credits)` : ''} · {formatDate(c.sentAt || c.createdAt)}
                                    </p>
                                </div>
                                <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium tracking-[0.02em] ${statusStyle[c.status] || statusStyle.DRAFT}`}>
                                    {String(c.status).replaceAll('_', ' ')}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </SectionCard>

            <StripePaymentModal
                open={Boolean(payState)}
                clientSecret={payState?.clientSecret}
                returnUrl={typeof window !== 'undefined' ? `${window.location.origin}/dashboard/campaigns` : undefined}
                onSuccess={() => {
                    setPayState(null);
                    setName('');
                    setSubject('');
                    setBody('');
                    setLoading(true);
                    load();
                }}
                onCancel={() => setPayState(null)}
            />
        </div>
    );
}

export default function CampaignsPage() {
    return (
        <Suspense fallback={<div className="mx-auto max-w-7xl p-8 text-zinc-500">Loading campaigns...</div>}>
            <CampaignsPageContent />
        </Suspense>
    );
}
