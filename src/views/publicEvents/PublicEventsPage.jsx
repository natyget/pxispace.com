'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { eventsService } from '@/services/events';
import EventCard from '@/views/events/EventCard';
import { loadFavoriteEventIds, toggleFavoriteEventId } from '@/lib/eventFavorites';
import { useAuth } from '@/contexts/AuthContext';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowDown01Icon, FavouriteIcon } from '@hugeicons/core-free-icons';
const DEFAULT_IMG =
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=2070';

function normalizeApiEvent(e) {
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

    // Fields used by original EventCard UI
    image: e.coverImage || DEFAULT_IMG,
    location: e.location || 'Location TBA',
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
  };
}

function formatHeroDate(d) {
  if (!d) return 'Date TBA';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const TRENDING_OPTIONS = [
  { id: 'all', label: 'All' },
  { id: 'nearest', label: 'Nearest' },
  { id: 'largest', label: 'Largest' },
];
const TIME_OPTIONS = [
  { id: 'all', label: 'All' },
  { id: 'today', label: 'Today' },
  { id: 'this_week', label: 'This week' },
  { id: 'this_month', label: 'This month' },
];
const CITY_PRESETS = [
  'All',
  'New York City',
  'Miami',
  'Los Angeles',
  'Washington DC',
  'Boston',
  'Atlanta',
];

const CITY_ALIASES = {
  'new york city': ['new york city', 'new york', 'nyc', 'manhattan', 'brooklyn', 'queens'],
  miami: ['miami', 'miami fl'],
  'los angeles': ['los angeles', 'los angeles ca', 'la', 'l a'],
  'washington dc': [
    'washington dc',
    'washington d c',
    'washington district columbia',
    'washington district of columbia',
    'district of columbia',
    'district columbia',
    'dc',
    'd c',
  ],
  boston: ['boston', 'boston ma', 'cambridge', 'cambridge ma'],
  atlanta: ['atlanta', 'atlanta ga'],
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

function EventCardSkeleton() {
  return (
    <div className="w-full max-w-[420px] mx-auto">
      <div className="relative aspect-[3/4] overflow-hidden rounded-3xl bg-zinc-900/80">
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-white/[0.08] via-white/[0.035] to-transparent" />
        <div className="absolute left-4 top-4 h-9 w-9 rounded-full bg-white/10" />
        <div className="absolute right-4 top-4 h-9 w-9 rounded-full bg-white/10" />
        <div className="absolute inset-x-5 bottom-5 space-y-3">
          <div className="h-3 w-20 rounded-full bg-white/15" />
          <div className="h-8 w-4/5 rounded-xl bg-white/15" />
          <div className="h-4 w-1/2 rounded-full bg-white/10" />
        </div>
      </div>
    </div>
  );
}

function EventsGridSkeleton({ count = 6 }) {
  return (
    <div
      className="grid w-full justify-center gap-6 py-6 md:py-0"
      style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 350px), 1fr))' }}
      aria-hidden="true"
    >
      {Array.from({ length: count }).map((_, i) => (
        <EventCardSkeleton key={i} />
      ))}
    </div>
  );
}

export default function PublicEventsPage() {
  const { user } = useAuth();
  const isLoggedIn = !!user?.id;
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState(() => new Set());
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [heroIndex, setHeroIndex] = useState(0);
  const [bgCover, setBgCover] = useState(null);
  const [bgPrevCover, setBgPrevCover] = useState(null);
  const [bgFadeIn, setBgFadeIn] = useState(true);
  const [activeTab, setActiveTab] = useState('featured');

  const [trending] = useState(TRENDING_OPTIONS[0].id); // All | Nearest | Largest
  const [timeFilter, setTimeFilter] = useState(TIME_OPTIONS[0].id); // All | Today | This week | This month
  const [cityFilter, setCityFilter] = useState(CITY_PRESETS[0]);
  const [cityQuery, setCityQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [openMenu, setOpenMenu] = useState(null); // 'trending' | 'time' | 'city' | null
  const [searchOpen, setSearchOpen] = useState(false);
  const filterTrayRef = useRef(null);
  const searchInputRef = useRef(null);
  const bgCoverRef = useRef(null);
  const bgTransitionIdRef = useRef(0);
  const [portalTarget, setPortalTarget] = useState(null);

  useEffect(() => {
    setPortalTarget(document.getElementById('navbar-center-portal'));
  }, []);

  useEffect(() => {
    setLoading(true);
    eventsService
      .getDiscoverEvents(48, 0, 'vendor')
      .then((res) => setEvents((res.events || []).map(normalizeApiEvent)))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  const loadFavorites = useCallback(() => {
    loadFavoriteEventIds(isLoggedIn).then(setFavoriteIds).catch(() => setFavoriteIds(new Set()));
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

    // Basic default ordering is by createdAt desc.
    if (trending === 'all') {
      list.sort((a, b) => (b.createdAt?.getTime?.() ?? 0) - (a.createdAt?.getTime?.() ?? 0));
    } else if (trending === 'nearest') {
      list.sort((a, b) => (a.startDate?.getTime?.() ?? Number.MAX_SAFE_INTEGER) - (b.startDate?.getTime?.() ?? Number.MAX_SAFE_INTEGER));
    } else if (trending === 'largest') {
      list.sort((a, b) => (b.attendees ?? 0) - (a.attendees ?? 0));
    }

    if (cityFilter && cityFilter !== 'All') {
      list = list.filter((e) => locationMatchesCity(`${e.venue ?? ''} ${e.location ?? ''}`, cityFilter));
    }

    if (favoritesOnly) {
      list = list.filter((e) => favoriteIds.has(String(e.id)));
    }

    return list;
  }, [events, trending, timeFilter, cityFilter, searchQuery, favoritesOnly, favoriteIds]);

  const heroEvents = useMemo(() => {
    let list = [...events];
    list.sort((a, b) => (b.createdAt?.getTime?.() ?? 0) - (a.createdAt?.getTime?.() ?? 0));
    return list.slice(0, 8);
  }, [events]);

  const featured = useMemo(
    () => (heroEvents.length ? heroEvents[Math.min(heroIndex, heroEvents.length - 1)] : null),
    [heroEvents, heroIndex]
  );

  const rest = useMemo(() => {
    const isFiltered = searchQuery || timeFilter !== 'all' || cityFilter !== 'All' || favoritesOnly || trending !== 'all';
    if (!isFiltered) {
      return filteredSortedEvents.length > 1 ? filteredSortedEvents.slice(1) : [];
    }
    return filteredSortedEvents;
  }, [filteredSortedEvents, searchQuery, timeFilter, cityFilter, favoritesOnly, trending]);

  // Auto-advance carousel
  useEffect(() => {
    if (heroEvents.length <= 1) return;
    const t = setInterval(() => {
      setHeroIndex((i) => (i + 1) % heroEvents.length);
    }, 5200);
    return () => clearInterval(t);
  }, [heroEvents.length]);

  useEffect(() => {
    bgCoverRef.current = bgCover;
  }, [bgCover]);

  // One crossfade per slide: blurred cover photos only.
  useEffect(() => {
    const next = featured?.coverImage ?? null;
    if (!next) return;

    const prev = bgCoverRef.current;
    if (prev === null) {
      setBgCover(next);
      setBgPrevCover(null);
      setBgFadeIn(true);
      return;
    }
    if (prev === next) return;

    const id = (bgTransitionIdRef.current += 1);
    setBgPrevCover(prev);
    setBgCover(next);
    setBgFadeIn(false);

    let raf2;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        if (bgTransitionIdRef.current !== id) return;
        setBgFadeIn(true);
      });
    });

    const t = window.setTimeout(() => {
      if (bgTransitionIdRef.current !== id) return;
      setBgPrevCover(null);
    }, 720);

    return () => {
      cancelAnimationFrame(raf1);
      if (raf2 != null) cancelAnimationFrame(raf2);
      window.clearTimeout(t);
    };
  }, [featured?.coverImage]);

  useEffect(() => {
    const onDocPointerDown = (event) => {
      if (!filterTrayRef.current) return;
      if (filterTrayRef.current.contains(event.target)) return;
      setOpenMenu(null);
    };
    document.addEventListener('pointerdown', onDocPointerDown);
    return () => document.removeEventListener('pointerdown', onDocPointerDown);
  }, []);

  const timeLabel = TIME_OPTIONS.find((o) => o.id === timeFilter)?.label ?? 'All';
  const cityLabel = cityFilter || 'All';

  return (
    <div className="min-h-screen bg-black pt-16 font-sans text-white md:pt-20">
      {portalTarget
        ? createPortal(
            <div ref={filterTrayRef} className="flex flex-nowrap items-center justify-center gap-0 rounded-full bg-white/[0.04] px-2.5 py-1 md:px-3.5 md:py-1.5 backdrop-blur-2xl border-0 shadow-lg max-w-[92vw]">
              {/* Time */}
              <div className="relative flex items-center" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => setOpenMenu((m) => (m === 'time' ? null : 'time'))}
                  className="flex items-center gap-1 rounded-full px-3 py-1.5 text-sm md:text-base font-semibold text-white/80 transition-colors hover:text-white"
                >
                  {timeLabel}
                  <HugeiconsIcon icon={ArrowDown01Icon} size={13} className="opacity-50" />
                </button>
                {openMenu === 'time' ? (
                  <div className="absolute left-0 top-full z-50 mt-2 w-52 rounded-2xl border border-white/10 bg-zinc-950/90 p-2 backdrop-blur">
                    {TIME_OPTIONS.map((o) => (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => { setTimeFilter(o.id); setOpenMenu(null); }}
                        className={`w-full rounded-xl px-3 py-2 text-left text-sm font-semibold hover:bg-white/5 ${timeFilter === o.id ? 'text-[#d946ef]' : 'text-white'}`}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <span className="text-sm md:text-base font-semibold text-white/40 px-1.5 select-none leading-none flex items-center h-full" aria-hidden="true">in</span>

              {/* City */}
              <div className="relative flex items-center" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => setOpenMenu((m) => (m === 'city' ? null : 'city'))}
                  className="flex items-center gap-1 rounded-full px-3 py-1.5 text-sm md:text-base font-semibold text-white/80 transition-colors hover:text-white"
                >
                  {cityLabel === 'All' ? 'City' : cityLabel}
                  <HugeiconsIcon icon={ArrowDown01Icon} size={13} className="opacity-50" />
                </button>
                {openMenu === 'city' ? (
                  <div className="absolute left-0 top-full z-50 mt-2 w-[320px] rounded-2xl border border-white/10 bg-zinc-950/90 p-2 backdrop-blur">
                    <div className="px-2 pb-2">
                      <input
                        value={cityQuery}
                        onChange={(e) => setCityQuery(e.target.value)}
                        placeholder="Search city..."
                        className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none"
                      />
                    </div>
                    <div className="max-h-64 overflow-auto">
                      {CITY_PRESETS.filter((c) => cityOptionMatchesQuery(c, cityQuery)).map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => { setCityFilter(c); setOpenMenu(null); }}
                          className={`w-full rounded-xl px-3 py-2 text-left text-sm font-semibold hover:bg-white/5 ${cityFilter === c ? 'text-[#d946ef]' : 'text-white'}`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              {user?.id ? (
                <>
                  <span className="h-5 w-px bg-white/10 mx-2" aria-hidden />
                  {/* Favorites heart */}
                  <button
                    type="button"
                    onClick={() => setFavoritesOnly((v) => !v)}
                    className={`rounded-full p-2.5 transition-colors ${favoritesOnly ? 'text-[#d946ef]' : 'text-white/50 hover:text-white'}`}
                    aria-label="Toggle favorites"
                  >
                    <HugeiconsIcon icon={FavouriteIcon} size={18} className={favoritesOnly ? 'fill-current' : ''} />
                  </button>
                </>
              ) : null}

              <span className="h-5 w-px bg-white/10 mx-2" aria-hidden />

              {/* Expandable search */}
              <div className="flex items-center">
                {searchOpen ? (
                  <input
                    ref={searchInputRef}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onBlur={() => { if (!searchQuery) setSearchOpen(false); }}
                    placeholder="Search..."
                    className="w-[85px] sm:w-[120px] rounded-full bg-transparent px-2 py-1 text-xs text-white placeholder-white/30 focus:outline-none"
                    autoFocus
                  />
                ) : null}
                <button
                  type="button"
                  onClick={() => { setSearchOpen(true); setTimeout(() => searchInputRef.current?.focus(), 50); }}
                  className="rounded-full p-2.5 text-white/50 transition-colors hover:text-white"
                  aria-label="Search events"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                  </svg>
                </button>
              </div>
            </div>,
            portalTarget
          )
        : null}

      {/* Hero (Desktop only) */}
      <section className="hidden md:flex relative w-full overflow-hidden bg-black px-6 pb-16 pt-12 items-center" style={{ minHeight: '400px', maxHeight: '65svh' }}>
        {/* Blurred cover image backdrop (full-bleed, crossfades with slide) */}
        {bgCover ? (
          <div className="absolute inset-0 z-0">
            {bgPrevCover ? (
              <img
                src={bgPrevCover}
                alt=""
                className="absolute inset-0 h-full w-full scale-110 object-cover blur-[60px] opacity-[0.65]"
              />
            ) : null}
            <img
              src={bgCover}
              alt=""
              className="absolute inset-0 h-full w-full scale-110 object-cover blur-[60px] transition-opacity duration-700 ease-out"
              style={{ opacity: bgFadeIn ? 0.65 : 0 }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/15 to-black/75" />
          </div>
        ) : null}
        {heroEvents.length > 0 ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-4 z-20 flex justify-center gap-2">
            {heroEvents.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setHeroIndex(i)}
                className={`pointer-events-auto h-2 w-2 rounded-full transition-colors ${
                  i === heroIndex ? 'bg-white' : 'bg-neutral-700 hover:bg-neutral-500'
                }`}
                aria-label={`Go to event ${i + 1}`}
              />
            ))}
          </div>
        ) : null}
        <div className="relative z-10 mx-auto grid max-w-[1440px] grid-cols-1 gap-12 lg:grid-cols-2 lg:items-start pt-6 md:pt-10">
          <div className="relative order-2 lg:order-1 flex justify-center">
            {featured ? (
              <img
                src={featured.coverImage}
                className="w-full max-w-[300px] aspect-[3/4] object-cover rounded-3xl shadow-2xl border-0"
                alt="Featured"
              />
            ) : (
              <div className="relative w-full max-w-[300px] aspect-[3/4] overflow-hidden rounded-3xl bg-zinc-900/70 border-0">
                <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-white/[0.08] via-white/[0.035] to-transparent" />
              </div>
            )}
          </div>

          <div className="order-1 lg:order-2 space-y-6">
            <div className="space-y-2">
              {featured ? (
                <>
                  <h1 className="text-3xl font-black leading-tight tracking-tight md:text-5xl">
                    {featured.title}
                  </h1>
                  <p className="text-base font-medium text-neutral-400">
                    {featured.venue}{featured.startDate ? ` · ${formatHeroDate(featured.startDate)}` : ''}
                  </p>
                </>
              ) : (
                <div className="space-y-4" aria-hidden="true">
                  <div className="h-12 w-[min(100%,520px)] animate-pulse rounded-2xl bg-white/10" />
                  <div className="h-5 w-64 animate-pulse rounded-full bg-white/10" />
                </div>
              )}
            </div>
            {featured ? (
              <Link
                href={featured.ticketType === 'PAID' ? `/events/${featured.id}/checkout` : `/events/${featured.id}`}
                className="inline-flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md px-7 py-2.5 text-xs font-black uppercase tracking-widest text-white transition hover:scale-105 border-0"
              >
                {featured.ticketType === 'PAID' ? 'Get tickets' : 'Join album'}
              </Link>
            ) : (
              <div className="h-10 w-32 animate-pulse rounded-full bg-white/10" aria-hidden="true" />
            )}
          </div>
        </div>
      </section>

      {/* Mobile Tab Selector */}
      <div className="flex border-b border-white/5 md:hidden justify-center bg-black pt-4">
        <div className="flex gap-8 px-6">
          <button
            type="button"
            onClick={() => setActiveTab('featured')}
            className={`pb-3 text-sm font-black uppercase tracking-widest transition-all ${
              activeTab === 'featured'
                ? 'text-white border-b-2 border-white'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Featured
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('browse')}
            className={`pb-3 text-sm font-black uppercase tracking-widest transition-all ${
              activeTab === 'browse'
                ? 'text-white border-b-2 border-white'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Browse
          </button>
        </div>
      </div>

      {/* Grid */}
      <main className="mx-auto max-w-[1440px] px-4 pb-20 md:px-6">
        <h2 className="hidden md:block mb-6 text-xl font-black uppercase tracking-widest text-white/60">Upcoming Events</h2>

        {/* Mobile Tab Views */}
        <div className="md:hidden">
          {loading && events.length === 0 ? (
            <EventsGridSkeleton count={4} />
          ) : activeTab === 'featured' ? (
            <div className="grid gap-6 w-full justify-center py-6" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 350px), 1fr))' }}>
              {heroEvents.map((ev) => (
                <div key={ev.id} className="w-full max-w-[420px] mx-auto">
                  <EventCard
                    event={ev}
                    favorited={favoriteIds.has(String(ev.id))}
                    onToggleFavorite={handleToggleFavorite}
                    detailBasePath="/events"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-6 w-full justify-center py-6" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 350px), 1fr))' }}>
              {rest.map((ev) => (
                <div key={ev.id} className="w-full max-w-[420px] mx-auto">
                  <EventCard
                    event={ev}
                    favorited={favoriteIds.has(String(ev.id))}
                    onToggleFavorite={handleToggleFavorite}
                    detailBasePath="/events"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Desktop Grid View */}
        <div className="hidden md:block">
          {loading && events.length === 0 ? (
            <EventsGridSkeleton />
          ) : (
            <div className="grid gap-6 w-full justify-center" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 350px), 1fr))' }}>
              {rest.map((ev) => (
                <div key={ev.id} className="w-full max-w-[420px] mx-auto">
                  <EventCard
                    event={ev}
                    favorited={favoriteIds.has(String(ev.id))}
                    onToggleFavorite={handleToggleFavorite}
                    detailBasePath="/events"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
