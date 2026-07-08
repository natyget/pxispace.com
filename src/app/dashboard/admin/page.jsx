'use client';

import { useEffect, useState } from 'react';
import { fetchAdminStats } from '@/services/admin';
import DataSourceBadge from '@/components/dashboard/DataSourceBadge';
import { useAuth } from '@/contexts/AuthContext';
import { adminMockStats } from '@/lib/adminMockData';
import { adminErrorMessage } from '@/components/admin/adminFormat';

function formatInteger(value) {
    return Number(value || 0).toLocaleString();
}

function totalUsers(users = {}) {
    return Number(users.partial || 0) + Number(users.citizen || 0) + Number(users.vendor || 0) + Number(users.admin || 0);
}

function totalEvents(events = {}) {
    return Number(events.pending || 0) + Number(events.upcoming || 0) + Number(events.ended || 0);
}

function SummaryTile({ label, value, hint }) {
    return (
        <div className="rounded-2xl bg-white/[0.04] p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/40">{label}</p>
            <p className="mt-3 text-[28px] font-black leading-none tracking-normal text-white tabular-nums">{value}</p>
            {hint ? <p className="mt-2 text-xs font-semibold leading-5 text-white/45">{hint}</p> : null}
        </div>
    );
}

function StatBlock({ title, rows }) {
    return (
        <div className="rounded-[1.75rem] bg-white/[0.04] p-5">
            <h2 className="mb-4 text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">{title}</h2>
            <dl className="space-y-2">
                {rows.map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between gap-4 rounded-2xl bg-white/[0.035] px-4 py-3">
                        <dt className="min-w-0 truncate text-sm font-semibold text-white/55">{label}</dt>
                        <dd className="shrink-0 text-lg font-black tabular-nums text-white">{formatInteger(value)}</dd>
                    </div>
                ))}
            </dl>
        </div>
    );
}

function AdminOverviewHero({ stats, isLiveAdmin }) {
    const userTotal = totalUsers(stats?.users);
    const eventTotal = totalEvents(stats?.events);
    const pendingReports = Number(stats?.reports?.pending || 0);
    const openSupport = Number(stats?.support?.open || 0);

    return (
        <section className="dashboard-surface-b relative overflow-hidden rounded-[2rem] px-5 py-7 md:px-8 md:py-8">
            <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                <div className="max-w-2xl">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">PXI Admin</span>
                        <span className="text-zinc-700">/</span>
                        <DataSourceBadge source={isLiveAdmin ? 'Live' : 'Mock'} />
                    </div>
                    <h1 className="max-w-xl text-4xl font-black leading-[0.92] tracking-normal text-white normal-case md:text-6xl">
                        Admin overview
                    </h1>
                    <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-300 md:text-base">
                        Users, events, reports, and operating queues at platform level.
                    </p>
                </div>
                <div className="grid grid-cols-2 gap-2 xl:w-[520px]">
                    <SummaryTile label="Users" value={formatInteger(userTotal)} hint={`${formatInteger(stats?.users?.vendor)} organizers`} />
                    <SummaryTile label="Events" value={formatInteger(eventTotal)} hint={`${formatInteger(stats?.events?.upcoming)} upcoming`} />
                    <SummaryTile label="Reports" value={formatInteger(pendingReports)} hint="Pending review" />
                    <SummaryTile label="Support" value={formatInteger(openSupport)} hint="Open tickets" />
                </div>
            </div>
        </section>
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
        const timer = setTimeout(() => {
            fetchAdminStats()
                .then((data) => {
                    if (!cancelled) {
                        setStats(data);
                        setError(null);
                    }
                })
                .catch((err) => {
                    if (!cancelled) setError(adminErrorMessage(err, 'Failed to load stats'));
                })
                .finally(() => {
                    if (!cancelled) setLoading(false);
                });
        }, 0);
        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [isLiveAdmin]);

    return (
        <div className="max-w-7xl space-y-6 md:space-y-8">
            <AdminOverviewHero stats={resolvedStats} isLiveAdmin={isLiveAdmin} />

            {resolvedLoading && (
                <div className="rounded-2xl bg-white/[0.04] px-6 py-12 text-center text-sm text-white/50">
                    Loading statistics...
                </div>
            )}
            {error && (
                <div className="rounded-2xl bg-red-500/5 px-6 py-4 text-sm text-red-300">{error}</div>
            )}
            {!resolvedLoading && !error && resolvedStats && (
                <>
                <div className="rounded-[1.75rem] bg-white/[0.04] p-5">
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/35">Operating mode</p>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-white/55">
                        {isLiveAdmin
                            ? 'Live admin data is enabled for this account. Use the sidebar to manage users, events, safety, support, promos, and moderation.'
                            : 'Preview mode is enabled for PXI employee accounts without backend ADMIN tier. The data below is mock data for safe UI review.'}
                    </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatBlock
                        title="Accounts"
                        rows={[
                            { label: 'Partial', value: resolvedStats.users.partial },
                            { label: 'Citizen', value: resolvedStats.users.citizen },
                            { label: 'Organizers', value: resolvedStats.users.vendor },
                            ...(resolvedStats.users.admin > 0 ? [{ label: 'Platform admin', value: resolvedStats.users.admin }] : []),
                        ]}
                    />
                    <StatBlock
                        title="Events"
                        rows={[
                            { label: 'Pending review', value: resolvedStats.events.pending },
                            { label: 'Upcoming', value: resolvedStats.events.upcoming },
                            { label: 'Ended or archived', value: resolvedStats.events.ended },
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
                    {resolvedStats.support || resolvedStats.promos ? (
                        <StatBlock
                            title="Operations"
                            rows={[
                                { label: 'Open support tickets', value: resolvedStats.support?.open ?? 0 },
                                { label: 'Active promo codes', value: resolvedStats.promos?.active ?? 0 },
                            ]}
                        />
                    ) : null}
                </div>
                </>
            )}
        </div>
    );
}
