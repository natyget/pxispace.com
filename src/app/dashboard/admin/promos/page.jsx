'use client';

/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
    fetchAdminPromos,
    createAdminPromo,
    updateAdminPromo,
    grantCredits,
} from '@/services/admin';
import { searchUsers } from '@/services/events';
import AdminPagination from '@/components/admin/AdminPagination';
import { useAdminMode } from '@/contexts/AdminModeContext';
import {
    AdminError,
    AdminPageShell,
    AdminTableShell,
    adminTableClass,
    adminTdClass,
    adminThClass,
} from '@/components/admin/AdminPageShell';
import { adminErrorMessage } from '@/components/admin/adminFormat';
import { Button, Panel } from '@/components/dashboard/ui/kit';
import { count, money } from '@/lib/dashFormat';

function formatDate(iso) {
    if (!iso) return '-';
    try {
        return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
        return '-';
    }
}

const inputCls =
    'h-11 w-full rounded-2xl bg-pxi-field px-4 text-[14px] text-white placeholder:text-white/35 outline-none transition focus:shadow-[0_0_0_1.5px_#a523ef]';

/** Username-first user picker: debounced lookup with an inline preview dropdown. */
function UsernameInput({ value, onChange, placeholder }) {
    const [results, setResults] = useState([]);
    const [open, setOpen] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        const q = value.trim().replace(/^@/, '');
        if (q.length < 2) {
            setResults([]);
            return;
        }
        let cancelled = false;
        const timer = setTimeout(() => {
            searchUsers(q)
                .then((data) => {
                    if (!cancelled) setResults((data.results || data.users || []).slice(0, 5));
                })
                .catch(() => {
                    if (!cancelled) setResults([]);
                });
        }, 300);
        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [value]);

    useEffect(() => {
        const onDocClick = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', onDocClick);
        return () => document.removeEventListener('mousedown', onDocClick);
    }, []);

    return (
        <div ref={containerRef} className="relative">
            <input
                value={value}
                onChange={(e) => {
                    onChange(e.target.value);
                    setOpen(true);
                }}
                onFocus={() => setOpen(true)}
                placeholder={placeholder}
                className={inputCls}
            />
            {open && results.length > 0 ? (
                <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-xl bg-pxi-field shadow-2xl">
                    {results.map((u) => (
                        <button
                            key={u.id}
                            type="button"
                            onClick={() => {
                                onChange(u.username || '');
                                setOpen(false);
                            }}
                            className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left hover:bg-white/[0.06]"
                        >
                            {u.avatarUrl ? (
                                <img src={u.avatarUrl} alt="" className="h-7 w-7 rounded-full object-cover" />
                            ) : (
                                <span className="grid h-7 w-7 place-items-center rounded-full bg-white/10 text-[11px] font-bold text-white">
                                    {(u.username || u.name || '?').charAt(0).toUpperCase()}
                                </span>
                            )}
                            <span className="min-w-0">
                                <span className="block truncate text-[13px] font-bold text-white">@{u.username}</span>
                                {u.name ? <span className="block truncate text-[11px] text-white/40">{u.name}</span> : null}
                            </span>
                        </button>
                    ))}
                </div>
            ) : null}
        </div>
    );
}

function CreatePromoCard({ onCreated }) {
    const [kind, setKind] = useState('CREDIT');
    const [code, setCode] = useState('');
    const [creditUsd, setCreditUsd] = useState('');
    const [commissionPct, setCommissionPct] = useState('');
    const [ownerUsername, setOwnerUsername] = useState('');
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
                ownerUsername: ownerUsername.trim() || undefined,
                maxRedemptions: maxRedemptions ? parseInt(maxRedemptions, 10) : undefined,
                expiresAt: expiresAt || undefined,
                note: note.trim() || undefined,
            };
            const data = await createAdminPromo(body);
            setCreated(data.promo);
            setCode('');
            setCreditUsd('');
            setCommissionPct('');
            setOwnerUsername('');
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
        <Panel title="Create code">
            <div className="grid gap-3 sm:grid-cols-2">
                <select value={kind} onChange={(e) => setKind(e.target.value)} className={inputCls}>
                    <option value="CREDIT">Credit: gives credits to whoever redeems it</option>
                    <option value="AMBASSADOR">Ambassador: tracks sales and pays commission</option>
                </select>
                <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Code (blank makes one)" className={inputCls} />
                <input value={creditUsd} onChange={(e) => setCreditUsd(e.target.value)} type="number" min="0" step="0.01" placeholder="Credit per redemption, in dollars" className={inputCls} />
                {kind === 'AMBASSADOR' && (
                    <>
                        <input value={commissionPct} onChange={(e) => setCommissionPct(e.target.value)} type="number" min="0" max="50" step="0.1" placeholder="Commission, % of sales" className={inputCls} />
                        <UsernameInput value={ownerUsername} onChange={setOwnerUsername} placeholder="Ambassador username (required)" />
                    </>
                )}
                <input value={maxRedemptions} onChange={(e) => setMaxRedemptions(e.target.value)} type="number" min="1" placeholder="Max redemptions (blank for no limit)" className={inputCls} />
                <input value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} type="date" className={inputCls} />
                <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Internal note" className={`${inputCls} sm:col-span-2`} />
            </div>
            {error && <p className="mt-3 text-[13px] text-red-300">{error}</p>}
            {created && (
                <p className="mt-3 text-[13px] text-emerald-300">
                    Created <span className="font-mono font-semibold">{created.code}</span>
                </p>
            )}
            <div className="mt-4">
                <Button variant="primary" onClick={submit} disabled={busy}>
                    {busy ? 'Creating...' : 'Create code'}
                </Button>
            </div>
        </Panel>
    );
}

function GrantCreditsCard() {
    const [username, setUsername] = useState('');
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
                username: username.trim(),
                amountCents: Math.round(parseFloat(amountUsd) * 100),
                note: note.trim(),
            });
            setDone(data.balanceCents);
            setUsername('');
            setAmountUsd('');
            setNote('');
        } catch (err) {
            setError(err.message || 'Failed to grant credits');
        } finally {
            setBusy(false);
        }
    };

    return (
        <Panel title="Give credits">
            <div className="grid gap-3 sm:grid-cols-3">
                <UsernameInput value={username} onChange={setUsername} placeholder="Username, like @dj-nova" />
                <input value={amountUsd} onChange={(e) => setAmountUsd(e.target.value)} type="number" step="0.01" placeholder="Dollars (negative takes credit away)" className={inputCls} />
                <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reason (required, recorded)" className={inputCls} />
            </div>
            {error && <p className="mt-3 text-[13px] text-red-300">{error}</p>}
            {done != null && <p className="mt-3 text-[13px] text-emerald-300">Done. New balance {money(done)}</p>}
            <div className="mt-4">
                <Button variant="primary" onClick={submit} disabled={busy || !username.trim() || !amountUsd || !note.trim()}>
                    {busy ? 'Granting...' : 'Give credits'}
                </Button>
            </div>
        </Panel>
    );
}

export default function AdminPromosPage() {
    const [rows, setRows] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { isLive: isLiveAdmin } = useAdminMode();

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
            copy="Credit codes, ambassador codes and direct credits."
            source={isLiveAdmin ? 'Live' : 'Mock'}
            metrics={[
                { label: 'Codes', value: count(rows.length), hint: 'On this page' },
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
                                    <td data-label="Code" className="admin-table-primary px-6 py-4">
                                        <span className="font-mono text-[13px] text-white/90">{p.code}</span>
                                        {p.owner ? (
                                            <p className="text-[11px] text-white/40 mt-0.5">→ {p.owner.username || p.owner.email}</p>
                                        ) : null}
                                    </td>
                                    <td data-label="Kind" className={`${adminTdClass} text-[12px]`}>{p.kind}</td>
                                    <td data-label="Credit" className={`${adminTdClass} text-white/80 tabular-nums`}>{p.creditCents ? money(p.creditCents) : '-'}</td>
                                    <td data-label="Commission" className={`${adminTdClass} text-white/80 tabular-nums`}>{p.commissionBps ? `${(p.commissionBps / 100).toFixed(1)}%` : '-'}</td>
                                    <td data-label="Redemptions" className={`${adminTdClass} text-white/70 tabular-nums`}>
                                        {p.redemptionCount}{p.maxRedemptions ? ` / ${p.maxRedemptions}` : ''}
                                    </td>
                                    <td data-label="Expires" className={adminTdClass}>{formatDate(p.expiresAt)}</td>
                                    <td data-label="Status" className="px-6 py-4">
                                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium tracking-[0.02em] ${
                                            p.isActive
                                                ? 'bg-emerald-500/10 text-emerald-300'
                                                : 'bg-pxi-field text-white/55'
                                        }`}>
                                            {p.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td data-label="Action" className="px-6 py-4">
                                        <button
                                            type="button"
                                            onClick={() => toggleActive(p)}
                                            className="rounded-full bg-pxi-field px-3.5 py-1.5 text-[12px] font-semibold text-white/70 hover:bg-white/[0.1] hover:text-white"
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
