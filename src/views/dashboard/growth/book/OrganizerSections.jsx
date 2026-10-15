'use client';

// The read-only blocks of the organizer quick view, top to bottom: why now, numbers, coming up, contact,
// brought in by, past nights, timeline. Each is small and takes plain data from GET /api/growth/organizers/:id.

import { useState } from 'react';
import { Button, KpiStrip, PersonLine, StateText } from '@/components/dashboard/ui/kit';
import { ago, count, dateTime, dayDate, displayName, handle, money, shortDate } from '@/lib/dashFormat';
import { claimSourceText, claimStatusOf, nightProgressLine, ticketsText, touchWord } from './bookFormat';

export function Section({ title, aside = null, children }) {
    return (
        <section>
            <div className="mb-3 flex items-baseline justify-between gap-3">
                <p role="heading" aria-level={3} className="text-[15px] font-semibold text-white">
                    {title}
                </p>
                {aside}
            </div>
            {children}
        </section>
    );
}

export function WhyNow({ signal }) {
    if (!signal?.text) return null;
    return (
        <div>
            <p className="text-[12px] font-semibold text-[#c77dff]">Why now</p>
            <p className="mt-1 text-[15px] leading-6 text-white">{signal.text}</p>
        </div>
    );
}

export function Numbers({ organizer }) {
    const life = organizer.lifetime || {};
    const last = organizer.last30 || {};
    const items = [{ label: 'PXI revenue', value: money(life.pxiRevenueCents || 0) }];
    if (life.grossCents != null) items.push({ label: 'Ticket sales', value: money(life.grossCents) });
    items.push({ label: 'Tickets', value: count(life.tickets || 0) });
    items.push({ label: 'Nights', value: count(life.events || 0) });
    return (
        <div>
            <KpiStrip items={items} className="xl:w-full!" />
            <p className="mt-2.5 text-[13px] text-white/50">
                Last 30 days: {money(last.pxiRevenueCents || 0)} PXI revenue, {ticketsText(last.tickets || 0)}
            </p>
        </div>
    );
}

function SoldBar({ sold, capacity, projected }) {
    if (!capacity) return null;
    const pct = (n) => Math.max(0, Math.min(100, (Number(n || 0) / capacity) * 100));
    return (
        <div className="relative mt-2.5 h-1.5 rounded-full bg-white/10" role="img" aria-label={`${sold} of ${capacity} sold`}>
            <div className="absolute inset-y-0 left-0 rounded-full bg-[#A523EF]" style={{ width: `${pct(sold)}%` }} />
            {Number(projected) > Number(sold) ? (
                <div className="absolute -top-[3px] h-3 w-0.5 rounded-full bg-white" style={{ left: `calc(${pct(projected)}% - 1px)` }} />
            ) : null}
        </div>
    );
}

export function ComingUp({ nights }) {
    if (!nights?.length) return null;
    return (
        <Section title="Coming up">
            <ul className="space-y-5">
                {nights.map((night) => (
                    <li key={night.eventId}>
                        <div className="flex items-baseline justify-between gap-3">
                            <p className="min-w-0 truncate text-[14px] font-semibold text-white">{night.name}</p>
                            <p className="shrink-0 text-[12px] text-white/45">{dayDate(night.startDate)}</p>
                        </div>
                        <SoldBar sold={night.sold} capacity={night.capacity} projected={night.projectedSold} />
                        <p className="mt-2 text-[12px] text-white/50">{nightProgressLine(night)}</p>
                    </li>
                ))}
            </ul>
        </Section>
    );
}

function CopyButton({ text }) {
    const [copied, setCopied] = useState(false);
    const copy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1600);
        } catch {
            setCopied(false);
        }
    };
    return (
        <Button size="sm" variant="secondary" onClick={copy}>
            {copied ? 'Copied' : 'Copy'}
        </Button>
    );
}

export function Contact({ organizer }) {
    const email = organizer.email || null;
    const instagram = String(organizer.instagramHandle || '').replace(/^@/, '').trim();
    if (!email && !instagram && !organizer.emailOptedOut) return null;
    return (
        <Section title="Contact">
            <dl className="space-y-2.5">
                {email ? (
                    <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                            <dt className="text-[12px] text-white/45">Email</dt>
                            <dd className="truncate text-[14px] text-white">{email}</dd>
                        </div>
                        <CopyButton text={email} />
                    </div>
                ) : null}
                {instagram ? (
                    <div>
                        <dt className="text-[12px] text-white/45">Instagram</dt>
                        <dd className="text-[14px]">
                            <a
                                href={`https://instagram.com/${encodeURIComponent(instagram)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#c77dff] hover:underline"
                            >
                                @{instagram}
                            </a>
                        </dd>
                    </div>
                ) : null}
            </dl>
            {organizer.emailOptedOut ? <p className="mt-3 text-[13px] text-amber-300">Asked the team to stop emailing</p> : null}
        </Section>
    );
}

const ROLE_WORDS = { AMBASSADOR: 'Ambassador', REGIONAL_MANAGER: 'Regional manager' };

export function BroughtInBy({ organizer, canAssign, onMove }) {
    const owner = organizer.owner;
    const earlier = (organizer.claims || [])
        .filter((c) => !owner || c.id !== owner.claimId)
        .sort((a, b) => new Date(b.raisedAt) - new Date(a.raisedAt));
    const status = owner ? claimStatusOf(owner.status) : null;
    return (
        <Section title="Brought in by">
            {owner ? (
                <div className="flex items-center justify-between gap-3">
                    <PersonLine
                        person={owner.seller}
                        meta={`${ROLE_WORDS[owner.seller?.role] || 'Seller'}, since ${shortDate(owner.since)}`}
                    />
                    <div className="shrink-0 text-right">
                        <StateText tone={status.tone}>{status.label}</StateText>
                        <p className="mt-0.5 text-[12px] text-white/45">{claimSourceText(owner.source)}</p>
                    </div>
                </div>
            ) : (
                <p className="text-[14px] text-white/50">No one yet.</p>
            )}

            {earlier.length ? (
                <div className="mt-4">
                    <p className="mb-2 text-[12px] text-white/40">Earlier</p>
                    <ul className="space-y-2.5">
                        {earlier.map((claim) => {
                            const s = claimStatusOf(claim.status);
                            const when = claim.revokedAt ? `Ended ${shortDate(claim.revokedAt)}` : `${claimSourceText(claim.source)} ${shortDate(claim.raisedAt)}`;
                            return (
                                <li key={claim.id} className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="truncate text-[13px] text-white">{handle(claim.seller)}</p>
                                        <p className="text-[12px] text-white/45">{when}</p>
                                        {claim.note ? <p className="mt-0.5 text-[12px] text-white/50">{claim.note}</p> : null}
                                    </div>
                                    <StateText tone={s.tone}>{s.label}</StateText>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            ) : null}

            {canAssign ? (
                <div className="mt-4">
                    <Button size="sm" variant="secondary" onClick={onMove}>
                        {owner ? 'Move to someone else' : 'Assign to someone'}
                    </Button>
                </div>
            ) : null}
        </Section>
    );
}

export function PastNights({ nights }) {
    if (!nights?.length) return null;
    const showGross = nights.some((n) => n.grossCents != null);
    return (
        <Section title="Past nights">
            <div className="grid grid-cols-[minmax(0,1fr)_44px_62px_76px] gap-x-3 px-3 pb-2 text-[11px] font-medium text-white/40 sm:grid-cols-[minmax(0,1fr)_52px_70px_88px]">
                <span>Night</span>
                <span className="text-right">Sold</span>
                <span className="text-right">Scanned</span>
                <span className="text-right">PXI revenue</span>
            </div>
            <ul className="space-y-1.5">
                {nights.map((night) => {
                    const scanned = Number(night.sold) > 0 ? `${Math.round((Number(night.scanned || 0) / Number(night.sold)) * 100)}%` : '-';
                    return (
                        <li
                            key={night.eventId}
                            className="grid grid-cols-[minmax(0,1fr)_44px_62px_76px] items-center gap-x-3 rounded-2xl bg-pxi-field px-3 py-2.5 sm:grid-cols-[minmax(0,1fr)_52px_70px_88px]"
                        >
                            <div className="min-w-0">
                                <p className="truncate text-[13px] font-semibold text-white">{night.name}</p>
                                <p className="text-[12px] text-white/45">{shortDate(night.startDate)}</p>
                            </div>
                            <p className="text-right text-[13px] text-white">{count(night.sold)}</p>
                            <p className="text-right text-[13px] text-white/70">{scanned}</p>
                            <div className="text-right">
                                <p className={`text-[13px] ${night.pxiRevenueCents ? 'text-white' : 'text-white/35'}`}>{money(night.pxiRevenueCents || 0)}</p>
                                {showGross && night.grossCents != null ? (
                                    <p className={`text-[12px] ${night.grossCents ? 'text-white/45' : 'text-white/30'}`}>{money(night.grossCents)} sales</p>
                                ) : null}
                            </div>
                        </li>
                    );
                })}
            </ul>
        </Section>
    );
}

const SHOWN_AT_FIRST = 8;

export function Timeline({ touches }) {
    const [all, setAll] = useState(false);
    const list = touches || [];
    const shown = all ? list : list.slice(0, SHOWN_AT_FIRST);
    return (
        <Section title="Timeline">
            {list.length ? (
                <>
                    <ul className="divide-y divide-white/[0.06]">
                        {shown.map((touch) => (
                            <li key={touch.id} className="py-3 first:pt-0">
                                <div className="flex items-baseline justify-between gap-3">
                                    <p className="text-[13px] font-semibold text-white">{touchWord(touch.kind)}</p>
                                    <p className="min-w-0 truncate text-right text-[12px] text-white/45">
                                        <span className="text-white/60">{displayName(touch.actor)}</span>
                                        <span className="ml-2">{ago(touch.at)}</span>
                                    </p>
                                </div>
                                {touch.kind === 'MEETING' && touch.meetingAt ? (
                                    <p className="mt-0.5 text-[12px] text-[#c77dff]">{dateTime(touch.meetingAt)}</p>
                                ) : null}
                                {touch.subject ? <p className="mt-1 text-[13px] text-white/75">{touch.subject}</p> : null}
                                {touch.body ? <p className="mt-0.5 whitespace-pre-wrap text-[13px] leading-5 text-white/60">{touch.body}</p> : null}
                            </li>
                        ))}
                    </ul>
                    {!all && list.length > SHOWN_AT_FIRST ? (
                        <div className="mt-2">
                            <Button size="sm" variant="quiet" onClick={() => setAll(true)}>
                                Show all {list.length}
                            </Button>
                        </div>
                    ) : null}
                </>
            ) : (
                <p className="text-[14px] text-white/50">No contact yet.</p>
            )}
        </Section>
    );
}
