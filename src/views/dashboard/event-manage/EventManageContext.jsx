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
import { eventsService } from '@/services/events';

import { getEventsForWallet } from '@/services/events';

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

  const loadEvent = useCallback(() => {
    if (!eventId) return;
    setLoading(true);
    eventsService
      .getEvent(eventId)
      .then((data) => {
        setEvent(data.event || data);
        setError(null);
      })
      .catch(async () => {
        try {
          const managedRes = await eventsService.getManagedEvents({ limit: 100, offset: 0 });
          const found = (managedRes?.events || []).find((e) => String(e.id) === String(eventId));
          if (found) {
            setEvent(found);
            setError(null);
            return;
          }
          const walletRes = await getEventsForWallet(100, 0);
          const foundWallet = (walletRes?.events || []).find((e) => String(e.id) === String(eventId));
          if (foundWallet) {
            setEvent(foundWallet);
            setError(null);
            return;
          }
        } catch {
          // ignore fallback error
        }
        setError('Event not found');
      })
      .finally(() => setLoading(false));
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
