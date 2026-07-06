'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import EventsHero from './EventsHero';
import EventsFilters from './EventsFilters';
import EventsGrid from './EventsGrid';
import EventsEmpty from './EventsEmpty';
import EventsCTA from './EventsCTA';
import EventsDiscoverMap from './EventsDiscoverMap';
import EventPreviewModal from './EventPreviewModal';
import { eventsService } from '../../services/events';
import { musicService } from '../../services/music';
import { loadFavoriteEventIds, toggleFavoriteEventId } from '@/lib/eventFavorites';
import { useAuth } from '@/contexts/AuthContext';

const DEFAULT_IMG =
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=2070';
const DISCOVER_CACHE_TTL = 45_000;
const discoverEventsCache = new Map();

function discoverCacheKey({ sortMode, nearMe, coords, radiusKm, isLoggedIn }) {
  return JSON.stringify({
    sortMode,
    nearMe: !!nearMe,
    lat: coords?.lat ? Number(coords.lat).toFixed(3) : null,
    lng: coords?.lng ? Number(coords.lng).toFixed(3) : null,
    radiusKm,
    includeMatch: !!isLoggedIn,
  });
}

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
    albumId: e.albumId || e.albums?.[0]?.id || null,
    distanceKm: e.distanceKm ?? null,
    musicMatchScore: e.musicMatchScore ?? null,
    organizer: e.organizer ?? null,
  };
};

const Events = ({ detailBasePath = '/events' }) => {
  const { user } = useAuth();
  const isLoggedIn = !!user?.id;
  const [filter, setFilter] = useState('All');
  const [sortMode, setSortMode] = useState('vendor');
  const [searchQuery, setSearchQuery] = useState('');
  const [apiEvents, setApiEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  // Empty until mount — reading localStorage in useState breaks SSR/client hydration
  const [favoriteIds, setFavoriteIds] = useState(() => new Set());
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [previewEvent, setPreviewEvent] = useState(null);
  const [nearMe, setNearMeRaw] = useState(false);
  const [radiusKm, setRadiusKm] = useState(80);
  const [coords, setCoords] = useState(null);
  const [geoError, setGeoError] = useState(null);
  const [musicConnected, setMusicConnected] = useState(null);

  const loadFavorites = useCallback(() => {
    loadFavoriteEventIds(isLoggedIn).then(setFavoriteIds).catch(() => setFavoriteIds(new Set()));
  }, [isLoggedIn]);

  useEffect(() => {
    const timer = setTimeout(loadFavorites, 0);
    return () => clearTimeout(timer);
  }, [loadFavorites]);

  const requestGeolocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoError('Location is not supported in this browser.');
      setNearMeRaw(false);
      toast.error('Location is not supported in this browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoError(null);
      },
      () => {
        setGeoError('Could not get your location. Check your browser permissions.');
        setNearMeRaw(false);
        toast.error('Could not get your location. Check your browser permissions.');
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 }
    );
  }, []);

  const setNearMe = useCallback(
    (next) => {
      setNearMeRaw(next);
      if (next) {
        setGeoError(null);
        requestGeolocation();
      }
    },
    [requestGeolocation]
  );

  // 'distance' sort needs coords — auto-enable "near me" when it's picked
  useEffect(() => {
    if (sortMode === 'distance' && !nearMe && !geoError) {
      const timer = setTimeout(() => setNearMe(true), 0);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [sortMode, nearMe, geoError, setNearMe]);

  const loadDiscoverEvents = useCallback(() => {
    const cacheKey = discoverCacheKey({ sortMode, nearMe, coords, radiusKm, isLoggedIn });
    const cached = discoverEventsCache.get(cacheKey);
    const hasFreshCache = cached && Date.now() - cached.ts < DISCOVER_CACHE_TTL;

    if (hasFreshCache) {
      setApiEvents(cached.events);
      setMusicConnected(cached.musicConnected);
      setEventsLoading(false);
    } else {
      setEventsLoading(true);
    }

    const opts = {};
    if (nearMe && coords) {
      opts.lat = coords.lat;
      opts.lng = coords.lng;
      opts.radiusKm = radiusKm;
    }
    if (isLoggedIn) {
      opts.includeMatch = true;
    }
    return eventsService
      .getDiscoverEvents(48, 0, sortMode, opts)
      .then((res) => {
        const events = (res.events || []).map(normalizeApiEvent);
        const musicConnectedValue = typeof res.musicProfileConnected === 'boolean' ? res.musicProfileConnected : null;
        discoverEventsCache.set(cacheKey, {
          events,
          musicConnected: musicConnectedValue,
          ts: Date.now(),
        });
        setApiEvents(events);
        setMusicConnected(musicConnectedValue);
      })
      .catch(() => {
        if (!hasFreshCache) setApiEvents([]);
      })
      .finally(() => setEventsLoading(false));
  }, [sortMode, nearMe, coords, radiusKm, isLoggedIn]);

  useEffect(() => {
    const timer = setTimeout(loadDiscoverEvents, 0);
    return () => clearTimeout(timer);
  }, [loadDiscoverEvents]);

  const handleConnectSpotify = useCallback(() => {
    musicService
      .startSpotifyConnect()
      .then((res) => {
        if (res?.authorizeUrl) window.location.assign(res.authorizeUrl);
      })
      .catch(() => toast.error('Could not start the Spotify connect flow. Try again.'));
  }, []);

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
      const isFavorite = favoriteIds.has(String(id));
      toggleFavoriteEventId(id, isFavorite, isLoggedIn)
        .then(setFavoriteIds)
        .catch(() => loadFavorites());
    },
    [favoriteIds, isLoggedIn, loadFavorites]
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
          nearMe={nearMe}
          setNearMe={setNearMe}
          radiusKm={radiusKm}
          setRadiusKm={setRadiusKm}
        />

        {sortMode === 'match' && !isLoggedIn ? (
          <div className="flex flex-wrap items-center justify-between gap-4 mb-10 rounded-2xl border border-white/[0.08] bg-white/[0.02] px-5 py-4 text-sm text-zinc-400">
            <p>Log in and connect Spotify to rank events by your taste.</p>
            <Link href="/login" className="text-pxi-purple hover:text-white font-bold uppercase text-xs tracking-widest shrink-0">
              Log in →
            </Link>
          </div>
        ) : null}

        {sortMode === 'match' && isLoggedIn && musicConnected === false ? (
          <div className="flex flex-wrap items-center justify-between gap-4 mb-10 rounded-2xl border border-white/[0.08] bg-white/[0.02] px-5 py-4 text-sm text-zinc-400">
            <p>Connect Spotify to rank events by your taste.</p>
            <button
              type="button"
              onClick={handleConnectSpotify}
              className="shrink-0 rounded-full bg-[#1DB954] px-5 py-2 text-xs font-black uppercase tracking-widest text-black"
            >
              Connect Spotify
            </button>
          </div>
        ) : null}

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
            detailBasePath={detailBasePath}
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

        <EventPreviewModal open={!!previewEvent} onClose={() => setPreviewEvent(null)} event={previewEvent} detailBasePath={detailBasePath} />
      </div>
    </div>
  );
};

export default Events;
