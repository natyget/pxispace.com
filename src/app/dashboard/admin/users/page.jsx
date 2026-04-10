'use client';

import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { fetchAdminUsers } from '@/services/admin';
import AdminPagination from '@/components/admin/AdminPagination';

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

export default function AdminUsersPage() {
    const [rows, setRows] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [input, setInput] = useState('');
    const [q, setQ] = useState('');

    useEffect(() => {
        const t = setTimeout(() => setQ(input.trim()), 400);
        return () => clearTimeout(t);
    }, [input]);

    useLayoutEffect(() => {
        setPage(1);
    }, [q]);

    const load = useCallback(async (p) => {
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
    }, [q]);

    useEffect(() => {
        load(page);
    }, [load, page]);

    return (
        <div className="max-w-6xl space-y-6">
            <div>
                <h1 className="text-xl font-bold text-white mb-2">User management</h1>
                <p className="text-white/60 text-sm leading-relaxed">
                    Search by email, username, or name. {total > 0 ? `${total} users match.` : null}
                </p>
            </div>

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
                    <table className="w-full text-left border-collapse min-w-[720px]">
                        <thead>
                            <tr className="border-b border-white/5">
                                <th className="px-6 py-4 text-[11px] font-bold tracking-widest text-white/40 uppercase">Email</th>
                                <th className="px-6 py-4 text-[11px] font-bold tracking-widest text-white/40 uppercase">Username</th>
                                <th className="px-6 py-4 text-[11px] font-bold tracking-widest text-white/40 uppercase">Tier</th>
                                <th className="px-6 py-4 text-[11px] font-bold tracking-widest text-white/40 uppercase">Vendor</th>
                                <th className="px-6 py-4 text-[11px] font-bold tracking-widest text-white/40 uppercase">Verified</th>
                                <th className="px-6 py-4 text-[11px] font-bold tracking-widest text-white/40 uppercase">Joined</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {rows.map((u) => (
                                <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="px-6 py-4 text-[14px] text-white/90 break-all max-w-[200px]">{u.email}</td>
                                    <td className="px-6 py-4 text-[14px] text-white/60">{u.username || '—'}</td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/5 text-white/70 border border-white/10">
                                            {u.accountTier}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-[14px] text-white/70">{u.isVendor ? 'Yes' : 'No'}</td>
                                    <td className="px-6 py-4 text-[14px] text-white/70">{u.isVerified ? 'Yes' : 'No'}</td>
                                    <td className="px-6 py-4 text-[13px] text-white/50 whitespace-nowrap">{formatDate(u.createdAt)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <AdminPagination page={page} totalPages={totalPages} onPageChange={setPage} disabled={loading} />
        </div>
    );
}
