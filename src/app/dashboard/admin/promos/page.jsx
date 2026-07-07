'use client';

import { useCallback, useEffect, useState } from 'react';
import {
    fetchAdminPromos,
    createAdminPromo,
    updateAdminPromo,
    grantCredits,
} from '@/services/admin';
import AdminPagination from '@/components/admin/AdminPagination';
import { useAuth } from '@/contexts/AuthContext';
import {
    AdminError,
    AdminPageShell,
    AdminPanel,
    AdminTableShell,
    adminTableClass,
    adminTdClass,
    adminThClass,
} from '@/components/admin/AdminPageShell';
import { adminErrorMessage } from '@/components/admin/adminFormat';

function formatDate(iso) {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
        return '—';
    }
}

function formatUsd(cents) {
    return `$${(Number(cents || 0) / 100).toFixed(2)}`;
}

const inputCls =
    'w-full rounded-xl bg-black/25 px-4 py-2.5 text-[14px] text-white placeholder:text-white/35 outline-none focus:bg-black/35';

function CreatePromoCard({ onCreated }) {
    const [kind, setKind] = useState('CREDIT');
    const [code, setCode] = useState('');
    const [creditUsd, setCreditUsd] = useState('');
    const [commissionPct, setCommissionPct] = useState('');
    const [ownerUserId, setOwnerUserId] = useState('');
    const [maxRedemptions, setMaxRedemptions] = useState('');
    const [expiresAt, setExpiresAt] = useState('');
    const [note, setNote] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);
    const [created, setCreated] = useState(null);

    const submit = async () => {
        setBusy(true);
        setError(null);
        setCreated(null);
        try {
            const body = {
                kind,
                code: code.trim() || undefined,
                creditCents: creditUsd ? Math.round(parseFloat(creditUsd) * 100) : 0,
                commissionBps: commissionPct ? Math.round(parseFloat(commissionPct) * 100) : 0,
                ownerUserId: ownerUserId.trim() || undefined,
                maxRedemptions: maxRedemptions ? parseInt(maxRedemptions, 10) : undefined,
                expiresAt: expiresAt || undefined,
                note: note.trim() || undefined,
            };
            const data = await createAdminPromo(body);
            setCreated(data.promo);
            setCode('');
            setCreditUsd('');
            setCommissionPct('');
            setOwnerUserId('');
            setMaxRedemptions('');
            setExpiresAt('');
            setNote('');
            onCreated?.();
        } catch (err) {
            setError(err.message || 'Failed to create code');
        } finally {
            setBusy(false);
        }
    };

    return (
        <AdminPanel className="space-y-4">
            <h2 className="text-[11px] font-bold tracking-widest text-white/40 uppercase">Create promo code</h2>
            <div className="grid gap-3 sm:grid-cols-2">
                <select value={kind} onChange={(e) => setKind(e.target.value)} className={inputCls}>
                    <option value="CREDIT">Credit — grants credits to redeemers</option>
                    <option value="AMBASSADOR">Ambassador — attribution + commission</option>
                </select>
                <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Code (blank = auto e.g. PXI-XXXXXXXX)" className={inputCls} />
                <input value={creditUsd} onChange={(e) => setCreditUsd(e.target.value)} type="number" min="0" step="0.01" placeholder="Credit per redemption (USD)" className={inputCls} />
                {kind === 'AMBASSADOR' && (
                    <>
                        <input value={commissionPct} onChange={(e) => setCommissionPct(e.target.value)} type="number" min="0" max="50" step="0.1" placeholder="Commission % of attributed sales" className={inputCls} />
                        <input value={ownerUserId} onChange={(e) => setOwnerUserId(e.target.value)} placeholder="Ambassador user ID (required)" className={inputCls} />
                    </>
                )}
                <input value={maxRedemptions} onChange={(e) => setMaxRedemptions(e.target.value)} type="number" min="1" placeholder="Max redemptions (blank = unlimited)" className={inputCls} />
                <input value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} type="date" className={inputCls} />
                <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Internal note" className={`${inputCls} sm:col-span-2`} />
            </div>
            {error && <p className="text-red-300 text-[13px]">{error}</p>}
            {created && (
                <p className="text-emerald-400 text-[13px]">
                    Created <span className="font-mono font-bold">{created.code}</span>
                </p>
            )}
            <button
                type="button"
                onClick={submit}
                disabled={busy}
                className="rounded-full bg-white text-black px-5 py-2 text-[13px] font-bold disabled:opacity-40"
            >
                {busy ? 'Creating...' : 'Create code'}
            </button>
        </AdminPanel>
    );
}

function GrantCreditsCard() {
    const [userId, setUserId] = useState('');
    const [amountUsd, setAmountUsd] = useState('');
    const [note, setNote] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);
    const [done, setDone] = useState(null);

    const submit = async () => {
        setBusy(true);
        setError(null);
        setDone(null);
        try {
            const data = await grantCredits({
                userId: userId.trim(),
                amountCents: Math.round(parseFloat(amountUsd) * 100),
                note: note.trim(),
            });
            setDone(data.balanceCents);
            setUserId('');
            setAmountUsd('');
            setNote('');
        } catch (err) {
            setError(err.message || 'Failed to grant credits');
        } finally {
            setBusy(false);
        }
    };

    return (
        <AdminPanel className="space-y-4">
            <h2 className="text-[11px] font-bold tracking-widest text-white/40 uppercase">Grant credits directly</h2>
            <div className="grid gap-3 sm:grid-cols-3">
                <input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="User ID" className={inputCls} />
                <input value={amountUsd} onChange={(e) => setAmountUsd(e.target.value)} type="number" step="0.01" placeholder="Amount USD (negative = adjust down)" className={inputCls} />
                <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reason (required, audited)" className={inputCls} />
            </div>
            {error && <p className="text-red-300 text-[13px]">{error}</p>}
            {done != null && <p className="text-emerald-400 text-[13px]">Done. New balance {formatUsd(done)}</p>}
            <button
                type="button"
                onClick={submit}
                disabled={busy || !userId.trim() || !amountUsd || !note.trim()}
                className="rounded-full bg-white text-black px-5 py-2 text-[13px] font-bold disabled:opacity-40"
            >
                {busy ? 'Granting...' : 'Grant'}
            </button>
        </AdminPanel>
    );
}

export default function AdminPromosPage() {
    const { user } = useAuth();
    const [rows, setRows] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const isLiveAdmin = user?.accountTier === 'ADMIN';

    const load = useCallback(async (p) => {
        if (!isLiveAdmin) {
            setRows([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const data = await fetchAdminPromos({ page: p, limit: 50 });
            setRows(data.promos || []);
            setTotalPages(data.totalPages || 1);
        } catch (err) {
            setError(adminErrorMessage(err, 'Failed to load promo codes'));
            setRows([]);
        } finally {
            setLoading(false);
        }
    }, [isLiveAdmin]);

    useEffect(() => {
        const timer = setTimeout(() => load(page), 0);
        return () => clearTimeout(timer);
    }, [load, page]);

    const toggleActive = async (promo) => {
        try {
            await updateAdminPromo(promo.id, { isActive: !promo.isActive });
            load(page);
        } catch (err) {
            setError(err.message || 'Failed to update code');
        }
    };

    return (
        <AdminPageShell
            title="Promos & credits"
            copy="Credit drops, ambassador codes with commission, and direct account credits. Every grant is audit-ready."
            source={isLiveAdmin ? 'Live' : 'Mock'}
            metrics={[
                { label: 'Codes', value: rows.length.toLocaleString(), hint: 'Loaded rows' },
                { label: 'Mode', value: isLiveAdmin ? 'Live' : 'Mock', hint: 'Data source' },
            ]}
        >

            <CreatePromoCard onCreated={() => load(1)} />
            <GrantCreditsCard />

            <AdminError>{error}</AdminError>

            <AdminTableShell
                loading={loading}
                emptyMessage={rows.length === 0 ? (isLiveAdmin ? 'No promo codes yet.' : 'Live promo data requires a backend ADMIN account.') : null}
            >
                    <table className={`${adminTableClass} min-w-[880px]`}>
                        <thead>
                            <tr>
                                <th className={adminThClass}>Code</th>
                                <th className={adminThClass}>Kind</th>
                                <th className={adminThClass}>Credit</th>
                                <th className={adminThClass}>Commission</th>
                                <th className={adminThClass}>Redemptions</th>
                                <th className={adminThClass}>Expires</th>
                                <th className={adminThClass}>Status</th>
                                <th className="px-6 py-4" />
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((p) => (
                                <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="px-6 py-4">
                                        <span className="font-mono text-[13px] text-white/90">{p.code}</span>
                                        {p.owner ? (
                                            <p className="text-[11px] text-white/40 mt-0.5">→ {p.owner.username || p.owner.email}</p>
                                        ) : null}
                                    </td>
                                    <td className={`${adminTdClass} text-[12px]`}>{p.kind}</td>
                                    <td className={`${adminTdClass} text-white/80 tabular-nums`}>{p.creditCents ? formatUsd(p.creditCents) : '—'}</td>
                                    <td className={`${adminTdClass} text-white/80 tabular-nums`}>{p.commissionBps ? `${(p.commissionBps / 100).toFixed(1)}%` : '—'}</td>
                                    <td className={`${adminTdClass} text-white/70 tabular-nums`}>
                                        {p.redemptionCount}{p.maxRedemptions ? ` / ${p.maxRedemptions}` : ''}
                                    </td>
                                    <td className={adminTdClass}>{formatDate(p.expiresAt)}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                                            p.isActive
                                                ? 'bg-emerald-500/10 text-emerald-300'
                                                : 'bg-white/[0.055] text-white/55'
                                        }`}>
                                            {p.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            type="button"
                                            onClick={() => toggleActive(p)}
                                            className="rounded-full bg-white/[0.065] px-3.5 py-1.5 text-[12px] font-semibold text-white/70 hover:bg-white/[0.1] hover:text-white"
                                        >
                                            {p.isActive ? 'Deactivate' : 'Reactivate'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
            </AdminTableShell>

            <AdminPagination page={page} totalPages={totalPages} onPageChange={setPage} disabled={loading} />
        </AdminPageShell>
    );
}
