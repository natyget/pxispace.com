'use client';

import { useEffect, useMemo, useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Notification03Icon, UserGroupIcon } from '@hugeicons/core-free-icons';
import { useAuth } from '@/contexts/AuthContext';
import { getNotifications } from '@/services/notifications';
import { eventsService } from '@/services/events';
import SectionCard from '@/components/dashboard/SectionCard';
import MetricCard from '@/components/dashboard/MetricCard';

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
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div>
                <p className="text-xs font-bold tracking-widest uppercase text-pxi-purple">Organizer Studio</p>
                <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight mt-1">Audience Board</h1>
                <p className="text-zinc-500 text-sm mt-1">Blended live invite signals and growth forecasting.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

            <SectionCard title="Audience Signals" subtitle="Recent signals from event activity." source="Derived">
                <div className="space-y-3">
                    {[
                        {
                            title: 'Top conversion channel',
                            value: inviteNotifications.length > 0 ? 'Direct Staff Invites' : 'Community referrals',
                        },
                        {
                            title: 'Strongest response window',
                            value: '60–120 minutes before doors',
                        },
                        {
                            title: 'Recommended next move',
                            value: 'Push reminder to pending invitees from notifications.',
                        },
                    ].map((row) => (
                        <div key={row.title} className="rounded-xl border border-white/10 bg-black/30 px-4 py-3">
                            <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">{row.title}</p>
                            <p className="text-sm text-white mt-1">{row.value}</p>
                        </div>
                    ))}
                </div>
            </SectionCard>
        </div>
    );
}
