'use client';

import { useCallback, useEffect, useState } from 'react';
import { fetchAdminEvents } from '@/services/admin';
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

export default function AdminEventsPage() {
    const [rows, setRows] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const load = useCallback(async (p) => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchAdminEvents({ page: p, limit: 50 });
            setRows(data.events || []);
            setTotalPages(data.totalPages || 1);
            setTotal(data.total ?? 0);
        } catch (err) {
            setError(err.message || 'Failed to load events');
            setRows([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load(page);
    }, [load, page]);

    return (
        <div className="max-w-6xl space-y-6">
            <div>
                <h1 className="text-xl font-bold text-white mb-2">Event management</h1>
                <p className="text-white/60 text-sm leading-relaxed">
                    All studio events. {total > 0 ? `${total} total.` : null}
                </p>
            </div>

            {error && (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/5 px-6 py-4 text-red-300 text-sm">{error}</div>
            )}

            <div className="rounded-2xl border border-white/10 bg-zinc-900/40 overflow-x-auto">
                {loading ? (
                    <div className="px-6 py-12 text-center text-white/45 text-sm">Loading…</div>
                ) : rows.length === 0 ? (
                    <div className="px-6 py-12 text-center text-white/45 text-sm">No events yet.</div>
                ) : (
                    <table className="w-full text-left border-collapse min-w-[900px]">
                        <thead>
                            <tr className="border-b border-white/5">
                                <th className="px-6 py-4 text-[11px] font-bold tracking-widest text-white/40 uppercase">Name</th>
                                <th className="px-6 py-4 text-[11px] font-bold tracking-widest text-white/40 uppercase">Start</th>
                                <th className="px-6 py-4 text-[11px] font-bold tracking-widest text-white/40 uppercase">End</th>
                                <th className="px-6 py-4 text-[11px] font-bold tracking-widest text-white/40 uppercase">Status</th>
                                <th className="px-6 py-4 text-[11px] font-bold tracking-widest text-white/40 uppercase">Visibility</th>
                                <th className="px-6 py-4 text-[11px] font-bold tracking-widest text-white/40 uppercase">Host email</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {rows.map((ev) => (
                                <tr key={ev.id} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="px-6 py-4 text-[14px] font-semibold text-white max-w-[220px]">
                                        <div className="line-clamp-2">{ev.name}</div>
                                        {ev.location ? (
                                            <div className="text-[12px] font-normal text-white/45 mt-1 line-clamp-1">{ev.location}</div>
                                        ) : null}
                                    </td>
                                    <td className="px-6 py-4 text-[13px] text-white/60 whitespace-nowrap">{formatDate(ev.startDate)}</td>
                                    <td className="px-6 py-4 text-[13px] text-white/60 whitespace-nowrap">{formatDate(ev.endDate)}</td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                            {ev.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-[13px] text-white/60">{ev.visibility}</td>
                                    <td className="px-6 py-4 text-[13px] text-white/55 break-all max-w-[180px]">
                                        {ev.creator?.email || '—'}
                                    </td>
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
