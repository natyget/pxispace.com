'use client';

import { useEffect, useState } from 'react';
import { getUserTickets } from '@/services/tickets';
import { getEventsForWallet, getMyEventXp, getUserEventXp } from '@/services/events';

/**
 * Attended events for passport stamps.
 * @param {string | undefined} userId
 * @param {'self' | 'public'} mode — `self` uses session XP; `public` uses that user's XP
 */
export function usePassportAttendedEvents(userId, mode = 'self') {
    const [attendedEvents, setAttendedEvents] = useState([]);

    useEffect(() => {
        if (!userId) {
            setAttendedEvents([]);
            return;
        }
        let cancelled = false;
        const xpPromise = mode === 'public' ? getUserEventXp(userId) : getMyEventXp();

        Promise.all([getUserTickets(userId), getEventsForWallet(100, 0), xpPromise])
            .then(([tickets, eventsData, xpByEventId]) => {
                if (cancelled) return;
                const events = (tickets ?? []).flatMap((t) => {
                    const ev = (eventsData?.events ?? []).find((e) => e.id === t.eventId);
                    if (!ev) return [];
                    return [
                        {
                            id: ev.id,
                            name: ev.name,
                            startDate: ev.startDate,
                            location: ev.location,
                            xp: xpByEventId?.[ev.id],
                        },
                    ];
                });
                setAttendedEvents(events);
            })
            .catch(() => {
                if (!cancelled) setAttendedEvents([]);
            });

        return () => {
            cancelled = true;
        };
    }, [userId, mode]);

    return attendedEvents;
}
