'use client';

// The composer: three steps, each one a question. Who gets it, what to say, send. The payment flow is the one
// Campaigns always had (draft, quote, pay with credits or card through Stripe, PXI sends); consent and the
// unsubscribe link are enforced by the API, and the page says so in one line.

import { useState } from 'react';
import Link from 'next/link';
import { Button, Field, Notice, PageHeader, Panel, TextArea, WordTabs } from '@/components/dashboard/ui/kit';
import { StripePaymentModal } from '@/components/checkout/StripePaymentModal';
import { api } from '@/services/api';
import { count, money } from '@/lib/dashFormat';
import { useRequest } from '@/views/dashboard/audience/useRequest';
import FilterSelect from '@/views/dashboard/audience/FilterSelect';
import { nightOptions } from '@/views/dashboard/audience/audienceFilters';
import CampaignPreview from './CampaignPreview';
import { AUDIENCE_OPTIONS, campaignName, pickNights, startFrom } from './campaignText';

const CHANNEL_TABS = [
    { key: 'EMAIL', label: 'Email' },
    { key: 'SMS', label: 'Text' },
];

function quotePath({ audience, eventId, segmentId }, channel) {
    const params = new URLSearchParams({ audience, channel });
    if (audience === 'ATTENDEES') params.set('eventId', eventId);
    if (audience === 'SEGMENT') params.set('segmentId', segmentId);
    return `/api/campaigns/quote?${params}`;
}

/** Reach for both channels at once, so the audience step can say "48 by email, 12 by text". */
async function loadQuotes(target) {
    const [EMAIL, SMS] = await Promise.all(['EMAIL', 'SMS'].map((channel) => api.get(quotePath(target, channel)).catch(() => null)));
    return { EMAIL, SMS };
}

function sendError(error) {
    const raw = error?.data?.error || error?.data?.message || error?.message || '';
    if (error?.status === 404 || /not found/i.test(raw)) return 'Sending is not available here yet.';
    if (error?.status >= 500) return 'Campaigns are having trouble right now. Your message is still here. Try again in a moment.';
    return raw || 'Could not start this send. Try again.';
}

function Step({ number, title, children }) {
    return (
        <section className="py-6 first:pt-0 last:pb-0">
            <div className="flex items-center gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pxi-purple text-[11px] font-bold text-white">{number}</span>
                <h2 className="text-[17px] font-semibold text-white">{title}</h2>
            </div>
            <div className="mt-4">{children}</div>
        </section>
    );
}

function QuoteRow({ label, value, tone = null, strong = false, first = false }) {
    return (
        <div className={`flex items-center justify-between gap-4 py-3 text-[14px] ${first ? '' : 'border-t border-white/[0.08]'}`}>
            <dt className="text-white/60">{label}</dt>
            <dd className={`tabular-nums ${strong ? 'font-semibold text-white' : tone === 'good' ? 'text-emerald-300' : 'text-white'}`}>{value}</dd>
        </div>
    );
}

function ReachLine({ complete, audience, loading, quotes }) {
    if (!complete) {
        return <p className="mt-4 text-[13px] text-white/45">{audience === 'ATTENDEES' ? 'Choose a night to see who it reaches.' : 'Choose a list to see who it reaches.'}</p>;
    }
    if (!quotes) return <p className="mt-4 text-[13px] text-white/45">Counting who it reaches...</p>;
    if (!quotes.EMAIL && !quotes.SMS) return <p className="mt-4 text-[13px] text-amber-300">Could not count who it reaches. Try again in a moment.</p>;
    const email = quotes.EMAIL?.recipientCount ?? 0;
    const text = quotes.SMS?.recipientCount ?? 0;
    return (
        <p className={`mt-4 text-[14px] text-white/60 transition-opacity ${loading ? 'opacity-60' : ''}`}>
            <span className="font-semibold text-white">{count(email)}</span> by email, <span className="font-semibold text-white">{count(text)}</span> by text
            {email + text === 0 ? '. No one has opted in yet.' : ''}
        </p>
    );
}

/**
 * initial: { audience, eventId, segmentId } from the address (or the defaults).
 * onBack: back to the history. onDone(kind): the send is paid ('credits' or 'card').
 */
export default function CampaignComposer({ initial, events, segments, onBack, onDone }) {
    // A link can name a night or a list that is gone; then the select starts on "Choose" instead of a stale id.
    const [audience, setAudience] = useState(initial.audience);
    const [eventId, setEventId] = useState(events.some((e) => e.id === initial.eventId) ? initial.eventId : '');
    const [segmentId, setSegmentId] = useState(segments.some((s) => s.id === initial.segmentId) ? initial.segmentId : '');
    const [channel, setChannel] = useState('EMAIL');
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [payState, setPayState] = useState(null);

    const isSms = channel === 'SMS';
    const complete = audience === 'ALL_PAST' || (audience === 'ATTENDEES' && Boolean(eventId)) || (audience === 'SEGMENT' && Boolean(segmentId));
    const quoteKey = complete ? JSON.stringify([audience, audience === 'ATTENDEES' ? eventId : '', audience === 'SEGMENT' ? segmentId : '']) : null;
    const quoteReq = useRequest(quoteKey, () => loadQuotes({ audience, eventId, segmentId }));
    const quotes = quoteReq.data;
    const quote = complete && !quoteReq.loading ? quotes?.[channel] || null : null;

    // What a text can hold depends on who sends it: PXI puts "Sent via PXI on behalf of {name}: " in front and the
    // STOP line after, and the API refuses anything that does not fit. The quote carries the exact room left; it is
    // kept from the last quote so the limit does not jump while a new one loads. 320 is only the first guess.
    const senderName = quotes?.EMAIL?.sentOnBehalfOf || quotes?.SMS?.sentOnBehalfOf || '';
    const smsBudget = typeof quotes?.SMS?.smsBodyBudget === 'number' ? quotes.SMS.smsBodyBudget : null;
    const bodyMax = isSms ? smsBudget ?? 320 : 10000;
    const bodyTooLong = body.length > bodyMax;
    const smsNotReady = isSms && quotes?.SMS?.smsChannelReady === false;

    const nights = pickNights(events);
    const chosenNight = audience === 'ATTENDEES' ? events.find((e) => e.id === eventId) || null : null;
    const nightPick = [{ value: '', label: 'Choose a night' }, ...nightOptions(events).slice(1)];
    const listPick = [{ value: '', label: segments.length ? 'Choose a list' : 'No saved lists yet' }, ...segments.map((s) => ({ value: s.id, label: s.name }))];

    const creditApplied = quote?.creditAppliedCents || 0;
    const cardRemainder = quote?.stripeRemainderCents ?? (quote ? quote.priceCents - creditApplied : 0);
    const fullyCredits = Boolean(quote) && quote.priceCents > 0 && cardRemainder === 0;

    let blocker = '';
    if (!complete) blocker = audience === 'ATTENDEES' ? 'Choose a night.' : 'Choose a list.';
    else if (quoteReq.loading) blocker = 'Counting who it reaches.';
    else if (!quote) blocker = 'Could not count who it reaches.';
    else if (smsNotReady) blocker = 'Texts cannot be sent yet.';
    else if (!quote.recipientCount) blocker = isSms ? 'No one has opted in for text yet.' : 'No one has opted in for email yet.';
    else if (!isSms && !subject.trim()) blocker = 'Add a subject.';
    else if (!body.trim()) blocker = 'Write your message.';
    else if (bodyTooLong) blocker = `That is ${count(body.length - bodyMax)} over what a text can hold. Shorten it.`;

    function fill(key) {
        const message = startFrom({ key, channel, nights, night: chosenNight });
        if (!message) return;
        setBody(message.body.slice(0, bodyMax));
        if (!isSms) setSubject(message.subject);
    }

    async function createAndPay() {
        setBusy(true);
        setError('');
        try {
            const { campaign } = await api.post('/api/campaigns', {
                name: campaignName({ channel, subject, body }) || 'Campaign',
                channel,
                ...(isSms ? {} : { subject: subject.trim() }),
                body: body.trim(),
                audience,
                ...(audience === 'ATTENDEES' ? { eventId } : {}),
                ...(audience === 'SEGMENT' ? { segmentId } : {}),
            });
            const pay = await api.post(`/api/campaigns/${campaign.id}/pay`, {});
            if (pay.paid) {
                // Fully covered by credits: settled and sending, no card step.
                onDone('credits');
                return;
            }
            setPayState({ campaignId: campaign.id, clientSecret: pay.clientSecret });
        } catch (err) {
            setError(sendError(err));
        } finally {
            setBusy(false);
        }
    }

    const startButtons = [
        { key: 'thanks', label: 'Thank you, see you next time', ok: true },
        { key: 'last', label: nights.next ? `Last call for ${nights.next.name}` : 'Last call', ok: Boolean(nights.next) },
        { key: 'tonight', label: "Tonight's details", ok: Boolean(nights.tonight || nights.next) },
    ];

    return (
        <div className="space-y-5 md:space-y-6">
            <PageHeader
                title="New campaign"
                aside={
                    <div className="-mt-3 xl:mt-0">
                        <Button variant="quiet" onClick={onBack} className="!px-0">
                            Back to campaigns
                        </Button>
                    </div>
                }
            />

            <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
                <Panel>
                    <div className="divide-y divide-white/[0.08]">
                        <Step number={1} title="Who gets it?">
                            <div className={`grid gap-3 ${audience === 'ALL_PAST' ? '' : 'md:grid-cols-2'}`}>
                                <FilterSelect ariaLabel="Who gets it" value={audience} onChange={(e) => setAudience(e.target.value)} options={AUDIENCE_OPTIONS} />
                                {audience === 'ATTENDEES' ? (
                                    <FilterSelect ariaLabel="Night" value={eventId} onChange={(e) => setEventId(e.target.value)} options={nightPick} />
                                ) : null}
                                {audience === 'SEGMENT' ? (
                                    <FilterSelect ariaLabel="Saved list" value={segmentId} onChange={(e) => setSegmentId(e.target.value)} options={listPick} disabled={!segments.length} />
                                ) : null}
                            </div>
                            {audience === 'SEGMENT' ? (
                                <Link href="/dashboard/audience" className="mt-3 inline-block text-[13px] text-white/50 underline-offset-4 transition hover:text-white hover:underline">
                                    Build a list in Audience
                                </Link>
                            ) : null}
                            <ReachLine complete={complete} audience={audience} loading={quoteReq.loading} quotes={complete ? quotes : null} />
                        </Step>

                        <Step number={2} title="What do you want to say?">
                            <WordTabs items={CHANNEL_TABS} value={channel} onChange={setChannel} className="mb-5" />
                            {!isSms ? (
                                <Field label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={200} placeholder="Tonight's details are live" className="mb-4" />
                            ) : null}
                            <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1">
                                <span className="text-[12px] text-white/45">Start from</span>
                                {startButtons.map((b) => (
                                    <Button key={b.key} variant="quiet" size="sm" onClick={() => fill(b.key)} disabled={!b.ok} className="!px-0 text-left underline-offset-4 hover:underline">
                                        {b.label}
                                    </Button>
                                ))}
                            </div>
                            <TextArea
                                aria-label="Message"
                                value={body}
                                onChange={(e) => setBody(e.target.value.slice(0, bodyMax))}
                                rows={isSms ? 5 : 9}
                                placeholder={isSms ? "Tonight's set starts at 9. See you there." : 'Write your message. Blank lines become paragraphs.'}
                            />
                            {isSms ? (
                                <p className={`mt-1.5 text-right text-[12px] tabular-nums ${bodyTooLong ? 'text-red-300' : 'text-white/40'}`}>
                                    {count(body.length)}/{count(bodyMax)}
                                </p>
                            ) : null}
                            {smsNotReady ? <Notice className="mt-3">Texts cannot be sent yet. Switch to Email to send.</Notice> : null}
                        </Step>

                        <Step number={3} title="Send">
                            {quote && quote.recipientCount > 0 ? (
                                <dl className="rounded-2xl bg-pxi-field px-4">
                                    <QuoteRow first label="People" value={count(quote.recipientCount)} />
                                    <QuoteRow label="Cost" value={money(quote.priceCents)} />
                                    {creditApplied > 0 ? <QuoteRow label="Credits applied" tone="good" value={`-${money(creditApplied)}`} /> : null}
                                    <QuoteRow label="Card pays" strong value={money(cardRemainder)} />
                                </dl>
                            ) : (
                                <p className="rounded-2xl bg-pxi-field px-4 py-3 text-[13px] text-white/50">The cost shows here once it knows who it reaches.</p>
                            )}
                            <p className="mt-3 text-[12px] text-white/45">Only people who opted in get it. PXI adds the unsubscribe link.</p>
                            {error ? (
                                <Notice tone="error" className="mt-4">
                                    {error}
                                </Notice>
                            ) : null}
                            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                                <Button variant="primary" size="lg" onClick={createAndPay} disabled={busy || Boolean(blocker)} className="sm:min-w-[160px]">
                                    {busy ? 'Preparing...' : fullyCredits ? 'Send with credits' : 'Pay and send'}
                                </Button>
                                {blocker ? <p className="text-[13px] text-white/45">{blocker}</p> : null}
                            </div>
                        </Step>
                    </div>
                </Panel>

                <div className="xl:sticky xl:top-5">
                    <CampaignPreview channel={channel} subject={subject} body={body} senderName={senderName} />
                </div>
            </div>

            <StripePaymentModal
                open={Boolean(payState)}
                clientSecret={payState?.clientSecret}
                returnUrl={typeof window !== 'undefined' ? `${window.location.origin}/dashboard/campaigns` : undefined}
                onSuccess={() => {
                    setPayState(null);
                    onDone('card');
                }}
                onCancel={() => setPayState(null)}
            />
        </div>
    );
}
