'use client';

import { useEffect, useState } from 'react';
import { fetchAdminStats } from '@/services/admin';

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
    const [stats, setStats] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
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
    }, []);

    return (
        <div className="max-w-6xl space-y-8">
            <div>
                <h1 className="text-xl font-bold text-white mb-2">Overview</h1>
                <p className="text-white/60 text-sm leading-relaxed">
                    Platform snapshot — users by tier, events by lifecycle, and moderation queue.
                </p>
            </div>

            {loading && (
                <div className="rounded-2xl border border-white/10 bg-zinc-900/40 px-6 py-12 text-center text-white/50 text-sm">
                    Loading statistics…
                </div>
            )}
            {error && (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/5 px-6 py-4 text-red-300 text-sm">{error}</div>
            )}
            {!loading && !error && stats && (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    <StatBlock
                        title="Users"
                        rows={[
                            { label: 'Partial', value: stats.users.partial },
                            { label: 'Citizen', value: stats.users.citizen },
                            { label: 'Vendor', value: stats.users.vendor },
                            ...(stats.users.admin > 0 ? [{ label: 'Platform admin', value: stats.users.admin }] : []),
                        ]}
                    />
                    <StatBlock
                        title="Events"
                        rows={[
                            { label: 'Pending (DORMANT)', value: stats.events.pending },
                            { label: 'Upcoming (start in future)', value: stats.events.upcoming },
                            { label: 'Ended / archived', value: stats.events.ended },
                        ]}
                    />
                    <StatBlock
                        title="Reports"
                        rows={[
                            { label: 'Pending', value: stats.reports.pending },
                            { label: 'Cancelled', value: stats.reports.cancel },
                            { label: 'Accepted (resolved)', value: stats.reports.accepted },
                        ]}
                    />
                </div>
            )}
        </div>
    );
}
