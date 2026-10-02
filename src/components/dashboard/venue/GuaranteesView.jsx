'use client';

// VEN-8, "Guarantees": what PXI promised this venue (VEN-7), and how a promise works, in the design's sections.
// The words follow VEN-7's rules exactly: a person is a ticket scanned at the door inside the night's window,
// a sale or an album join never counts, and nothing is paid until a person at PXI has reviewed the count.
// Credits are shown because they are a promise to the venue itself, not anyone's revenue.

import { useEffect, useState } from 'react';
import { fetchVenueGuarantees } from '@/services/venues';
import { DASHBOARD_BRAND_COLOR } from '@/components/dashboard/chartStyles';
import { formatInteger, formatNightDate } from '@/lib/venueDashboard';
import { CardError, CardSkeleton } from './VenueCard';

const STATUS = {
    OFFERED: 'On offer',
    MEASURED: 'Counted, under review',
    SETTLED: 'Settled',
    VOID: 'Withdrawn',
};

function formatCents(cents) {
    return `$${(Number(cents || 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function formatMoment(iso, timeZone) {
    if (!iso) return '';
    try {
        return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', ...(timeZone ? { timeZone } : {}) });
    } catch {
        return '';
    }
}

function Block({ title, children }) {
    return (
        <section className="rounded-xl p-4 ring-1 ring-white/[0.1]">
            <h3 className="text-[14px] font-semibold text-white">{title}</h3>
            <div className="mt-3">{children}</div>
        </section>
    );
}

function Tile({ lead, title, body }) {
    return (
        <div className="rounded-xl bg-white/[0.09] p-4 ring-1 ring-white/[0.12]">
            {lead ? <p className="text-[13px] font-bold text-white">{lead}</p> : null}
            <p className={`text-[15px] font-bold text-white ${lead ? 'mt-1' : ''}`}>{title}</p>
            <p className="mt-1 text-[12px] leading-5 text-white/60">{body}</p>
        </div>
    );
}

export default function GuaranteesView({ venueId, timeZone = null }) {
    const [rows, setRows] = useState(null);
    const [error, setError] = useState(null);
    const [selectedId, setSelectedId] = useState(null);

    useEffect(() => {
        let cancelled = false;
        fetchVenueGuarantees(venueId)
            .then((res) => { if (!cancelled) setRows(res.guarantees || []); })
            .catch((err) => { if (!cancelled) setError(err.message || 'Failed to load guarantees'); });
        return () => { cancelled = true; };
    }, [venueId]);

    const live = (rows || []).filter((g) => g.status !== 'VOID');
    const selected = live.find((g) => g.id === selectedId) || live[0] || null;
    const count = (status) => (rows || []).filter((g) => g.status === status).length;
    const shortBy = selected && selected.shortfall !== null && selected.shortfall !== undefined ? selected.shortfall : null;

    return (
        <section className="glass-panel rounded-[1.25rem] p-4" data-venue-card="guarantees">
            <h2 className="text-[15px] font-semibold tracking-tight text-white/85">Guarantees</h2>

            {error ? <div className="mt-3"><CardError>{error}</CardError></div> : null}
            {!rows && !error ? <div className="mt-3"><CardSkeleton className="h-10" /></div> : null}

            {rows ? (
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                    {[['On offer', count('OFFERED')], ['Counted, under review', count('MEASURED')], ['Settled', count('SETTLED')]].map(([label, n]) => (
                        <p key={label} className="flex items-center justify-between rounded-full bg-white/[0.09] px-5 py-2.5 text-[13px] text-white/80 ring-1 ring-white/[0.12]">
                            <span>{label}</span>
                            <span className="font-bold text-white tabular-nums">{n}</span>
                        </p>
                    ))}
                </div>
            ) : null}

            {rows && !rows.length ? (
                <p className="mt-3 text-[13px] leading-6 text-white/55">
                    No guarantee on this venue yet. When PXI offers one, the promise, the count and any credits show here. This is how one works.
                </p>
            ) : null}

            {rows?.length ? (
                <ul className="mt-3 space-y-2">
                    {rows.map((g) => (
                        <li key={g.id}>
                            <button
                                type="button"
                                onClick={() => setSelectedId(g.id)}
                                disabled={g.status === 'VOID'}
                                aria-pressed={selected?.id === g.id}
                                className={`flex w-full flex-wrap items-center justify-between gap-2 rounded-xl px-4 py-3 text-left text-[13px] transition ${selected?.id === g.id ? 'bg-white/[0.09] ring-1 ring-white/[0.16]' : 'bg-white/[0.035] hover:bg-white/[0.06]'}`}
                            >
                                <span className="min-w-0">
                                    <span className="block truncate font-semibold text-white">{g.event?.name || 'A night here'}</span>
                                    <span className="block text-[12px] text-white/45">{formatNightDate(g.event?.startDate, timeZone)}</span>
                                </span>
                                <span className="rounded-full bg-white/[0.08] px-2.5 py-1 text-[11px] text-white/75">{STATUS[g.status] || g.status}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            ) : null}

            <div className="mt-4 space-y-4">
                <Block title="What is Guaranteed">
                    <div className="grid gap-3 md:grid-cols-3">
                        {selected ? (
                            <>
                                <Tile title={`${formatInteger(selected.guaranteedAttendees)} people`} body={`Through your door on ${selected.event?.name || 'the night'}.`} />
                                <Tile title={`${formatCents(selected.refundPerShortfallCents)} per person short`} body="In PXI credits, for each person fewer than promised." />
                                <Tile title={`Up to ${formatCents(selected.maxPayoutCents)}`} body="The most this promise can credit, agreed before the night." />
                            </>
                        ) : (
                            <>
                                <Tile title="A number of people" body="PXI promises at least this many people through your door on one night." />
                                <Tile title="Credits per person short" body="If fewer come, PXI credits you for each person fewer than promised." />
                                <Tile title="A stated maximum" body="Every promise has a cap, agreed before the night." />
                            </>
                        )}
                    </div>
                </Block>

                <Block title="How it Works">
                    <div className="grid gap-3 md:grid-cols-3">
                        <Tile lead="1" title="PXI makes the offer" body="For one night, in writing: how many people, the credit per person short, and the cap." />
                        <Tile lead="2" title="Your door does the counting" body="Each ticket scanned at your door on the night is one person. A ticket can only be scanned once." />
                        <Tile lead="3" title="A person checks the count" body="After the night PXI reviews the count and settles it. Nothing is credited automatically." />
                    </div>
                </Block>

                <Block title="What counts">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[640px] border-collapse text-left text-[12px]">
                            <thead>
                                <tr className="text-[12px] font-semibold text-white" style={{ borderBottom: `2px solid ${DASHBOARD_BRAND_COLOR}` }}>
                                    {['What happened', 'Counts', 'When', 'Why'].map((heading, i) => (
                                        <th key={heading} className="px-3 py-2 font-semibold" style={i ? { borderLeft: `2px solid ${DASHBOARD_BRAND_COLOR}` } : undefined}>{heading}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="text-white/70">
                                {[
                                    [
                                        'A ticket scanned at your door',
                                        'Yes',
                                        selected
                                            ? `${formatMoment(selected.windowStart, timeZone)} to ${formatMoment(selected.windowEnd, timeZone)}`
                                            : 'From two hours before the start to the end of the night',
                                        'One ticket is one person, and it can only be scanned once.',
                                    ],
                                    ['A ticket sold but never scanned', 'No', 'Never', 'A sale is not a person in the room.'],
                                    ['Joining the album or opening the event page', 'No', 'Never', 'Anyone with the link can do that from home.'],
                                ].map((cells) => (
                                    <tr key={cells[0]} className="border-b border-white/[0.14]">
                                        {cells.map((cell, i) => (
                                            <td key={i} className={`px-3 py-2.5 align-top ${i === 0 ? 'font-medium text-white/85' : ''}`} style={i ? { borderLeft: `2px solid ${DASHBOARD_BRAND_COLOR}` } : undefined}>{cell}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Block>

                <Block title="What guarantee applies">
                    <ul className="space-y-2 rounded-xl bg-white/[0.09] p-4 text-[13px] text-white/80 ring-1 ring-white/[0.12]">
                        {[
                            'PXI offered it in writing before the night. A promise that was never offered, or was withdrawn, does not apply.',
                            'It is for one night at this venue, and it is made to the account that owns the venue on PXI.',
                            'Tickets were scanned at the door on the night. If the door does not scan, there is no count to settle.',
                        ].map((line) => (
                            <li key={line} className="flex gap-3">
                                <svg viewBox="0 0 16 16" className="mt-0.5 h-4 w-4 shrink-0 text-white" fill="none" aria-hidden="true">
                                    <path d="M3 8.5l3.2 3.2L13 4.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <span>{line}</span>
                            </li>
                        ))}
                    </ul>
                </Block>

                <Block title="What happens if a guarantee isn't met">
                    <div className="grid items-center gap-3 md:grid-cols-[1fr_auto_1fr]">
                        <Tile
                            title={shortBy !== null ? (shortBy > 0 ? `${formatInteger(shortBy)} fewer than promised` : 'The promise was met') : 'Fewer people than promised'}
                            body={
                                selected && selected.measuredAttendees !== null && selected.measuredAttendees !== undefined
                                    ? `Counted at the door: ${formatInteger(selected.measuredAttendees)} of ${formatInteger(selected.guaranteedAttendees)} promised.`
                                    : 'The shortfall is the number promised minus the people scanned in at your door.'
                            }
                        />
                        <svg viewBox="0 0 48 32" className="mx-auto h-8 w-12 rotate-90 text-white md:rotate-0" fill="none" aria-hidden="true">
                            <path d="M2 16h42M32 4l12 12-12 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <Tile
                            title={
                                selected && selected.settledPayoutCents !== null && selected.settledPayoutCents !== undefined
                                    ? `${formatCents(selected.settledPayoutCents)} in credits`
                                    : 'PXI credits you for each person short'
                            }
                            body={
                                selected && selected.settledPayoutCents !== null && selected.settledPayoutCents !== undefined
                                    ? `Settled ${formatMoment(selected.settledAt, timeZone)}.`
                                    : 'Up to the cap, as PXI credits on your account, once a person at PXI has reviewed the count.'
                            }
                        />
                    </div>
                </Block>
            </div>
        </section>
    );
}
