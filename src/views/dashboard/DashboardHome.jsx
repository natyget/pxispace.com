'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { HugeiconsIcon } from '@hugeicons/react';
import { FloorPlanIcon, Image01Icon, PlusSignIcon, UserGroupIcon } from '@hugeicons/core-free-icons';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/auth';
import { eventsService } from '../../services/events';
import { RechartsChart, ChartSkeleton } from '@/components/dashboard/ChartFrame';
import { DASHBOARD_BRAND_COLOR, DASHBOARD_MUTED_COLOR, DASHBOARD_TOOLTIP_PROPS } from '@/components/dashboard/chartStyles';
import { usePageAction } from '@/components/dashboard/shell/usePageAction';
import EventCard from '@/components/dashboard/hub/EventCard';
import MemberCommandCenter from './MemberCommandCenter';
import { isVendorUser } from '@/lib/accountTier';
import { useNotifications } from '@/lib/dashboardStore';
import { organizerAnalyticsService } from '@/services/organizerAnalytics';
import { listFloorPlans } from '@/services/floorPlans';
import { floorPlanAccess } from '@/lib/floorPlanAccess';
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

/** Signed variant for the ledger, where net profit can be negative. */
function formatCents(cents = 0) {
    const dollars = Math.round(Math.abs(cents) / 100).toLocaleString(undefined, { maximumFractionDigits: 0 });
    return `${cents < 0 ? '-' : ''}$${dollars}`;
}

function coverImageUrl(value) {
    const raw = typeof value === 'string' ? value.trim() : '';
    return raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('data:image/') ? raw : null;
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

/**
 * The Command Center splits on ACCESS TIER (not passport level): Diplomats get
 * the operations desk below, Partials and Citizens get the ladder + vendor-setup
 * pitch. Splitting at the top also keeps the organizer-only fetches from firing
 * for people who'd only get 403s back.
 */
export default function DashboardHome() {
    const { user, authReady, authRefreshing } = useAuth();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const frame = requestAnimationFrame(() => setMounted(true));
        return () => cancelAnimationFrame(frame);
    }, []);

    if (!mounted || !authReady || authRefreshing) {
        return <div className="mx-auto max-w-7xl space-y-8" />;
    }
    if (!isVendorUser(user)) {
        return <MemberCommandCenter user={user} />;
    }
    return <VendorCommandCenter />;
}

function VendorCommandCenter() {
    const { user } = useAuth();
    const [mounted, setMounted] = useState(false);
    const [vendorData, setVendorData] = useState(null);
    const [vendorLoading, setVendorLoading] = useState(false);
    const [events, setEvents] = useState([]);
    const [eventsLoading, setEventsLoading] = useState(false);
    const [overview, setOverview] = useState(null);
    const [overviewLoading, setOverviewLoading] = useState(false);
    const [announcements, setAnnouncements] = useState([]);
    const { unreadCount: notificationCount } = useNotifications(50);
    const createAction = useMemo(
        () => (
            <Link href="/dashboard/events/new" className="pill-ghost inline-flex min-h-[42px] items-center gap-2 px-5 text-sm font-bold">
                <HugeiconsIcon icon={PlusSignIcon} size={15} />
                Create event
            </Link>
        ),
        []
    );
    usePageAction(createAction);

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
        // Per-event rows show GROSS revenue — ticket face value, matching Earnings.
        // Face value is payout + the $0.99 taken off it; `grossAmount` on the row is
        // the buyer's card charge (face + service + processing) and is not revenue.
        const totalGross = overview?.totals?.grossCents ?? vendorData?.aggregates?.grossRevenue ?? 0;
        const totalTickets = events.reduce((sum, e) => sum + soldTicketsExcludingOrganizer(e?._count?.tickets), 0);
        const revenueByKey = new Map();

        for (const payment of vendorData?.payments ?? []) {
            const amount = (payment.netPayout ?? 0) + (payment.vendorFlatFee ?? 0);
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
                // `ticketPrice` is whole USD; every other figure here is cents.
                const ticketPriceRevenue = Number.isFinite(Number(e.ticketPrice))
                    ? Math.round(Number(e.ticketPrice) * 100) * ticketsSold
                    : null;
                const proportionalRevenue = totalTickets > 0 ? Math.round(totalGross * (ticketsSold / totalTickets)) : 0;
                const revenue = directRevenue ?? ticketPriceRevenue ?? proportionalRevenue;

                return {
                    id: e.id,
                    name: e.name || 'Untitled event',
                    cover: coverImageUrl(e.coverImage),
                    venue: e.location || e.venue || '',
                    dateLabel: formatEventDate(e.startDate),
                    status,
                    ticketsSold,
                    revenueLabel: formatMoney(revenue),
                    href: e.id ? `/dashboard/events/${e.id}` : '/dashboard/events',
                };
            });
        const sales = overview?.totals?.ticketsSold ?? events.reduce((sum, e) => sum + soldTicketsExcludingOrganizer(e?._count?.tickets ?? 0), 0);
        const attendees = overview?.totals?.attendees ?? 0;
        const scanned = overview?.totals?.ticketsScanned ?? 0;
        const activeCount = events.filter((event) => eventState(event, now) === 'Live').length;
        const scheduledCount = events.filter((event) => eventState(event, now) === 'Upcoming').length;
        const draftCount = events.filter((event) => eventState(event, now) === 'Draft').length;

        return {
            eventRows: rows,
            summary: {
                revenue: formatMoney(totalEarnings),
                sales,
                attendees,
                scanned,
                // Turnout = scanned at the door / sold. The one headline number no
                // other ticketing dashboard can produce honestly, because everyone
                // else infers attendance from a check-in app staff skip at the door.
                turnout: sales > 0 ? Math.round((scanned / sales) * 100) : null,
                mediaCount: overview?.totals?.mediaCount ?? 0,
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

    const upcomingAndLiveEvents = useMemo(
        () => eventRows.filter((event) => event.status === 'Live' || event.status === 'Upcoming').slice(0, 4),
        [eventRows]
    );
    // Key metrics ledger: the same vendor dashboard figures Earnings uses, no new fetches.
    const ledgerRows = useMemo(() => {
        const aggregates = vendorData?.aggregates ?? {};
        const costs = vendorData?.costs?.totalCents ?? 0;
        const marketing = vendorData?.marketing?.cashCents ?? 0;
        const netPayout = aggregates.netPayout ?? 0;
        return [
            { label: 'Gross revenue', note: 'Ticket face value sold', value: formatCents(aggregates.grossRevenue ?? 0) },
            { label: 'Platform fee', note: '$0.99 per ticket', value: formatCents(aggregates.vendorFlatFeeTotal ?? 0) },
            { label: 'Net payout', note: 'Transferred to you by Stripe', value: formatCents(netPayout) },
            { label: 'Event costs', note: 'Expenses you logged per event', value: formatCents(costs) },
            { label: 'Marketing spend', note: 'Cash spent on ads and campaigns', value: formatCents(marketing) },
            { label: 'Net profit', note: 'Payout minus costs and cash marketing', value: formatCents(netPayout - costs - marketing) },
        ];
    }, [vendorData]);
    // Notices are only real problems on live data. Nothing is invented to fill the card.
    const notices = useMemo(() => {
        const now = DASHBOARD_RENDER_NOW;
        const upcoming = events.filter((event) => ['Live', 'Upcoming'].includes(eventState(event, now)));
        const items = [];
        const unclearedPayouts = (vendorData?.payouts ?? []).filter((payout) => String(payout?.status || '').toLowerCase() !== 'paid').length;
        if (unclearedPayouts > 0) {
            items.push({
                id: 'payouts',
                title: 'Payouts did not clear',
                detail: `${unclearedPayouts} payout${unclearedPayouts === 1 ? '' : 's'} to review`,
                href: '/dashboard/earnings',
            });
        }
        if (notificationCount > 0) {
            items.push({
                id: 'unread',
                title: 'Unread notifications',
                detail: `${notificationCount} waiting in your inbox`,
                href: '/dashboard/notifications',
            });
        }
        const noCover = upcoming.filter((event) => !coverImageUrl(event.coverImage));
        if (noCover.length) {
            items.push({
                id: 'cover',
                title: 'Missing cover image',
                detail: `${noCover.length} upcoming event${noCover.length === 1 ? '' : 's'} without a poster`,
                href: noCover[0].id ? `/dashboard/events/${noCover[0].id}` : '/dashboard/events',
            });
        }
        const noTickets = upcoming.filter((event) => event.ticketPrice == null && !event.ticketTiersJson);
        if (noTickets.length) {
            items.push({
                id: 'tickets',
                title: 'No tickets set up',
                detail: `${noTickets.length} upcoming event${noTickets.length === 1 ? '' : 's'} cannot sell yet`,
                href: noTickets[0].id ? `/dashboard/events/${noTickets[0].id}` : '/dashboard/events',
            });
        }
        return items;
    }, [events, vendorData, notificationCount]);
    const metricsLoading = vendorLoading || eventsLoading || overviewLoading;
    // Tier 1 — "am I making money". This strip is the comparison an organizer is
    // actually running against Eventbrite/Posh, so it leads and stays money-first.
    // Turnout is the exception: it's the first number here they can't get anywhere
    // else. See docs/DASHBOARD_POSITIONING.md.
    const commandMetrics = [
        { label: 'Net revenue', value: metricsLoading ? '-' : summary.revenue },
        { label: 'Tickets sold', value: metricsLoading ? '-' : summary.sales.toLocaleString() },
        {
            label: 'Turnout',
            value: metricsLoading ? '-' : summary.turnout == null ? '-' : `${summary.turnout}%`,
        },
        { label: 'Live now', value: metricsLoading ? '-' : summary.activeCount },
    ];

    if (!mounted) {
        return <div className="mx-auto max-w-7xl space-y-8" />;
    }

    return (
        <div className="mx-auto max-w-7xl space-y-5 md:space-y-6">
            <section className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                <h1 className="text-2xl font-semibold text-white md:text-[28px]">Command Center</h1>
                <div className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl bg-white/[0.08] sm:grid-cols-4 xl:w-[560px]">
                    {commandMetrics.map((metric) => (
                        <div key={metric.label} className="min-w-0 bg-pxi-surface px-4 py-3.5">
                            <p className="text-xs text-zinc-500">{metric.label}</p>
                            <p className="mt-1.5 truncate text-[22px] font-semibold leading-none tracking-tight text-white">{metric.value}</p>
                        </div>
                    ))}
                </div>
            </section>

            <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
                <div className="min-w-0 space-y-5">
                    <div className="grid gap-5 md:grid-cols-2">
                        <TrendChartCard
                            title="Revenue"
                            subtitle="Ticket sales per day, last 30 days"
                            emptyLine="Earnings show here after your first sale."
                            data={revenueTrend}
                            hasData={hasRevenueTrend}
                            loading={metricsLoading}
                            color={DASHBOARD_BRAND_COLOR}
                            valueFormatter={formatRevenueTick}
                            gradientId="commandRevenueGradient"
                        />
                        <TrendChartCard
                            title="Tickets sold"
                            subtitle="Sold per day, last 30 days"
                            emptyLine="Ticket sales show here after your first sale."
                            data={ticketsTrend}
                            hasData={hasTicketsTrend}
                            loading={metricsLoading}
                            color={DASHBOARD_MUTED_COLOR}
                            valueFormatter={(value) => Number(value || 0).toLocaleString('en-US')}
                            gradientId="commandTicketsGradient"
                        />
                    </div>

                    <section className="dashboard-surface min-w-0 rounded-3xl p-5 md:p-6">
                        <CardHeader
                            title="Live and upcoming"
                            action={<Link href="/dashboard/events" className="text-xs font-bold text-white/55 transition hover:text-white">View all</Link>}
                        />
                        <div className="mt-5">
                            {metricsLoading ? (
                                <div className="grid gap-3 md:grid-cols-2">
                                    {[0, 1].map((item) => (
                                        <div key={item} className="h-[240px] animate-pulse rounded-[1.25rem] bg-pxi-field" />
                                    ))}
                                </div>
                            ) : upcomingAndLiveEvents.length === 0 ? (
                                <EmptyPanel
                                    title="No live or upcoming events"
                                    body="Create an event to see it here."
                                    href="/dashboard/events/new"
                                    action="Create event"
                                />
                            ) : (
                                <div className="flex gap-3 overflow-x-auto pb-1 md:grid md:grid-cols-2 md:overflow-visible xl:grid-cols-3">
                                    {upcomingAndLiveEvents.map((event) => (
                                        <EventCard key={event.id} event={event} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>

                    <MoatBand summary={summary} loading={metricsLoading} />
                </div>

                <aside className="min-w-0 space-y-5">
                    <section className="dashboard-surface rounded-3xl p-5 md:p-6">
                        <CardHeader title="Key metrics" />
                        <div className="mt-4 divide-y divide-white/[0.08]">
                            {ledgerRows.map((row) => (
                                <LedgerRow key={row.label} label={row.label} note={row.note} value={row.value} loading={metricsLoading} />
                            ))}
                        </div>
                    </section>

                    <section className="dashboard-surface rounded-3xl p-5 md:p-6">
                        <CardHeader title="Notices" />
                        <div className="mt-4 space-y-3">
                            {notices.length ? (
                                notices.map((notice) => <NoticeRow key={notice.id} notice={notice} />)
                            ) : (
                                <p className="text-sm text-zinc-500">Nothing needs you right now.</p>
                            )}
                        </div>
                    </section>
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

/**
 * Tier 3 — the moat. Deliberately BELOW the money and the queue: an organizer
 * comparing us to Eventbrite reads the top of this page first, and if it opened
 * with heat maps and face-tagging they'd file PXI as a social app and leave.
 * It is not hidden, though — an organizer who has never seen a venue heat map
 * will never go looking for one in a nav menu, so it gets named here with a
 * live number attached. See docs/DASHBOARD_POSITIONING.md.
 */
function MoatBand({ summary, loading }) {
    // PART-3: the Venues page is for venue accounts. Everyone else is sent to the heat map itself, which
    // draws on a map of the area when an event has no floor plan.
    const [venuesOffered, setVenuesOffered] = useState(false);
    useEffect(() => {
        let alive = true;
        listFloorPlans()
            .then((res) => { if (alive) setVenuesOffered(floorPlanAccess(res).canOpen); })
            .catch(() => {});
        return () => { alive = false; };
    }, []);

    const items = [
        {
            icon: FloorPlanIcon,
            title: 'Where the room was alive',
            stat: loading ? '-' : summary.turnout == null ? 'Awaiting first scan' : `${summary.turnout}% turnout verified`,
            body: venuesOffered
                ? 'Photo capture points across the night, projected onto your floor plan. No other ticketing platform can draw this.'
                : 'Photo capture points across the night, drawn on a map of the venue. No other ticketing platform can draw this.',
            href: venuesOffered ? '/dashboard/floor-plans' : '/dashboard/analytics',
            action: venuesOffered ? 'Open venues' : 'See the heat map',
        },
        {
            icon: Image01Icon,
            title: 'Your crowd shot your marketing',
            stat: loading ? '-' : `${summary.mediaCount.toLocaleString()} moments captured`,
            body: 'Every album photo ranked by reaction. Pull a marketing kit instead of booking a photographer.',
            href: '/dashboard/analytics',
            action: 'See top moments',
        },
        {
            icon: UserGroupIcon,
            title: 'Guests you can prove came',
            stat: loading ? '-' : `${summary.attendees.toLocaleString()} verified attendees`,
            body: 'Scanned at the door, not self-reported. Segment by city, taste, and attendance history, then send.',
            href: '/dashboard/audience',
            action: 'Open CRM',
        },
    ];

    return (
        <section className="dashboard-surface rounded-3xl p-5 md:p-6">
            <CardHeader title="Only on PXI" />
            <div className="mt-5 grid gap-3 lg:grid-cols-3">
                {items.map((item) => (
                    <Link
                        key={item.title}
                        href={item.href}
                        className="group flex flex-col rounded-3xl bg-pxi-field p-4 transition hover:bg-[#3a3a3a]"
                    >
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#3a3a3a]">
                            <HugeiconsIcon icon={item.icon} size={17} className="text-white opacity-60" />
                        </div>
                        <p className="mt-3.5 text-sm font-bold text-white">{item.title}</p>
                        <p className="mt-1.5 text-[13px] font-bold tabular-nums text-white">{item.stat}</p>
                        <p className="mt-1.5 flex-1 text-xs leading-5 text-[#9a9a9a]">{item.body}</p>
                        <p className="mt-3 text-[11px] font-bold tracking-[0.02em] text-white/45 transition group-hover:text-white/75">
                            {item.action}
                        </p>
                    </Link>
                ))}
            </div>
        </section>
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
        <div className="dashboard-surface relative overflow-hidden rounded-3xl p-5">
            <span className="absolute inset-y-0 left-0 w-[3px] bg-pxi-purple" aria-hidden="true" />
            <div className="flex flex-col gap-3 pl-2 md:flex-row md:items-center md:justify-between md:gap-6">
                <div className="min-w-0">
                    <p className="text-sm font-bold text-white">{announcement.title}</p>
                    <p className="mt-1 text-sm leading-6 text-[#9a9a9a]">{announcement.body}</p>
                </div>
                {hasCta ? (
                    <Link
                        href={announcement.ctaHref}
                        className="shrink-0 self-start whitespace-nowrap rounded-full bg-pxi-purple px-5 py-2.5 text-[12px] font-black uppercase tracking-[0.08em] text-white transition hover:brightness-110 md:self-center"
                    >
                        {announcement.ctaLabel}
                    </Link>
                ) : null}
            </div>
        </div>
    );
}

function CardHeader({ title, subtitle, action }) {
    return (
        <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
                <h2 className="text-base font-semibold text-white">{title}</h2>
                {subtitle ? <p className="mt-1 text-xs text-zinc-500">{subtitle}</p> : null}
            </div>
            {action}
        </div>
    );
}

function TrendChartCard({ title, subtitle, emptyLine, data, hasData, loading, color, valueFormatter, gradientId }) {
    return (
        <section className="dashboard-surface min-w-0 rounded-3xl p-5 md:p-6">
            <CardHeader title={title} subtitle={subtitle} />
            <div className="mt-4 h-[200px] md:h-[230px]">
                {loading ? (
                    <ChartSkeleton />
                ) : !hasData ? (
                    <div className="flex h-full flex-col items-center justify-center rounded-2xl bg-pxi-field px-4 text-center">
                        <p className="text-sm font-semibold text-white">No sales yet</p>
                        <p className="mt-1 text-xs text-zinc-500">{emptyLine}</p>
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
                                        activeDot={{ r: 4, fill: '#ffffff', stroke: '#1c1c1c' }}
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

function LedgerRow({ label, note, value, loading }) {
    return (
        <div className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
            <div className="min-w-0">
                <p className="text-sm font-semibold text-white">{label}</p>
                <p className="mt-0.5 text-xs text-zinc-500">{note}</p>
            </div>
            <p className="shrink-0 text-sm font-semibold tabular-nums text-white">{loading ? '-' : value}</p>
        </div>
    );
}

function EmptyPanel({ title, body, href, action }) {
    return (
        <div className="rounded-[1rem] bg-pxi-field px-4 py-7 text-center">
            <p className="text-sm font-semibold text-white">{title}</p>
            <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-[#9a9a9a]">{body}</p>
            <Link href={href} className="pill-ghost mt-4 px-4 py-2 text-xs font-bold tracking-[0.02em] whitespace-nowrap">
                {action}
            </Link>
        </div>
    );
}

function NoticeRow({ notice }) {
    return (
        <Link href={notice.href} className="block rounded-[1rem] bg-pxi-field p-3.5 transition hover:bg-[#3a3a3a]">
            <p className="text-sm font-semibold text-white">{notice.title}</p>
            <p className="mt-0.5 text-xs text-zinc-500">{notice.detail}</p>
        </Link>
    );
}
