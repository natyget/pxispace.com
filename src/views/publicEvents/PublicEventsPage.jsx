'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { eventsService } from '@/services/events';
import { getAdSlot } from '@/services/ads';
import { musicService } from '@/services/music';
import { getAnonId, queueAdImpression, trackAdClick, useAdImpression } from '@/lib/adTracking';
import EventCard from '@/views/events/EventCard';
import CreateEventEmptyState from '@/components/discover/CreateEventEmptyState';
import DiscoverStage, { StageSkeleton } from '@/components/discover/DiscoverStage';
import FilterPill from '@/components/discover/FilterPill';
import '@/components/discover/discover.css';
import { loadFavoriteEventIds, toggleFavoriteEventId } from '@/lib/eventFavorites';
import { useAuth } from '@/contexts/AuthContext';
import { resolveEventCity } from '@/lib/seo/cities';
import { trackSearchDebounced, trackSelectItem, trackViewItemList, trackViewSearchResults } from '@/lib/analytics';
const DEFAULT_IMG =
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=2070';

// GA4 list identity. The SORT changes what the list is (a taste-ranked grid is a
// different surface from newest-first browse), so it changes the id; the time /
// city / text filters keep the id and just re-fire with a new item set.
const LIST_BROWSE = { id: 'events_browse', name: 'Browse events' };
const LIST_TASTE_MATCH = { id: 'events_taste_match', name: 'Browse events, music match' };
const LIST_WISHLIST = { id: 'wishlist', name: 'Wishlist' };
const LIST_FEATURED = { id: 'events_featured', name: 'Featured events' };
// GA4 accepts at most 200 items per hit; the grid only ever fetches 48, so this is
// a guard rather than a real truncation.
const MAX_LIST_ITEMS = 50;

function normalizeApiEvent(e) {
  const paid = e.ticketType === 'PAID';
  const sym = e.currency === 'EUR' ? '€' : '$';
  // Keep the NUMBER as well as the display string: GA4 items[].price needs a
  // number and "$12.00" parses to NaN.
  const priceUsd = paid && e.ticketPrice != null && Number(e.ticketPrice) > 0 ? Number(e.ticketPrice) : 0;
  const price = priceUsd > 0 ? `${sym}${priceUsd.toFixed(2)}` : 'Free';

  const vs = e.vendorStats;
  const vendorHint =
    vs && typeof vs.hostEventsCreated === 'number'
      ? `Host, ${vs.hostEventsCreated} events, ${vs.hostTicketsSold ?? 0} tickets sold`
      : null;

  return {
    // Keep fields used by hero
    id: e.id,
    title: e.name,
    coverImage: e.coverImage || DEFAULT_IMG,
    venue: e.location || 'Location TBA',
    createdAt: e.createdAt ? new Date(e.createdAt) : null,
    startDate: e.startDate ? new Date(e.startDate) : null,
    price,
    attendees: e._count?.tickets ?? 0,
    ticketType: e.ticketType || null,
    albumId: e.albumId || e.albums?.[0]?.id || null,
    // Populated only when the discover fetch requests `includeMatch` (music-preference sort).
    musicMatchScore: e.musicMatchScore ?? null,
    // Not sent by the API yet (see the app's docs/handoff/CTO-HANDOFF.md, item 9). Until then the
    // cover shows the host's face alone and prints the event name over the artwork.
    attendeePreview: Array.isArray(e.attendeePreview) ? e.attendeePreview : [],
    hideNameOnCover: e.hideNameOnCover === true,

    // Fields used by original EventCard UI
    image: e.coverImage || DEFAULT_IMG,
    location: e.location || 'Location TBA',
    // What the city filter reads. Kept apart from the display fields above, which fall back
    // to "Location TBA" — a string that must never count as being in a city.
    cityText: e.location || '',
    date: e.startDate
      ? new Date(e.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : 'Date TBA',
    members: e._count?.tickets ?? 0,
    status:
      (e._count?.tickets ?? 0) > 200
        ? 'Hot'
        : e.visibility === 'PUBLIC'
          ? 'Public'
          : String(e.visibility || 'Event'),
    vendorHint,
    organizerAvatar: e.host?.avatarUrl || e.user?.avatarUrl || null,
    organizerName: e.host?.name || e.host?.username || e.user?.name || e.user?.username || 'Host',

    // Read by the album card and the stage: the host (discover rows carry `organizer`), the
    // event stamp (visibility picks date-only vs name-only; keywords pick the look), the venue.
    organizer: e.organizer || null,
    visibility: e.visibility || 'PUBLIC',
    stampImageUrl: e.stampImageUrl || null,
    venueName: e.venueName || '',
    description: typeof e.description === 'string' ? e.description : '',
    genres: e.playlist?.topGenres || [],
    // The previous edition of a recurring night, when the API has one: up to two polaroids and
    // a reaction count for the record's label. Absent today, so the record just pops.
    // Shape (same as the app reads; see its docs/handoff/CTO-HANDOFF.md, item 6):
    //   previousEdition: { topReaction: { emoji, count }, photos: [{ id, url, thumbnailUrl }] }
    pastPhotos: (e.previousEdition?.photos || [])
      .map((photo) => (typeof photo === 'string' ? photo : photo?.thumbnailUrl || photo?.url))
      .filter(Boolean)
      .slice(0, 2),
    pastReactions: e.previousEdition?.topReaction?.count ?? e.previousEdition?.reactions ?? null,

    // GA4 taxonomy fields. Carried on the normalized event so every tracking call
    // on this page has real values: the discover payload has all of these and the
    // display shape used to throw them away.
    hostId: e.createdBy || e.organizer?.id || null,
    city: resolveEventCity(e)?.name || null,
    // `genre` is not sent yet (handoff item 9); `playlist` only comes with match scores.
    genre: e.genre || e.playlist?.topGenres?.[0] || null,
    // The host's song: the pulled-out record plays its preview, and the event view shows it.
    topSong: e.topSong && typeof e.topSong === 'object' ? e.topSong : null,
    topSongArtworkUrl: e.topSongArtworkUrl || null,
    value: priceUsd,
  };
}

/** Sponsored creative → the page's normalized event shape (carries its ad as __ad). */
function normalizeAdEvent(ad) {
  const e = ad.event;
  const paid = e.ticketType === 'PAID';
  const sym = e.currency === 'EUR' ? '€' : '$';
  const priceUsd = paid && Number(e.ticketPrice) > 0 ? Number(e.ticketPrice) : 0;
  return {
    id: e.id,
    title: e.name,
    coverImage: e.coverImage || DEFAULT_IMG,
    venue: e.venueName || e.location || 'Location TBA',
    createdAt: null,
    startDate: e.startDate ? new Date(e.startDate) : null,
    price: priceUsd > 0 ? `${sym}${priceUsd.toFixed(2)}` : 'Free',
    attendees: 0,
    ticketType: e.ticketType || null,
    albumId: null,
    image: e.coverImage || DEFAULT_IMG,
    location: e.venueName || e.location || 'Location TBA',
    // A sponsored event's display fields prefer the venue name ("The Sinclair"), which says
    // nothing about the city — so the filter reads venue name and address together.
    cityText: [e.venueName, e.location].filter(Boolean).join(' '),
    date: e.startDate
      ? new Date(e.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : 'Date TBA',
    members: 0,
    status: 'Sponsored',
    vendorHint: null,
    organizerAvatar: null,
    organizerName: '',
    organizer: e.organizer || null,
    visibility: e.visibility || 'PUBLIC',
    stampImageUrl: e.stampImageUrl || null,
    venueName: e.venueName || '',
    description: typeof e.description === 'string' ? e.description : '',
    genres: [],
    pastPhotos: [],
    pastReactions: null,

    // GA4 taxonomy fields — the ad payload carries no creator, so host_id stays unset.
    hostId: null,
    city: resolveEventCity(e)?.name || null,
    genre: null,
    value: priceUsd,
    __ad: ad,
  };
}

/** Grid card that fires one viewable impression when sponsored. */
function AdAwareEventCard({ event, favorited, onToggleFavorite, listId, listName, index, recSource, recRank }) {
  const ad = event.__ad || null;
  const impressionRef = useAdImpression(ad);
  return (
    <div ref={ad ? impressionRef : undefined} className="min-w-0">
      <EventCard
        event={event}
        favorited={favorited}
        onToggleFavorite={onToggleFavorite}
        detailBasePath="/events"
        sponsored={Boolean(ad)}
        onSponsoredClick={ad ? () => trackAdClick(ad) : undefined}
        listId={listId}
        listName={listName}
        index={index}
        recSource={recSource}
        recRank={recRank}
      />
    </div>
  );
}

/** Sponsored cards drop into the grid after every 7 organic cards. */
function interleaveGridAds(list, ads) {
  if (!ads.length) return list;
  const out = [];
  let adCursor = 0;
  list.forEach((item, index) => {
    out.push(item);
    if ((index + 1) % 7 === 0 && adCursor < ads.length) {
      out.push(normalizeAdEvent(ads[adCursor]));
      adCursor += 1;
    }
  });
  // Small lists still show the first sponsored card at the end.
  if (adCursor === 0 && out.length > 0) out.push(normalizeAdEvent(ads[0]));
  return out;
}

const TRENDING_OPTIONS = [
  { id: 'all', label: 'All' },
  { id: 'nearest', label: 'Nearest' },
  { id: 'largest', label: 'Largest' },
];
// What the sort button offers, worded for the reader. The ids are the TRENDING_OPTIONS ids.
const SORT_OPTIONS = [
  { id: 'all', label: 'Newest' },
  { id: 'nearest', label: 'Soonest' },
  { id: 'largest', label: 'Most going' },
];
const SORT_MATCH = { id: 'match', label: 'Music match' };
const TIME_OPTIONS = [
  { id: 'all', label: 'All' },
  { id: 'today', label: 'Today' },
  { id: 'this_week', label: 'This week' },
  { id: 'this_month', label: 'This month' },
];
// PXI operates in New York and Boston only. Offering city filters we do not serve
// produces empty result sets and advertises coverage that does not exist.
// Keep this in step with src/lib/seo/cities.js — that registry drives /discover/[city].
const CITY_PRESETS = ['All', 'New York City', 'Boston'];

// Aliases for the operational cities only. These mirror the `match` arrays in
// src/lib/seo/cities.js; keep the two in step so the filter and the /discover hub
// agree on which events belong to a city.
const CITY_ALIASES = {
  'new york city': [
    'new york city',
    'new york',
    'nyc',
    'manhattan',
    'brooklyn',
    'queens',
    'bronx',
    'harlem',
    'bushwick',
    'williamsburg',
  ],
  boston: [
    'boston',
    'boston ma',
    'cambridge',
    'cambridge ma',
    'somerville',
    'allston',
    'brighton',
    'dorchester',
    'roxbury',
    'jamaica plain',
    'back bay',
    'seaport',
    'fenway',
    'brookline',
  ],
};

function normalizeCityText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function compactCityText(value) {
  return normalizeCityText(value).replace(/\s+/g, '');
}

function cityAliases(city) {
  const normalized = normalizeCityText(city);
  return CITY_ALIASES[normalized] || [normalized];
}

function locationMatchesCity(location, city) {
  if (!city || city === 'All') return true;

  const normalizedLocation = normalizeCityText(location);
  if (!normalizedLocation) return false;

  const compactLocation = compactCityText(location);
  const locationTokens = new Set(normalizedLocation.split(' ').filter(Boolean));

  return cityAliases(city).some((alias) => {
    const normalizedAlias = normalizeCityText(alias);
    if (!normalizedAlias) return false;
    if (normalizedLocation.includes(normalizedAlias)) return true;

    const compactAlias = compactCityText(alias);
    if (compactAlias.length > 2 && compactLocation.includes(compactAlias)) return true;

    return compactAlias.length <= 2 && locationTokens.has(compactAlias);
  });
}

function cityOptionMatchesQuery(city, query) {
  const normalizedQuery = normalizeCityText(query);
  if (!normalizedQuery) return true;
  return cityAliases(city).some((alias) => normalizeCityText(alias).includes(normalizedQuery));
}

/** The one city test for the banner and the grid, so the two can never disagree. */
function eventInCity(ev, city) {
  return locationMatchesCity(ev.cityText, city);
}

const TIME_PHRASES = { today: 'today', this_week: 'this week', this_month: 'this month' };

/**
 * Copy for an empty list. It names what emptied the list, so "no events in Boston today" is
 * never read as "PXI has nothing on". `more` means the banner above still has events, so an
 * empty grid under it is the end of the list rather than an empty site.
 */
function emptyResultsCopy({ city = 'All', time = 'all', query = '', more = false }) {
  const inCity = city !== 'All' ? ` in ${city}` : '';
  const when = TIME_PHRASES[time] ? ` ${TIME_PHRASES[time]}` : '';
  const people = city !== 'All' ? `people in ${city}` : 'people';
  if (query) {
    const shown = query.length > 40 ? `${query.slice(0, 40)}…` : query;
    return {
      title: `Nothing matches “${shown}”${inCity}${when}.`,
      blurb: `Try another search, or put your own night on PXI and ${people} will find it here.`,
    };
  }
  if (inCity && !when) {
    // Same words as the empty /discover/[city] hub: both are the same fetch filtered by city.
    return {
      title: `No live events${inCity} yet.`,
      blurb: `Be the first. Put your night on PXI and ${people} will find it here.`,
    };
  }
  if (inCity || when) {
    return {
      title: `No events${inCity}${when}.`,
      blurb: `Hosting something? Put it on PXI and ${people} will find it here.`,
    };
  }
  if (more) {
    return {
      title: 'That’s everything for now.',
      blurb: 'New events land here as hosts post them. Hosting something? Put it on PXI and people will find it here.',
    };
  }
  return {
    title: 'No live events yet.',
    blurb: 'Be the first. Put your night on PXI and people will find it here.',
  };
}

function EventCardSkeleton() {
  return (
    <div className="dsc-card" aria-hidden="true">
      <div className="dsc-skel dsc-skel-card" />
      <div className="dsc-card-cap">
        <div className="dsc-card-txt" style={{ width: '100%' }}>
          <div className="dsc-skel" style={{ height: 10, width: '55%' }} />
          <div className="dsc-skel" style={{ height: 12, width: '80%', marginTop: 8 }} />
        </div>
      </div>
    </div>
  );
}

function EventsGridSkeleton({ count = 8 }) {
  return (
    <div className="dsc-grid" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <EventCardSkeleton key={i} />
      ))}
    </div>
  );
}

// The navbar has room for the filter pill from here up; below it the pill sits in the page
// under the title, like the app. The stage itself goes two-column later (see discover.css).
const WIDE_QUERY = '(min-width: 861px)';
function subscribeWide(onChange) {
  const m = window.matchMedia(WIDE_QUERY);
  m.addEventListener('change', onChange);
  return () => m.removeEventListener('change', onChange);
}
const readWide = () => window.matchMedia(WIDE_QUERY).matches;
const readWideOnServer = () => false;

// /events gets #navbar-center-portal from the Navbar. Look once after mount, as an effect would,
// rather than during render (on a client-side navigation the navbar can commit in the same pass).
function subscribePortal(onChange) {
  const t = setTimeout(onChange, 0);
  return () => clearTimeout(t);
}
const readPortal = () => document.getElementById('navbar-center-portal');
const readPortalOnServer = () => null;

export default function PublicEventsPage() {
  const { user } = useAuth();
  const isLoggedIn = !!user?.id;
  const searchParams = useSearchParams();
  // The wishlist view lives behind the profile dropdown's "Wishlist" link (?wishlist=1).
  const favoritesOnly = searchParams.get('wishlist') === '1';
  // Dev only: ?sample=1 swaps the live list for sample events (components/discover/sampleEvents.js)
  // so the carousel can be previewed with a thin dev database. Dead code in production builds.
  const sampleMode = process.env.NODE_ENV !== 'production' && searchParams.get('sample') === '1';

  const [events, setEvents] = useState([]);
  const [loadedKey, setLoadedKey] = useState(null);
  const [favoriteIds, setFavoriteIds] = useState(() => new Set());
  const [favoritesReady, setFavoritesReady] = useState(false);
  // Music-preference sort: re-ranks the grid by the signed-in user's music match score.
  const [musicSortActive, setMusicSortActive] = useState(false);
  const [musicConnectedRaw, setMusicConnected] = useState(null);
  const [heroIndex, setHeroIndex] = useState(0);

  const [trending, setTrending] = useState(TRENDING_OPTIONS[0].id); // All | Nearest | Largest
  const [timeFilter, setTimeFilter] = useState(TIME_OPTIONS[0].id); // All | Today | This week | This month
  const [cityFilter, setCityFilter] = useState(CITY_PRESETS[0]);
  const [cityQuery, setCityQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const isWide = useSyncExternalStore(subscribeWide, readWide, readWideOnServer);
  const portalTarget = useSyncExternalStore(subscribePortal, readPortal, readPortalOnServer);

  const [featuredAds, setFeaturedAds] = useState([]);
  const [gridAds, setGridAds] = useState([]);

  useEffect(() => {
    const anonId = getAnonId();
    getAdSlot('WEB_FEATURED', 3, anonId).then(setFeaturedAds);
    getAdSlot('WEB_DISCOVERY', 4, anonId).then(setGridAds);
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return undefined;
    let alive = true;
    musicService
      .getProfile()
      .then((p) => alive && setMusicConnected(!!p?.connected))
      .catch(() => alive && setMusicConnected(null));
    return () => {
      alive = false;
    };
  }, [isLoggedIn]);
  const musicConnected = isLoggedIn ? musicConnectedRaw : null;

  const musicSortEffective = musicSortActive && isLoggedIn;

  // One request per (sort, signed-in, sample) combination. `loading` is derived from which key
  // last finished, so switching sort never flashes the skeleton over events already on screen.
  const fetchKey = `${musicSortEffective ? 'match' : 'vendor'}|${isLoggedIn ? 'in' : 'out'}|${sampleMode ? 'sample' : 'live'}`;
  const loading = loadedKey !== fetchKey;

  useEffect(() => {
    let alive = true;
    const finish = (list) => {
      if (!alive) return;
      setEvents(list);
      setLoadedKey(fetchKey);
    };
    if (process.env.NODE_ENV !== 'production' && fetchKey.endsWith('|sample')) {
      import('@/components/discover/sampleEvents').then((m) => finish(m.SAMPLE_API_EVENTS.map(normalizeApiEvent)));
    } else {
      // Signed-in readers always get match scores (the stage prints TASTE MATCH for the event in
      // front of them); the ORDER is only by match when the sort is switched on.
      eventsService
        .getDiscoverEvents(48, 0, musicSortEffective ? 'match' : 'vendor', isLoggedIn ? { includeMatch: true } : {})
        .then((res) => finish((res.events || []).map(normalizeApiEvent)))
        .catch(() => finish([]));
    }
    return () => {
      alive = false;
    };
  }, [fetchKey, musicSortEffective, isLoggedIn]);

  const loadFavorites = useCallback(() => {
    loadFavoriteEventIds(isLoggedIn)
      .then((ids) => {
        setFavoriteIds(ids);
        setFavoritesReady(true);
      })
      .catch(() => {
        setFavoriteIds(new Set());
        setFavoritesReady(true);
      });
  }, [isLoggedIn]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const handleToggleFavorite = useCallback(
    (id) => {
      const isFavorite = favoriteIds.has(String(id));
      toggleFavoriteEventId(id, isFavorite, isLoggedIn)
        .then(setFavoriteIds)
        .catch(() => loadFavorites());
    },
    [favoriteIds, isLoggedIn, loadFavorites]
  );

  const filteredSortedEvents = useMemo(() => {
    let list = [...events];

    const q = normalizeCityText(searchQuery);
    if (q) {
      list = list.filter((e) => {
        const hay = normalizeCityText(`${e.title ?? ''} ${e.venue ?? ''} ${e.location ?? ''}`);
        return hay.includes(q);
      });
    }

    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(endOfToday.getDate() + 1);
    const startOfWeek = new Date(startOfToday);
    const day = startOfWeek.getDay(); // 0=Sun
    const diffToMon = (day + 6) % 7;
    startOfWeek.setDate(startOfWeek.getDate() - diffToMon);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 7);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    if (timeFilter === 'today') {
      list = list.filter((e) => {
        const t = e.startDate?.getTime?.();
        return typeof t === 'number' && t >= startOfToday.getTime() && t < endOfToday.getTime();
      });
    } else if (timeFilter === 'this_week') {
      list = list.filter((e) => {
        const t = e.startDate?.getTime?.();
        return typeof t === 'number' && t >= startOfWeek.getTime() && t < endOfWeek.getTime();
      });
    } else if (timeFilter === 'this_month') {
      list = list.filter((e) => {
        const t = e.startDate?.getTime?.();
        return typeof t === 'number' && t >= startOfMonth.getTime() && t < endOfMonth.getTime();
      });
    }

    // Music-preference sort takes priority over the (currently static) trending modes —
    // the discover fetch already asked the backend to rank by match score when active,
    // this client-side sort is a defensive re-application of that order.
    if (musicSortEffective) {
      list.sort((a, b) => (b.musicMatchScore ?? -1) - (a.musicMatchScore ?? -1));
    } else if (trending === 'all') {
      // Basic default ordering is by createdAt desc.
      list.sort((a, b) => (b.createdAt?.getTime?.() ?? 0) - (a.createdAt?.getTime?.() ?? 0));
    } else if (trending === 'nearest') {
      list.sort((a, b) => (a.startDate?.getTime?.() ?? Number.MAX_SAFE_INTEGER) - (b.startDate?.getTime?.() ?? Number.MAX_SAFE_INTEGER));
    } else if (trending === 'largest') {
      list.sort((a, b) => (b.attendees ?? 0) - (a.attendees ?? 0));
    }

    if (cityFilter && cityFilter !== 'All') {
      list = list.filter((e) => eventInCity(e, cityFilter));
    }

    if (favoritesOnly) {
      list = list.filter((e) => favoriteIds.has(String(e.id)));
    }

    return list;
  }, [events, trending, timeFilter, cityFilter, searchQuery, favoritesOnly, favoriteIds, musicSortEffective]);

  // Paid featured slots pin first (labeled Sponsored); organic newest-first fills
  // the remaining stage slots, deduped by event id. A chosen city applies to both, so a
  // reader who picked Boston never gets a night somewhere else as the featured event.
  // Time and search stay off the stage; those narrow the grid below it.
  const heroEvents = useMemo(() => {
    const inCity = (e) => eventInCity(e, cityFilter);
    const paid = featuredAds.map(normalizeAdEvent).filter(inCity);
    const paidIds = new Set(paid.map((e) => String(e.id)));
    const organic = events
      .filter(inCity)
      .sort((a, b) => (b.createdAt?.getTime?.() ?? 0) - (a.createdAt?.getTime?.() ?? 0))
      .filter((e) => !paidIds.has(String(e.id)));
    return [...paid, ...organic].slice(0, 8);
  }, [events, featuredAds, cityFilter]);

  // A new city is a new set of slides, so the stage starts again from the first.
  const chooseCity = (city) => {
    setCityFilter(city);
    setHeroIndex(0);
  };

  const heroCurrent = heroEvents.length ? Math.min(heroIndex, heroEvents.length - 1) : 0;
  const featured = heroEvents.length ? heroEvents[heroCurrent] : null;

  // Each paid slide counts one impression when it comes into the centre.
  useEffect(() => {
    if (featured?.__ad) queueAdImpression(featured.__ad);
  }, [featured]);

  // The blurred backdrop follows the centred cover. Two layers: the one that just left stays
  // underneath while the new one fades in on top (state derived while rendering, no effect).
  const cover = featured?.coverImage ?? null;
  const [bg, setBg] = useState({ cur: null, prev: null });
  if (cover && bg.cur !== cover) {
    setBg({ cur: cover, prev: bg.cur });
  }

  const isFiltered =
    searchQuery || timeFilter !== 'all' || cityFilter !== 'All' || favoritesOnly || trending !== 'all' || musicSortEffective;

  const rest = useMemo(() => {
    if (!isFiltered) {
      return filteredSortedEvents.length > 1 ? filteredSortedEvents.slice(1) : [];
    }
    return filteredSortedEvents;
  }, [filteredSortedEvents, isFiltered]);

  // Sponsored discovery cards join the grid only in the unfiltered browse view.
  const restWithAds = useMemo(() => {
    if (isFiltered) return rest;
    return interleaveGridAds(rest, gridAds);
  }, [rest, gridAds, isFiltered]);

  // ── Empty states ──────────────────────────────────────────────────────────
  // WEB-1 on /events: when a filter empties the list, the reader gets the same "create one"
  // CTA as an empty city hub, worded for what emptied it, plus a way back to everything.
  const narrowing = Boolean(searchQuery.trim()) || timeFilter !== 'all' || cityFilter !== 'All';

  const resetFilters = () => {
    setTrending(TRENDING_OPTIONS[0].id);
    setMusicSortActive(false);
    setTimeFilter(TIME_OPTIONS[0].id);
    chooseCity(CITY_PRESETS[0]);
    setCityQuery('');
    setSearchQuery('');
  };

  const showAllButton = (
    <button type="button" onClick={resetFilters} className="dsc-link">
      Show all events
    </button>
  );

  // Not on the wishlist: that list is the reader's own saves, which load separately from the
  // events, so an empty state there could claim "nothing" before the saves arrive.
  const gridEmpty =
    loading || favoritesOnly || restWithAds.length > 0 ? null : (
      <CreateEventEmptyState
        {...emptyResultsCopy({
          city: cityFilter,
          time: timeFilter,
          query: searchQuery.trim(),
          more: heroEvents.length > 0,
        })}
        secondary={narrowing ? showAllButton : null}
      />
    );

  // Same wait for the saves, then the same words the /wishlist page uses.
  const wishlistEmpty =
    favoritesOnly && favoritesReady && !loading && restWithAds.length === 0 ? (
      <div className="dsc-empty">
        <h2 className="dsc-empty-title">Nothing saved yet</h2>
        <p className="dsc-empty-blurb">Tap the heart on any event to keep it here for later.</p>
        <div className="dsc-empty-actions">
          <Link href="/events" className="dsc-join">
            Discover events
          </Link>
        </div>
      </div>
    ) : null;

  // Nothing to feature once loading is done: drop the stage rather than pulse its skeleton forever.
  const showHero = loading || heroEvents.length > 0;

  // ── Analytics ─────────────────────────────────────────────────────────────
  // List tracking is driven off state, never off a render, so a re-render never doubles a hit.
  const activeList = favoritesOnly ? LIST_WISHLIST : musicSortEffective ? LIST_TASTE_MATCH : LIST_BROWSE;

  // The text filter re-runs on every keystroke, so everything keyed off the search
  // term waits for it to settle first — otherwise "techno" is six list impressions.
  const [settledSearch, setSettledSearch] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setSettledSearch(searchQuery.trim()), 700);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const listKeyRef = useRef(null);
  useEffect(() => {
    if (loading || restWithAds.length === 0) return;
    // One view_item_list per list + filter combination — not per render, not per scroll.
    const key = [activeList.id, trending, timeFilter, cityFilter, settledSearch].join('|');
    if (listKeyRef.current === key) return;
    listKeyRef.current = key;
    trackViewItemList({
      listId: activeList.id,
      listName: activeList.name,
      items: restWithAds.slice(0, MAX_LIST_ITEMS),
    });
  }, [loading, restWithAds, activeList, trending, timeFilter, cityFilter, settledSearch]);

  const featuredKeyRef = useRef(null);
  useEffect(() => {
    if (heroEvents.length === 0) return;
    const key = heroEvents.map((e) => e.id).join(',');
    if (featuredKeyRef.current === key) return;
    featuredKeyRef.current = key;
    trackViewItemList({
      listId: LIST_FEATURED.id,
      listName: LIST_FEATURED.name,
      items: heroEvents.slice(0, MAX_LIST_ITEMS),
    });
  }, [heroEvents]);

  // The client-side filter is instant, so the shared 700ms debounce is the only
  // thing standing between GA4 and one `search` hit per keystroke.
  useEffect(() => {
    const term = searchQuery.trim();
    if (!term) return;
    trackSearchDebounced({ searchTerm: term });
  }, [searchQuery]);

  const searchResultsCount = filteredSortedEvents.length;
  const searchReportedRef = useRef(null);
  useEffect(() => {
    if (!settledSearch) {
      searchReportedRef.current = null;
      return;
    }
    if (loading || searchReportedRef.current === settledSearch) return;
    searchReportedRef.current = settledSearch;
    trackViewSearchResults({ searchTerm: settledSearch, resultsCount: searchResultsCount });
  }, [settledSearch, searchResultsCount, loading]);

  // Drop a pending debounced `search` when the page goes away.
  useEffect(() => () => trackSearchDebounced.cancel(), []);

  // The stage's cover and JOIN button are the featured-list equivalent of clicking a card.
  const handleOpenFeatured = useCallback((ev, i) => {
    if (ev.__ad) trackAdClick(ev.__ad);
    trackSelectItem({
      listId: LIST_FEATURED.id,
      listName: LIST_FEATURED.name,
      item: ev,
      index: i,
    });
  }, []);

  // The sort button: the three plain orders for everyone, plus the signed-in music match.
  const sortOptions = isLoggedIn ? [...SORT_OPTIONS, SORT_MATCH] : SORT_OPTIONS;
  const sortKey = musicSortEffective ? SORT_MATCH.id : trending;
  const chooseSort = (id) => {
    if (id === SORT_MATCH.id) {
      setMusicSortActive(true);
      return;
    }
    setMusicSortActive(false);
    setTrending(id);
  };

  const pill = (
    <FilterPill
      timeOptions={TIME_OPTIONS}
      timeFilter={timeFilter}
      onTime={setTimeFilter}
      cityOptions={CITY_PRESETS}
      cityFilter={cityFilter}
      onCity={chooseCity}
      cityQuery={cityQuery}
      onCityQuery={setCityQuery}
      cityMatches={cityOptionMatchesQuery}
      searchQuery={searchQuery}
      onSearch={setSearchQuery}
      sortOptions={sortOptions}
      sortKey={sortKey}
      onSort={chooseSort}
    />
  );

  const shown = filteredSortedEvents.length;
  const showBrowseHeading = favoritesOnly || loading || restWithAds.length > 0;

  return (
    <div className="dsc-root">
      {showHero && bg.cur ? (
        <div className="dsc-backdrop" aria-hidden="true">
          {bg.prev ? <img key={`p-${bg.prev}`} src={bg.prev} alt="" /> : null}
          <img key={`c-${bg.cur}`} className="dsc-bd-cur" src={bg.cur} alt="" />
        </div>
      ) : null}

      {isWide && portalTarget ? createPortal(<div className="dsc-navpill">{pill}</div>, portalTarget) : null}

      <div className="dsc-wrap">
        <header className="dsc-head">
          <p className="dsc-title" aria-hidden="true">
            {favoritesOnly ? 'Wishlist' : 'Discover'}
          </p>
          {!loading && shown > 0 ? (
            <span className="dsc-count">
              {shown} event{shown === 1 ? '' : 's'}
            </span>
          ) : null}
          {!isWide ? <div className="dsc-pillrow">{pill}</div> : null}
        </header>

        {showHero ? (
          loading && heroEvents.length === 0 ? (
            <StageSkeleton />
          ) : (
            <DiscoverStage
              events={heroEvents}
              index={heroCurrent}
              onIndexChange={setHeroIndex}
              favoriteIds={favoriteIds}
              onToggleFavorite={handleToggleFavorite}
              isLoggedIn={isLoggedIn}
              musicConnected={musicConnected}
              onOpen={handleOpenFeatured}
            />
          )
        ) : null}

        {musicSortEffective && musicConnected === false ? (
          <div className="dsc-note">
            <p>Connect Spotify for personalized ranking.</p>
            <Link href="/dashboard/account">Connect →</Link>
          </div>
        ) : null}

        <section className="dsc-sec" aria-labelledby="dsc-browse-title">
          {showBrowseHeading ? (
            <div className="dsc-sec-h">
              <h2 id="dsc-browse-title" className="dsc-sec-t">
                {favoritesOnly ? 'Your Wishlist' : 'Upcoming Events'}
              </h2>
              {favoritesOnly ? (
                <Link href="/events" className="dsc-sec-link">
                  Browse all events →
                </Link>
              ) : null}
            </div>
          ) : null}

          {loading && events.length === 0 ? (
            <EventsGridSkeleton />
          ) : gridEmpty ? (
            gridEmpty
          ) : wishlistEmpty ? (
            wishlistEmpty
          ) : (
            <div className="dsc-grid">
              {restWithAds.map((ev, i) => (
                <AdAwareEventCard
                  key={ev.__ad ? `ad-${ev.__ad.campaignId}-${ev.id}` : ev.id}
                  event={ev}
                  favorited={favoriteIds.has(String(ev.id))}
                  onToggleFavorite={handleToggleFavorite}
                  listId={activeList.id}
                  listName={activeList.name}
                  index={i}
                  recSource={musicSortEffective ? 'taste_match' : undefined}
                  recRank={musicSortEffective ? i : undefined}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
