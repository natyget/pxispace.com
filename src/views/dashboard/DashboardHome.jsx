'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion as Motion } from 'framer-motion';
import { HugeiconsIcon } from '@hugeicons/react';
import { Notification03Icon } from '@hugeicons/core-free-icons';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/auth';
import { eventsService } from '../../services/events';
import SectionCard from '@/components/dashboard/SectionCard';
import { MicroChart, StatRow } from '@/components/dashboard/MetricCard';
import { useNotifications } from '@/lib/dashboardStore';
import { buildCommandCenterUpdates } from '@/services/commandCenter';

const DASHBOARD_RENDER_NOW = Date.now();
const BASE_CHART_COLOR = '#d4d4d8';

function soldTicketsExcludingOrganizer(count) {
    return Math.max(0, (count ?? 0) - 1);
}

function formatMoney(cents = 0) {
    return `$${(Math.max(0, cents) / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function formatEventDate(value) {
    if (!value) return 'Date pending';
    return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function eventState(event, now = DASHBOARD_RENDER_NOW) {
    const startMs = event.startDate ? new Date(event.startDate).getTime() : 0;
    const endMs = event.endDate ? new Date(event.endDate).getTime() : 0;
    const statusRaw = String(event.status || '').toUpperCase();

    if (statusRaw === 'ARCHIVED' || (endMs && endMs < now)) return 'Ended';
    if (statusRaw === 'LIVE' || statusRaw === 'ACTIVE' || (startMs && startMs <= now && (!endMs || endMs >= now))) return 'Active';
    if (startMs > now) return 'Scheduled';
    return 'Draft';
}

function stateClassName(status) {
    if (status === 'Active') return 'bg-emerald-400/10 text-emerald-300';
    if (status === 'Scheduled') return 'bg-white/[0.08] text-zinc-200';
    if (status === 'Draft') return 'bg-amber-400/10 text-amber-200';
    return 'bg-white/[0.04] text-zinc-400';
}

function buildSparkline(seed = 0, lift = 0) {
    return Array.from({ length: 9 }, (_, index) => {
        const wave = ((index + 1) * (seed + 3)) % 17;
        return Math.max(6, Math.round(18 + wave + lift + index * 2));
    });
}

export default function DashboardHome() {
    const { user } = useAuth();
    const [mounted, setMounted] = useState(false);
    const [vendorData, setVendorData] = useState(null);
    const [vendorLoading, setVendorLoading] = useState(false);
    const [events, setEvents] = useState([]);
    const [eventsLoading, setEventsLoading] = useState(false);
    const { unreadCount: notificationCount } = useNotifications(50);

    useEffect(() => {
        const frame = requestAnimationFrame(() => setMounted(true));
        return () => cancelAnimationFrame(frame);
    }, []);

    useEffect(() => {
        if (!mounted) return;
        let cancelled = false;
        const timer = setTimeout(() => {
            setEventsLoading(true);
            eventsService
                .getMyEvents({ limit: 100, offset: 0 })
                .then((res) => {
                    if (!cancelled) setEvents(res.events || []);
                })
                .catch(() => {
                    if (!cancelled) setEvents([]);
                })
                .finally(() => {
                    if (!cancelled) setEventsLoading(false);
                });
        }, 0);
        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [mounted]);

    useEffect(() => {
        if (!user?.isVendor) return;
        let cancelled = false;
        const timer = setTimeout(() => {
            setVendorLoading(true);
            authService
                .getVendorDashboard()
                .then((next) => {
                    if (!cancelled) setVendorData(next);
                })
                .catch(() => {})
                .finally(() => {
                    if (!cancelled) setVendorLoading(false);
                });
        }, 0);
        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [user?.isVendor]);

    const { eventRows, summary } = useMemo(() => {
        const now = DASHBOARD_RENDER_NOW;
        const totalEarnings = vendorData?.aggregates?.netPayout ?? 0;
        const totalTickets = events.reduce((sum, e) => sum + soldTicketsExcludingOrganizer(e?._count?.tickets), 0);
        const revenueByKey = new Map();

        for (const payment of vendorData?.payments ?? []) {
            const amount = payment.netPayout ?? payment.grossAmount ?? 0;
            const keys = [payment.eventId, payment.eventName, payment.event?.id, payment.event?.name].filter(Boolean);
            for (const key of keys) {
                revenueByKey.set(key, (revenueByKey.get(key) || 0) + amount);
            }
        }

        const rank = { Active: 0, Scheduled: 1, Draft: 2, Ended: 3 };
        const rows = [...events]
            .sort((a, b) => {
                const stateDelta = rank[eventState(a, now)] - rank[eventState(b, now)];
                if (stateDelta !== 0) return stateDelta;
                return (a.startDate ? new Date(a.startDate).getTime() : Number.MAX_SAFE_INTEGER)
                    - (b.startDate ? new Date(b.startDate).getTime() : Number.MAX_SAFE_INTEGER);
            })
            .slice(0, 5)
            .map((e, index) => {
                const status = eventState(e, now);
                const ticketsSold = soldTicketsExcludingOrganizer(e?._count?.tickets ?? 0);
                const directRevenue = revenueByKey.get(e.id) ?? revenueByKey.get(e.name);
                const ticketPriceRevenue = Number.isFinite(Number(e.ticketPrice)) ? Number(e.ticketPrice) * ticketsSold : null;
                const proportionalRevenue = totalTickets > 0 ? Math.round(totalEarnings * (ticketsSold / totalTickets)) : 0;
                const revenue = directRevenue ?? ticketPriceRevenue ?? proportionalRevenue;
                const statusLift = status === 'Active' ? 16 : status === 'Scheduled' ? 8 : 0;
                const hype = Math.max(0, Math.min(98, Math.round(ticketsSold * 7 + (revenue / 6000) + statusLift)));

                return {
                    id: e.id,
                    name: e.name || 'Untitled event',
                    dateLabel: formatEventDate(e.startDate),
                    status,
                    statusClassName: stateClassName(status),
                    ticketsSold,
                    revenue,
                    revenueLabel: formatMoney(revenue),
                    hype,
                    href: e.id ? `/dashboard/events/${e.id}` : '/dashboard/events',
                    chartPoints: buildSparkline(index, Math.min(28, hype / 4)),
                };
            });
        const sales = events.reduce((sum, e) => sum + soldTicketsExcludingOrganizer(e?._count?.tickets ?? 0), 0);
        const hypeAvg = rows.length
            ? Math.round(rows.reduce((sum, e) => sum + (e.hype ?? 0), 0) / rows.length)
            : 0;
        const activeCount = events.filter((event) => eventState(event, now) === 'Active').length;
        const scheduledCount = events.filter((event) => eventState(event, now) === 'Scheduled').length;
        const draftCount = events.filter((event) => eventState(event, now) === 'Draft').length;

        return {
            eventRows: rows,
            summary: {
                revenue: formatMoney(totalEarnings),
                sales,
                hype: hypeAvg,
                activeCount,
                scheduledCount,
                draftCount,
                salesTrend: buildSparkline(2, Math.min(26, sales / 3)),
                hypeTrend: buildSparkline(5, hypeAvg / 4),
            },
        };
    }, [events, vendorData]);
    const updates = useMemo(
        () => buildCommandCenterUpdates({ events, unreadCount: notificationCount, vendorDashboard: vendorData }),
        [events, notificationCount, vendorData]
    );
    const metricsLoading = vendorLoading || eventsLoading;

    if (!mounted) {
        return <div className="max-w-6xl mx-auto space-y-8" />;
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Command Center</h1>
                <Link
                    href="/dashboard/notifications"
                    aria-label="Open notifications"
                    className="relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.06] text-white/70 transition hover:bg-white/10 hover:text-white"
                >
                    <HugeiconsIcon icon={Notification03Icon} size={16} />
                    {notificationCount > 0 ? (
                        <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-pxi-purple px-1 text-[10px] font-black text-white">
                            {notificationCount > 99 ? '99+' : notificationCount}
                        </span>
                    ) : null}
                </Link>
            </div>

            {mounted && !user?.isVendor && (
                <div className="dashboard-surface-frosted rounded-2xl p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-white/40">Organizer access</p>
                            <h2 className="mt-1 text-lg font-black text-white">Unlock your PXI Passport</h2>
                        </div>
                        <Link
                            href="/dashboard/vendor-upgrade"
                            className="inline-flex shrink-0 items-center justify-center rounded-full bg-pxi-purple px-4 py-2 text-xs font-bold uppercase tracking-widest text-white transition hover:brightness-110 whitespace-nowrap"
                        >
                            Vendor Setup
                        </Link>
                    </div>
                </div>
            )}

            <Motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]"
            >
                <SectionCard
                    title="Event Pulse"
                    actions={(
                        <Link href="/dashboard/events" className="text-[12px] font-bold tracking-wide text-white/60 hover:text-white transition-colors uppercase whitespace-nowrap">
                            View all
                        </Link>
                    )}
                    bodyClassName="space-y-3"
                >
                    {metricsLoading ? (
                        <div className="space-y-3">
                            {[0, 1, 2].map((item) => (
                                <div key={item} className="h-28 rounded-2xl bg-white/[0.035] animate-pulse" />
                            ))}
                        </div>
                    ) : eventRows.length === 0 ? (
                        <div className="dashboard-surface-frosted rounded-2xl px-4 py-6 text-center">
                            <p className="text-sm font-semibold text-white">No events yet.</p>
                            <Link href="/dashboard/events/new" className="mt-3 inline-flex rounded-full bg-pxi-purple px-4 py-2 text-xs font-bold uppercase tracking-widest text-white whitespace-nowrap">
                                Create event
                            </Link>
                        </div>
                    ) : (
                        eventRows.map((event) => (
                            <article key={event.id} className="dashboard-surface-frosted rounded-2xl p-4">
                                <div className="flex min-w-0 items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <h2 className="truncate text-sm font-black text-white">{event.name}</h2>
                                        <p className="mt-1 text-xs font-medium text-zinc-500">{event.dateLabel}</p>
                                    </div>
                                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${event.statusClassName}`}>
                                        {event.status}
                                    </span>
                                </div>
                                <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_132px] lg:items-center">
                                    <StatRow
                                        className="!rounded-xl !p-3"
                                        items={[
                                            { label: 'Revenue', value: event.revenueLabel },
                                            { label: 'Tickets', value: event.ticketsSold.toLocaleString() },
                                            { label: 'Hype Index', value: event.hype },
                                        ]}
                                    />
                                    <div className="rounded-xl bg-white/[0.035] p-3">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Momentum</p>
                                        <MicroChart points={event.chartPoints} color={BASE_CHART_COLOR} className="mt-2" />
                                    </div>
                                </div>
                                <div className="mt-3 flex justify-end">
                                    <Link href={event.href} className="text-[11px] font-bold uppercase tracking-widest text-white/55 transition hover:text-white whitespace-nowrap">
                                        Open event
                                    </Link>
                                </div>
                            </article>
                        ))
                    )}
                </SectionCard>

                <div className="space-y-4">
                    <SectionCard title="Snapshot" dense bodyClassName="space-y-4">
                        <StatRow
                            className="!rounded-xl !p-3"
                            items={[
                                { label: 'Revenue', value: metricsLoading ? '—' : summary.revenue },
                                { label: 'Tickets', value: metricsLoading ? '—' : summary.sales.toLocaleString() },
                                { label: 'Hype Index', value: metricsLoading ? '—' : summary.hype },
                            ]}
                        />
                        <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-xl bg-white/[0.035] p-3">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Sales</p>
                                <MicroChart points={summary.salesTrend} color={BASE_CHART_COLOR} className="mt-2" />
                            </div>
                            <div className="rounded-xl bg-white/[0.035] p-3">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Hype</p>
                                <MicroChart points={summary.hypeTrend} color={BASE_CHART_COLOR} className="mt-2" />
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                ['Active', summary.activeCount],
                                ['Scheduled', summary.scheduledCount],
                                ['Draft', summary.draftCount],
                            ].map(([label, value]) => (
                                <div key={label} className="rounded-xl bg-white/[0.035] px-3 py-2">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/35">{label}</p>
                                    <p className="mt-1 text-lg font-black text-white">{metricsLoading ? '—' : value}</p>
                                </div>
                            ))}
                        </div>
                    </SectionCard>

                    <SectionCard title="PXI Updates" dense bodyClassName="space-y-3">
                        {updates.map((update) => (
                            <Link
                                key={update.id}
                                href={update.href}
                                className="block rounded-xl bg-white/[0.035] p-3 transition hover:bg-white/[0.06]"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-bold text-white">{update.title}</p>
                                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-500">{update.detail}</p>
                                    </div>
                                    <span className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-white/45 whitespace-nowrap">
                                        {update.action}
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </SectionCard>
                </div>
            </Motion.div>

            <nav className="dashboard-surface dashboard-scrollbar-none flex flex-nowrap items-center gap-1 overflow-x-auto rounded-full p-1" aria-label="Command Center actions">
                {[
                    { href: '/dashboard/events', label: 'Events' },
                    { href: '/dashboard/analytics', label: 'Analytics' },
                    { href: '/dashboard/audience', label: 'Audience' },
                    { href: '/dashboard/earnings', label: 'Earnings' },
                ].map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className="shrink-0 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-widest text-white/60 transition hover:bg-white/[0.07] hover:text-white whitespace-nowrap"
                    >
                        {item.label}
                    </Link>
                ))}
                <Link
                    href="/dashboard/events/new"
                    className="ml-auto shrink-0 rounded-full bg-pxi-purple px-4 py-2 text-xs font-bold uppercase tracking-widest text-white transition hover:brightness-110 whitespace-nowrap"
                >
                    Create
                </Link>
            </nav>
        </div>
    );
}
