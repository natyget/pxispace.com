'use client';

// Admin ads control room (W12): platform-wide campaign monitoring, revenue
// split, staff pause/cancel (organizer cannot resume a staff pause), and a
// per-placement kill switch for featured hero slots.

import { useCallback, useEffect, useState } from 'react';
import {
    adminCancelAdCampaign,
    adminPauseAdCampaign,
    adminResumeAdCampaign,
    adminToggleAdPlacement,
    fetchAdminAdCampaigns,
    fetchAdminAdsOverview,
} from '@/services/admin';
import AdminPagination from '@/components/admin/AdminPagination';
import { useAdminMode } from '@/contexts/AdminModeContext';
import {
    AdminError,
    AdminPageShell,
    AdminPanel,
    AdminTableShell,
    adminTableClass,
    adminTdClass,
    adminThClass,
} from '@/components/admin/AdminPageShell';
import { adminErrorMessage } from '@/components/admin/adminFormat';

const STATUS_FILTERS = ['ALL', 'ACTIVE', 'SCHEDULED', 'PAUSED', 'PENDING_PAYMENT', 'COMPLETED', 'CANCELLED'];

const statusPill = {
    DRAFT: 'bg-white/[0.055] text-white/55',
    PENDING_PAYMENT: 'bg-amber-500/10 text-amber-300',
    SCHEDULED: 'bg-sky-500/10 text-sky-300',
    ACTIVE: 'bg-emerald-500/10 text-emerald-300',
    PAUSED: 'bg-orange-500/10 text-orange-300',
    COMPLETED: 'bg-white/10 text-white/70',
    CANCELLED: 'bg-white/[0.055] text-white/40',
};

const SURFACE_SHORT = {
    FEED: 'Feed',
    DISCOVERY: 'Discovery',
    WEB_DISCOVERY: 'Web grid',
    WEB_FEATURED: 'Featured',
};

function formatUsd(cents) {
    return `$${(Number(cents || 0) / 100).toFixed(2)}`;
}

function formatDay(iso) {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
        return '—';
    }
}

export default function AdminAdsPage() {
    const { isLive: isLiveAdmin } = useAdminMode();
    const [overview, setOverview] = useState(null);
    const [rows, setRows] = useState([]);
    const [status, setStatus] = useState('ALL');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [busyId, setBusyId] = useState(null);

    const load = useCallback(async (p, s) => {
        if (!isLiveAdmin) {
            setRows([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const [ov, data] = await Promise.all([
                fetchAdminAdsOverview(),
                fetchAdminAdCampaigns({ page: p, limit: 50, ...(s !== 'ALL' ? { status: s } : {}) }),
            ]);
            setOverview(ov);
            setRows(data.campaigns || []);
            setTotalPages(data.totalPages || 1);
        } catch (err) {
            setError(adminErrorMessage(err, 'Failed to load ad campaigns'));
            setRows([]);
        } finally {
            setLoading(false);
        }
    }, [isLiveAdmin]);

    useEffect(() => {
        const timer = setTimeout(() => load(page, status), 0);
        return () => clearTimeout(timer);
    }, [load, page, status]);

    const runAction = async (campaign, action) => {
        setBusyId(campaign.id);
        setError(null);
        try {
            if (action === 'pause') {
                const reason = window.prompt('Reason for pausing (audited):') || '';
                await adminPauseAdCampaign(campaign.id, reason);
            } else if (action === 'resume') {
                await adminResumeAdCampaign(campaign.id);
            } else {
                const reason = window.prompt('Reason for cancelling (audited, refunds unserved days as credits):') || '';
                await adminCancelAdCampaign(campaign.id, reason);
            }
            await load(page, status);
        } catch (err) {
            setError(err.message || `Failed to ${action}`);
        } finally {
            setBusyId(null);
        }
    };

    const togglePlacement = async (placement) => {
        setBusyId(placement.id);
        setError(null);
        try {
            await adminToggleAdPlacement(placement.id, !placement.disabledByAdminAt);
            await load(page, status);
        } catch (err) {
            setError(err.message || 'Failed to toggle placement');
        } finally {
            setBusyId(null);
        }
    };

    const featuredPlacements = rows.flatMap((c) =>
        (c.placements || [])
            .filter((p) => p.surface === 'WEB_FEATURED')
            .map((p) => ({ ...p, campaignName: c.name, campaignStatus: c.status, organizer: c.organizer }))
    );

    return (
        <AdminPageShell
            title="Ads"
            copy="Every paid campaign on the platform: revenue, delivery, and kill switches. Staff pauses lock the campaign until staff resume it."
            source={isLiveAdmin ? 'Live' : 'Mock'}
            metrics={[
                { label: 'Revenue', value: overview ? formatUsd(overview.revenue.totalPaidCents) : '—', hint: overview ? `${formatUsd(overview.revenue.creditPaidCents)} credits · ${formatUsd(overview.revenue.stripePaidCents)} card` : 'Paid campaigns' },
                { label: 'Active', value: overview ? overview.activeCampaigns.toLocaleString() : '—', hint: 'Serving now' },
                { label: 'Impressions today', value: overview ? overview.impressionsToday.toLocaleString() : '—', hint: `${overview ? overview.clicksToday.toLocaleString() : '—'} clicks today` },
            ]}
        >
            <AdminPanel className="space-y-3">
                <h2 className="text-[11px] font-bold tracking-[0.02em] text-white/40">Filter by status</h2>
                <div className="flex flex-wrap gap-2">
                    {STATUS_FILTERS.map((s) => (
                        <button
                            key={s}
                            type="button"
                            onClick={() => {
                                setStatus(s);
                                setPage(1);
                            }}
                            className={`rounded-full px-3.5 py-1.5 text-[12px] font-bold transition ${
                                status === s ? 'bg-white text-black' : 'bg-white/[0.065] text-white/60 hover:bg-white/[0.1]'
                            }`}
                        >
                            {s.replaceAll('_', ' ')}
                        </button>
                    ))}
                </div>
            </AdminPanel>

            <AdminError>{error}</AdminError>

            <AdminTableShell
                loading={loading}
                emptyMessage={rows.length === 0 ? (isLiveAdmin ? 'No ad campaigns yet.' : 'Live ads data requires a backend ADMIN account.') : null}
            >
                <table className={`${adminTableClass} min-w-[1080px]`}>
                    <thead>
                        <tr>
                            <th className={adminThClass}>Campaign</th>
                            <th className={adminThClass}>Organizer</th>
                            <th className={adminThClass}>Surfaces</th>
                            <th className={adminThClass}>Schedule</th>
                            <th className={adminThClass}>Paid</th>
                            <th className={adminThClass}>Delivery</th>
                            <th className={adminThClass}>Status</th>
                            <th className="px-6 py-4" />
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((c) => {
                            const stats = c.stats || { impressions: 0, clicks: 0 };
                            const paidCents = (c.creditAppliedCents || 0) + (c.stripeAmountCents || 0);
                            const busy = busyId === c.id;
                            return (
                                <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                                    <td data-label="Campaign" className="admin-table-primary px-6 py-4">
                                        <span className="text-[13px] font-bold text-white/90">{c.name}</span>
                                        <p className="mt-0.5 text-[11px] text-white/40">
                                            {(c.events || []).map((e) => e.event?.name).filter(Boolean).join(', ') || '—'}
                                            {c.emailEnabled ? ' · Email' : ''}
                                        </p>
                                    </td>
                                    <td data-label="Organizer" className={`${adminTdClass} text-[12px]`}>
                                        {c.organizer?.username ? `@${c.organizer.username}` : c.organizer?.email || '—'}
                                    </td>
                                    <td data-label="Surfaces" className={`${adminTdClass} text-[12px] text-white/70`}>
                                        {(c.placements || [])
                                            .map((p) => `${SURFACE_SHORT[p.surface] || p.surface}${p.disabledByAdminAt ? ' (off)' : ''}`)
                                            .join(', ') || '—'}
                                    </td>
                                    <td data-label="Schedule" className={`${adminTdClass} text-[12px] text-white/70`}>
                                        {formatDay(c.startAt)} → {formatDay(c.endAt)}
                                    </td>
                                    <td data-label="Paid" className={`${adminTdClass} tabular-nums text-white/80`}>{formatUsd(paidCents)}</td>
                                    <td data-label="Delivery" className={`${adminTdClass} tabular-nums text-[12px] text-white/70`}>
                                        {stats.impressions.toLocaleString()} impr · {stats.clicks.toLocaleString()} clk
                                    </td>
                                    <td data-label="Status" className="px-6 py-4">
                                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium tracking-[0.02em] ${statusPill[c.status] || statusPill.DRAFT}`}>
                                            {String(c.status).replaceAll('_', ' ')}
                                        </span>
                                        {c.pausedByAdmin ? (
                                            <p className="mt-1 text-[11px] font-medium tracking-[0.02em] text-red-300/80">Staff hold</p>
                                        ) : null}
                                    </td>
                                    <td data-label="Actions" className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1.5">
                                            {c.status === 'ACTIVE' || c.status === 'SCHEDULED' ? (
                                                <button
                                                    type="button"
                                                    disabled={busy}
                                                    onClick={() => runAction(c, 'pause')}
                                                    className="rounded-full bg-white/[0.065] px-3 py-1.5 text-[12px] font-semibold text-white/70 hover:bg-white/[0.1] hover:text-white disabled:opacity-40"
                                                >
                                                    Pause
                                                </button>
                                            ) : null}
                                            {c.status === 'PAUSED' ? (
                                                <button
                                                    type="button"
                                                    disabled={busy}
                                                    onClick={() => runAction(c, 'resume')}
                                                    className="rounded-full bg-white/[0.065] px-3 py-1.5 text-[12px] font-semibold text-white/70 hover:bg-white/[0.1] hover:text-white disabled:opacity-40"
                                                >
                                                    Resume
                                                </button>
                                            ) : null}
                                            {['ACTIVE', 'SCHEDULED', 'PAUSED', 'PENDING_PAYMENT', 'DRAFT'].includes(c.status) ? (
                                                <button
                                                    type="button"
                                                    disabled={busy}
                                                    onClick={() => runAction(c, 'cancel')}
                                                    className="rounded-full bg-red-500/10 px-3 py-1.5 text-[12px] font-semibold text-red-300 hover:bg-red-500/20 disabled:opacity-40"
                                                >
                                                    Cancel
                                                </button>
                                            ) : null}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </AdminTableShell>

            <AdminPagination page={page} totalPages={totalPages} onPageChange={setPage} disabled={loading} />

            <AdminPanel className="space-y-3">
                <h2 className="text-[11px] font-bold tracking-[0.02em] text-white/40">Featured hero placements</h2>
                {featuredPlacements.length === 0 ? (
                    <p className="text-[13px] text-white/45">No featured placements in the loaded campaigns.</p>
                ) : (
                    <div className="space-y-2">
                        {featuredPlacements.map((p) => (
                            <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white/[0.045] px-4 py-3">
                                <div className="min-w-0">
                                    <p className="truncate text-[13px] font-bold text-white">{p.campaignName}</p>
                                    <p className="text-[11px] text-white/40">
                                        {p.organizer?.username ? `@${p.organizer.username}` : p.organizer?.email || '—'} · {p.intensity.toLowerCase()} intensity ·{' '}
                                        {p.campaignStatus.toLowerCase()}
                                        {p.disabledByAdminAt ? ' · disabled by staff' : ''}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    disabled={busyId === p.id}
                                    onClick={() => togglePlacement(p)}
                                    className={`rounded-full px-3.5 py-1.5 text-[12px] font-semibold disabled:opacity-40 ${
                                        p.disabledByAdminAt
                                            ? 'bg-white text-black'
                                            : 'bg-red-500/10 text-red-300 hover:bg-red-500/20'
                                    }`}
                                >
                                    {p.disabledByAdminAt ? 'Re-enable' : 'Disable slot'}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </AdminPanel>
        </AdminPageShell>
    );
}
