'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { HugeiconsIcon } from '@hugeicons/react';
import { Calendar01Icon, Ticket01Icon } from '@hugeicons/core-free-icons';
import EventsHero from './EventsHero';
import EventsFilters from './EventsFilters';
import EventsGrid from './EventsGrid';
import EventsEmpty from './EventsEmpty';
import EventsCTA from './EventsCTA';
import EventsDiscoverMap from './EventsDiscoverMap';
import EventDetailsModal from '@/components/events/EventDetailsModal';
import { eventsService } from '../../services/events';
import { musicService } from '../../services/music';
import { loadFavoriteEventIds, toggleFavoriteEventId } from '@/lib/eventFavorites';
import { useAuth } from '@/contexts/AuthContext';

/** Adapt the flat `normalizeApiEvent` shape into `EventDetailsModal`'s section-driven
 * contract. This call site only has flat discover-list data (no lineup / ticket-tier /
 * participant arrays), so those sections simply don't render — badges, schedule,
 * location, description and playlist do. */
function toEventDetailsModalEvent(event) {
  if (!event) return null;
  return {
    id: event.id,
    title: event.title,
    image: event.image,
    badges: event.status ? [{ label: event.status, tone: 'purple' }] : [],
    schedule: event.date,
    location: event.location,
    description: event.description,
    host: event.organizer
      ? { name: event.organizer.name, username: event.organizer.username, avatarUrl: event.organizer.avatarUrl }
      : null,
    memberCount: event.members > 0 ? event.members : undefined,
    playlist: { spotifyPlaylistUrl: event.spotifyPlaylistUrl, spotifyTopTrackUrl: event.spotifyTopTrackUrl },
  };
}

function ticketCtaLabel(event) {
  return event.ticketType === 'PAID' || (event.price && event.price !== 'Free') ? 'Get Ticket' : 'RSVP';
}

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
    playlistTopGenres: e.playlist?.topGenres ?? [],
    playlistUrl: e.playlist?.sourceUrl ?? null,
    organizer: e.organizer ?? null,
    ticketType: e.ticketType ?? null,
    spotifyPlaylistUrl: e.spotifyPlaylistUrl ?? null,
    spotifyTopTrackUrl: e.spotifyTopTrackUrl ?? null,
  };
};

const Events = ({ detailBasePath = '/events' }) => {
  const router = useRouter();
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
  /** User's top genres (from their connected music profile) for the genre filter dropdown. */
  const [myGenres, setMyGenres] = useState([]);
  const [genreFilter, setGenreFilter] = useState(() => new Set());

  useEffect(() => {
    if (!isLoggedIn) {
      const timer = setTimeout(() => {
        setMyGenres([]);
        setGenreFilter(new Set());
      }, 0);
      return () => clearTimeout(timer);
    }
    musicService
      .getProfile()
      .then((p) => setMyGenres(p?.connected ? p.topGenres ?? [] : []))
      .catch(() => setMyGenres([]));
    return undefined;
  }, [isLoggedIn]);

  const toggleGenre = useCallback((genre) => {
    setGenreFilter((prev) => {
      const next = new Set(prev);
      if (next.has(genre)) next.delete(genre);
      else next.add(genre);
      return next;
    });
  }, []);

  const clearGenres = useCallback(() => setGenreFilter(new Set()), []);

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
      const matchesGenre =
        genreFilter.size === 0 || (event.playlistTopGenres || []).some((g) => genreFilter.has(g));
      return matchesFilter && matchesSearch && matchesFav && matchesGenre;
    });
  }, [apiEvents, filter, searchQuery, favoritesOnly, favoriteIds, genreFilter]);

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
          myGenres={myGenres}
          genreFilter={genreFilter}
          toggleGenre={toggleGenre}
          clearGenres={clearGenres}
          musicConnected={musicConnected}
          sortMode={sortMode}
          setSortMode={setSortMode}
          isLoggedIn={isLoggedIn}
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

        <EventDetailsModal
          open={!!previewEvent}
          onClose={() => setPreviewEvent(null)}
          presentation="modal"
          event={toEventDetailsModalEvent(previewEvent)}
          primaryAction={
            previewEvent
              ? {
                  label: ticketCtaLabel(previewEvent),
                  icon: <HugeiconsIcon icon={Ticket01Icon} size={16} />,
                  onClick: () => {
                    setPreviewEvent(null);
                    router.push(`${String(detailBasePath).replace(/\/$/, '')}/${previewEvent.id}`);
                  },
                }
              : null
          }
          secondaryAction={
            previewEvent
              ? {
                  label: 'Open Album',
                  icon: <HugeiconsIcon icon={Calendar01Icon} size={16} />,
                  href: `/album/${previewEvent.albumId || previewEvent.id}`,
                  onClick: () => setPreviewEvent(null),
                }
              : null
          }
        />
      </div>
    </div>
  );
};

export default Events;
