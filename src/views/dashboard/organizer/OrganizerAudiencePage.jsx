'use client';

import { useEffect, useMemo, useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Activity01Icon, Notification03Icon, UserGroupIcon } from '@hugeicons/core-free-icons';
import { useAuth } from '@/contexts/AuthContext';
import { getNotifications } from '@/services/notifications';
import { eventsService } from '@/services/events';
import SectionCard from '@/components/dashboard/SectionCard';
import MetricCard from '@/components/dashboard/MetricCard';
import DataSourceBadge from '@/components/dashboard/DataSourceBadge';

export default function OrganizerAudiencePage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [notifications, setNotifications] = useState([]);
    const [events, setEvents] = useState([]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            const [notificationsResult, eventsResult] = await Promise.allSettled([
                user?.id ? getNotifications(user.id, 100) : Promise.resolve({ notifications: [] }),
                eventsService.getMyEvents({ limit: 100, offset: 0 }),
            ]);
            if (cancelled) return;
            setNotifications(
                notificationsResult.status === 'fulfilled'
                    ? (notificationsResult.value?.notifications || [])
                    : []
            );
            setEvents(eventsResult.status === 'fulfilled' ? (eventsResult.value?.events || []) : []);
            setLoading(false);
        })();
        return () => {
            cancelled = true;
        };
    }, [user?.id]);

    const inviteNotifications = useMemo(
        () => notifications.filter((item) => ['ALBUM_INVITE', 'STAFF_INVITE', 'LINEUP_INVITE'].includes(item.type)),
        [notifications]
    );
    const acceptedInvites = useMemo(
        () => inviteNotifications.filter((item) => String(item?.data?.inviteResponse || '').toLowerCase() === 'accepted').length,
        [inviteNotifications]
    );
    const totalTickets = useMemo(
        () => events.reduce((sum, event) => sum + Math.max(0, (event?._count?.tickets ?? 0) - 1), 0),
        [events]
    );
    const estimatedTierMix = useMemo(() => {
        const audience = Math.max(120, totalTickets || 0);
        return [
            { tier: 'Wanderer', share: 0.34, odysseyBand: '0 - 500 XP' },
            { tier: 'Seeker', share: 0.24, odysseyBand: '501 - 2.5K XP' },
            { tier: 'Voyager', share: 0.18, odysseyBand: '2.5K - 7K XP' },
            { tier: 'Pathfinder', share: 0.13, odysseyBand: '7K - 15K XP' },
            { tier: 'Luminary+', share: 0.11, odysseyBand: '15K+ XP' },
        ].map((row) => ({ ...row, count: Math.round(audience * row.share) }));
    }, [totalTickets]);
    const highValueShare = useMemo(
        () => estimatedTierMix
            .filter((row) => row.tier === 'Pathfinder' || row.tier === 'Luminary+')
            .reduce((sum, row) => sum + row.share, 0),
        [estimatedTierMix]
    );

    const cards = [
        {
            title: 'Invite Inbox',
            value: String(inviteNotifications.length),
            description: 'Live invite notifications',
            icon: Notification03Icon,
            trend: inviteNotifications.length > 0 ? 'up' : 'neutral',
            source: 'Live',
        },
        {
            title: 'Accepted Invites',
            value: String(acceptedInvites),
            description: 'Conversion from invite flow',
            icon: UserGroupIcon,
            trend: acceptedInvites > 0 ? 'up' : 'neutral',
            source: 'Derived',
        },
        {
            title: 'Projected Reach',
            value: String(Math.max(180, events.length * 45)),
            description: 'Mock audience expansion model',
            icon: UserGroupIcon,
            trend: 'up',
            source: 'Mock',
        },
        {
            title: 'High-Value Cohort',
            value: `${Math.round(highValueShare * 100)}%`,
            description: 'Pathfinder + Luminary share',
            icon: Activity01Icon,
            trend: 'up',
            source: 'Derived',
        },
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-bold tracking-widest uppercase text-pxi-purple">Organizer Studio</p>
                    <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight mt-1">Audience CRM</h1>
                    <p className="text-zinc-500 text-sm mt-1">Passport-tier segmentation, Odyssey progression, and invite intelligence.</p>
                </div>
                <div className="flex items-center gap-2">
                    <DataSourceBadge source="Live" />
                    <DataSourceBadge source="Derived" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
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

            <SectionCard title="Passport Tier Mix" subtitle="Estimated audience composition by Odyssey progression levels." source="Derived">
                <div className="space-y-3">
                    {estimatedTierMix.map((row) => (
                        <div key={row.tier} className="rounded-xl border border-white/10 bg-black/30 px-4 py-3">
                            <div className="flex items-center justify-between gap-3">
                                <p className="text-sm font-bold text-white">{row.tier}</p>
                                <p className="text-xs text-zinc-100 font-semibold">{Math.round(row.share * 100)}%</p>
                            </div>
                            <p className="text-[11px] text-zinc-300 mt-1">{row.odysseyBand}</p>
                            <div className="mt-2 h-2 rounded-full bg-white/10 overflow-hidden">
                                <div className="h-2 bg-pxi-purple/80 rounded-full" style={{ width: `${Math.round(row.share * 100)}%` }} />
                            </div>
                            <p className="text-[11px] text-zinc-500 mt-1">{row.count} estimated attendees</p>
                        </div>
                    ))}
                </div>
            </SectionCard>

            <SectionCard title="Audience Signals" subtitle="Behavioral intel to improve event conversion and retention." source="Derived">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-3">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Top Conversion Channel</p>
                        <p className="text-sm text-zinc-100 mt-1">{inviteNotifications.length > 0 ? 'Direct Staff Invites' : 'Community referrals'}</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-3">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Strongest Response Window</p>
                        <p className="text-sm text-zinc-100 mt-1">60-120 minutes before doors</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-3">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Recommended Next Move</p>
                        <p className="text-sm text-zinc-100 mt-1">Push reminder to pending invitees from notifications.</p>
                    </div>
                </div>
            </SectionCard>
        </div>
    );
}
