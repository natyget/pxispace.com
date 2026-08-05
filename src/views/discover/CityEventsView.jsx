'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { eventsService } from '@/services/events';
import EventCard from '@/views/events/EventCard';
import { StaggerGroup, RevealItem, HoverLift } from '@/components/motion/Reveal';
import SectionShell from '@/components/marketing/SectionShell';
import { trackViewItemList } from '@/lib/analytics';

const DEFAULT_IMG = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=2070';

// GA4 caps items[] at 200 per hit; the hub fetches 48 before city filtering.
const MAX_LIST_ITEMS = 50;

/** @param {Object} city the registry record from src/lib/seo/cities.js */
function normalize(e, city) {
  const paid = e.ticketType === 'PAID';
  const sym = e.currency === 'EUR' ? '€' : '$';
  // Numeric price is kept alongside the display string — GA4 items[].price is a number.
  const priceUsd = paid && e.ticketPrice != null && Number(e.ticketPrice) > 0 ? Number(e.ticketPrice) : 0;
  const price = priceUsd > 0 ? `${sym}${priceUsd.toFixed(2)}` : 'Free';
  return {
    id: e.id,
    title: e.name,
    image: e.coverImage || DEFAULT_IMG,
    coverImage: e.coverImage || DEFAULT_IMG,
    location: e.location || 'Location TBA',
    startDate: e.startDate ? new Date(e.startDate) : null,
    date: e.startDate
      ? new Date(e.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : 'Date TBA',
    price,
    members: e._count?.tickets ?? 0,
    attendees: e._count?.tickets ?? 0,
    status: (e._count?.tickets ?? 0) > 200 ? 'Hot' : 'Public',
    organizer: e.organizer || (e.host ? { name: e.host.name, username: e.host.username, avatarUrl: e.host.avatarUrl } : null),
    albumId: e.albumId || e.albums?.[0]?.id || null,

    // GA4 taxonomy fields. The hub already resolved the city, so use the registry
    // name rather than re-deriving it from the free-text location.
    hostId: e.createdBy || e.organizer?.id || e.host?.id || null,
    city: city?.name || null,
    // Only present when the fetch asked for match scores; harmless when it did not.
    genre: e.playlist?.topGenres?.[0] || null,
    value: priceUsd,
  };
}

/**
 * @param {object}   props
 * @param {object}   props.city          registry record from @/lib/seo/cities
 * @param {object[]} [props.initialEvents] events resolved on the SERVER by the route.
 *   Without these the hub shipped a hero plus six skeleton divs, which is all Google
 *   ever saw — the entire point of a city hub is the event list being in the first HTML
 *   response. When they are supplied we render them immediately and skip the client
 *   fetch; the page is still interactive, it just is not empty on arrival.
 */
export default function CityEventsView({ city, initialEvents }) {
  const seeded = Array.isArray(initialEvents) && initialEvents.length > 0;
  const [events, setEvents] = useState(() => (seeded ? initialEvents : []));
  const [loading, setLoading] = useState(!seeded);

  useEffect(() => {
    // Already server-rendered — refetching would only cause a flash of the same rows.
    if (seeded) return undefined;
    let alive = true;
    eventsService
      .getPublicEvents(48, 0)
      .then((res) => {
        if (!alive) return;
        setEvents(res?.events || []);
      })
      .catch(() => alive && setEvents([]))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [seeded]);

  const cityEvents = useMemo(() => {
    const needles = city.match.map((m) => m.toLowerCase());
    return events
      .filter((e) => {
        const loc = String(e.location || '').toLowerCase();
        return needles.some((n) => loc.includes(n));
      })
      .map((e) => normalize(e, city));
  }, [events, city]);

  // The list id carries the city slug so each hub is separable in reporting.
  const listId = `city_${city.slug}`;
  const listName = `${city.name} events`;

  const listKeyRef = useRef(null);
  useEffect(() => {
    if (loading || cityEvents.length === 0 || listKeyRef.current === listId) return;
    listKeyRef.current = listId;
    trackViewItemList({ listId, listName, items: cityEvents.slice(0, MAX_LIST_ITEMS) });
  }, [loading, cityEvents, listId, listName]);

  return (
    <div className="landing-v2 bg-black text-white">
      {/* Hero */}
      <section className="relative overflow-hidden pt-32 md:pt-40">
        <div
          className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[50vh] w-[80vw] max-w-[900px] -translate-x-1/2 rounded-full bg-pxi-purple/[0.08] blur-[160px]"
          aria-hidden
        />
        <div className="mx-auto max-w-[1200px] px-6">
          <h1 className="display-1 mt-6 max-w-3xl">
            Events in <span className="text-pxi-purple">{city.name}.</span>
          </h1>
          <p className="body-lead mt-8 max-w-xl">{city.blurb}</p>
          <Link href="/events" className="glow-cta mt-10 inline-flex px-8 py-4 text-sm">
            Browse all events <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Grid */}
      <SectionShell pad="loose">
        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-[4/5] animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.03]" />
            ))}
          </div>
        ) : cityEvents.length ? (
          <StaggerGroup className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {cityEvents.map((ev, i) => (
              <RevealItem key={ev.id}>
                <HoverLift>
                  <EventCard event={ev} listId={listId} listName={listName} index={i} />
                </HoverLift>
              </RevealItem>
            ))}
          </StaggerGroup>
        ) : (
          <div className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-10 text-center">
            <h2 className="display-3">No live events in {city.name} yet.</h2>
            <p className="body-lead mx-auto mt-4 max-w-md">
              New nights drop all the time. Browse everything happening on PXI right now.
            </p>
            <Link href="/events" className="glow-cta mt-8 inline-flex px-8 py-4 text-sm">
              Explore all events <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </SectionShell>
    </div>
  );
}
