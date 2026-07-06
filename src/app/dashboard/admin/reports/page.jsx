'use client';

import { Fragment, useCallback, useEffect, useState } from 'react';
import { fetchAdminReports, resolveAdminReport } from '@/services/admin';
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

function ActionPanel({ report, onDone, onCancel }) {
    const isUserReport = report.targetType === 'USER';
    const [status, setStatus] = useState('RESOLVED');
    const [action, setAction] = useState('NONE');
    const [reason, setReason] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);

    const submit = async () => {
        setBusy(true);
        setError(null);
        try {
            await resolveAdminReport(report.id, {
                status,
                action: isUserReport ? action : 'NONE',
                reason: reason.trim() || undefined,
            });
            onDone();
        } catch (err) {
            setError(err.message || 'Failed to update report');
            setBusy(false);
        }
    };

    return (
        <div className="rounded-xl border border-white/10 bg-zinc-900/70 p-4 space-y-3">
            <div className="flex flex-wrap gap-3">
                <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="rounded-full border border-white/10 bg-zinc-900 px-3 py-1.5 text-[12px] text-white/80 outline-none"
                >
                    <option value="RESOLVED">Resolve (report is valid)</option>
                    <option value="CANCELLED">Dismiss (no violation)</option>
                </select>
                {isUserReport && status === 'RESOLVED' && (
                    <select
                        value={action}
                        onChange={(e) => setAction(e.target.value)}
                        className="rounded-full border border-white/10 bg-zinc-900 px-3 py-1.5 text-[12px] text-white/80 outline-none"
                    >
                        <option value="NONE">No enforcement</option>
                        <option value="WARN_USER">Warn user (audited)</option>
                        <option value="SUSPEND_USER">Suspend user</option>
                    </select>
                )}
                <input
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Reason / note for the audit log"
                    className="flex-1 min-w-[220px] rounded-full border border-white/10 bg-zinc-900 px-4 py-1.5 text-[12px] text-white placeholder:text-white/35 outline-none focus:border-white/25"
                />
            </div>
            {error && <p className="text-red-300 text-[12px]">{error}</p>}
            <div className="flex gap-2 justify-end">
                <button
                    type="button"
                    onClick={onCancel}
                    className="rounded-full border border-white/10 px-4 py-1.5 text-[12px] text-white/60 hover:text-white"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={submit}
                    disabled={busy}
                    className="rounded-full bg-white text-black px-4 py-1.5 text-[12px] font-bold disabled:opacity-40"
                >
                    {busy ? 'Applying…' : 'Apply'}
                </button>
            </div>
        </div>
    );
}

export default function AdminReportsPage() {
    const { user } = useAuth();
    const [rows, setRows] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actingOn, setActingOn] = useState(null);
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
                    Trust &amp; safety reports. Every resolution is written to the moderation audit log. {total > 0 ? `${total} total.` : null}
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
                                <th className="px-6 py-4" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {rows.map((r) => (
                                <Fragment key={r.id}>
                                    <tr className="hover:bg-white/[0.02] transition-colors align-top">
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
                                        <td className="px-6 py-4">
                                            {isLiveAdmin && r.status === 'PENDING' && (
                                                <button
                                                    type="button"
                                                    onClick={() => setActingOn(actingOn === r.id ? null : r.id)}
                                                    className="rounded-full border border-white/10 px-3.5 py-1.5 text-[12px] text-white/70 hover:text-white hover:border-white/25 whitespace-nowrap"
                                                >
                                                    Take action
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                    {actingOn === r.id && (
                                        <tr>
                                            <td colSpan={6} className="px-6 pb-5">
                                                <ActionPanel
                                                    report={r}
                                                    onCancel={() => setActingOn(null)}
                                                    onDone={() => {
                                                        setActingOn(null);
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
