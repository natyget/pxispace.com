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
    DRAFT: 'bg-white/5 text-white/60 border-white/10',
    PENDING_PAYMENT: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
    SENDING: 'bg-sky-500/10 text-sky-300 border-sky-500/20',
    SENT: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
    FAILED: 'bg-red-500/10 text-red-300 border-red-500/20',
    CANCELLED: 'bg-white/5 text-white/40 border-white/10',
};

const inputCls =
    'w-full rounded-xl border border-white/10 bg-zinc-900/60 px-4 py-2.5 text-sm text-white placeholder:text-white/35 outline-none focus:border-white/25';

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
            setError(err?.message || 'Failed to load campaigns');
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
            setError(err?.message || 'Failed to create campaign');
        } finally {
            setBusy(false);
        }
    };

    const canSubmit = name.trim() && subject.trim() && body.trim() && quote?.recipientCount > 0
        && (audience !== 'ATTENDEES' || eventId);

    return (
        <div className="mx-auto max-w-5xl space-y-8">
            <div>
                <h1 className="text-2xl font-black tracking-tight text-white md:text-3xl">Email Campaigns</h1>
                <p className="mt-1 text-sm text-zinc-500">
                    Real sends to your opted-in attendees. Priced per recipient; PXI enforces consent and unsubscribes automatically.
                </p>
            </div>

            {error && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>
            )}

            <SectionCard title="New campaign" dense>
                <div className="grid gap-4 sm:grid-cols-2">
                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Internal name (e.g. Summer kickoff blast)" className={inputCls} />
                    <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Email subject line" className={inputCls} />
                    <select value={audience} onChange={(e) => setAudience(e.target.value)} className={inputCls}>
                        <option value="ALL_PAST">All my past attendees (opted-in)</option>
                        <option value="ATTENDEES">Attendees of one event (opted-in)</option>
                    </select>
                    {audience === 'ATTENDEES' ? (
                        <select value={eventId} onChange={(e) => setEventId(e.target.value)} className={inputCls}>
                            <option value="">Choose event…</option>
                            {events.map((ev) => (
                                <option key={ev.id} value={ev.id}>{ev.name}</option>
                            ))}
                        </select>
                    ) : <div />}
                    <textarea
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        rows={6}
                        placeholder={'Write your message…\n\nBlank lines become paragraphs. An unsubscribe link is added automatically.'}
                        className={`${inputCls} sm:col-span-2 resize-y`}
                    />
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-zinc-400">
                        {quote
                            ? quote.recipientCount > 0
                                ? <>Reaches <span className="font-bold text-white">{quote.recipientCount}</span> opted-in {quote.recipientCount === 1 ? 'person' : 'people'} · <span className="font-bold text-white">{formatUsd(quote.priceCents)}</span></>
                                : 'No opted-in recipients yet — attendees enable event updates in their PXI settings.'
                            : audience === 'ATTENDEES' && !eventId
                                ? 'Pick an event to see the audience.'
                                : 'Calculating audience...'}
                    </p>
                    <button
                        type="button"
                        onClick={createAndPay}
                        disabled={busy || !canSubmit}
                        className="rounded-full bg-white px-6 py-2.5 text-sm font-bold text-black disabled:opacity-40"
                    >
                        {busy ? 'Preparing...' : `Pay ${quote?.priceCents ? formatUsd(quote.priceCents) : ''} & send`}
                    </button>
                </div>
            </SectionCard>

            <SectionCard title="History" dense>
                {loading ? (
                    <p className="px-2 py-4 text-sm text-zinc-500">Loading...</p>
                ) : campaigns.length === 0 ? (
                    <p className="px-2 py-4 text-sm text-zinc-500">No campaigns yet. Your first send shows up here.</p>
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
                                <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${statusStyle[c.status] || statusStyle.DRAFT}`}>
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
