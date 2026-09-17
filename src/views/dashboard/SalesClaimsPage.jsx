'use client';

// PART-4: venue claims for ambassadors and regional managers (backend /api/sales).
// An ambassador or manager raises a claim on a venue in their territory for a vendor account. It waits for the
// regional manager of that city, who approves or rejects it. Nobody approves their own claim. Every rule is
// enforced by the backend; this page shows its refusals as they come.

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    approveSalesClaim,
    fetchSalesClaims,
    fetchSalesMe,
    fetchSalesVenues,
    raiseSalesClaim,
    rejectSalesClaim,
} from '@/services/sales';
import { cityLabel } from '@/lib/dashboardNavConfig';

const STATUS_STYLES = {
    PENDING_APPROVAL: 'bg-amber-500/10 text-amber-300',
    ACTIVE: 'bg-emerald-500/10 text-emerald-300',
    REJECTED: 'bg-red-500/10 text-red-300',
    REVOKED: 'bg-white/[0.06] text-white/50',
};
const STATUS_LABELS = { PENDING_APPROVAL: 'Waiting for approval', ACTIVE: 'Approved', REJECTED: 'Rejected', REVOKED: 'Revoked' };

const inputCls = 'w-full rounded-full bg-white/[0.055] px-4 py-2.5 text-[14px] text-white placeholder:text-white/35 outline-none focus:bg-white/[0.075]';
const pillBtn = 'rounded-full bg-white/[0.065] px-4 py-1.5 text-[12px] font-semibold text-white/70 hover:bg-white/[0.1] hover:text-white disabled:opacity-40';

function formatDate(iso) {
    if (!iso) return '';
    try {
        return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
        return '';
    }
}

function Panel({ title, hint, children }) {
    return (
        <section className="dashboard-surface rounded-[1.75rem] p-5">
            <h2 className="text-[15px] font-semibold text-white">{title}</h2>
            {hint ? <p className="mt-1 text-[13px] leading-5 text-white/45">{hint}</p> : null}
            <div className="mt-4">{children}</div>
        </section>
    );
}

function ClaimRow({ claim, children }) {
    return (
        <li className="flex flex-col gap-3 rounded-2xl bg-white/[0.035] px-4 py-3 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
                <p className="truncate text-[14px] font-semibold text-white">{claim.venue.name}</p>
                <p className="mt-0.5 text-[12px] text-white/45">
                    For @{claim.beneficiary.username || 'account'} · raised {formatDate(claim.raisedAt)} ·{' '}
                    {claim.exposedEventCount} events, {claim.exposedAttendeeCount} attendees
                </p>
                {claim.decidedNote ? <p className="mt-1 text-[12px] text-white/55">Note: {claim.decidedNote}</p> : null}
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${STATUS_STYLES[claim.status] || ''}`}>
                    {STATUS_LABELS[claim.status] || claim.status}
                </span>
                {children}
            </div>
        </li>
    );
}

function QueueActions({ claim, onDone }) {
    const [note, setNote] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);

    if (claim.raisedByMe) {
        return <span className="text-[12px] text-white/40">Your claim. Another approver decides it.</span>;
    }
    const act = async (fn) => {
        setBusy(true);
        setError(null);
        try {
            await fn(claim.id, note.trim() || undefined);
            onDone();
        } catch (err) {
            setError(err.message || 'Action failed');
            setBusy(false);
        }
    };
    return (
        <div className="flex flex-wrap items-center gap-2">
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional)" className="rounded-full bg-white/[0.055] px-3 py-1.5 text-[12px] text-white placeholder:text-white/35 outline-none" />
            <button type="button" disabled={busy} onClick={() => act(approveSalesClaim)} className="rounded-full bg-emerald-500/10 px-4 py-1.5 text-[12px] text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-40">
                Approve
            </button>
            <button type="button" disabled={busy} onClick={() => act(rejectSalesClaim)} className="rounded-full bg-red-500/10 px-4 py-1.5 text-[12px] text-red-300 hover:bg-red-500/20 disabled:opacity-40">
                Reject
            </button>
            {error ? <span className="text-[12px] text-red-300">{error}</span> : null}
        </div>
    );
}

export default function SalesClaimsPage() {
    const router = useRouter();
    const [me, setMe] = useState(null);
    const [checked, setChecked] = useState(false);
    const [q, setQ] = useState('');
    const [venues, setVenues] = useState([]);
    const [selected, setSelected] = useState(null);
    const [username, setUsername] = useState('');
    const [note, setNote] = useState('');
    const [busy, setBusy] = useState(false);
    const [formError, setFormError] = useState(null);
    const [formDone, setFormDone] = useState(null);
    const [mine, setMine] = useState([]);
    const [queue, setQueue] = useState([]);
    const [loadError, setLoadError] = useState(null);
    const [venueRefresh, setVenueRefresh] = useState(0);

    useEffect(() => {
        let cancelled = false;
        fetchSalesMe()
            .then((data) => { if (!cancelled) setMe(data); })
            .catch(() => { if (!cancelled) router.replace('/dashboard'); })
            .finally(() => { if (!cancelled) setChecked(true); });
        return () => { cancelled = true; };
    }, [router]);

    const isManager = me?.salesRole === 'REGIONAL_MANAGER';

    const loadClaims = useCallback(async () => {
        if (!me) return;
        try {
            const [mineData, queueData] = await Promise.all([
                fetchSalesClaims('mine'),
                me.salesRole === 'REGIONAL_MANAGER' ? fetchSalesClaims('queue') : Promise.resolve({ claims: [] }),
            ]);
            setMine(mineData.claims || []);
            setQueue(queueData.claims || []);
            setLoadError(null);
        } catch (err) {
            setLoadError(err.message || 'Failed to load claims');
        }
    }, [me]);

    useEffect(() => {
        const timer = setTimeout(loadClaims, 0);
        return () => clearTimeout(timer);
    }, [loadClaims]);

    useEffect(() => {
        if (!me) return undefined;
        let cancelled = false;
        const timer = setTimeout(() => {
            fetchSalesVenues(q.trim())
                .then((data) => { if (!cancelled) setVenues(data.venues || []); })
                .catch(() => { if (!cancelled) setVenues([]); });
        }, 300);
        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [me, q, venueRefresh]);

    const submit = async () => {
        if (!selected) return;
        setBusy(true);
        setFormError(null);
        setFormDone(null);
        try {
            await raiseSalesClaim({ venueId: selected.id, beneficiaryUsername: username.trim(), note: note.trim() || undefined });
            setFormDone(`Claim on ${selected.name} sent for approval.`);
            setSelected(null);
            setUsername('');
            setNote('');
            loadClaims();
            setVenueRefresh((n) => n + 1);
        } catch (err) {
            setFormError(err.message || 'Failed to raise claim');
        } finally {
            setBusy(false);
        }
    };

    if (!checked || !me) {
        return <div className="flex min-h-[40vh] items-center justify-center text-sm text-white/60">Loading...</div>;
    }

    const city = cityLabel(me.cityCode);

    return (
        <div className="max-w-5xl space-y-6">
            <section className="dashboard-surface-b rounded-[1.25rem] px-5 py-7 md:px-8">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-medium tracking-[0.02em] text-zinc-500">PXI Sales</span>
                    <span className="rounded-full bg-sky-500/10 px-2.5 py-1 text-[11px] font-medium text-sky-300">{city}</span>
                </div>
                <h1 className="text-2xl font-semibold tracking-tight text-white md:text-[28px]">Venue claims</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-300">
                    {isManager
                        ? `You approve claims on ${city} venues. You can also raise claims; someone else approves yours.`
                        : `Raise a claim on a ${city} venue for the venue's vendor account.${me.manager ? ` ${me.manager.name || `@${me.manager.username}`} approves it.` : ''}`}{' '}
                    Approving a claim gives that account the venue&apos;s analytics, so check the account is really the venue.
                </p>
            </section>

            {loadError ? <div className="rounded-2xl bg-red-500/10 px-5 py-4 text-sm text-red-200">{loadError}</div> : null}

            {isManager && (
                <Panel title="Waiting for your approval" hint={`Pending claims on ${city} venues.`}>
                    {queue.length === 0 ? (
                        <p className="text-sm text-white/45">Nothing waiting.</p>
                    ) : (
                        <ul className="space-y-2">
                            {queue.map((c) => (
                                <ClaimRow key={c.id} claim={c}>
                                    <QueueActions claim={c} onDone={loadClaims} />
                                </ClaimRow>
                            ))}
                        </ul>
                    )}
                </Panel>
            )}

            <Panel title="Raise a claim" hint={`Only ${city} venues are listed. A venue that is claimed, or already has a claim waiting, cannot be picked.`}>
                <div className="space-y-3">
                    <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search venues..." className={inputCls} />
                    <ul className="max-h-64 space-y-1 overflow-y-auto">
                        {venues.map((v) => {
                            const unavailable = v.claimed || v.claimPending;
                            const active = selected?.id === v.id;
                            return (
                                <li key={v.id}>
                                    <button
                                        type="button"
                                        disabled={unavailable}
                                        onClick={() => setSelected(v)}
                                        className={`flex w-full items-center justify-between gap-3 rounded-xl px-4 py-2.5 text-left ${active ? 'bg-white/[0.1]' : 'bg-white/[0.03] hover:bg-white/[0.06]'} disabled:opacity-40`}
                                    >
                                        <span className="min-w-0">
                                            <span className="block truncate text-[14px] font-semibold text-white">{v.name}</span>
                                            <span className="block truncate text-[12px] text-white/45">{v.address || 'No address'} · {v.eventCount} events</span>
                                        </span>
                                        <span className="shrink-0 text-[11px] text-white/45">
                                            {v.claimed ? 'Claimed' : v.claimPending ? 'Claim waiting' : active ? 'Selected' : ''}
                                        </span>
                                    </button>
                                </li>
                            );
                        })}
                        {venues.length === 0 ? <li className="px-1 text-sm text-white/45">No venues found.</li> : null}
                    </ul>
                    {selected && (
                        <div className="space-y-3 rounded-2xl bg-white/[0.03] p-4">
                            <p className="text-[13px] text-white/70">
                                Claiming <span className="font-semibold text-white">{selected.name}</span>
                            </p>
                            <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Vendor account username (exact)" className={inputCls} />
                            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note for the approver (optional)" className={inputCls} />
                            <div className="flex flex-wrap gap-2">
                                <button type="button" disabled={busy || !username.trim()} onClick={submit} className="rounded-full bg-white px-5 py-2 text-[13px] font-bold text-black disabled:opacity-40">
                                    {busy ? 'Sending...' : 'Send for approval'}
                                </button>
                                <button type="button" disabled={busy} onClick={() => setSelected(null)} className={pillBtn}>
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                    {formError ? <p className="text-[13px] text-red-300">{formError}</p> : null}
                    {formDone ? <p className="text-[13px] text-emerald-300">{formDone}</p> : null}
                </div>
            </Panel>

            <Panel title="Claims you raised">
                {mine.length === 0 ? (
                    <p className="text-sm text-white/45">You have not raised any claims yet.</p>
                ) : (
                    <ul className="space-y-2">
                        {mine.map((c) => (
                            <ClaimRow key={c.id} claim={c} />
                        ))}
                    </ul>
                )}
            </Panel>
        </div>
    );
}
