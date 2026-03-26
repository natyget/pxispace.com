'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    Ticket,
    Calendar,
    DollarSign,
    Activity,
    Edit,
    CheckSquare,
    Radio,
    Eye,
    ArrowUpRight,
    ArrowDownRight,
    ArrowRight,
    Star,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/auth';
import { eventsService } from '../../services/events';

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
        { title: 'Total Ticket Sales', value: salesCount.toLocaleString(), delta: `${events.length} events`, icon: Ticket, trend: salesCount > 0 ? 'up' : 'neutral' },
        { title: 'Active Events', value: String(activeEvents), delta: `${events.length} total`, icon: Calendar, trend: 'neutral' },
        { title: 'Total Net Payout', value: `$${(totalEarnings / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, delta: `Gross $${(totalGross / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: DollarSign, trend: totalEarnings > 0 ? 'up' : 'neutral' },
        { title: 'Avg Hype Score', value: `${avgHype}/100`, delta: 'From live event metrics', icon: Activity, trend: avgHype > 0 ? 'down' : 'neutral' },
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
                            <Star size={14} className="text-pxi-purple" />
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
                            <ArrowRight size={14} />
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
                    <div key={kpi.title} className="rounded-2xl border border-white/10 bg-zinc-900/40 p-6 md:p-8 flex flex-col justify-between relative group hover:border-white/20 transition-colors">
                        <div className="flex items-center justify-between mb-6 md:mb-8">
                            <span className="text-[11px] md:text-[12px] font-bold tracking-widest text-white/40 uppercase">{kpi.title}</span>
                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors shrink-0">
                                <kpi.icon className="h-4 w-4 text-white" />
                            </div>
                        </div>
                        {(vendorLoading || eventsLoading) ? (
                            <div className="h-10 w-24 bg-white/5 rounded animate-pulse" />
                        ) : (
                            <div className="mt-auto flex flex-col items-start gap-3 md:gap-4">
                                <div className="text-3xl lg:text-[40px] font-[900] text-white tracking-tighter leading-none">{kpi.value}</div>
                                <div className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] md:text-[11px] font-bold tracking-wider uppercase ${
                                    kpi.trend === 'up' ? 'bg-[#4ade80]/10 text-[#4ade80] border border-[#4ade80]/20' :
                                    kpi.trend === 'down' ? 'bg-[#f87171]/10 text-[#f87171] border border-[#f87171]/20' :
                                    'bg-white/5 text-white/50 border border-white/10'
                                }`}>
                                    {kpi.trend === 'up' && <ArrowUpRight className="w-3 h-3" />}
                                    {kpi.trend === 'down' && <ArrowDownRight className="w-3 h-3" />}
                                    <span>{kpi.delta}</span>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </motion.div>

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-[20px] font-[800] tracking-tight text-white">Active Events</h2>
                    <Link href="/dashboard/events" className="text-[13px] font-bold tracking-wide text-white/50 hover:text-white transition-colors uppercase">
                        View All
                    </Link>
                </div>
                <div className="rounded-2xl border border-white/10 bg-zinc-900/40 overflow-x-auto">
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
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button className="w-8 h-8 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                                                    <CheckSquare className="w-4 h-4" />
                                                </button>
                                                <button className="w-8 h-8 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                                                    <Radio className="w-4 h-4" />
                                                </button>
                                                <Link href="/dashboard/events" className="w-8 h-8 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                                                    <Eye className="w-4 h-4" />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
