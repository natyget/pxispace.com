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

  const loadEvent = useCallback(() => {
    if (!eventId) return;
    setLoading(true);
    eventsService
      .getEvent(eventId)
      .then((data) => {
        setEvent(data.event || data);
        setError(null);
      })
      .catch(() => setError('Event not found'))
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
