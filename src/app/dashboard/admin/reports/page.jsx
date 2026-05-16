'use client';

import { useCallback, useEffect, useState } from 'react';
import { fetchAdminReports } from '@/services/admin';
import AdminPagination from '@/components/admin/AdminPagination';
import { useAuth } from '@/contexts/AuthContext';
import { adminMockReports } from '@/lib/adminMockData';
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

const statusStyle = {
    PENDING: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    RESOLVED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    CANCELLED: 'bg-white/5 text-white/55 border-white/10',
};

export default function AdminReportsPage() {
    const { user } = useAuth();
    const [rows, setRows] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const isLiveAdmin = user?.accountTier === 'ADMIN';

    const load = useCallback(async (p) => {
        if (!isLiveAdmin) {
            setRows(adminMockReports);
            setTotal(adminMockReports.length);
            setTotalPages(1);
            setError(null);
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const data = await fetchAdminReports({ page: p, limit: 50 });
            setRows(data.reports || []);
            setTotalPages(data.totalPages || 1);
            setTotal(data.total ?? 0);
        } catch (err) {
            setError(err.message || 'Failed to load reports');
            setRows([]);
        } finally {
            setLoading(false);
        }
    }, [isLiveAdmin]);

    useEffect(() => {
        load(page);
    }, [load, page]);

    return (
        <div className="max-w-6xl space-y-6">
            <div>
                <h1 className="text-xl font-bold text-white mb-2">Report management</h1>
                <p className="text-white/60 text-sm leading-relaxed">
                    Trust &amp; safety reports. {total > 0 ? `${total} total.` : null}
                </p>
            </div>
            <DataSourceBadge source={isLiveAdmin ? 'Live' : 'Mock'} />

            {error && (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/5 px-6 py-4 text-red-300 text-sm">{error}</div>
            )}

            <div className="rounded-2xl border border-white/10 bg-zinc-900/40 overflow-x-auto">
                {loading ? (
                    <div className="px-6 py-12 text-center text-white/45 text-sm">Loading…</div>
                ) : rows.length === 0 ? (
                    <div className="px-6 py-12 text-center text-white/45 text-sm">No reports yet.</div>
                ) : (
                    <table className="w-full text-left border-collapse min-w-[880px]">
                        <thead>
                            <tr className="border-b border-white/5">
                                <th className="px-6 py-4 text-[11px] font-bold tracking-widest text-white/40 uppercase">Status</th>
                                <th className="px-6 py-4 text-[11px] font-bold tracking-widest text-white/40 uppercase">Reporter</th>
                                <th className="px-6 py-4 text-[11px] font-bold tracking-widest text-white/40 uppercase">Target</th>
                                <th className="px-6 py-4 text-[11px] font-bold tracking-widest text-white/40 uppercase">Reason</th>
                                <th className="px-6 py-4 text-[11px] font-bold tracking-widest text-white/40 uppercase">Created</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {rows.map((r) => (
                                <tr key={r.id} className="hover:bg-white/[0.02] transition-colors align-top">
                                    <td className="px-6 py-4">
                                        <span
                                            className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusStyle[r.status] || statusStyle.PENDING}`}
                                        >
                                            {r.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-[13px] text-white/70 break-all max-w-[160px]">
                                        {r.reporter?.email || r.reporterId}
                                    </td>
                                    <td className="px-6 py-4 text-[13px] text-white/70">
                                        <div className="font-mono text-[12px] text-white/50">{r.targetType}</div>
                                        <div className="font-mono text-[11px] break-all max-w-[200px] mt-0.5">{r.targetId}</div>
                                    </td>
                                    <td className="px-6 py-4 text-[13px] text-white/60 max-w-[280px]">
                                        <p className="line-clamp-3">{r.reason}</p>
                                    </td>
                                    <td className="px-6 py-4 text-[13px] text-white/50 whitespace-nowrap">{formatDate(r.createdAt)}</td>
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
