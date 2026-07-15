'use client';

// Wishlist — the user's saved events on their own page (linked from the
// profile dropdown). Loads favorite ids, hydrates each event, renders the
// same discovery cards.

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import EventCard from '@/views/events/EventCard';
import { eventsService } from '@/services/events';
import { loadFavoriteEventIds, toggleFavoriteEventId } from '@/lib/eventFavorites';
import { useAuth } from '@/contexts/AuthContext';

const DEFAULT_IMG =
  'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?q=80&w=1200&auto=format&fit=crop';

const MAX_WISHLIST_FETCH = 60;

function normalizeApiEvent(e) {
  return {
    id: e.id,
    title: e.name,
    coverImage: e.coverImage || DEFAULT_IMG,
    image: e.coverImage || DEFAULT_IMG,
    venue: e.location || 'Location TBA',
    location: e.location || 'Location TBA',
    startDate: e.startDate ? new Date(e.startDate) : null,
    date: e.startDate
      ? new Date(e.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : 'Date TBA',
    musicMatchScore: e.musicMatchScore ?? null,
  };
}

export default function WishlistPage() {
  const { user } = useAuth();
  const isLoggedIn = !!user?.id;
  const [events, setEvents] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState(() => new Set());
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const ids = await loadFavoriteEventIds(isLoggedIn);
      setFavoriteIds(ids);
      const list = [...ids].slice(0, MAX_WISHLIST_FETCH);
      const settled = await Promise.allSettled(
        list.map((id) => eventsService.getEvent(id).then((d) => d.event || d)),
      );
      setEvents(
        settled
          .filter((r) => r.status === 'fulfilled' && r.value?.id)
          .map((r) => normalizeApiEvent(r.value)),
      );
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    load();
  }, [load]);

  const handleToggleFavorite = useCallback(
    (id) => {
      const isFavorite = favoriteIds.has(String(id));
      toggleFavoriteEventId(id, isFavorite, isLoggedIn)
        .then((next) => {
          setFavoriteIds(next);
          setEvents((prev) => prev.filter((e) => next.has(String(e.id))));
        })
        .catch(() => load());
    },
    [favoriteIds, isLoggedIn, load],
  );

  return (
    <div className="min-h-screen bg-black pt-24 pb-20 text-white">
      <div className="container mx-auto px-6">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter md:text-6xl">Wishlist</h1>
            <p className="mt-2 text-sm font-bold text-zinc-500">
              Events you saved — tap the heart on any card to remove it.
            </p>
          </div>
          <Link
            href="/events"
            className="hidden shrink-0 text-xs font-black uppercase tracking-widest text-[#d84aff] hover:text-white md:block"
          >
            Browse events
          </Link>
        </div>

        {loading ? (
          <div
            className="grid w-full justify-center gap-6"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 350px), 1fr))' }}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] animate-pulse rounded-lg bg-zinc-900" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-24 text-center">
            <p className="text-lg font-bold text-zinc-400">Nothing saved yet</p>
            <p className="max-w-sm text-sm text-zinc-500">
              Tap the heart on any event card to keep it here for later.
            </p>
            <Link
              href="/events"
              className="mt-2 inline-flex items-center justify-center rounded-full bg-white px-7 py-2.5 text-xs font-black uppercase tracking-widest text-black transition hover:scale-105"
            >
              Discover events
            </Link>
          </div>
        ) : (
          <div
            className="grid w-full justify-center gap-6"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 350px), 1fr))' }}
          >
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                favorited={favoriteIds.has(String(event.id))}
                onToggleFavorite={handleToggleFavorite}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
