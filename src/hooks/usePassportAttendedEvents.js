'use client';

import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { getUserTickets } from '@/services/tickets';
import { getEventsForWallet, getMyEventXp, getUserEventXp } from '@/services/events';
import { resolvePassportStampPriceUsd } from '@/utils/resolveTicketFacePrice';

const EMPTY_EVENTS_PAGE = { events: [], pagination: { limit: 100, offset: 0, total: 0 } };

async function fetchPassportEventsFromApi(userId) {
    try {
        const response = await api.get(`/api/users/${userId}/passport-events`);
        return response.events ?? [];
    } catch {
        return null;
    }
}

async function fetchPassportEventsLegacy(userId, mode) {
    const xpPromise = mode === 'public' ? getUserEventXp(userId) : getMyEventXp();
    const [tickets, eventsData, xpByEventId] = await Promise.all([
        getUserTickets(userId),
        getEventsForWallet(100, 0).catch(() => EMPTY_EVENTS_PAGE),
        xpPromise,
    ]);

    return (tickets ?? []).flatMap((ticket) => {
        const ev = (eventsData?.events ?? []).find((e) => e.id === ticket.eventId);
        if (!ev) return [];
        const albumRole = 'MEMBER';
        const isPrivate = ev.visibility === 'PRIVATE';
        return [
            {
                id: ev.id,
                // Same contract as the API: a private event's name never reaches the stamp.
                name: isPrivate ? '' : ev.name,
                isPrivate,
                startDate: ev.startDate,
                location: ev.location,
                xp: xpByEventId?.[ev.id],
                ticketPriceUsd: resolvePassportStampPriceUsd(ticket, ev, albumRole),
                albumRole,
            },
        ];
    });
}

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

        (async () => {
            try {
                const fromApi = await fetchPassportEventsFromApi(userId);
                if (cancelled) return;
                if (fromApi) {
                    setAttendedEvents(fromApi);
                    return;
                }
                const legacy = await fetchPassportEventsLegacy(userId, mode);
                if (!cancelled) setAttendedEvents(legacy);
            } catch {
                if (!cancelled) setAttendedEvents([]);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [userId, mode]);

    return attendedEvents;
}
