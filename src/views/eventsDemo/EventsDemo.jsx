'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { eventsService } from '@/services/events';
import EventCard from '@/views/events/EventCard';
import { ChevronDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
const LogoSVG = '/images/logo.svg';

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

export default function EventsDemo() {
  const { isAuthenticated, user, logout } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [heroIndex, setHeroIndex] = useState(0);
  const [bgCover, setBgCover] = useState(null);
  const [bgPrevCover, setBgPrevCover] = useState(null);
  const [bgFadeIn, setBgFadeIn] = useState(true);

  const [trending, setTrending] = useState(TRENDING_OPTIONS[0].id); // All | Nearest | Largest
  const [timeFilter, setTimeFilter] = useState(TIME_OPTIONS[0].id); // All | Today | This week | This month
  const [cityFilter, setCityFilter] = useState(CITY_PRESETS[0]);
  const [cityQuery, setCityQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [openMenu, setOpenMenu] = useState(null); // 'trending' | 'time' | 'city' | null
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const headerBarRef = useRef(null);
  const avatarFallback = user?.name?.charAt(0)?.toUpperCase() || '?';

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    setLoading(true);
    eventsService
      .getDiscoverEvents(48, 0, 'vendor')
      .then((res) => setEvents((res.events || []).map(normalizeApiEvent)))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  const filteredSortedEvents = useMemo(() => {
    let list = [...events];

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((e) => {
        const hay = `${e.title ?? ''} ${e.venue ?? ''}`.toLowerCase();
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
      const cq = cityFilter.toLowerCase();
      list = list.filter((e) => String(e.venue || '').toLowerCase().includes(cq));
    }

    return list;
  }, [events, trending, timeFilter, cityFilter, searchQuery]);

  const heroEvents = useMemo(() => filteredSortedEvents.slice(0, 8), [filteredSortedEvents]);
  const featured = useMemo(
    () => (heroEvents.length ? heroEvents[Math.min(heroIndex, heroEvents.length - 1)] : null),
    [heroEvents, heroIndex]
  );
  const rest = useMemo(() => (filteredSortedEvents.length > 1 ? filteredSortedEvents.slice(1) : []), [filteredSortedEvents]);

  useEffect(() => {
    setHeroIndex(0);
  }, [trending, timeFilter, cityFilter, searchQuery]);

  // Auto-advance carousel
  useEffect(() => {
    if (heroEvents.length <= 1) return;
    const t = setInterval(() => {
      setHeroIndex((i) => (i + 1) % heroEvents.length);
    }, 5200);
    return () => clearInterval(t);
  }, [heroEvents.length]);

  // Keep hero background synced with slide (crossfade)
  useEffect(() => {
    const next = featured?.coverImage ?? null;
    if (!next) return;
    if (bgCover === null) {
      setBgCover(next);
      setBgPrevCover(null);
      setBgFadeIn(true);
      return;
    }
    if (next === bgCover) return;
    setBgPrevCover(bgCover);
    setBgCover(next);
    setBgFadeIn(false);
    const t = setTimeout(() => setBgFadeIn(true), 20);
    const t2 = setTimeout(() => setBgPrevCover(null), 800);
    return () => {
      clearTimeout(t);
      clearTimeout(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [featured?.id]);

  useEffect(() => {
    const onDocPointerDown = (event) => {
      if (!headerBarRef.current) return;
      if (headerBarRef.current.contains(event.target)) return;
      setOpenMenu(null);
      setUserMenuOpen(false);
    };
    document.addEventListener('pointerdown', onDocPointerDown);
    return () => document.removeEventListener('pointerdown', onDocPointerDown);
  }, []);

  const trendingLabel = TRENDING_OPTIONS.find((o) => o.id === trending)?.label ?? 'All';
  const timeLabel = TIME_OPTIONS.find((o) => o.id === timeFilter)?.label ?? 'All';
  const cityLabel = cityFilter || 'All';

  return (
    <div className="min-h-screen bg-black font-sans text-white">
      {/* Events-new header (custom search bar) */}
      <div
        ref={headerBarRef}
        className="sticky top-0 z-40 border-b border-white/10 bg-black/70 backdrop-blur-2xl"
      >
        <div className="max-w-[1440px] mx-auto px-4 md:px-6 py-4 grid grid-cols-1 lg:grid-cols-[auto_1fr_auto] items-center gap-3">
          <Link href="/" className="text-white font-black tracking-widest text-sm uppercase w-fit justify-self-start">
            <img src={LogoSVG} alt="PXI Logo" className="h-8 w-8" />
          </Link>

          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 justify-center">
            <div className="w-full md:w-[220px] lg:w-[260px]">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-pxi-purple/50"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {/* Newest */}
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => setOpenMenu((m) => (m === 'trending' ? null : 'trending'))}
                  className="rounded-full bg-white/5 border border-white/10 px-4 py-2.5 text-sm font-bold hover:bg-white/10 transition"
                >
                  Trending: {trendingLabel} <ChevronDown size={14} className="inline-block ml-1 -mt-0.5 opacity-70" />
                </button>
                {openMenu === 'trending' ? (
                  <div className="absolute left-0 top-full mt-2 w-44 rounded-2xl border border-white/10 bg-zinc-950/90 backdrop-blur p-2 z-50">
                    {TRENDING_OPTIONS.map((o) => (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => {
                          setTrending(o.id);
                          setOpenMenu(null);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-sm font-semibold hover:bg-white/5 ${
                          trending === o.id ? 'text-pxi-purple' : 'text-white'
                        }`}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              {/* This week */}
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => setOpenMenu((m) => (m === 'time' ? null : 'time'))}
                  className="rounded-full bg-white/5 border border-white/10 px-4 py-2.5 text-sm font-bold hover:bg-white/10 transition"
                >
                  Time: {timeLabel} <ChevronDown size={14} className="inline-block ml-1 -mt-0.5 opacity-70" />
                </button>
                {openMenu === 'time' ? (
                  <div className="absolute left-0 top-full mt-2 w-52 rounded-2xl border border-white/10 bg-zinc-950/90 backdrop-blur p-2 z-50">
                    {TIME_OPTIONS.map((o) => (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => {
                          setTimeFilter(o.id);
                          setOpenMenu(null);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-sm font-semibold hover:bg-white/5 ${
                          timeFilter === o.id ? 'text-pxi-purple' : 'text-white'
                        }`}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              {/* Nearby */}
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => setOpenMenu((m) => (m === 'city' ? null : 'city'))}
                  className="rounded-full bg-white/5 border border-white/10 px-4 py-2.5 text-sm font-bold hover:bg-white/10 transition"
                >
                  City: {cityLabel} <ChevronDown size={14} className="inline-block ml-1 -mt-0.5 opacity-70" />
                </button>
                {openMenu === 'city' ? (
                  <div className="absolute left-0 top-full mt-2 w-[320px] rounded-2xl border border-white/10 bg-zinc-950/90 backdrop-blur p-2 z-50">
                    <div className="px-2 pb-2">
                      <input
                        value={cityQuery}
                        onChange={(e) => setCityQuery(e.target.value)}
                        placeholder="Search city..."
                        className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-pxi-purple/50"
                      />
                    </div>
                    <div className="max-h-64 overflow-auto">
                      {CITY_PRESETS.filter((c) =>
                        c.toLowerCase().includes(cityQuery.trim().toLowerCase())
                      ).map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => {
                            setCityFilter(c);
                            setOpenMenu(null);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl text-sm font-semibold hover:bg-white/5 ${
                            cityFilter === c ? 'text-pxi-purple' : 'text-white'
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 justify-start lg:justify-end">
            <Link
              href="/dashboard/events/new"
              className="rounded-full bg-white text-black px-4 py-2.5 text-sm font-bold hover:opacity-90 transition"
            >
              Create Event
            </Link>
            {!mounted ? (
              <div className="w-24 h-10 rounded-full bg-zinc-800/60 animate-pulse" />
            ) : isAuthenticated ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-3 py-2 hover:bg-white/10 transition"
                >
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user?.name ?? ''} className="w-6 h-6 rounded-full object-cover" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-pxi-purple/30 border border-pxi-purple/40 flex items-center justify-center text-pxi-purple text-xs font-bold">
                      {avatarFallback}
                    </div>
                  )}
                  <span className="text-sm font-semibold text-white max-w-[120px] truncate">
                    {user?.name?.split(' ')[0] || 'Account'}
                  </span>
                  <ChevronDown size={12} className={`text-zinc-500 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {userMenuOpen ? (
                  <div className="absolute right-0 top-full mt-2 w-44 bg-zinc-950 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                    <Link
                      href="/dashboard"
                      onClick={() => setUserMenuOpen(false)}
                      className="block px-4 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-white/5 transition"
                    >
                      Dashboard
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        logout();
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-zinc-400 hover:text-pxi-purple hover:bg-pxi-purple/10 transition"
                    >
                      Logout
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <Link
                href="/login"
                className="rounded-full bg-white/5 border border-white/10 px-4 py-2.5 text-sm font-bold hover:bg-white/10 transition"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Hero */}
      <section className="relative w-full overflow-hidden bg-black pt-12 pb-24 px-6">
        {/* Blurred featured cover background */}
        {bgCover ? (
          <div className="absolute inset-0 -z-10">
            {bgPrevCover ? (
              <img
                src={bgPrevCover}
                alt=""
                className="absolute inset-0 w-full h-full object-cover scale-110 blur-[52px] opacity-35"
              />
            ) : null}
            <img
              src={bgCover}
              alt=""
              className="absolute inset-0 w-full h-full object-cover scale-110 blur-[52px] opacity-35 transition-opacity duration-700"
              style={{ opacity: bgFadeIn ? 0.35 : 0 }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/55 to-black" />
          </div>
        ) : null}
        <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="relative order-2 lg:order-1 flex justify-center [perspective:1000px]">
            {featured ? (
              <img
                src={featured.coverImage}
                className="w-full max-w-lg aspect-[4/5] object-cover rounded-2xl shadow-2xl transform [transform:rotateY(-15deg)_rotateX(5deg)_scale(0.96)]"
                alt="Featured"
              />
            ) : (
              <div className="w-full max-w-lg aspect-[4/5] rounded-2xl border border-white/10 bg-zinc-900/50" />
            )}
          </div>

          <div className="order-1 lg:order-2 space-y-6">
            <div className="space-y-2">
              <h1 className="text-5xl md:text-7xl font-bold leading-tight tracking-tight">
                {featured?.title || (loading ? 'Loading…' : 'No events')}
              </h1>
              <p className="text-xl text-neutral-400 font-medium">
                {featured?.venue || '—'} {featured?.startDate ? `· ${formatHeroDate(featured.startDate)}` : ''}
              </p>
            </div>
            <Link
              href={featured ? `/events-new/${featured.id}` : '/events-new'}
              className="inline-flex items-center justify-center bg-white text-black font-bold px-10 py-4 rounded-full text-lg hover:scale-105 transition-transform"
            >
              Open event
            </Link>

            <div className="flex gap-2 pt-8">
              {heroEvents.length > 0
                ? heroEvents.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setHeroIndex(i)}
                      className={`h-2 w-2 rounded-full transition-colors ${
                        i === heroIndex ? 'bg-white' : 'bg-neutral-700 hover:bg-neutral-500'
                      }`}
                      aria-label={`Go to event ${i + 1}`}
                    />
                  ))
                : null}
            </div>
          </div>
        </div>
      </section>

      {/* Grid */}
      <main className="max-w-[1440px] mx-auto px-4 md:px-6 pb-20">
        <h2 className="text-2xl font-bold mb-6">Upcoming Events</h2>
        {loading && events.length === 0 ? (
          <div className="text-neutral-400">Loading…</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-4">
            {rest.map((ev) => (
              <EventCard key={ev.id} event={ev} detailBasePath="/events-new" />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

