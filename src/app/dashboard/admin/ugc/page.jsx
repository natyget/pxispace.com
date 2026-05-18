'use client';

import { useEffect, useMemo, useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Alert02Icon, CheckmarkCircle02Icon, Delete02Icon, ViewIcon } from '@hugeicons/core-free-icons';
import { useAuth } from '@/contexts/AuthContext';
import { fetchAdminUgcReports } from '@/services/admin';
import { adminMockUgcReports } from '@/lib/adminMockData';
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

const severityStyle = {
    CRITICAL: 'bg-red-500/15 text-red-200 border-red-500/35',
    HIGH: 'bg-amber-500/15 text-amber-200 border-amber-500/35',
    MEDIUM: 'bg-white/10 text-zinc-200 border-white/20',
};

export default function AdminUgcModerationPage() {
    const { user } = useAuth();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statusFilter, setStatusFilter] = useState('ALL');
    const isLiveAdmin = user?.accountTier === 'ADMIN';

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            setError(null);

            if (!isLiveAdmin) {
                if (!cancelled) {
                    setRows(adminMockUgcReports);
                    setLoading(false);
                }
                return;
            }

            try {
                const payload = await fetchAdminUgcReports({
                    page: 1,
                    limit: 100,
                    status: statusFilter === 'ALL' ? undefined : statusFilter,
                });
                if (!cancelled) {
                    setRows(payload?.reports || payload?.items || adminMockUgcReports);
                }
            } catch (nextError) {
                if (!cancelled) {
                    setRows(adminMockUgcReports);
                    setError(nextError?.message || 'Live moderation endpoint unavailable, showing fallback queue.');
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [isLiveAdmin, statusFilter]);

    const filteredRows = useMemo(
        () => rows.filter((row) => statusFilter === 'ALL' || String(row.status || '').toUpperCase() === statusFilter),
        [rows, statusFilter]
    );

    return (
        <div className="max-w-6xl space-y-6">
            <header className="flex items-start justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-black text-white tracking-tight">UGC Moderation Queue</h1>
                    <p className="text-white/60 text-sm mt-1">Zero-tolerance surface for inappropriate event content.</p>
                </div>
                <DataSourceBadge source={isLiveAdmin ? 'Live' : 'Mock'} />
            </header>

            <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
                <p className="text-sm text-red-200 flex items-center gap-2">
                    <HugeiconsIcon icon={Alert02Icon} size={16} />
                    Any critical UGC report should be triaged immediately and hidden pending review.
                </p>
            </div>

            <div className="flex gap-2 flex-wrap">
                {['ALL', 'PENDING', 'RESOLVED'].map((status) => (
                    <button
                        key={status}
                        type="button"
                        onClick={() => setStatusFilter(status)}
                        className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-widest border ${
                            statusFilter === status
                                ? 'border-white/25 bg-white text-black'
                                : 'border-white/15 text-zinc-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        {status}
                    </button>
                ))}
            </div>

            {error && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
                    {error}
                </div>
            )}

            <div className="rounded-2xl border border-white/10 bg-zinc-900/40 overflow-x-auto">
                {loading ? (
                    <div className="px-6 py-12 text-center text-white/45 text-sm">Loading moderation queue…</div>
                ) : filteredRows.length === 0 ? (
                    <div className="px-6 py-12 text-center text-white/45 text-sm">No UGC reports in this filter.</div>
                ) : (
                    <table className="w-full text-left border-collapse min-w-[980px]">
                        <thead>
                            <tr className="border-b border-white/5">
                                <th className="px-6 py-4 text-[11px] font-bold tracking-widest text-white/40 uppercase">Severity</th>
                                <th className="px-6 py-4 text-[11px] font-bold tracking-widest text-white/40 uppercase">Status</th>
                                <th className="px-6 py-4 text-[11px] font-bold tracking-widest text-white/40 uppercase">Reason</th>
                                <th className="px-6 py-4 text-[11px] font-bold tracking-widest text-white/40 uppercase">Event</th>
                                <th className="px-6 py-4 text-[11px] font-bold tracking-widest text-white/40 uppercase">Author</th>
                                <th className="px-6 py-4 text-[11px] font-bold tracking-widest text-white/40 uppercase">Created</th>
                                <th className="px-6 py-4 text-[11px] font-bold tracking-widest text-white/40 uppercase text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredRows.map((row) => (
                                <tr key={row.id} className="hover:bg-white/[0.02]">
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${severityStyle[row.severity] || severityStyle.MEDIUM}`}>
                                            {row.severity}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-[13px] text-white/75">{row.status}</td>
                                    <td className="px-6 py-4 text-[13px] text-white/75 max-w-[260px]">
                                        {row.reason} <span className="text-zinc-500">({row.reporterCount} reports)</span>
                                    </td>
                                    <td className="px-6 py-4 text-[13px] text-white/60">{row.eventName}</td>
                                    <td className="px-6 py-4 text-[13px] text-white/60">{row.author}</td>
                                    <td className="px-6 py-4 text-[13px] text-white/50 whitespace-nowrap">{formatDate(row.createdAt)}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <button className="rounded-lg border border-white/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-zinc-200 hover:bg-white/10">
                                                <HugeiconsIcon icon={ViewIcon} size={12} className="inline mr-1" />
                                                Review
                                            </button>
                                            <button className="rounded-lg border border-red-500/35 bg-red-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-red-200 hover:bg-red-500/20">
                                                <HugeiconsIcon icon={Delete02Icon} size={12} className="inline mr-1" />
                                                Hide
                                            </button>
                                            <button className="rounded-lg border border-emerald-500/35 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-200 hover:bg-emerald-500/20">
                                                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={12} className="inline mr-1" />
                                                Resolve
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
