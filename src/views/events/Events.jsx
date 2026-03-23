'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import EventsHero from './EventsHero';
import EventsFilters from './EventsFilters';
import EventsGrid from './EventsGrid';
import EventsEmpty from './EventsEmpty';
import EventsCTA from './EventsCTA';
import EventsDiscoverMap from './EventsDiscoverMap';
import EventPreviewModal from './EventPreviewModal';
import { eventsService } from '../../services/events';
import { readFavoriteEventIds, toggleFavoriteEventId } from '@/lib/eventFavorites';

const DEFAULT_IMG =
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=2070';

const normalizeApiEvent = (e) => {
  const paid = e.ticketType === 'PAID';
  const sym = e.currency === 'EUR' ? '€' : '$';
  const price =
    paid && e.ticketPrice != null && Number(e.ticketPrice) > 0
      ? `${sym}${Number(e.ticketPrice).toFixed(2)}`
      : 'Free';
  const vs = e.vendorStats;
  const vendorHint =
    vs && typeof vs.hostEventsCreated === 'number'
      ? `Host · ${vs.hostEventsCreated} events · ${vs.hostTicketsSold ?? 0} tickets sold`
      : null;

  return {
    id: e.id,
    title: e.name,
    image: e.coverImage || DEFAULT_IMG,
    location: e.location || 'Location TBA',
    date: e.startDate
      ? new Date(e.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : 'Date TBA',
    members: e._count?.tickets ?? 0,
    type: paid ? 'Paid' : 'Free',
    status:
      (e._count?.tickets ?? 0) > 200
        ? 'Hot'
        : e.visibility === 'PUBLIC'
          ? 'Public'
          : String(e.visibility || 'Event'),
    price,
    description: typeof e.description === 'string' ? e.description : '',
    latitude: e.latitude ?? null,
    longitude: e.longitude ?? null,
    vendorHint,
  };
};

const Events = () => {
  const [filter, setFilter] = useState('All');
  const [sortMode, setSortMode] = useState('vendor');
  const [searchQuery, setSearchQuery] = useState('');
  const [apiEvents, setApiEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  // Empty until mount — reading localStorage in useState breaks SSR/client hydration
  const [favoriteIds, setFavoriteIds] = useState(() => new Set());
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [previewEvent, setPreviewEvent] = useState(null);

  const loadFavorites = useCallback(() => {
    setFavoriteIds(readFavoriteEventIds());
  }, []);

  useEffect(() => {
    setFavoriteIds(readFavoriteEventIds());
  }, []);

  useEffect(() => {
    setEventsLoading(true);
    eventsService
      .getDiscoverEvents(48, 0, sortMode)
      .then((res) => setApiEvents((res.events || []).map(normalizeApiEvent)))
      .catch(() => setApiEvents([]))
      .finally(() => setEventsLoading(false));
  }, [sortMode]);

  const filteredEvents = useMemo(() => {
    return apiEvents.filter((event) => {
      const matchesFilter = filter === 'All' || event.type === filter;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q || (event.title || '').toLowerCase().includes(q) || (event.location || '').toLowerCase().includes(q);
      const matchesFav = !favoritesOnly || favoriteIds.has(String(event.id));
      return matchesFilter && matchesSearch && matchesFav;
    });
  }, [apiEvents, filter, searchQuery, favoritesOnly, favoriteIds]);

  const mapEvents = useMemo(
    () =>
      filteredEvents.map((ev) => ({
        id: ev.id,
        title: ev.title,
        latitude: ev.latitude,
        longitude: ev.longitude,
      })),
    [filteredEvents]
  );

  const handleToggleFavorite = useCallback(
    (id) => {
      toggleFavoriteEventId(id);
      loadFavorites();
    },
    [loadFavorites]
  );

  return (
    <div className="pt-32 pb-24 min-h-screen bg-black overflow-hidden relative">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-pxi-purple/10 blur-[150px] rounded-full -z-10" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 blur-[150px] rounded-full -z-10" />

      <div className="container mx-auto px-6">
        <EventsHero
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          sortMode={sortMode}
          setSortMode={setSortMode}
        />

        <EventsFilters
          filter={filter}
          setFilter={setFilter}
          favoritesOnly={favoritesOnly}
          setFavoritesOnly={setFavoritesOnly}
          favoriteCount={favoriteIds.size}
        />

        <div className="flex flex-wrap gap-4 items-center justify-between mb-10 text-sm text-zinc-500">
          <p>
            {eventsLoading ? 'Loading events…' : `${filteredEvents.length} event${filteredEvents.length === 1 ? '' : 's'} shown`}
          </p>
          <Link href="/dashboard/events" className="text-pxi-purple hover:text-white font-bold uppercase text-xs tracking-widest">
            Create an event →
          </Link>
        </div>

        <EventsDiscoverMap events={mapEvents} />

        {eventsLoading && !apiEvents.length ? (
          <div className="py-32 text-center text-zinc-500">Loading discover…</div>
        ) : filteredEvents.length > 0 ? (
          <EventsGrid
            events={filteredEvents}
            favoriteIds={favoriteIds}
            onToggleFavorite={handleToggleFavorite}
            onQuickView={setPreviewEvent}
          />
        ) : (
          <EventsEmpty
            reset={() => {
              setFilter('All');
              setSearchQuery('');
              setFavoritesOnly(false);
            }}
          />
        )}

        <EventsCTA />

        <EventPreviewModal open={!!previewEvent} onClose={() => setPreviewEvent(null)} event={previewEvent} />
      </div>
    </div>
  );
};

export default Events;
