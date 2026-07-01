'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { HugeiconsIcon } from '@hugeicons/react';
import {
    Ticket01Icon,
    Calendar01Icon,
    Activity01Icon,
    ArrowRight02Icon,
    StarIcon,
    Notification03Icon,
} from '@hugeicons/core-free-icons';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/auth';
import { eventsService } from '../../services/events';
import { getNotifications } from '../../services/notifications';
import SectionCard from '@/components/dashboard/SectionCard';
import CommandCenterNotifications from '@/components/dashboard/CommandCenterNotifications';

function CompactMetric({ label, value, detail }) {
    return (
        <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 whitespace-nowrap">{label}</p>
            <p className="mt-1 text-xl font-black text-white truncate">{value}</p>
            {detail ? <p className="mt-0.5 text-xs text-zinc-500 truncate">{detail}</p> : null}
        </div>
    );
}

export default function DashboardHome() {
    const { user } = useAuth();
    const [mounted, setMounted] = useState(false);
    const [vendorData, setVendorData] = useState(null);
    const [vendorLoading, setVendorLoading] = useState(false);
    const [events, setEvents] = useState([]);
    const [eventsLoading, setEventsLoading] = useState(false);
    const [notificationCount, setNotificationCount] = useState(0);

    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        if (!mounted || !user?.id) return;
        getNotifications(user.id, 50)
            .then((res) => setNotificationCount(res.unreadCount ?? res.notifications?.filter((n) => !n.read)?.length ?? 0))
            .catch(() => setNotificationCount(0));
    }, [mounted, user?.id]);

    useEffect(() => {
        if (!mounted) return;
        setEventsLoading(true);
        eventsService
            .getMyEvents({ limit: 100, offset: 0 })
            .then((res) => setEvents(res.events || []))
            .catch(() => setEvents([]))
            .finally(() => setEventsLoading(false));
    }, [mounted]);

    useEffect(() => {
        if (!user?.isVendor) return;
        setVendorLoading(true);
        authService
            .getVendorDashboard()
            .then(setVendorData)
            .catch(() => {})
            .finally(() => setVendorLoading(false));
    }, [user?.isVendor]);

    const totalEarnings = vendorData?.aggregates?.netPayout ?? 0;
    const now = Date.now();
    const soldTicketsExcludingOrganizer = (count) => Math.max(0, (count ?? 0) - 1);
    const eventRows = events.slice(0, 8).map((e) => {
        const startMs = e.startDate ? new Date(e.startDate).getTime() : 0;
        const endMs = e.endDate ? new Date(e.endDate).getTime() : 0;
        const statusRaw = String(e.status || '').toUpperCase();
        let status = 'Draft';
        if (statusRaw === 'ARCHIVED' || (endMs && endMs < now)) status = 'Ended';
        else if (statusRaw === 'LIVE' || (startMs && startMs <= now && (!endMs || endMs >= now))) status = 'Active';
        else if (startMs > now) status = 'Scheduled';
        const ticketsSold = soldTicketsExcludingOrganizer(e?._count?.tickets ?? 0);
        const hype = Math.max(0, Math.min(100, Math.round(Math.min(100, ticketsSold * 8))));
        return {
            id: e.id,
            name: e.name || 'Untitled event',
            date: e.startDate,
            status,
            ticketsSold,
            hype,
        };
    });
    const salesCount = events.reduce((sum, e) => sum + soldTicketsExcludingOrganizer(e?._count?.tickets ?? 0), 0);
    const avgHype = eventRows.length
        ? Math.round(eventRows.reduce((sum, e) => sum + (e.hype ?? 0), 0) / eventRows.length)
        : 0;
    const metricsLoading = vendorLoading || eventsLoading;

    if (!mounted) {
        return <div className="max-w-6xl mx-auto space-y-12" />;
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Command Center</h1>
                <Link
                    href="/dashboard/notifications"
                    className="relative inline-flex items-center gap-2 rounded-full bg-white/[0.06] px-4 py-2 text-xs font-bold uppercase tracking-widest text-white/70 transition hover:bg-white/10 hover:text-white"
                >
                    <HugeiconsIcon icon={Notification03Icon} size={16} />
                    <span className="whitespace-nowrap">Notifications</span>
                    {notificationCount > 0 ? (
                        <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-pxi-purple px-1 text-[10px] font-black text-white">
                            {notificationCount > 99 ? '99+' : notificationCount}
                        </span>
                    ) : null}
                </Link>
            </div>

            {mounted && !user?.isVendor && (
                <div className="glow-surface relative overflow-hidden rounded-2xl p-6">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-pxi-purple/10 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                    <div className="relative">
                        <div className="flex items-center gap-2 mb-1">
                            <HugeiconsIcon icon={StarIcon} size={14} className="text-pxi-purple" />
                            <span className="text-pxi-purple text-xs font-bold uppercase tracking-widest whitespace-nowrap">
                                Become an Organizer
                            </span>
                        </div>
                        <h2 className="text-white font-black text-xl mt-2 mb-2">Unlock your PXI Passport</h2>
                        <Link
                            href="/dashboard/vendor-upgrade"
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-pxi-purple text-white font-bold text-sm uppercase tracking-widest shadow-[0_0_24px_rgba(216,74,255,0.3)] hover:brightness-110 transition-all"
                        >
                            Vendor Setup
                            <HugeiconsIcon icon={ArrowRight02Icon} size={14} />
                        </Link>
                    </div>
                </div>
            )}

            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
                <div className="glow-surface rounded-2xl p-5">
                    <div className="grid grid-cols-2 gap-6">
                        <CompactMetric
                            label="Money Made"
                            value={metricsLoading ? '—' : `$${(totalEarnings / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                            detail="Net payout"
                        />
                        <CompactMetric
                            label="Tickets Sold"
                            value={metricsLoading ? '—' : salesCount.toLocaleString()}
                            detail={`${events.length} events`}
                        />
                    </div>
                </div>
                <div className="glow-surface rounded-2xl p-5">
                    <div className="flex items-center justify-between gap-4">
                        <CompactMetric
                            label="Hype Index"
                            value={metricsLoading ? '—' : `${avgHype}`}
                            detail="Avg across events"
                        />
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-pxi-purple/15">
                            <HugeiconsIcon icon={Activity01Icon} size={20} className="text-pxi-purple" />
                        </div>
                    </div>
                    <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
                        <div
                            className="h-full rounded-full bg-pxi-purple transition-all duration-500"
                            style={{ width: `${avgHype}%` }}
                        />
                    </div>
                </div>
            </motion.div>

            <CommandCenterNotifications />

            <SectionCard
                title="Active Events"
                source="Derived"
                actions={(
                    <Link href="/dashboard/events" className="text-[12px] font-bold tracking-wide text-white/60 hover:text-white transition-colors uppercase whitespace-nowrap">
                        View all
                    </Link>
                )}
            >
                <div className="overflow-x-auto -mx-6 px-6">
                    {metricsLoading ? (
                        <div className="px-6 py-10 text-center text-zinc-600 text-sm">Loading…</div>
                    ) : eventRows.length === 0 ? (
                        <div className="px-6 py-10 text-center text-zinc-600 text-sm">No events yet.</div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/5">
                                    <th className="px-6 py-4 text-[11px] font-bold tracking-widest text-white/40 uppercase">Event</th>
                                    <th className="px-6 py-4 text-[11px] font-bold tracking-widest text-white/40 uppercase">Date</th>
                                    <th className="px-6 py-4 text-[11px] font-bold tracking-widest text-white/40 uppercase">Status</th>
                                    <th className="px-6 py-4 text-[11px] font-bold tracking-widest text-white/40 uppercase">Tickets</th>
                                    <th className="px-6 py-4 text-[11px] font-bold tracking-widest text-white/40 uppercase">Hype</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {eventRows.map((event) => (
                                    <tr key={event.id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="px-6 py-4 text-sm font-bold text-white truncate max-w-[200px]">{event.name}</td>
                                        <td className="px-6 py-4 text-sm text-white/50 whitespace-nowrap">
                                            {event.date ? new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400 whitespace-nowrap">
                                                {event.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-mono text-white/70">{event.ticketsSold}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
                                                    <div className="bg-pxi-purple h-full rounded-full" style={{ width: `${event.hype}%` }} />
                                                </div>
                                                <span className="text-xs font-mono text-white/60">{event.hype}</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </SectionCard>

            <div className="flex flex-wrap gap-3">
                <Link
                    href="/dashboard/events"
                    className="inline-flex items-center gap-2 rounded-full bg-white/[0.06] px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-white/70 transition hover:bg-white/10 hover:text-white"
                >
                    <HugeiconsIcon icon={Calendar01Icon} size={14} />
                    My Events
                </Link>
                <Link
                    href="/dashboard/analytics"
                    className="inline-flex items-center gap-2 rounded-full bg-white/[0.06] px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-white/70 transition hover:bg-white/10 hover:text-white"
                >
                    <HugeiconsIcon icon={Activity01Icon} size={14} />
                    Analytics
                </Link>
                <Link
                    href="/dashboard/events/new"
                    className="inline-flex items-center gap-2 rounded-full bg-pxi-purple px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-white transition hover:brightness-110"
                >
                    <HugeiconsIcon icon={Ticket01Icon} size={14} />
                    Create Event
                </Link>
            </div>
        </div>
    );
}
