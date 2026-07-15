'use client';

import { Fragment, useCallback, useEffect, useState } from 'react';
import { fetchAdminReports, resolveAdminReport } from '@/services/admin';
import AdminPagination from '@/components/admin/AdminPagination';
import { useAuth } from '@/contexts/AuthContext';
import { adminMockReports } from '@/lib/adminMockData';
import {
    AdminError,
    AdminPageShell,
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

const statusStyle = {
    PENDING: 'bg-amber-500/10 text-amber-300',
    RESOLVED: 'bg-emerald-500/10 text-emerald-300',
    CANCELLED: 'bg-white/[0.055] text-white/55',
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
        <div className="rounded-2xl bg-white/[0.035] p-4 space-y-3">
            <div className="flex flex-wrap gap-3">
                <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="rounded-full bg-white/[0.065] px-3 py-1.5 text-[12px] text-white/80 outline-none"
                >
                    <option value="RESOLVED">Resolve (report is valid)</option>
                    <option value="CANCELLED">Dismiss (no violation)</option>
                </select>
                {isUserReport && status === 'RESOLVED' && (
                    <select
                        value={action}
                        onChange={(e) => setAction(e.target.value)}
                        className="rounded-full bg-white/[0.065] px-3 py-1.5 text-[12px] text-white/80 outline-none"
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
                    className="flex-1 min-w-[220px] rounded-full bg-white/[0.055] px-4 py-1.5 text-[12px] text-white placeholder:text-white/35 outline-none focus:bg-white/[0.075]"
                />
            </div>
            {error && <p className="text-red-300 text-[12px]">{error}</p>}
            <div className="flex gap-2 justify-end">
                <button
                    type="button"
                    onClick={onCancel}
                    className="rounded-full bg-white/[0.065] px-4 py-1.5 text-[12px] font-semibold text-white/60 hover:bg-white/[0.1] hover:text-white"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={submit}
                    disabled={busy}
                    className="rounded-full bg-white text-black px-4 py-1.5 text-[12px] font-bold disabled:opacity-40"
                >
                    {busy ? 'Applying...' : 'Apply'}
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
            setError(adminErrorMessage(err, 'Failed to load reports'));
            setRows([]);
        } finally {
            setLoading(false);
        }
    }, [isLiveAdmin]);

    useEffect(() => {
        const timer = setTimeout(() => load(page), 0);
        return () => clearTimeout(timer);
    }, [load, page]);

    return (
        <AdminPageShell
            title="Reports"
            copy="Trust and safety reports with target context, reporter details, enforcement actions, and audit-ready resolutions."
            source={isLiveAdmin ? 'Live' : 'Mock'}
            metrics={[
                { label: 'Total', value: total.toLocaleString(), hint: 'Reports' },
                { label: 'Rows', value: rows.length.toLocaleString(), hint: `Page ${page}` },
            ]}
        >
            <AdminError>{error}</AdminError>

            <AdminTableShell loading={loading} emptyMessage={rows.length === 0 ? 'No reports yet.' : null}>
                    <table className={`${adminTableClass} min-w-[880px]`}>
                        <thead>
                            <tr>
                                <th className={adminThClass}>Status</th>
                                <th className={adminThClass}>Reporter</th>
                                <th className={adminThClass}>Target</th>
                                <th className={adminThClass}>Reason</th>
                                <th className={adminThClass}>Created</th>
                                <th className="px-6 py-4" />
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((r) => (
                                <Fragment key={r.id}>
                                    <tr className="hover:bg-white/[0.02] transition-colors align-top">
                                        <td data-label="Status" className="px-6 py-4">
                                            <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium tracking-[0.02em] ${statusStyle[r.status] || statusStyle.PENDING}`}>
                                                {r.status}
                                            </span>
                                        </td>
                                        <td data-label="Reporter" className="px-6 py-4 text-[13px] text-white/70 break-all max-w-[160px]">
                                            {r.reporter?.email || r.reporterId}
                                        </td>
                                        <td data-label="Target" className="px-6 py-4 text-[13px] text-white/70">
                                            <div className="font-mono text-[12px] text-white/50">{r.targetType}</div>
                                            <div className="font-mono text-[11px] break-all max-w-[200px] mt-0.5">{r.targetId}</div>
                                        </td>
                                        <td data-label="Reason" className={`${adminTdClass} max-w-[280px]`}>
                                            <p className="line-clamp-3">{r.reason}</p>
                                        </td>
                                        <td data-label="Created" className={`${adminTdClass} whitespace-nowrap`}>{formatDate(r.createdAt)}</td>
                                        <td data-label="Action" className="px-6 py-4">
                                            {isLiveAdmin && r.status === 'PENDING' && (
                                                <button
                                                    type="button"
                                                    onClick={() => setActingOn(actingOn === r.id ? null : r.id)}
                                                    className="rounded-full bg-white/[0.065] px-3.5 py-1.5 text-[12px] font-semibold text-white/70 hover:bg-white/[0.1] hover:text-white whitespace-nowrap"
                                                >
                                                    Take action
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                    {actingOn === r.id && (
                                        <tr className="admin-table-expanded-row">
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
            </AdminTableShell>

            <AdminPagination page={page} totalPages={totalPages} onPageChange={setPage} disabled={loading} />
        </AdminPageShell>
    );
}
