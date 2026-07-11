'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/auth';
import { eventsService } from '../../services/events';
import { MicroChart, StatRow } from '@/components/dashboard/MetricCard';
import { RechartsChart, ChartSkeleton } from '@/components/dashboard/ChartFrame';
import { DASHBOARD_BRAND_COLOR, DASHBOARD_TOOLTIP_PROPS } from '@/components/dashboard/chartStyles';
import { useNotifications } from '@/lib/dashboardStore';
import { buildCommandCenterUpdates } from '@/services/commandCenter';
import { helpRequestsService } from '@/services/helpRequests';
import { organizerAnalyticsService } from '@/services/organizerAnalytics';

const DASHBOARD_RENDER_NOW = Date.now();
const BASE_CHART_COLOR = '#d4d4d8';

/** 'YYYY-MM-DD' -> 'Jun 7'. Falls back to the raw value for non-date labels. */
function formatDayTick(value) {
    if (!value) return '';
    const [y, m, d] = String(value).split('-').map(Number);
    if (!y || !m || !d) return String(value);
    const date = new Date(Date.UTC(y, m - 1, d));
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

/** Best-effort day label for a trailing-N-day series point that has no explicit date field. */
function fallbackDayLabel(index, total, now = DASHBOARD_RENDER_NOW) {
    const daysAgo = Math.max(0, total - index - 1);
    const date = new Date(now);
    date.setUTCDate(date.getUTCDate() - daysAgo);
    return date.toISOString().slice(0, 10);
}

function formatRevenueTick(value) {
    return `$${Number(value || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

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
    if (status === 'Active') return 'bg-emerald-500/[0.08] text-emerald-400/80 backdrop-blur-md';
    if (status === 'Scheduled') return 'bg-white/[0.04] text-white/70 backdrop-blur-md';
    if (status === 'Draft') return 'bg-amber-500/[0.08] text-amber-400/80 backdrop-blur-md';
    return 'bg-white/[0.04] text-zinc-500 backdrop-blur-md';
}

export default function DashboardHome() {
    const { user, authReady, authRefreshing } = useAuth();
    const [mounted, setMounted] = useState(false);
    const [vendorData, setVendorData] = useState(null);
    const [vendorLoading, setVendorLoading] = useState(false);
    const [events, setEvents] = useState([]);
    const [eventsLoading, setEventsLoading] = useState(false);
    const [helpRequests, setHelpRequests] = useState([]);
    const [overview, setOverview] = useState(null);
    const [overviewLoading, setOverviewLoading] = useState(false);
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

    useEffect(() => {
        if (!mounted) return;
        helpRequestsService
            .listOrganizerHelpRequests({ events })
            .then(setHelpRequests)
            .catch(() => setHelpRequests([]));
    }, [events, mounted]);

    useEffect(() => {
        if (!mounted) return;
        let cancelled = false;
        const timer = setTimeout(() => {
            setOverviewLoading(true);
            organizerAnalyticsService
                .getOverview()
                .then((next) => {
                    if (!cancelled) setOverview(next);
                })
                .catch(() => {
                    if (!cancelled) setOverview(null);
                })
                .finally(() => {
                    if (!cancelled) setOverviewLoading(false);
                });
        }, 0);
        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [mounted]);

    const { eventRows, summary } = useMemo(() => {
        const now = DASHBOARD_RENDER_NOW;
        const totalEarnings = overview?.totals?.netCents ?? vendorData?.aggregates?.netPayout ?? 0;
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
            .map((e) => {
                const status = eventState(e, now);
                const ticketsSold = soldTicketsExcludingOrganizer(e?._count?.tickets ?? 0);
                const directRevenue = revenueByKey.get(e.id) ?? revenueByKey.get(e.name);
                const ticketPriceRevenue = Number.isFinite(Number(e.ticketPrice)) ? Number(e.ticketPrice) * ticketsSold : null;
                const proportionalRevenue = totalTickets > 0 ? Math.round(totalEarnings * (ticketsSold / totalTickets)) : 0;
                const revenue = directRevenue ?? ticketPriceRevenue ?? proportionalRevenue;

                return {
                    id: e.id,
                    name: e.name || 'Untitled event',
                    dateLabel: formatEventDate(e.startDate),
                    status,
                    statusClassName: stateClassName(status),
                    ticketsSold,
                    revenue,
                    revenueLabel: formatMoney(revenue),
                    href: e.id ? `/dashboard/events/${e.id}` : '/dashboard/events',
                };
            });
        const sales = overview?.totals?.ticketsSold ?? events.reduce((sum, e) => sum + soldTicketsExcludingOrganizer(e?._count?.tickets ?? 0), 0);
        const attendees = overview?.totals?.attendees ?? 0;
        const activeCount = events.filter((event) => eventState(event, now) === 'Active').length;
        const scheduledCount = events.filter((event) => eventState(event, now) === 'Scheduled').length;
        const draftCount = events.filter((event) => eventState(event, now) === 'Draft').length;

        return {
            eventRows: rows,
            summary: {
                revenue: formatMoney(totalEarnings),
                sales,
                attendees,
                activeCount,
                scheduledCount,
                draftCount,
                salesTrend: (overview?.last30d?.ticketsByDay || []).map((d) => d.count),
                mediaTrend: (overview?.last30d?.mediaByDay || []).map((d) => d.count),
            },
        };
    }, [events, vendorData, overview]);
    const revenueTrend = useMemo(() => {
        const revenueByDay = overview?.last30d?.revenueByDay || [];
        return revenueByDay.map((d, index) => ({
            date: d.date || d.day || fallbackDayLabel(index, revenueByDay.length),
            value: (d.netCents ?? d.grossCents ?? 0) / 100,
        }));
    }, [overview]);
    const hasRevenueTrend = revenueTrend.some((point) => point.value > 0);
    const updates = useMemo(
        () => buildCommandCenterUpdates({ events, unreadCount: notificationCount, vendorDashboard: vendorData }),
        [events, notificationCount, vendorData]
    );
    const upcomingAndLiveEvents = useMemo(
        () => eventRows.filter((event) => event.status === 'Active' || event.status === 'Scheduled').slice(0, 4),
        [eventRows]
    );
    const urgentQueue = useMemo(() => {
        return helpRequests
            .filter((request) => request.status !== 'resolved')
            .slice(0, 3)
            .map((request) => ({
                id: request.id,
                title: request.subject || 'Customer ticket',
                event: request.eventName || 'Hosted event',
                severity: request.type === 'safety-security' || request.type === 'access-issue' ? 'high' : 'medium',
                detail: request.message || 'Attendee needs organizer follow-up.',
                action: request.status === 'reviewing' ? 'Continue review' : 'Review ticket',
                href: request.eventId ? `/dashboard/events/${request.eventId}/members` : '/dashboard/events',
            }));
    }, [helpRequests]);
    const reminderUpdates = updates.filter((update) => update.group !== 'product');
    const productUpdates = updates.filter((update) => update.group === 'product');
    const metricsLoading = vendorLoading || eventsLoading || overviewLoading;
    const isVendorDashboard = mounted && authReady && !authRefreshing && !!user?.isVendor;
    const dashboardHero = isVendorDashboard
        ? {
              eyebrow: 'Command center',
              title: 'Run the room.',
              copy: 'A focused read on live work, upcoming events, revenue, and anything that needs attention.',
          }
        : {
              eyebrow: 'Workspace',
              title: 'Your PXI.',
              copy: 'Tickets, notifications, hosted events, and account tools in one clean place.',
          };
    const commandMetrics = isVendorDashboard
        ? [
              { label: 'Revenue', value: metricsLoading ? '-' : summary.revenue },
              { label: 'Tickets', value: metricsLoading ? '-' : summary.sales.toLocaleString() },
              { label: 'Attendees', value: metricsLoading ? '-' : summary.attendees.toLocaleString() },
              { label: 'Live', value: metricsLoading ? '-' : summary.activeCount },
          ]
        : [
              { label: 'Hosted', value: metricsLoading ? '-' : events.length.toLocaleString() },
              { label: 'Unread', value: notificationCount > 99 ? '99+' : notificationCount.toLocaleString() },
              { label: 'Scheduled', value: metricsLoading ? '-' : summary.scheduledCount },
              { label: 'Drafts', value: metricsLoading ? '-' : summary.draftCount },
          ];

    if (!mounted) {
        return <div className="mx-auto max-w-7xl space-y-8" />;
    }

    return (
        <div className="mx-auto max-w-7xl space-y-5 md:space-y-6">
            <section className="dashboard-surface-b relative overflow-hidden rounded-[1.75rem] px-5 py-6 md:px-7 md:py-7">
                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,520px)] xl:items-end">
                    <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">{dashboardHero.eyebrow}</p>
                        <h1 className="mt-2 text-4xl font-black leading-[0.9] text-white md:text-6xl">{dashboardHero.title}</h1>
                        <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">{dashboardHero.copy}</p>
                        <div className="mt-5 flex flex-wrap items-center gap-2">
                            <Link
                                href={isVendorDashboard ? '/dashboard/events' : '/dashboard/vendor-upgrade'}
                                className="pill-solid px-4 py-2.5 text-xs uppercase tracking-widest"
                            >
                                {isVendorDashboard ? 'Manage events' : 'Start hosting'}
                            </Link>
                            <Link
                                href="/dashboard/analytics"
                                className="pill-ghost px-4 py-2.5 text-xs font-black uppercase tracking-widest"
                            >
                                Analytics
                            </Link>
                            <Link
                                href="/dashboard/notifications"
                                className="pill-ghost relative px-4 py-2.5 text-xs font-black uppercase tracking-widest"
                            >
                                Inbox
                                {notificationCount > 0 ? (
                                    <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-white px-1.5 py-0.5 text-[10px] font-black text-black">
                                        {notificationCount > 99 ? '99+' : notificationCount}
                                    </span>
                                ) : null}
                            </Link>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {commandMetrics.map((metric) => (
                            <CommandMetric key={metric.label} metric={metric} />
                        ))}
                    </div>
                </div>
            </section>

            <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.65fr)]">
                <section className="dashboard-surface rounded-[1.75rem] p-5 md:p-6">
                    <SurfaceHeader
                        eyebrow="Now / next"
                        title="Upcoming + live"
                        action={<Link href="/dashboard/events" className="text-[12px] font-bold uppercase tracking-wide text-white/55 transition hover:text-white">View all</Link>}
                    />
                    <div className="mt-5 space-y-3">
                        {metricsLoading ? (
                            <div className="grid gap-3 md:grid-cols-2">
                                {[0, 1, 2, 3].map((item) => (
                                    <div key={item} className="h-[104px] animate-pulse rounded-[1.25rem] bg-white/[0.035]" />
                                ))}
                            </div>
                        ) : upcomingAndLiveEvents.length === 0 ? (
                            <EmptyPanel
                                title="No live or upcoming events yet."
                                body={isVendorDashboard ? 'Create or schedule an event to start filling this queue.' : 'Events you host will appear here once hosting is enabled.'}
                                href="/dashboard/events"
                                action="Open events"
                            />
                        ) : (
                            <div className="grid gap-3">
                                {upcomingAndLiveEvents.map((event) => (
                                    <EventPriorityRow key={event.id} event={event} />
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                <aside className="space-y-5">
                    <section className="dashboard-surface rounded-[1.75rem] p-5">
                        <SurfaceHeader eyebrow="Pulse" title="Performance" />
                        <div className="mt-4 space-y-4">
                            <StatRow
                                className="!rounded-[1.25rem] !p-3"
                                items={[
                                    { label: 'Revenue', value: metricsLoading ? '-' : summary.revenue },
                                    { label: 'Tickets', value: metricsLoading ? '-' : summary.sales.toLocaleString() },
                                    { label: 'Attendees', value: metricsLoading ? '-' : summary.attendees.toLocaleString() },
                                ]}
                            />
                            <div className="grid grid-cols-2 gap-3">
                                <MiniTrend label="Sales (30d)" points={summary.salesTrend} />
                                <MiniTrend label="Media (30d)" points={summary.mediaTrend} />
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    ['Active', summary.activeCount],
                                    ['Scheduled', summary.scheduledCount],
                                    ['Draft', summary.draftCount],
                                ].map(([label, value]) => (
                                    <div key={label} className="rounded-[1rem] bg-white/[0.035] px-3 py-3">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/35">{label}</p>
                                        <p className="mt-1 text-lg font-black text-white">{metricsLoading ? '-' : value}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    <section className="dashboard-surface rounded-[1.75rem] p-5">
                        <SurfaceHeader eyebrow="Attention" title="Urgent notices" />
                        <div className="mt-4 space-y-3">
                            {urgentQueue.length ? (
                                urgentQueue.map((notice) => <NoticeLink key={notice.id} notice={notice} />)
                            ) : (
                                <div className="rounded-[1.25rem] bg-white/[0.035] px-4 py-5">
                                    <p className="text-sm font-semibold text-white">No urgent notices.</p>
                                    <p className="mt-1 text-xs leading-5 text-zinc-500">Customer requests and event issues will surface here when they need review.</p>
                                </div>
                            )}
                        </div>
                    </section>
                </aside>
            </div>

            {isVendorDashboard ? (
                <section className="dashboard-surface rounded-[1.75rem] p-5 md:p-6">
                    <SurfaceHeader
                        eyebrow="Trend"
                        title="Revenue"
                        action={<span className="text-[12px] font-bold uppercase tracking-wide text-white/45">Last 30 days</span>}
                    />
                    <div className="mt-5 h-[220px] md:h-[260px]">
                        {metricsLoading ? (
                            <ChartSkeleton />
                        ) : !hasRevenueTrend ? (
                            <div className="flex h-full items-center justify-center rounded-2xl bg-white/[0.03]">
                                <p className="text-xs font-bold uppercase tracking-widest text-white/30">No revenue data yet</p>
                            </div>
                        ) : (
                            <RechartsChart>
                                {({ ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip }) => (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={revenueTrend} margin={{ top: 12, right: 12, left: -8, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="dashboardRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor={DASHBOARD_BRAND_COLOR} stopOpacity={0.38} />
                                                    <stop offset="100%" stopColor={DASHBOARD_BRAND_COLOR} stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                                            <XAxis
                                                dataKey="date"
                                                tickFormatter={formatDayTick}
                                                interval={revenueTrend.length > 8 ? Math.ceil(revenueTrend.length / 8) - 1 : 0}
                                                tick={{ fill: 'rgba(255,255,255,0.46)', fontSize: 11 }}
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <YAxis
                                                tickFormatter={formatRevenueTick}
                                                tick={{ fill: 'rgba(255,255,255,0.46)', fontSize: 11 }}
                                                axisLine={false}
                                                tickLine={false}
                                                width={56}
                                            />
                                            <Tooltip
                                                {...DASHBOARD_TOOLTIP_PROPS}
                                                labelFormatter={formatDayTick}
                                                formatter={(value) => [formatRevenueTick(value), 'Revenue']}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="value"
                                                name="Revenue"
                                                stroke={DASHBOARD_BRAND_COLOR}
                                                strokeWidth={2.2}
                                                fill="url(#dashboardRevenueGradient)"
                                                dot={false}
                                                activeDot={{ r: 4, fill: '#ffffff', stroke: '#09090b' }}
                                                isAnimationActive={false}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                )}
                            </RechartsChart>
                        )}
                    </div>
                </section>
            ) : null}

            <section className="dashboard-surface rounded-[1.75rem] p-5 md:p-6">
                <SurfaceHeader eyebrow="Updates" title="PXI updates" />
                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                    <div className="space-y-3">
                        <p className="px-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/35">Reminders</p>
                        {reminderUpdates.map((update) => (
                            <UpdateLink key={update.id} update={update} />
                        ))}
                    </div>
                    <div className="space-y-3">
                        <p className="px-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/35">Product + policy</p>
                        {productUpdates.map((update) => (
                            <UpdateLink key={update.id} update={update} />
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}

function CommandMetric({ metric }) {
    return (
        <div className="min-h-[92px] rounded-[1.25rem] bg-white/[0.045] p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/35">{metric.label}</p>
            <p className="mt-3 truncate text-2xl font-black text-white">{metric.value}</p>
        </div>
    );
}

function SurfaceHeader({ eyebrow, title, action = null }) {
    return (
        <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/35">{eyebrow}</p>
                <h2 className="mt-1 text-xl font-black tracking-normal text-white">{title}</h2>
            </div>
            {action ? <div className="shrink-0 pt-1">{action}</div> : null}
        </div>
    );
}

function EventPriorityRow({ event }) {
    return (
        <Link href={event.href} className="grid gap-4 rounded-[1.25rem] bg-white/[0.035] p-4 transition hover:bg-white/[0.055] md:grid-cols-[minmax(0,1fr)_220px_auto] md:items-center">
            <div className="min-w-0">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <h3 className="max-w-full truncate text-base font-black text-white">{event.name}</h3>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${event.statusClassName}`}>
                        {event.status}
                    </span>
                </div>
                <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-white/35">{event.dateLabel}</p>
            </div>
            <StatRow
                className="!rounded-[1rem] !p-3"
                items={[
                    { label: 'Revenue', value: event.revenueLabel },
                    { label: 'Tickets', value: event.ticketsSold.toLocaleString() },
                ]}
            />
            <span className="text-[11px] font-black uppercase tracking-widest text-white/50 md:text-right">Open</span>
        </Link>
    );
}

function EmptyPanel({ title, body, href, action }) {
    return (
        <div className="rounded-[1.25rem] bg-white/[0.035] px-4 py-7 text-center">
            <p className="text-sm font-semibold text-white">{title}</p>
            <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-zinc-500">{body}</p>
            <Link href={href} className="pill-ghost mt-4 px-4 py-2 text-xs font-bold uppercase tracking-widest whitespace-nowrap">
                {action}
            </Link>
        </div>
    );
}

function MiniTrend({ label, points }) {
    return (
        <div className="rounded-[1rem] bg-white/[0.035] p-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">{label}</p>
            <MicroChart points={points} color={BASE_CHART_COLOR} className="mt-2" />
        </div>
    );
}

function NoticeLink({ notice }) {
    return (
        <Link href={notice.href} className="block rounded-[1.25rem] bg-white/[0.035] p-4 transition hover:bg-white/[0.055]">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="truncate text-sm font-black text-white">{notice.title}</p>
                    <p className="mt-1 text-[11px] font-bold uppercase tracking-widest text-white/35">{notice.event}</p>
                    <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-white/50">{notice.detail}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${
                    notice.severity === 'high' ? 'bg-red-500/[0.08] text-red-400/80' : 'bg-white/[0.045] text-white/55'
                }`}>
                    {notice.severity}
                </span>
            </div>
            <p className="mt-3 text-[10px] font-black uppercase tracking-widest text-white/55">{notice.action}</p>
        </Link>
    );
}

function UpdateLink({ update }) {
    return (
        <Link
            href={update.href}
            className="block rounded-[1.25rem] bg-white/[0.035] p-4 transition hover:bg-white/[0.055]"
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
    );
}
