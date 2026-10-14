'use client';

import { useCallback, useEffect, useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { CheckmarkCircle02Icon, Delete02Icon } from '@hugeicons/core-free-icons';
import { useAdminMode } from '@/contexts/AdminModeContext';
import { fetchAdminUgcReports, resolveAdminReport } from '@/services/admin';
import { adminMockUgcReports } from '@/lib/adminMockData';
import {
    AdminError,
    AdminPageShell,
    AdminTableShell,
    adminTableClass,
    adminTdClass,
    adminThClass,
} from '@/components/admin/AdminPageShell';
import { adminErrorMessage } from '@/components/admin/adminFormat';
import { WordTabs } from '@/components/dashboard/ui/kit';
import { count } from '@/lib/dashFormat';

function formatDate(iso) {
    if (!iso) return '-';
    try {
        return new Date(iso).toLocaleString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return '-';
    }
}

const STATUS_TABS = [
    { key: 'PENDING', label: 'Pending' },
    { key: 'RESOLVED', label: 'Resolved' },
    { key: 'CANCELLED', label: 'Cancelled' },
    { key: 'ALL', label: 'All' },
];

const statusStyle = {
    PENDING: 'bg-amber-500/10 text-amber-300',
    RESOLVED: 'bg-emerald-500/10 text-emerald-300',
    CANCELLED: 'bg-white/[0.055] text-white/55',
};

export default function AdminUgcModerationPage() {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statusFilter, setStatusFilter] = useState('PENDING');
    const [busyId, setBusyId] = useState(null);
    const { isLive: isLiveAdmin } = useAdminMode();

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        if (!isLiveAdmin) {
            setRows(adminMockUgcReports);
            setLoading(false);
            return;
        }
        try {
            const payload = await fetchAdminUgcReports({
                page: 1,
                limit: 100,
                status: statusFilter === 'ALL' ? undefined : statusFilter,
            });
            setRows(payload?.reports || []);
        } catch (nextError) {
            setRows([]);
            setError(adminErrorMessage(nextError, 'Failed to load the UGC queue.'));
        } finally {
            setLoading(false);
        }
    }, [isLiveAdmin, statusFilter]);

    useEffect(() => {
        const timer = setTimeout(() => load(), 0);
        return () => clearTimeout(timer);
    }, [load]);

    const act = async (report, action) => {
        const isTakedown = action === 'TAKEDOWN_MEDIA';
        if (
            isTakedown &&
            !window.confirm('Take this media down for everyone and resolve the report? This cannot be undone.')
        ) {
            return;
        }
        setBusyId(report.id);
        setError(null);
        try {
            await resolveAdminReport(report.id, {
                status: isTakedown ? 'RESOLVED' : 'CANCELLED',
                action: isTakedown ? 'TAKEDOWN_MEDIA' : 'NONE',
            });
            await load();
        } catch (err) {
            setError(err?.message || 'Action failed');
        } finally {
            setBusyId(null);
        }
    };

    return (
        <AdminPageShell
            title="Content"
            copy="Reported photos and posts, with take down and dismiss."
            source={isLiveAdmin ? 'Live' : 'Mock'}
            metrics={[{ label: 'In this view', value: count(rows.length), hint: STATUS_TABS.find((tab) => tab.key === statusFilter)?.label }]}
        >

            <WordTabs items={STATUS_TABS} value={statusFilter} onChange={setStatusFilter} />

            <AdminError>{error}</AdminError>

            <AdminTableShell
                loading={loading}
                emptyMessage={rows.length === 0 ? (isLiveAdmin ? 'No UGC reports in this filter.' : 'Live queue requires a backend ADMIN account.') : null}
            >
                    <table className={`${adminTableClass} min-w-[920px]`}>
                        <thead>
                            <tr>
                                <th className={adminThClass}>Status</th>
                                <th className={adminThClass}>Target</th>
                                <th className={adminThClass}>Reason</th>
                                <th className={adminThClass}>Reporter</th>
                                <th className={adminThClass}>Created</th>
                                <th className={`${adminThClass} text-right`}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row) => (
                                <tr key={row.id} className="hover:bg-white/[0.02] align-top">
                                    <td data-label="Status" className="px-6 py-4">
                                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium tracking-[0.02em] ${statusStyle[row.status] || statusStyle.PENDING}`}>
                                            {row.status || 'PENDING'}
                                        </span>
                                    </td>
                                    <td data-label="Target" className="admin-table-primary px-6 py-4 text-[13px] text-white/70">
                                        <div className="font-mono text-[12px] text-white/50">{row.targetType || 'MEDIA'}</div>
                                        <div className="font-mono text-[11px] break-all max-w-[180px] mt-0.5">{row.targetId || '-'}</div>
                                    </td>
                                    <td data-label="Reason" className={`${adminTdClass} max-w-[260px] text-white/75`}>
                                        <p className="line-clamp-3">{row.reason}</p>
                                    </td>
                                    <td data-label="Reporter" className={`${adminTdClass} break-all max-w-[160px]`}>
                                        {row.reporter?.email || row.reporterId || row.author || '-'}
                                    </td>
                                    <td data-label="Created" className={`${adminTdClass} whitespace-nowrap`}>{formatDate(row.createdAt)}</td>
                                    <td data-label="Actions" className="px-6 py-4">
                                        {isLiveAdmin && row.status === 'PENDING' ? (
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    type="button"
                                                    disabled={busyId === row.id}
                                                    onClick={() => act(row, 'TAKEDOWN_MEDIA')}
                                                    className="rounded-lg bg-red-500/10 px-2.5 py-1 text-[11px] font-medium tracking-[0.02em] text-red-200 hover:bg-red-500/20 disabled:opacity-50"
                                                >
                                                    <HugeiconsIcon icon={Delete02Icon} size={12} className="inline mr-1" />
                                                    Take down
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={busyId === row.id}
                                                    onClick={() => act(row, 'NONE')}
                                                    className="rounded-lg bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium tracking-[0.02em] text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-50"
                                                >
                                                    <HugeiconsIcon icon={CheckmarkCircle02Icon} size={12} className="inline mr-1" />
                                                    Dismiss
                                                </button>
                                            </div>
                                        ) : null}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
            </AdminTableShell>
        </AdminPageShell>
    );
}
