'use client';

import { useEffect, useState } from 'react';
import { Button, Field, Skeleton, TextArea } from '@/components/dashboard/ui/kit';
import { count } from '@/lib/dashFormat';
import { cleanUsername } from '@/lib/staffSetup';
import { fetchSalesVenues, raiseSalesClaim } from '@/services/sales';

/**
 * Claim a venue for its account (the Sales venue flow, as before): search the venues in your city, pick one,
 * name the venue's account by its exact username. Approving gives that account the venue's analytics.
 */
export default function VenueClaimForm({ cityName, onSent }) {
    const [q, setQ] = useState('');
    const [found, setFound] = useState({ q: null, venues: [], failed: false });
    const [selected, setSelected] = useState(null);
    const [username, setUsername] = useState('');
    const [note, setNote] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        let alive = true;
        const timer = setTimeout(() => {
            fetchSalesVenues(q.trim()).then(
                (data) => {
                    if (alive) setFound({ q, venues: data.venues || [], failed: false });
                },
                () => {
                    if (alive) setFound({ q, venues: [], failed: true });
                },
            );
        }, 300);
        return () => {
            alive = false;
            clearTimeout(timer);
        };
    }, [q]);

    const searching = found.q !== q;
    const account = cleanUsername(username);

    const submit = async () => {
        if (!selected || !account) return;
        setBusy(true);
        setError(null);
        try {
            await raiseSalesClaim({ venueId: selected.id, beneficiaryUsername: account, note: note.trim() || undefined });
            onSent();
        } catch (err) {
            setError(err.message || 'That did not send. Try again.');
            setBusy(false);
        }
    };

    return (
        <form
            className="space-y-5"
            onSubmit={(e) => {
                e.preventDefault();
                submit();
            }}
        >
            <Field
                type="search"
                label="Venue"
                placeholder="Search venues..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                hint={`Only ${cityName || 'your city'} venues are listed. A venue that is claimed, or already has a claim waiting, cannot be picked.`}
            />

            <div className="max-h-64 space-y-1.5 overflow-y-auto">
                {searching ? (
                    <>
                        <Skeleton className="h-14 rounded-2xl" />
                        <Skeleton className="h-14 rounded-2xl" />
                    </>
                ) : found.failed ? (
                    <p className="text-[13px] text-amber-300">Venues could not be loaded. Try again.</p>
                ) : found.venues.length === 0 ? (
                    <p className="text-[13px] text-white/45">No venues found.</p>
                ) : (
                    found.venues.map((v) => {
                        const unavailable = v.claimed || v.claimPending;
                        const active = selected?.id === v.id;
                        return (
                            <button
                                key={v.id}
                                type="button"
                                disabled={unavailable}
                                onClick={() => setSelected(v)}
                                className={`flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left transition disabled:opacity-40 ${active ? 'bg-[#3a3a3a]' : 'bg-pxi-field hover:bg-[#363636]'}`}
                            >
                                <span className="min-w-0">
                                    <span className="block truncate text-[14px] font-semibold text-white">{v.name}</span>
                                    <span className="block truncate text-[12px] text-white/45">{v.address || 'No address'}</span>
                                </span>
                                <span className="shrink-0 text-right text-[12px] text-white/45">
                                    <span className="block">{`${count(v.eventCount)} ${Number(v.eventCount) === 1 ? 'event' : 'events'}`}</span>
                                    <span className="block font-semibold text-white/70">{v.claimed ? 'Claimed' : v.claimPending ? 'Claim waiting' : active ? 'Selected' : ''}</span>
                                </span>
                            </button>
                        );
                    })
                )}
            </div>

            {selected ? (
                <div className="space-y-5">
                    <Field
                        label={`Account for ${selected.name}`}
                        placeholder="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        autoComplete="off"
                        autoCapitalize="none"
                        spellCheck={false}
                        hint="Its exact PXI username. Approving gives that account the venue's analytics, so check it is really the venue."
                    />
                    <TextArea label="Note for the approver (optional)" rows={3} value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
                    <div className="space-y-3">
                        <Button type="submit" variant="primary" size="lg" className="w-full" disabled={busy || !account}>
                            {busy ? 'Sending...' : 'Send for approval'}
                        </Button>
                        {error ? <p className="text-[13px] text-red-300">{error}</p> : null}
                    </div>
                </div>
            ) : null}
        </form>
    );
}
