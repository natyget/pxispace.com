'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { eventsService } from '@/services/events';
import { PxiSpinner } from '@/components/loading/PxiLoading';
import AppOpenBanner from '@/components/links/AppOpenBanner';
import EventDetailsModal from '@/components/events/EventDetailsModal';
import { buildAlbumEventDetails } from '@/views/public/album/albumEventDetailsAdapter';
import { parseEventTicketTiers } from '@/lib/ticketTiers';
import { resolveEventCity } from '@/lib/seo/cities';
import { track, trackViewItem } from '@/lib/analytics';

/** Google Ads destination for the §5.7 dynamic-remarketing hit. Unset = no-op. */
const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;

/**
 * The event-scoped GA4 dimensions for this event. Genres resolve exactly the way
 * the server-rendered JSON-LD on the route does, and anything the payload
 * genuinely lacks stays undefined so the wrapper drops it rather than
 * registering an empty dimension.
 */
function eventAnalyticsBase(event) {
  if (!event) return {};
  const rawGenres = Array.isArray(event.genres)
    ? event.genres
    : Array.isArray(event.playlist?.topGenres)
      ? event.playlist.topGenres
      : [];
  const genre = rawGenres.map((g) => (typeof g === 'string' ? g : g?.name)).find(Boolean);
  const headliner = (Array.isArray(event.featuredPeople) ? event.featuredPeople : [])
    .map((fp) => fp?.user?.name || fp?.user?.username)
    .find(Boolean);
  return {
    eventId: event.id,
    eventTitle: event.name,
    eventCity: resolveEventCity(event)?.name,
    eventGenre: genre ? String(genre).toLowerCase() : undefined,
    artist: headliner,
    hostId: event.host?.id,
  };
}

/**
 * The event API's shape, in the album shape `buildAlbumEventDetails` reads, so the event page and the
 * album page build the app's event view from the one adapter.
 */
function toAlbumShape(apiEvent, participants) {
  const featured = Array.isArray(apiEvent.featuredPeople) ? apiEvent.featuredPeople : [];
  const lineup = featured
    .map((fp) => {
      const user = fp?.user || fp;
      if (!user) return null;
      return {
        id: fp.id || fp.userId || user.id,
        userId: fp.userId || user.id,
        name: user.name,
        username: user.username,
        avatarUrl: user.avatarUrl,
        role: fp.role || fp.lineupSubrole || undefined,
      };
    })
    .filter(Boolean);
  const going = apiEvent._count?.tickets ?? 0;
  return {
    name: apiEvent.name,
    coverImage: apiEvent.coverImage,
    event: apiEvent,
    host: apiEvent.host || null,
    featuredPeople: lineup,
    previewParticipants: participants,
    memberCount: participants.length ? Math.max(going, participants.length) : going,
  };
}

export default function EventDetailClient() {
  const params = useParams();
  const id = params?.id;

  // What the fetch brought back, keyed by the id it was for — so a new id reads as loading without
  // resetting state inside the effect.
  const [fetched, setFetched] = useState({ id: null, event: null });
  const [participantsFor, setParticipantsFor] = useState({ albumId: null, list: [] });

  useEffect(() => {
    if (!id) return undefined;
    let alive = true;
    eventsService
      .getEvent(id)
      .then((data) => data?.event || data || null)
      .catch(() => null)
      .then((event) => alive && setFetched({ id, event }));
    return () => {
      alive = false;
    };
  }, [id]);

  const loading = !!id && fetched.id !== id;
  const apiEvent = fetched.id === id ? fetched.event : null;
  const albumId = apiEvent?.albumId || apiEvent?.albums?.[0]?.id || null;

  // The members row = primary album members (backend adds AlbumMember when a ticket is issued).
  useEffect(() => {
    if (!albumId) return undefined;
    let alive = true;
    eventsService
      .getAlbumParticipants(albumId)
      .then((res) => res?.participants || [])
      .catch(() => [])
      .then((list) => alive && setParticipantsFor({ albumId, list }));
    return () => {
      alive = false;
    };
  }, [albumId]);

  const ticketTiers = useMemo(() => parseEventTicketTiers(apiEvent), [apiEvent]);

  // view_item — once per event, not per render.
  const viewItemTrackedId = useRef(null);
  useEffect(() => {
    if (!apiEvent?.id || viewItemTrackedId.current === apiEvent.id) return;
    viewItemTrackedId.current = apiEvent.id;

    const entryTier = ticketTiers[0] ?? null;
    const rawValue =
      apiEvent.ticketType === 'PAID' ? (entryTier?.priceUsd ?? apiEvent.ticketPrice) : 0;
    const value = Number.isFinite(Number(rawValue)) ? Number(rawValue) : undefined;

    trackViewItem({
      ...eventAnalyticsBase(apiEvent),
      ticketTier: entryTier?.label,
      value,
    });

    // §5.7 dynamic remarketing. Scoped to the Ads destination with send_to, so it
    // never lands in GA4 as a second page_view for this route.
    if (GOOGLE_ADS_ID) {
      track('page_view', {
        send_to: GOOGLE_ADS_ID,
        ecomm_prodid: String(apiEvent.id),
        ecomm_pagetype: 'product',
        ecomm_totalvalue: value ?? 0,
      });
    }
  }, [apiEvent, ticketTiers]);

  // The app's event view: Join / Get ticket $X (→ the checkout route, which asks signed-out people to
  // sign in and come back), Open Album beside the share button.
  const details = useMemo(() => {
    if (!apiEvent) return null;
    const built = buildAlbumEventDetails(
      toAlbumShape(apiEvent, participantsFor.albumId === albumId ? participantsFor.list : []),
      albumId,
    );
    return {
      ...built,
      secondaryAction: albumId ? { label: 'Open Album', href: `/album/${albumId}` } : null,
    };
  }, [apiEvent, participantsFor, albumId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black pt-[var(--public-navbar-height)] text-zinc-300">
        <PxiSpinner size="md" />
      </div>
    );
  }

  if (!apiEvent || !details?.event) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center bg-black px-4 pt-[var(--public-navbar-height)] text-center text-white">
        <p className="text-lg font-semibold">Event not found</p>
        <p className="mt-2 max-w-sm text-sm text-zinc-500">
          This link may be invalid or the event was removed.
        </p>
        <Link href="/events" className="mt-6 text-sm font-medium text-pxi-purple hover:text-white">
          Browse events
        </Link>
      </div>
    );
  }

  return (
    <>
      <EventDetailsModal
        open
        presentation="page"
        event={details.event}
        primaryAction={details.primaryAction}
        secondaryAction={details.secondaryAction}
      />
      {/* Dismissible banner sits above the sticky footer (4.75rem ≈ footer pill + spacing) so it never obscures it. */}
      <AppOpenBanner
        deepLinkUrl={albumId ? `pxi://album/${albumId}` : `pxi://event/${apiEvent.id}`}
        title="Already have PXI?"
        subtitle="Tap to open this event in the app"
        bottomOffset="4.75rem"
        storageKey={`pxi_app_banner_event_${apiEvent.id}_dismissed`}
      />
    </>
  );
}
