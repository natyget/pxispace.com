'use client';

// Real email campaigns: draft → live recipient quote → pay (Stripe) → PXI sends
// to the organizer's opted-in attendees. Consent is enforced server-side.

import { useCallback, useEffect, useState } from 'react';
import SectionCard from '@/components/dashboard/SectionCard';
import { StripePaymentModal } from '@/components/checkout/StripePaymentModal';
import { api } from '@/services/api';
import { eventsService } from '@/services/events';

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

export default function CampaignsPage() {
    const [campaigns, setCampaigns] = useState([]);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [name, setName] = useState('');
    const [channel, setChannel] = useState('EMAIL');
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [audience, setAudience] = useState('ALL_PAST');
    const [eventId, setEventId] = useState('');
    const [quote, setQuote] = useState(null);
    const [busy, setBusy] = useState(false);
    const isSms = channel === 'SMS';
    const bodyMaxLength = isSms ? 320 : 10000;

    const [payState, setPayState] = useState(null); // { campaignId, clientSecret }

    const load = useCallback(async () => {
        try {
            const [c, e] = await Promise.all([
                api.get('/api/campaigns'),
                eventsService.getMyEvents ? eventsService.getMyEvents() : Promise.resolve({ events: [] }),
            ]);
            setCampaigns(c.campaigns || []);
            setEvents(e.events || e || []);
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
        if (audience === 'ATTENDEES' && !eventId) {
            const timer = setTimeout(() => setQuote(null), 0);
            return () => clearTimeout(timer);
        }
        const timer = setTimeout(() => {
            api.get(`/api/campaigns/quote?${params}`)
                .then((q) => { if (!cancelled) setQuote(q); })
                .catch(() => { if (!cancelled) setQuote(null); });
        }, 0);
        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [audience, eventId, channel]);

    const createAndPay = async () => {
        setBusy(true);
        setError(null);
        try {
            const { campaign } = await api.post('/api/campaigns', {
                name: name.trim(),
                channel,
                ...(isSms ? {} : { subject: subject.trim() }),
                body: body.trim(),
                audience,
                ...(audience === 'ATTENDEES' ? { eventId } : {}),
            });
            const pay = await api.post(`/api/campaigns/${campaign.id}/pay`, {});
            setPayState({ campaignId: campaign.id, clientSecret: pay.clientSecret });
        } catch (err) {
            setError(campaignErrorMessage(err, 'Failed to create campaign'));
        } finally {
            setBusy(false);
        }
    };

    const smsNotReady = isSms && quote?.smsChannelReady === false;
    const canSubmit = name.trim() && (isSms || subject.trim()) && body.trim() && quote?.recipientCount > 0
        && (audience !== 'ATTENDEES' || eventId) && !smsNotReady;

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
                <div className="grid shrink-0 grid-cols-3 gap-px overflow-hidden rounded-2xl bg-white/[0.06] ring-1 ring-white/[0.07] sm:min-w-[330px]">
                    {[
                        { label: 'Reach', value: quote?.recipientCount ?? '—' },
                        { label: 'Cost', value: quote ? formatUsd(quote.priceCents) : '—' },
                        { label: 'Sent', value: loading ? '—' : campaigns.length },
                    ].map((item) => (
                        <div key={item.label} className="bg-[#0e0e13] px-4 py-3">
                            <p className="text-[12px] font-medium text-zinc-500">{item.label}</p>
                            <p className="mt-1 truncate text-lg font-semibold tabular-nums tracking-tight text-white">{item.value}</p>
                        </div>
                    ))}
                </div>
            </section>

            {error && (
                <div className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm font-semibold leading-6 text-red-100">{error}</div>
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
                        <div className="overflow-hidden rounded-[1.25rem] bg-white/[0.03] ring-1 ring-white/[0.06]">
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-white/[0.06] px-4 py-3 sm:px-5">
                                <span className="w-14 shrink-0 text-[11px] font-medium tracking-[0.02em] text-zinc-500">To</span>
                                <span className="relative min-w-0 flex-1">
                                    <select
                                        value={audience}
                                        onChange={(e) => setAudience(e.target.value)}
                                        aria-label="Audience"
                                        className="w-full cursor-pointer appearance-none rounded-lg bg-transparent py-1 pl-1 pr-7 text-sm font-bold text-white outline-none transition focus-visible:ring-1 focus-visible:ring-white/20 [&>option]:bg-zinc-950"
                                    >
                                        <option value="ALL_PAST">All past attendees (opted-in)</option>
                                        <option value="ATTENDEES">One event&apos;s attendees (opted-in)</option>
                                    </select>
                                    <svg viewBox="0 0 10 10" className="pointer-events-none absolute right-2 top-1/2 h-2.5 w-2.5 -translate-y-1/2 text-zinc-500" aria-hidden="true">
                                        <path d="M1 3l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </span>
                                {quote?.recipientCount > 0 ? (
                                    <span className="shrink-0 rounded-full bg-white/[0.06] px-2.5 py-1 text-[11px] font-medium tabular-nums text-zinc-300">
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
                                            className="w-full cursor-pointer appearance-none rounded-lg bg-transparent py-1 pl-1 pr-7 text-sm font-bold text-white outline-none transition focus-visible:ring-1 focus-visible:ring-white/20 [&>option]:bg-zinc-950"
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
                            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] bg-white/[0.02] px-4 py-2.5 sm:px-5">
                                <span className="text-[11px] font-semibold text-zinc-500">
                                    {isSms ? '"Reply STOP to unsubscribe." is appended automatically.' : 'An unsubscribe link is added automatically.'}
                                </span>
                                <span className={`text-[11px] font-bold tabular-nums ${body.length >= bodyMaxLength ? 'text-amber-300' : 'text-zinc-500'}`}>
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
                    <aside className="flex flex-col justify-between rounded-[1rem] bg-white/[0.045] p-5">
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
                        </div>
                        <div className="mt-6 space-y-3">
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="rounded-2xl bg-white/[0.04] px-3 py-3">
                                    <p className="text-[11px] font-medium tracking-[0.02em] text-zinc-500">Consent</p>
                                    <p className="mt-1 font-bold text-white">Enforced</p>
                                </div>
                                <div className="rounded-2xl bg-white/[0.04] px-3 py-3">
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
                                {busy ? 'Preparing...' : `Pay ${quote?.priceCents ? formatUsd(quote.priceCents) : ''} & send`}
                            </button>
                        </div>
                    </aside>
                </div>
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white/[0.035] px-4 py-3">
                    <p className="text-sm text-zinc-400">
                        {quote
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
                    <div className="rounded-2xl bg-white/[0.035] px-5 py-8 text-center">
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
                                        {c.subject} · {c.recipientCount} recipients · {formatUsd(c.priceCents)} · {formatDate(c.sentAt || c.createdAt)}
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
