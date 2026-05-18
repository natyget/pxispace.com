'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { HugeiconsIcon } from '@hugeicons/react';
import { Ticket01Icon, Calendar01Icon, Activity01Icon, EditIcon, RadioIcon, ViewIcon, ArrowRight02Icon, StarIcon } from '@hugeicons/core-free-icons';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/auth';
import { eventsService } from '../../services/events';
import MetricCard from '@/components/dashboard/MetricCard';
import SectionCard from '@/components/dashboard/SectionCard';

export default function DashboardHome() {
    const { user } = useAuth();
    const [mounted, setMounted] = useState(false);
    const [vendorData, setVendorData] = useState(null);
    const [vendorLoading, setVendorLoading] = useState(false);
    const [events, setEvents] = useState([]);
    const [eventsLoading, setEventsLoading] = useState(false);

    useEffect(() => { setMounted(true); }, []);

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
    const totalGross = vendorData?.aggregates?.grossRevenue ?? 0;
    const recentPayments = vendorData?.payments ?? [];
    const paymentByEventId = new Map();
    for (const p of recentPayments) {
        const key = p.eventId || p.eventName || 'Ticket Sale';
        paymentByEventId.set(key, (paymentByEventId.get(key) ?? 0) + (p.netPayout ?? 0));
    }
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
        const revenue = paymentByEventId.get(e.id) ?? 0;
        const hype = Math.max(0, Math.min(100, Math.round(Math.min(100, ticketsSold * 8))));
        return {
            id: e.id,
            name: e.name || 'Untitled event',
            date: e.startDate,
            status,
            ticketsSold,
            capacity: 0,
            revenue,
            hype,
        };
    });
    const activeEvents = events.filter((e) => {
        const startMs = e.startDate ? new Date(e.startDate).getTime() : 0;
        const endMs = e.endDate ? new Date(e.endDate).getTime() : 0;
        const statusRaw = String(e.status || '').toUpperCase();
        return statusRaw === 'LIVE' || (startMs && startMs <= now && (!endMs || endMs >= now));
    }).length;
    const salesCount = events.reduce((sum, e) => sum + soldTicketsExcludingOrganizer(e?._count?.tickets ?? 0), 0);
    const avgHype = eventRows.length
        ? Math.round(eventRows.reduce((sum, e) => sum + (e.hype ?? 0), 0) / eventRows.length)
        : 0;

    const kpis = [
        { title: 'Total Ticket Sales', value: salesCount.toLocaleString(), description: `${events.length} events`, icon: Ticket01Icon, trend: salesCount > 0 ? 'up' : 'neutral', source: 'Live' },
        { title: 'Active Events', value: String(activeEvents), description: `${events.length} total`, icon: Calendar01Icon, trend: 'neutral', source: 'Live' },
        { title: 'Total Net Payout', value: `$${(totalEarnings / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, description: `Gross $${(totalGross / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: StarIcon, trend: totalEarnings > 0 ? 'up' : 'neutral', source: 'Live' },
        { title: 'Avg Hype Score', value: `${avgHype}/100`, description: 'From event momentum model', icon: Activity01Icon, trend: avgHype > 0 ? 'up' : 'neutral', source: 'Derived' },
    ];

    if (!mounted) {
        return <div className="max-w-6xl mx-auto space-y-12" />;
    }

    return (
        <div className="max-w-6xl mx-auto space-y-12">
            <div className="flex flex-col space-y-2">
                <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Command Center</h1>
                <p className="text-zinc-500 text-sm">Real-time overview of your events and performance.</p>
            </div>

            {mounted && !user?.isVendor && (
                <div className="relative overflow-hidden bg-gradient-to-br from-pxi-purple/10 to-zinc-900/60 border border-pxi-purple/20 rounded-2xl p-6">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-pxi-purple/10 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                    <div className="relative">
                        <div className="flex items-center gap-2 mb-1">
                            <HugeiconsIcon icon={StarIcon} size={14} className="text-pxi-purple" />
                            <span className="text-pxi-purple text-xs font-bold uppercase tracking-widest">
                                Become an Organizer
                            </span>
                        </div>
                        <h2 className="text-white font-black text-xl mt-2 mb-2">
                            Unlock your PXI Passport
                        </h2>
                        <p className="text-zinc-400 text-sm mb-5 leading-relaxed max-w-lg">
                            Connect your Stripe account to sell tickets, collect revenue,
                            and manage events on PXI. Verification takes just a few minutes.
                        </p>
                        <Link
                            href="/dashboard/vendor-upgrade"
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-pxi-purple text-white font-bold text-sm uppercase tracking-widest shadow-[0_0_24px_rgba(216,74,255,0.3)] hover:shadow-[0_0_36px_rgba(216,74,255,0.5)] hover:brightness-110 transition-all"
                        >
                            Go to Vendor Setup Page
                            <HugeiconsIcon icon={ArrowRight02Icon} size={14} />
                        </Link>
                    </div>
                </div>
            )}

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
            >
                {kpis.map((kpi) => (
                    <MetricCard
                        key={kpi.title}
                        title={kpi.title}
                        value={kpi.value}
                        description={kpi.description}
                        icon={kpi.icon}
                        trend={kpi.trend}
                        source={kpi.source}
                        loading={vendorLoading || eventsLoading}
                    />
                ))}
            </motion.div>

            <SectionCard
                title="Active Events"
                subtitle="Top events with ticket and hype snapshots."
                source="Derived"
                actions={(
                    <Link href="/dashboard/events" className="text-[12px] font-bold tracking-wide text-white/60 hover:text-white transition-colors uppercase">
                        View all
                    </Link>
                )}
            >
                <div className="overflow-x-auto -mx-6 px-6">
                    {(vendorLoading || eventsLoading) ? (
                        <div className="px-6 py-10 text-center text-zinc-600 text-sm">Loading…</div>
                    ) : eventRows.length === 0 ? (
                        <div className="px-6 py-10 text-center text-zinc-600 text-sm">No events yet.</div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/5">
                                    <th className="px-6 py-5 text-[11px] font-bold tracking-widest text-white/40 uppercase">Event Name</th>
                                    <th className="px-6 py-5 text-[11px] font-bold tracking-widest text-white/40 uppercase">Date</th>
                                    <th className="px-6 py-5 text-[11px] font-bold tracking-widest text-white/40 uppercase">Status</th>
                                    <th className="px-6 py-5 text-[11px] font-bold tracking-widest text-white/40 uppercase">Tickets Sold</th>
                                    <th className="px-6 py-5 text-[11px] font-bold tracking-widest text-white/40 uppercase">Net Revenue</th>
                                    <th className="px-6 py-5 text-[11px] font-bold tracking-widest text-white/40 uppercase">Hype Score</th>
                                    <th className="px-6 py-5 text-[11px] font-bold tracking-widest text-white/40 uppercase text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {eventRows.map((event) => (
                                    <tr key={event.id} className="group hover:bg-white/[0.02] transition-colors">
                                        <td className="px-6 py-5 text-[15px] font-bold text-white tracking-tight">{event.name}</td>
                                        <td className="px-6 py-5 text-[14px] font-medium text-white/50">
                                            {event.date ? new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                {event.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-[15px] font-mono font-medium text-white/70">
                                            {event.ticketsSold} {event.capacity ? `/ ${event.capacity}` : ''}
                                        </td>
                                        <td className="px-6 py-5 text-[15px] font-mono font-medium text-white/70">
                                            ${(event.revenue / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-20 bg-white/10 rounded-full h-1.5 overflow-hidden">
                                                    <div className="bg-white h-1.5 rounded-full" style={{ width: `${event.hype}%` }} />
                                                </div>
                                                <span className="text-[13px] text-white/70 font-mono font-bold">{event.hype}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="w-8 h-8 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                                                    <HugeiconsIcon icon={EditIcon} className="w-4 h-4" />
                                                </button>
                                                <button className="w-8 h-8 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                                                    <HugeiconsIcon icon={ViewIcon} className="w-4 h-4" />
                                                </button>
                                                <button className="w-8 h-8 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                                                    <HugeiconsIcon icon={RadioIcon} className="w-4 h-4" />
                                                </button>
                                                <Link href="/dashboard/events" className="w-8 h-8 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                                                    <HugeiconsIcon icon={ViewIcon} className="w-4 h-4" />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </SectionCard>
        </div>
    );
}
