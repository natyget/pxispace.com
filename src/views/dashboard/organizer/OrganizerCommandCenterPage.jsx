'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { HugeiconsIcon } from '@hugeicons/react';
import { Activity01Icon, Calendar01Icon, Ticket01Icon, UserGroupIcon } from '@hugeicons/core-free-icons';
import { eventsService } from '@/services/events';
import { authService } from '@/services/auth';
import MetricCard from '@/components/dashboard/MetricCard';
import SectionCard from '@/components/dashboard/SectionCard';

export default function OrganizerCommandCenterPage() {
    const [loading, setLoading] = useState(true);
    const [events, setEvents] = useState([]);
    const [vendorData, setVendorData] = useState(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            const [eventsResult, vendorResult] = await Promise.allSettled([
                eventsService.getMyEvents({ limit: 50, offset: 0 }),
                authService.getVendorDashboard(),
            ]);
            if (cancelled) return;
            setEvents(eventsResult.status === 'fulfilled' ? (eventsResult.value?.events || []) : []);
            setVendorData(vendorResult.status === 'fulfilled' ? vendorResult.value : null);
            setLoading(false);
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const liveCount = useMemo(() => events.filter((event) => {
        const status = String(event?.status || '').toUpperCase();
        return status === 'LIVE' || status === 'ACTIVE';
    }).length, [events]);
    const ticketCount = useMemo(() => events.reduce((sum, event) => sum + Math.max(0, (event?._count?.tickets ?? 0) - 1), 0), [events]);
    const revenue = (vendorData?.aggregates?.netPayout ?? 0) / 100;

    const cards = [
        {
            title: 'Live Events',
            value: String(liveCount),
            description: `${events.length} tracked events`,
            icon: Activity01Icon,
            trend: liveCount > 0 ? 'up' : 'neutral',
            source: 'Live',
        },
        {
            title: 'Ticket Sales',
            value: ticketCount.toLocaleString(),
            description: 'Across hosted events',
            icon: Ticket01Icon,
            trend: ticketCount > 0 ? 'up' : 'neutral',
            source: 'Live',
        },
        {
            title: 'Net Revenue',
            value: `$${revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
            description: 'Stripe vendor payouts',
            icon: Calendar01Icon,
            trend: revenue > 0 ? 'up' : 'neutral',
            source: vendorData ? 'Live' : 'Mock',
        },
        {
            title: 'Audience Reach',
            value: `${Math.max(120, ticketCount * 3)}`,
            description: 'Visibility estimate',
            icon: UserGroupIcon,
            trend: 'up',
            source: 'Derived',
        },
    ];

    const priorityQueue = [
        { title: 'Finalize tonight scan staffing', detail: 'Confirm bouncer/co-host assignments before doors.', route: '/dashboard/live-scan' },
        { title: 'Publish reminder push', detail: 'Use campaign board to schedule a last-call RSVP reminder.', route: '/dashboard/organizer/campaigns' },
        { title: 'Review audience growth', detail: 'Compare invite acceptance and ticket conversion trends.', route: '/dashboard/organizer/audience' },
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div>
                <p className="text-xs font-bold tracking-widest uppercase text-pxi-purple">Organizer Studio</p>
                <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight mt-1">Command Center</h1>
                <p className="text-zinc-500 text-sm mt-1">Live where available, mock where backend is still pending.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {cards.map((card) => (
                    <MetricCard
                        key={card.title}
                        title={card.title}
                        value={card.value}
                        description={card.description}
                        icon={card.icon}
                        trend={card.trend}
                        source={card.source}
                        loading={loading}
                    />
                ))}
            </div>

            <SectionCard
                title="Priority Queue"
                subtitle="Recommended next actions for event operations."
                source="Derived"
            >
                <ul className="space-y-3">
                    {priorityQueue.map((item) => (
                        <li key={item.title} className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 flex items-center justify-between gap-4">
                            <div>
                                <p className="text-sm font-semibold text-white">{item.title}</p>
                                <p className="text-xs text-zinc-500 mt-1">{item.detail}</p>
                            </div>
                            <Link href={item.route} className="text-xs font-bold uppercase tracking-widest text-pxi-purple hover:text-white">
                                Open
                            </Link>
                        </li>
                    ))}
                </ul>
            </SectionCard>
        </div>
    );
}
