'use client';

import { useEffect, useState } from 'react';
import { fetchAdminStats } from '@/services/admin';
import DataSourceBadge from '@/components/dashboard/DataSourceBadge';
import { useAuth } from '@/contexts/AuthContext';
import { adminMockStats } from '@/lib/adminMockData';

function StatBlock({ title, rows }) {
    return (
        <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-6">
            <h2 className="text-[11px] font-bold tracking-widest text-white/40 uppercase mb-4">{title}</h2>
            <dl className="space-y-3">
                {rows.map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between gap-4">
                        <dt className="text-[14px] text-white/55">{label}</dt>
                        <dd className="text-[18px] font-bold tabular-nums text-white">{value}</dd>
                    </div>
                ))}
            </dl>
        </div>
    );
}

export default function AdminOverviewPage() {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const isLiveAdmin = user?.accountTier === 'ADMIN';
    const resolvedLoading = isLiveAdmin ? loading : false;
    const resolvedStats = isLiveAdmin ? stats : adminMockStats;

    useEffect(() => {
        let cancelled = false;
        if (!isLiveAdmin) return () => { cancelled = true; };
        fetchAdminStats()
            .then((data) => {
                if (!cancelled) {
                    setStats(data);
                    setError(null);
                }
            })
            .catch((err) => {
                if (!cancelled) setError(err.message || 'Failed to load stats');
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [isLiveAdmin]);

    return (
        <div className="max-w-6xl space-y-8">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-black text-white mb-2 tracking-tight">PXI Admin Overview</h1>
                    <p className="text-white/60 text-sm leading-relaxed">
                        Platform snapshot — users by tier, events by lifecycle, and moderation queue.
                    </p>
                </div>
                <DataSourceBadge source={isLiveAdmin ? 'Live' : 'Mock'} />
            </div>

            <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-5">
                <p className="text-[11px] font-bold tracking-widest text-white/40 uppercase">Admin Workspace</p>
                <p className="text-white/60 text-sm leading-relaxed">
                    {isLiveAdmin
                        ? 'Live admin data is enabled for this account. Use the sidebar to manage users, events, and safety reports.'
                        : 'Preview mode is enabled for PXI employee accounts without backend ADMIN tier. Use this safely for UI review.'}
                </p>
            </div>

            {resolvedLoading && (
                <div className="rounded-2xl border border-white/10 bg-zinc-900/40 px-6 py-12 text-center text-white/50 text-sm">
                    Loading statistics…
                </div>
            )}
            {error && (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/5 px-6 py-4 text-red-300 text-sm">{error}</div>
            )}
            {!resolvedLoading && !error && resolvedStats && (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    <StatBlock
                        title="Users"
                        rows={[
                            { label: 'Partial', value: resolvedStats.users.partial },
                            { label: 'Citizen', value: resolvedStats.users.citizen },
                            { label: 'Vendor', value: resolvedStats.users.vendor },
                            ...(resolvedStats.users.admin > 0 ? [{ label: 'Platform admin', value: resolvedStats.users.admin }] : []),
                        ]}
                    />
                    <StatBlock
                        title="Events"
                        rows={[
                            { label: 'Pending (DORMANT)', value: resolvedStats.events.pending },
                            { label: 'Upcoming (start in future)', value: resolvedStats.events.upcoming },
                            { label: 'Ended / archived', value: resolvedStats.events.ended },
                        ]}
                    />
                    <StatBlock
                        title="Reports"
                        rows={[
                            { label: 'Pending', value: resolvedStats.reports.pending },
                            { label: 'Cancelled', value: resolvedStats.reports.cancel },
                            { label: 'Accepted (resolved)', value: resolvedStats.reports.accepted },
                        ]}
                    />
                </div>
            )}
        </div>
    );
}
