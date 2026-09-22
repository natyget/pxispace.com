'use client';

/* eslint-disable react-refresh/only-export-components */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react';
import { useParams } from 'next/navigation';
import { refreshSessionClaims } from '@/services/auth';
import { eventsService } from '@/services/events';


const EventManageContext = createContext(null);

export function EventManageProvider({ children }) {
  const params = useParams();
  const eventId = params?.id;
  const [event, setEvent] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [featuredPeople, setFeaturedPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const albumId = useMemo(() => event?.albumId || event?.albums?.[0]?.id, [event]);

  const isPast = useMemo(() => {
    if (!event) return false;
    const now = Date.now();
    const status = String(event.status || '').toLowerCase();
    if (['ended', 'past', 'completed', 'archived'].includes(status)) return true;
    if (event.endDate && new Date(event.endDate).getTime() < now) return true;
    if (!event.endDate && event.startDate && new Date(event.startDate).getTime() < now) return true;
    return false;
  }, [event]);

  /**
   * WEB-2. This is now the authoritative access check for a dashboard event, because the edge
   * no longer refuses one. Two things changed:
   *
   *   - `canManage` from the API decides, not the token's claim list. The API answers against
   *     the database, so a co-host, a second device and a stale cookie all get the truth.
   *   - On a refusal we refresh the session token ONCE and ask again before saying no. Claims
   *     freeze at token issue, so the common case is simply an out-of-date cookie. Once only:
   *     a genuine refusal survives a refresh, and retrying it forever would spin.
   *
   * The old version caught every rejection and hunted the id through two list endpoints, then
   * said "Event not found" regardless — so a permission problem, a deleted event and a dropped
   * connection all read the same, and none of them told the reader what to do.
   */
  const loadEvent = useCallback(async () => {
    if (!eventId) return;

    // One attempt. A refusal gets exactly one retry, after refreshing the token — see above.
    const attempt = async (allowRefresh) => {
      try {
        const data = await eventsService.getEvent(eventId);
        const loaded = data.event || data;
        if (loaded?.canManage === false) {
          if (allowRefresh && (await refreshSessionClaims())) return attempt(false);
          setEvent(null);
          setError({ kind: 'forbidden', message: 'You do not have access to this event.' });
          return;
        }
        setEvent(loaded);
        setError(null);
      } catch (err) {
        const status = err?.status;
        if (status === 404) {
          setError({ kind: 'missing', message: 'This event no longer exists.' });
        } else if (status === 401 || status === 403) {
          if (allowRefresh && (await refreshSessionClaims())) return attempt(false);
          setError({ kind: 'forbidden', message: 'You do not have access to this event.' });
        } else {
          setError({
            kind: 'unavailable',
            message: 'Could not load this event. Check your connection and try again.',
          });
        }
      }
    };

    setLoading(true);
    try {
      await attempt(true);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  const loadParticipants = useCallback(() => {
    if (!albumId) return;
    eventsService
      .getAlbumParticipants(albumId)
      .then((res) => setParticipants(res.participants || []))
      .catch(() => setParticipants([]));
  }, [albumId]);

  const loadFeaturedPeople = useCallback(() => {
    if (!albumId) return;
    eventsService
      .getFeaturedPeople(albumId)
      .then((res) => setFeaturedPeople(res.lineup || res.featuredPeople || []))
      .catch(() => setFeaturedPeople([]));
  }, [albumId]);

  useEffect(() => {
    const timer = setTimeout(() => loadEvent(), 0);
    return () => clearTimeout(timer);
  }, [loadEvent]);

  useEffect(() => {
    if (albumId) loadParticipants();
  }, [albumId, loadParticipants]);

  useEffect(() => {
    if (albumId) loadFeaturedPeople();
  }, [albumId, loadFeaturedPeople]);

  const value = useMemo(
    () => ({
      eventId,
      event,
      albumId,
      participants,
      featuredPeople,
      loading,
      error,
      isPast,
      reloadEvent: loadEvent,
      reloadParticipants: loadParticipants,
      reloadFeaturedPeople: loadFeaturedPeople,
    }),
    [
      eventId,
      event,
      albumId,
      participants,
      featuredPeople,
      loading,
      error,
      isPast,
      loadEvent,
      loadParticipants,
      loadFeaturedPeople,
    ],
  );

  return (
    <EventManageContext.Provider value={value}>{children}</EventManageContext.Provider>
  );
}

export function useEventManage() {
  const ctx = useContext(EventManageContext);
  if (!ctx) {
    throw new Error('useEventManage must be used within EventManageProvider');
  }
  return ctx;
}
