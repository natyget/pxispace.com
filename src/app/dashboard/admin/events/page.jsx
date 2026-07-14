'use client';

import { useCallback, useEffect, useState } from 'react';
import { fetchAdminEvents } from '@/services/admin';
import AdminPagination from '@/components/admin/AdminPagination';
import { useAuth } from '@/contexts/AuthContext';
import { adminMockEvents } from '@/lib/adminMockData';
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

export default function AdminEventsPage() {
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
            setRows(adminMockEvents);
            setTotal(adminMockEvents.length);
            setTotalPages(1);
            setError(null);
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const data = await fetchAdminEvents({ page: p, limit: 50 });
            setRows(data.events || []);
            setTotalPages(data.totalPages || 1);
            setTotal(data.total ?? 0);
        } catch (err) {
            setError(adminErrorMessage(err, 'Failed to load events'));
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
            title="Events"
            copy="A platform-wide view of hosted events, organizers, visibility state, and schedule."
            source={isLiveAdmin ? 'Live' : 'Mock'}
            metrics={[
                { label: 'Total', value: total.toLocaleString(), hint: 'Events tracked' },
                { label: 'Rows', value: rows.length.toLocaleString(), hint: `Page ${page}` },
            ]}
        >
            <AdminError>{error}</AdminError>

            <AdminTableShell loading={loading} emptyMessage={rows.length === 0 ? 'No events yet.' : null}>
                    <table className={`${adminTableClass} min-w-[900px]`}>
                        <thead>
                            <tr>
                                <th className={adminThClass}>Name</th>
                                <th className={adminThClass}>Start</th>
                                <th className={adminThClass}>End</th>
                                <th className={adminThClass}>Status</th>
                                <th className={adminThClass}>Visibility</th>
                                <th className={adminThClass}>Host email</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((ev) => (
                                <tr key={ev.id} className="hover:bg-white/[0.02] transition-colors">
                                    <td data-label="Event" className="admin-table-primary px-6 py-4 text-[14px] font-semibold text-white max-w-[220px]">
                                        <div className="line-clamp-2">{ev.name}</div>
                                        {ev.location ? (
                                            <div className="text-[12px] font-normal text-white/45 mt-1 line-clamp-1">{ev.location}</div>
                                        ) : null}
                                    </td>
                                    <td data-label="Start" className={`${adminTdClass} whitespace-nowrap`}>{formatDate(ev.startDate)}</td>
                                    <td data-label="End" className={`${adminTdClass} whitespace-nowrap`}>{formatDate(ev.endDate)}</td>
                                    <td data-label="Status" className="px-6 py-4">
                                        <span className="inline-flex rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium tracking-[0.02em] text-emerald-300">
                                            {ev.status}
                                        </span>
                                    </td>
                                    <td data-label="Visibility" className={adminTdClass}>{ev.visibility}</td>
                                    <td data-label="Organizer" className="px-6 py-4 text-[13px] text-white/55 break-all max-w-[180px]">
                                        {ev.creator?.email || '—'}
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
