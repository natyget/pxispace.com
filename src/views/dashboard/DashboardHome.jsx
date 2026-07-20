'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/auth';
import { eventsService } from '../../services/events';
import { StatRow } from '@/components/dashboard/MetricCard';
import { RechartsChart, ChartSkeleton } from '@/components/dashboard/ChartFrame';
import { DASHBOARD_BRAND_COLOR, DASHBOARD_MUTED_COLOR, DASHBOARD_TOOLTIP_PROPS } from '@/components/dashboard/chartStyles';
import { isVendorUser } from '@/lib/accountTier';
import { useNotifications } from '@/lib/dashboardStore';
import { buildCommandCenterReminders } from '@/services/commandCenter';
import { helpRequestsService } from '@/services/helpRequests';
import { organizerAnalyticsService } from '@/services/organizerAnalytics';
import { api } from '../../services/api';

const DASHBOARD_RENDER_NOW = Date.now();

/** 'YYYY-MM-DD' -> 'Jun 7'. Falls back to the raw value for non-date labels. */
function formatDayTick(value) {
    if (!value) return '';
    const [y, m, d] = String(value).split('-').map(Number);
    if (!y || !m || !d) return String(value);
    const date = new Date(Date.UTC(y, m - 1, d));
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
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
    if (statusRaw === 'LIVE' || statusRaw === 'ACTIVE' || (startMs && startMs <= now && (!endMs || endMs >= now))) return 'Live';
    if (startMs > now) return 'Upcoming';
    return 'Draft';
}

/** Color-coded status dot — green live, amber upcoming, zinc otherwise. */
function stateDotClass(status) {
    if (status === 'Live') return 'bg-emerald-400';
    if (status === 'Upcoming') return 'bg-amber-400';
    return 'bg-zinc-500';
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
    const [announcements, setAnnouncements] = useState([]);
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

    useEffect(() => {
        if (!mounted) return;
        let cancelled = false;
        const timer = setTimeout(() => {
            api.get('/api/announcements')
                .then((data) => {
                    if (!cancelled) setAnnouncements((data?.announcements || []).slice(0, 5));
                })
                .catch(() => {
                    if (!cancelled) setAnnouncements([]);
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

        const rank = { Live: 0, Upcoming: 1, Draft: 2, Ended: 3 };
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
                    ticketsSold,
                    revenueLabel: formatMoney(revenue),
                    href: e.id ? `/dashboard/events/${e.id}` : '/dashboard/events',
                };
            });
        const sales = overview?.totals?.ticketsSold ?? events.reduce((sum, e) => sum + soldTicketsExcludingOrganizer(e?._count?.tickets ?? 0), 0);
        const attendees = overview?.totals?.attendees ?? 0;
        const activeCount = events.filter((event) => eventState(event, now) === 'Live').length;
        const scheduledCount = events.filter((event) => eventState(event, now) === 'Upcoming').length;
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
            },
        };
    }, [events, vendorData, overview]);

    const revenueTrend = useMemo(() => {
        const revenueByDay = overview?.last30d?.revenueByDay || [];
        return revenueByDay.map((d) => ({
            date: d.date,
            value: (d.netCents ?? d.grossCents ?? 0) / 100,
        }));
    }, [overview]);
    const ticketsTrend = useMemo(
        () => (overview?.last30d?.ticketsByDay || []).map((d) => ({ date: d.date, value: d.count || 0 })),
        [overview]
    );
    const hasRevenueTrend = revenueTrend.some((point) => point.value > 0);
    const hasTicketsTrend = ticketsTrend.some((point) => point.value > 0);

    const reminders = useMemo(
        () => buildCommandCenterReminders({ events, unreadCount: notificationCount, vendorDashboard: vendorData }),
        [events, notificationCount, vendorData]
    );
    const upcomingAndLiveEvents = useMemo(
        () => eventRows.filter((event) => event.status === 'Live' || event.status === 'Upcoming').slice(0, 4),
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
    const metricsLoading = vendorLoading || eventsLoading || overviewLoading;
    const isVendorDashboard = mounted && authReady && !authRefreshing && isVendorUser(user);
    const dashboardHero = isVendorDashboard
        ? {
              eyebrow: 'Command center',
              title: 'Run the room',
              copy: 'Live work, the next events, and the money — one read, no repeats.',
          }
        : {
              eyebrow: 'Workspace',
              title: 'Your PXI',
              copy: 'Tickets, notifications, hosted events, and account tools in one clean place.',
          };
    const commandMetrics = isVendorDashboard
        ? [
              { label: 'Net revenue', value: metricsLoading ? '-' : summary.revenue },
              { label: 'Tickets', value: metricsLoading ? '-' : summary.sales.toLocaleString() },
              { label: 'Attendees', value: metricsLoading ? '-' : summary.attendees.toLocaleString() },
              { label: 'Live now', value: metricsLoading ? '-' : summary.activeCount },
          ]
        : [
              { label: 'Hosted', value: metricsLoading ? '-' : events.length.toLocaleString() },
              { label: 'Unread', value: notificationCount > 99 ? '99+' : notificationCount.toLocaleString() },
              { label: 'Upcoming', value: metricsLoading ? '-' : summary.scheduledCount },
              { label: 'Drafts', value: metricsLoading ? '-' : summary.draftCount },
          ];

    if (!mounted) {
        return <div className="mx-auto max-w-7xl space-y-8" />;
    }

    return (
        <div className="mx-auto max-w-7xl space-y-5 md:space-y-6">
            <section className="px-1">
                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,480px)] xl:items-end">
                    <div className="min-w-0">
                        <p className="text-[13px] font-medium text-zinc-500">{dashboardHero.eyebrow}</p>
                        <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-white md:text-[28px]">{dashboardHero.title}</h1>
                        <p className="mt-1.5 max-w-2xl text-sm leading-6 text-zinc-500">{dashboardHero.copy}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[1.25rem] bg-white/[0.06] ring-1 ring-white/[0.07] sm:grid-cols-4">
                        {commandMetrics.map((metric) => (
                            <div key={metric.label} className="bg-[#0e0e13] px-4 py-3.5">
                                <p className="text-[12px] font-medium text-zinc-500">{metric.label}</p>
                                <p className="mt-1.5 truncate text-[22px] font-semibold leading-none tracking-tight text-white">{metric.value}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {isVendorDashboard ? (
                <div className="grid gap-5 lg:grid-cols-2">
                    <TrendChartCard
                        title="Revenue"
                        subtitle="Net per day, last 30 days"
                        data={revenueTrend}
                        hasData={hasRevenueTrend}
                        loading={metricsLoading}
                        color={DASHBOARD_BRAND_COLOR}
                        valueFormatter={formatRevenueTick}
                        gradientId="commandRevenueGradient"
                    />
                    <TrendChartCard
                        title="Tickets"
                        subtitle="Sold per day, last 30 days"
                        data={ticketsTrend}
                        hasData={hasTicketsTrend}
                        loading={metricsLoading}
                        color={DASHBOARD_MUTED_COLOR}
                        valueFormatter={(value) => Number(value || 0).toLocaleString('en-US')}
                        gradientId="commandTicketsGradient"
                    />
                </div>
            ) : null}

            <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.65fr)]">
                <section className="dashboard-surface rounded-[1.25rem] p-5 md:p-6">
                    <SurfaceHeader
                        eyebrow="Now / next"
                        title="Upcoming + live"
                        action={<Link href="/dashboard/events" className="text-[12px] font-bold tracking-wide text-white/55 transition hover:text-white">View all</Link>}
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
                    <section className="dashboard-surface rounded-[1.25rem] p-5">
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

                    {reminders.length ? (
                        <section className="dashboard-surface rounded-[1.25rem] p-5">
                            <SurfaceHeader eyebrow="Follow-ups" title="Reminders" />
                            <div className="mt-4 space-y-3">
                                {reminders.map((update) => (
                                    <UpdateLink key={update.id} update={update} />
                                ))}
                            </div>
                        </section>
                    ) : null}
                </aside>
            </div>

            {announcements.length ? (
                <section className="space-y-3" aria-label="Announcements">
                    {announcements.map((announcement) => (
                        <AnnouncementBanner key={announcement.id} announcement={announcement} />
                    ))}
                </section>
            ) : null}
        </div>
    );
}

/** Full-width admin-authored banner — Command Center footer. */
function AnnouncementBanner({ announcement }) {
    const hasCta = Boolean(
        announcement.ctaLabel
        && announcement.ctaHref
        && announcement.ctaHref.startsWith('/')
        && !announcement.ctaHref.startsWith('//')
    );
    return (
        <div className="dashboard-surface relative overflow-hidden rounded-[1.25rem] p-5">
            <span className="absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b from-[#d84aff]/70 via-[#d84aff]/35 to-transparent" aria-hidden="true" />
            <div className="flex flex-col gap-3 pl-2 md:flex-row md:items-center md:justify-between md:gap-6">
                <div className="min-w-0">
                    <p className="text-sm font-bold text-white">{announcement.title}</p>
                    <p className="mt-1 text-sm leading-6 text-zinc-400">{announcement.body}</p>
                </div>
                {hasCta ? (
                    <Link
                        href={announcement.ctaHref}
                        className="shrink-0 self-start whitespace-nowrap rounded-full bg-[#d84aff]/10 px-4 py-2 text-[12px] font-bold tracking-[0.02em] text-[#e08bff] ring-1 ring-[#d84aff]/25 transition hover:bg-[#d84aff]/20 hover:text-white md:self-center"
                    >
                        {announcement.ctaLabel}
                    </Link>
                ) : null}
            </div>
        </div>
    );
}

function TrendChartCard({ title, subtitle, data, hasData, loading, color, valueFormatter, gradientId }) {
    return (
        <section className="dashboard-surface rounded-[1.25rem] p-5 md:p-6">
            <SurfaceHeader eyebrow={subtitle} title={title} />
            <div className="mt-4 h-[200px] md:h-[230px]">
                {loading ? (
                    <ChartSkeleton />
                ) : !hasData ? (
                    <div className="flex h-full items-center justify-center rounded-2xl bg-white/[0.03]">
                        <p className="text-xs font-bold tracking-[0.02em] text-white/30">No data yet</p>
                    </div>
                ) : (
                    <RechartsChart>
                        {({ ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip }) => (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data} margin={{ top: 12, right: 12, left: -8, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor={color} stopOpacity={0.34} />
                                            <stop offset="100%" stopColor={color} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={formatDayTick}
                                        interval={data.length > 8 ? Math.ceil(data.length / 8) - 1 : 0}
                                        tick={{ fill: 'rgba(255,255,255,0.46)', fontSize: 11 }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        tickFormatter={valueFormatter}
                                        tick={{ fill: 'rgba(255,255,255,0.46)', fontSize: 11 }}
                                        axisLine={false}
                                        tickLine={false}
                                        width={56}
                                        allowDecimals={false}
                                    />
                                    <Tooltip
                                        {...DASHBOARD_TOOLTIP_PROPS}
                                        labelFormatter={formatDayTick}
                                        formatter={(value) => [valueFormatter(value), title]}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="value"
                                        name={title}
                                        stroke={color}
                                        strokeWidth={2.2}
                                        fill={`url(#${gradientId})`}
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
    );
}

function SurfaceHeader({ eyebrow, title, action = null }) {
    return (
        <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
                <p className="text-[12px] font-medium text-zinc-500">{eyebrow}</p>
                <h2 className="mt-1 text-[17px] font-semibold tracking-tight text-white">{title}</h2>
            </div>
            {action ? <div className="shrink-0 pt-1">{action}</div> : null}
        </div>
    );
}

function EventPriorityRow({ event }) {
    return (
        <Link href={event.href} className="grid gap-4 rounded-[1.25rem] bg-white/[0.035] p-4 transition hover:bg-white/[0.055] md:grid-cols-[minmax(0,1fr)_220px] md:items-center">
            <div className="min-w-0">
                <div className="flex min-w-0 items-center gap-2.5">
                    <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${stateDotClass(event.status)}`} aria-hidden="true" />
                    <h3 className="max-w-full truncate text-base font-bold text-white">{event.name}</h3>
                    <span className="sr-only">{event.status}</span>
                </div>
                <p className="mt-1 text-xs font-semibold tracking-[0.02em] text-white/35">{event.dateLabel}</p>
            </div>
            <StatRow
                className="!rounded-[1rem] !p-3"
                items={[
                    { label: 'Revenue', value: event.revenueLabel },
                    { label: 'Tickets', value: event.ticketsSold.toLocaleString() },
                ]}
            />
        </Link>
    );
}

function EmptyPanel({ title, body, href, action }) {
    return (
        <div className="rounded-[1.25rem] bg-white/[0.035] px-4 py-7 text-center">
            <p className="text-sm font-semibold text-white">{title}</p>
            <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-zinc-500">{body}</p>
            <Link href={href} className="pill-ghost mt-4 px-4 py-2 text-xs font-bold tracking-[0.02em] whitespace-nowrap">
                {action}
            </Link>
        </div>
    );
}

function NoticeLink({ notice }) {
    return (
        <Link href={notice.href} className="block rounded-[1.25rem] bg-white/[0.035] p-4 transition hover:bg-white/[0.055]">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-white">{notice.title}</p>
                    <p className="mt-1 text-[11px] font-bold tracking-[0.02em] text-white/35">{notice.event}</p>
                    <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-white/50">{notice.detail}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium tracking-[0.02em] ${
                    notice.severity === 'high' ? 'bg-red-500/[0.08] text-red-400/80' : 'bg-white/[0.045] text-white/55'
                }`}>
                    {notice.severity}
                </span>
            </div>
            <p className="mt-3 text-[11px] font-medium tracking-[0.02em] text-white/55">{notice.action}</p>
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
                <span className="shrink-0 text-[11px] font-medium tracking-[0.02em] text-white/45 whitespace-nowrap">
                    {update.action}
                </span>
            </div>
        </Link>
    );
}
