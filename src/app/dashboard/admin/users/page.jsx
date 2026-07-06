'use client';

import { Fragment, useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { fetchAdminUsers, updateAdminUser, suspendUser, unsuspendUser } from '@/services/admin';
import AdminPagination from '@/components/admin/AdminPagination';
import { useAuth } from '@/contexts/AuthContext';
import { adminMockUsers } from '@/lib/adminMockData';
import { isSuperAdmin } from '@/lib/adminAccess';
import DataSourceBadge from '@/components/dashboard/DataSourceBadge';

function formatDate(iso) {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return '—';
    }
}

function UserActions({ user: row, canManageRoles, onDone }) {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);
    const [suspendReason, setSuspendReason] = useState('');

    const act = async (fn) => {
        setBusy(true);
        setError(null);
        try {
            await fn();
            onDone();
        } catch (err) {
            setError(err.message || 'Action failed');
            setBusy(false);
        }
    };

    return (
        <div className="rounded-xl border border-white/10 bg-zinc-900/70 p-4 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
                <button
                    type="button"
                    disabled={busy}
                    onClick={() => act(() => updateAdminUser(row.id, { isVendor: !row.isVendor }))}
                    className="rounded-full border border-white/10 px-4 py-1.5 text-[12px] text-white/70 hover:text-white hover:border-white/25 disabled:opacity-40"
                >
                    {row.isVendor ? 'Remove vendor' : 'Make vendor'}
                </button>
                <button
                    type="button"
                    disabled={busy}
                    onClick={() => act(() => updateAdminUser(row.id, { isVerified: !row.isVerified }))}
                    className="rounded-full border border-white/10 px-4 py-1.5 text-[12px] text-white/70 hover:text-white hover:border-white/25 disabled:opacity-40"
                >
                    {row.isVerified ? 'Unverify' : 'Verify'}
                </button>
                {canManageRoles && (
                    <>
                        <select
                            defaultValue={row.accountTier}
                            disabled={busy}
                            onChange={(e) => act(() => updateAdminUser(row.id, { accountTier: e.target.value }))}
                            className="rounded-full border border-white/10 bg-zinc-900 px-3 py-1.5 text-[12px] text-white/80 outline-none"
                        >
                            <option value="PARTIAL">PARTIAL</option>
                            <option value="CITIZEN">CITIZEN</option>
                            <option value="ADMIN">ADMIN</option>
                        </select>
                        <select
                            defaultValue={row.adminRole || 'NONE'}
                            disabled={busy}
                            onChange={(e) => act(() => updateAdminUser(row.id, { adminRole: e.target.value }))}
                            className="rounded-full border border-white/10 bg-zinc-900 px-3 py-1.5 text-[12px] text-white/80 outline-none"
                        >
                            <option value="NONE">Role: none</option>
                            <option value="SUPPORT">Role: support</option>
                            <option value="MODERATOR">Role: moderator</option>
                            <option value="ADMIN">Role: admin</option>
                        </select>
                    </>
                )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
                {row.suspendedAt ? (
                    <button
                        type="button"
                        disabled={busy}
                        onClick={() => act(() => unsuspendUser(row.id))}
                        className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-[12px] text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-40"
                    >
                        Unsuspend
                    </button>
                ) : (
                    <>
                        <input
                            value={suspendReason}
                            onChange={(e) => setSuspendReason(e.target.value)}
                            placeholder="Suspension reason (required, audited)"
                            className="flex-1 min-w-[220px] rounded-full border border-white/10 bg-zinc-900 px-4 py-1.5 text-[12px] text-white placeholder:text-white/35 outline-none focus:border-white/25"
                        />
                        <button
                            type="button"
                            disabled={busy || !suspendReason.trim()}
                            onClick={() => act(() => suspendUser(row.id, suspendReason.trim()))}
                            className="rounded-full border border-red-500/30 bg-red-500/10 px-4 py-1.5 text-[12px] text-red-300 hover:bg-red-500/20 disabled:opacity-40"
                        >
                            Suspend
                        </button>
                    </>
                )}
            </div>
            {error && <p className="text-red-300 text-[12px]">{error}</p>}
        </div>
    );
}

export default function AdminUsersPage() {
    const { user } = useAuth();
    const [rows, setRows] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [input, setInput] = useState('');
    const [q, setQ] = useState('');
    const [openUserId, setOpenUserId] = useState(null);
    const isLiveAdmin = user?.accountTier === 'ADMIN';
    const canManageRoles = isSuperAdmin(user);

    useEffect(() => {
        const t = setTimeout(() => setQ(input.trim()), 400);
        return () => clearTimeout(t);
    }, [input]);

    useLayoutEffect(() => {
        setPage(1);
    }, [q]);

    const load = useCallback(async (p) => {
        if (!isLiveAdmin) {
            const term = q.trim().toLowerCase();
            const filtered = term
                ? adminMockUsers.filter((row) =>
                    [row.email, row.username, row.id].some((field) => String(field || '').toLowerCase().includes(term))
                )
                : adminMockUsers;
            setRows(filtered);
            setTotal(filtered.length);
            setTotalPages(1);
            setError(null);
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const data = await fetchAdminUsers({ page: p, limit: 50, q: q || undefined });
            setRows(data.users || []);
            setTotalPages(data.totalPages || 1);
            setTotal(data.total ?? 0);
        } catch (err) {
            setError(err.message || 'Failed to load users');
            setRows([]);
        } finally {
            setLoading(false);
        }
    }, [q, isLiveAdmin]);

    useEffect(() => {
        load(page);
    }, [load, page]);

    return (
        <div className="max-w-6xl space-y-6">
            <div>
                <h1 className="text-xl font-bold text-white mb-2">User management</h1>
                <p className="text-white/60 text-sm leading-relaxed">
                    Search by email, username, or name. Click a row to manage. {total > 0 ? `${total} users match.` : null}
                    {canManageRoles ? ' Super-admin controls enabled.' : ''}
                </p>
            </div>
            <DataSourceBadge source={isLiveAdmin ? 'Live' : 'Mock'} />

            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                <input
                    type="search"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Search users…"
                    className="w-full sm:max-w-md rounded-full border border-white/10 bg-zinc-900/60 px-5 py-2.5 text-[14px] text-white placeholder:text-white/35 outline-none focus:border-white/25"
                />
            </div>

            {error && (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/5 px-6 py-4 text-red-300 text-sm">{error}</div>
            )}

            <div className="rounded-2xl border border-white/10 bg-zinc-900/40 overflow-x-auto">
                {loading ? (
                    <div className="px-6 py-12 text-center text-white/45 text-sm">Loading…</div>
                ) : rows.length === 0 ? (
                    <div className="px-6 py-12 text-center text-white/45 text-sm">No users found.</div>
                ) : (
                    <table className="w-full text-left border-collapse min-w-[840px]">
                        <thead>
                            <tr className="border-b border-white/5">
                                <th className="px-6 py-4 text-[11px] font-bold tracking-widest text-white/40 uppercase">Email</th>
                                <th className="px-6 py-4 text-[11px] font-bold tracking-widest text-white/40 uppercase">Username</th>
                                <th className="px-6 py-4 text-[11px] font-bold tracking-widest text-white/40 uppercase">Tier / Role</th>
                                <th className="px-6 py-4 text-[11px] font-bold tracking-widest text-white/40 uppercase">Vendor</th>
                                <th className="px-6 py-4 text-[11px] font-bold tracking-widest text-white/40 uppercase">Status</th>
                                <th className="px-6 py-4 text-[11px] font-bold tracking-widest text-white/40 uppercase">Joined</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {rows.map((u) => (
                                <Fragment key={u.id}>
                                    <tr
                                        onClick={() => isLiveAdmin && setOpenUserId(openUserId === u.id ? null : u.id)}
                                        className={`hover:bg-white/[0.02] transition-colors ${isLiveAdmin ? 'cursor-pointer' : ''}`}
                                    >
                                        <td className="px-6 py-4 text-[14px] text-white/90 break-all max-w-[200px]">{u.email}</td>
                                        <td className="px-6 py-4 text-[14px] text-white/60">{u.username || '—'}</td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/5 text-white/70 border border-white/10">
                                                {u.accountTier}
                                            </span>
                                            {u.adminRole && u.adminRole !== 'NONE' ? (
                                                <span className="inline-flex ml-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-500/10 text-sky-300 border border-sky-500/20">
                                                    {u.adminRole.replaceAll('_', ' ')}
                                                </span>
                                            ) : null}
                                        </td>
                                        <td className="px-6 py-4 text-[14px] text-white/70">{u.isVendor ? 'Yes' : 'No'}</td>
                                        <td className="px-6 py-4">
                                            {u.suspendedAt ? (
                                                <span className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-500/10 text-red-300 border border-red-500/20">
                                                    Suspended
                                                </span>
                                            ) : (
                                                <span className="text-[13px] text-white/50">{u.isVerified ? 'Verified' : 'Active'}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-[13px] text-white/50 whitespace-nowrap">{formatDate(u.createdAt)}</td>
                                    </tr>
                                    {openUserId === u.id && isLiveAdmin && (
                                        <tr>
                                            <td colSpan={6} className="px-6 pb-5">
                                                <UserActions
                                                    user={u}
                                                    canManageRoles={canManageRoles}
                                                    onDone={() => {
                                                        setOpenUserId(null);
                                                        load(page);
                                                    }}
                                                />
                                            </td>
                                        </tr>
                                    )}
                                </Fragment>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <AdminPagination page={page} totalPages={totalPages} onPageChange={setPage} disabled={loading} />
        </div>
    );
}
