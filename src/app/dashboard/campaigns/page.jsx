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

const inputCls =
    'dashboard-input min-h-12 w-full px-4 py-3 text-sm font-semibold text-white placeholder:text-white/35';

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
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [audience, setAudience] = useState('ALL_PAST');
    const [eventId, setEventId] = useState('');
    const [quote, setQuote] = useState(null);
    const [busy, setBusy] = useState(false);

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

    // Live quote as the audience selection changes.
    useEffect(() => {
        let cancelled = false;
        const params = new URLSearchParams({ audience });
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
    }, [audience, eventId]);

    const createAndPay = async () => {
        setBusy(true);
        setError(null);
        try {
            const { campaign } = await api.post('/api/campaigns', {
                name: name.trim(),
                subject: subject.trim(),
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

    const canSubmit = name.trim() && subject.trim() && body.trim() && quote?.recipientCount > 0
        && (audience !== 'ATTENDEES' || eventId);

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            <section className="dashboard-surface-b rounded-[1.75rem] px-5 py-6 md:px-7">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-2xl">
                        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">Campaigns</p>
                        <h1 className="mt-2 text-4xl font-black leading-none text-white md:text-5xl">Email Campaigns</h1>
                        <p className="mt-2 text-sm leading-6 text-zinc-400">
                            Send to opted-in attendees with pricing, consent, and unsubscribe handling managed by PXI.
                            Want sponsored feed, discovery, or featured placements?{' '}
                            <a href="/dashboard/ads" className="font-bold text-white underline decoration-white/30 underline-offset-2">
                                Promote with Ads →
                            </a>
                        </p>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center sm:min-w-[360px]">
                        {[
                            { label: 'Reach', value: quote?.recipientCount ?? '—' },
                            { label: 'Cost', value: quote ? formatUsd(quote.priceCents) : '—' },
                            { label: 'History', value: loading ? '—' : campaigns.length },
                        ].map((item) => (
                            <div key={item.label} className="rounded-2xl bg-white/[0.045] px-3 py-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{item.label}</p>
                                <p className="mt-1 truncate text-lg font-black tabular-nums text-white">{item.value}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {error && (
                <div className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm font-semibold leading-6 text-red-100">{error}</div>
            )}

            <SectionCard title="Compose send" dense className="dashboard-surface-b !shadow-[0_22px_70px_rgba(0,0,0,0.28)]">
                <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className="space-y-2">
                            <span className="px-1 text-[10px] font-black uppercase tracking-widest text-zinc-500">Internal name</span>
                            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Summer kickoff blast" className={inputCls} />
                        </label>
                        <label className="space-y-2">
                            <span className="px-1 text-[10px] font-black uppercase tracking-widest text-zinc-500">Subject line</span>
                            <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Tonight's details are live" className={inputCls} />
                        </label>
                        <label className="space-y-2">
                            <span className="px-1 text-[10px] font-black uppercase tracking-widest text-zinc-500">Audience</span>
                            <select value={audience} onChange={(e) => setAudience(e.target.value)} className={`${inputCls} appearance-none`}>
                                <option value="ALL_PAST">All past attendees (opted-in)</option>
                                <option value="ATTENDEES">One event's attendees (opted-in)</option>
                            </select>
                        </label>
                        {audience === 'ATTENDEES' ? (
                            <label className="space-y-2">
                                <span className="px-1 text-[10px] font-black uppercase tracking-widest text-zinc-500">Event</span>
                                <select value={eventId} onChange={(e) => setEventId(e.target.value)} className={`${inputCls} appearance-none`}>
                                    <option value="">Choose event...</option>
                                    {events.map((ev) => (
                                        <option key={ev.id} value={ev.id}>{ev.name}</option>
                                    ))}
                                </select>
                            </label>
                        ) : <div className="hidden sm:block" />}
                        <label className="space-y-2 sm:col-span-2">
                            <span className="px-1 text-[10px] font-black uppercase tracking-widest text-zinc-500">Message</span>
                            <textarea
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                                rows={8}
                                placeholder={'Write your message...\n\nBlank lines become paragraphs. An unsubscribe link is added automatically.'}
                                className={`${inputCls} resize-y rounded-[1.25rem]`}
                            />
                        </label>
                    </div>
                    <aside className="flex flex-col justify-between rounded-[1.35rem] bg-white/[0.045] p-5">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Send quote</p>
                            <p className="mt-2 text-3xl font-black tabular-nums text-white">
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
                                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Consent</p>
                                    <p className="mt-1 font-black text-white">Enforced</p>
                                </div>
                                <div className="rounded-2xl bg-white/[0.04] px-3 py-3">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Unsubscribe</p>
                                    <p className="mt-1 font-black text-white">Automatic</p>
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
                                <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${statusStyle[c.status] || statusStyle.DRAFT}`}>
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
