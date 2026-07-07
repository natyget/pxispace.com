'use client';

import { Fragment, useCallback, useEffect, useState } from 'react';
import { fetchAdminUsers, updateAdminUser, suspendUser, unsuspendUser } from '@/services/admin';
import AdminPagination from '@/components/admin/AdminPagination';
import { useAuth } from '@/contexts/AuthContext';
import { adminMockUsers } from '@/lib/adminMockData';
import { isSuperAdmin } from '@/lib/adminAccess';
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
        <div className="rounded-2xl bg-black/25 p-4 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
                <button
                    type="button"
                    disabled={busy}
                    onClick={() => act(() => updateAdminUser(row.id, { isVendor: !row.isVendor }))}
                    className="rounded-full bg-white/[0.065] px-4 py-1.5 text-[12px] font-semibold text-white/70 hover:bg-white/[0.1] hover:text-white disabled:opacity-40"
                >
                    {row.isVendor ? 'Remove vendor' : 'Make vendor'}
                </button>
                <button
                    type="button"
                    disabled={busy}
                    onClick={() => act(() => updateAdminUser(row.id, { isVerified: !row.isVerified }))}
                    className="rounded-full bg-white/[0.065] px-4 py-1.5 text-[12px] font-semibold text-white/70 hover:bg-white/[0.1] hover:text-white disabled:opacity-40"
                >
                    {row.isVerified ? 'Unverify' : 'Verify'}
                </button>
                {canManageRoles && (
                    <>
                        <select
                            defaultValue={row.accountTier}
                            disabled={busy}
                            onChange={(e) => act(() => updateAdminUser(row.id, { accountTier: e.target.value }))}
                            className="rounded-full bg-white/[0.065] px-3 py-1.5 text-[12px] text-white/80 outline-none"
                        >
                            <option value="PARTIAL">PARTIAL</option>
                            <option value="CITIZEN">CITIZEN</option>
                            <option value="ADMIN">ADMIN</option>
                        </select>
                        <select
                            defaultValue={row.adminRole || 'NONE'}
                            disabled={busy}
                            onChange={(e) => act(() => updateAdminUser(row.id, { adminRole: e.target.value }))}
                            className="rounded-full bg-white/[0.065] px-3 py-1.5 text-[12px] text-white/80 outline-none"
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
                            className="rounded-full bg-emerald-500/10 px-4 py-1.5 text-[12px] text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-40"
                    >
                        Unsuspend
                    </button>
                ) : (
                    <>
                        <input
                            value={suspendReason}
                            onChange={(e) => setSuspendReason(e.target.value)}
                            placeholder="Suspension reason (required, audited)"
                            className="flex-1 min-w-[220px] rounded-full bg-white/[0.055] px-4 py-1.5 text-[12px] text-white placeholder:text-white/35 outline-none focus:bg-white/[0.075]"
                        />
                        <button
                            type="button"
                            disabled={busy || !suspendReason.trim()}
                            onClick={() => act(() => suspendUser(row.id, suspendReason.trim()))}
                            className="rounded-full bg-red-500/10 px-4 py-1.5 text-[12px] text-red-300 hover:bg-red-500/20 disabled:opacity-40"
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

    useEffect(() => {
        const timer = setTimeout(() => setPage(1), 0);
        return () => clearTimeout(timer);
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
            setError(adminErrorMessage(err, 'Failed to load users'));
            setRows([]);
        } finally {
            setLoading(false);
        }
    }, [q, isLiveAdmin]);

    useEffect(() => {
        const timer = setTimeout(() => load(page), 0);
        return () => clearTimeout(timer);
    }, [load, page]);

    return (
        <AdminPageShell
            title="User management"
            copy={`Search by email, username, or ID. Click a live row to manage roles, verification, and suspensions.${canManageRoles ? ' Super-admin controls are enabled.' : ''}`}
            source={isLiveAdmin ? 'Live' : 'Mock'}
            metrics={[
                { label: 'Matches', value: total.toLocaleString(), hint: q || 'All users' },
                { label: 'Rows', value: rows.length.toLocaleString(), hint: `Page ${page}` },
            ]}
        >
            <AdminPanel className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <input
                    type="search"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Search users..."
                    className="w-full rounded-full bg-black/25 px-5 py-3 text-[14px] text-white placeholder:text-white/35 outline-none focus:bg-black/35 sm:max-w-md"
                />
                <p className="text-xs font-semibold text-zinc-500">
                    {isLiveAdmin ? 'Live management enabled' : 'Previewing mock users'}
                </p>
            </AdminPanel>

            <AdminError>{error}</AdminError>

            <AdminTableShell loading={loading} emptyMessage={rows.length === 0 ? 'No users found.' : null}>
                    <table className={`${adminTableClass} min-w-[840px]`}>
                        <thead>
                            <tr>
                                <th className={adminThClass}>Email</th>
                                <th className={adminThClass}>Username</th>
                                <th className={adminThClass}>Tier / Role</th>
                                <th className={adminThClass}>Vendor</th>
                                <th className={adminThClass}>Status</th>
                                <th className={adminThClass}>Joined</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((u) => (
                                <Fragment key={u.id}>
                                    <tr
                                        onClick={() => isLiveAdmin && setOpenUserId(openUserId === u.id ? null : u.id)}
                                        className={`hover:bg-white/[0.02] transition-colors ${isLiveAdmin ? 'cursor-pointer' : ''}`}
                                    >
                                        <td className="px-6 py-4 text-[14px] text-white/90 break-all max-w-[200px]">{u.email}</td>
                                        <td className={`${adminTdClass} text-[14px]`}>{u.username || '—'}</td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex rounded-full bg-white/[0.055] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white/70">
                                                {u.accountTier}
                                            </span>
                                            {u.adminRole && u.adminRole !== 'NONE' ? (
                                                <span className="ml-1.5 inline-flex rounded-full bg-sky-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-sky-300">
                                                    {u.adminRole.replaceAll('_', ' ')}
                                                </span>
                                            ) : null}
                                        </td>
                                        <td className={`${adminTdClass} text-[14px]`}>{u.isVendor ? 'Yes' : 'No'}</td>
                                        <td className="px-6 py-4">
                                            {u.suspendedAt ? (
                                                <span className="inline-flex rounded-full bg-red-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-red-300">
                                                    Suspended
                                                </span>
                                            ) : (
                                                <span className="text-[13px] text-white/50">{u.isVerified ? 'Verified' : 'Active'}</span>
                                            )}
                                        </td>
                                        <td className={`${adminTdClass} whitespace-nowrap`}>{formatDate(u.createdAt)}</td>
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
            </AdminTableShell>

            <AdminPagination page={page} totalPages={totalPages} onPageChange={setPage} disabled={loading} />
        </AdminPageShell>
    );
}
