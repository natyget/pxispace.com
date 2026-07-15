/**
 * Adapts the public album/event API shape into `EventDetailsModal`'s
 * section-driven contract. Shared by the desktop floating-modal call site and
 * the mobile-web full-screen sheet call site — both render the exact same
 * data, just with a different `presentation` prop on the modal.
 */

import { formatAlbumSchedule } from './publicAlbumDate';
import { formatTicketPrice, parseEventTicketTiers } from '@/lib/ticketTiers';

function eventRequiresPaidTicket(event) {
  if (!event || String(event.ticketType ?? '').toUpperCase() !== 'PAID') return false;
  if (parseEventTicketTiers(event).length > 0) return true;
  return Number(event.ticketPrice ?? 0) > 0;
}

export function albumDisplayTitle(album) {
  const eventName = album?.event?.name?.trim();
  if (eventName) return eventName;
  const raw = String(album?.name ?? '').trim();
  if (!raw) return 'Album';
  return raw.replace(/\s+Album$/i, '').trim() || raw;
}

function formatLocation(event) {
  const raw = String(event?.location ?? '').trim();
  if (raw) {
    const split = raw.split(/\n|,|•/).map((s) => s.trim()).filter(Boolean);
    if (split.length >= 2) return { primary: split[0], secondary: split.slice(1).join(' · ') };
    return { primary: raw, secondary: '' };
  }
  const lat = event?.latitude != null ? Number(event.latitude) : NaN;
  const lng = event?.longitude != null ? Number(event.longitude) : NaN;
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return { primary: `${lat.toFixed(5)}, ${lng.toFixed(5)}`, secondary: 'Coordinates (no address set)' };
  }
  return { primary: 'Location TBD', secondary: '' };
}

/** @returns {{ event: object, primaryAction: object|null, secondaryAction: object|null }} */
export function buildAlbumEventDetails(album, albumId) {
  if (!album) return { event: null, primaryAction: null, secondaryAction: null };

  const event = album.event;
  const isPublic = event?.visibility === 'PUBLIC';
  const isPaidEvent = eventRequiresPaidTicket(event);
  const isFinalized = event?.effectiveStatus === 'ARCHIVED';
  const rawTiers = parseEventTicketTiers(event);
  const ticketTiers = rawTiers.map((t) => ({
    ...t,
    priceLabel: formatTicketPrice(t.priceUsd, event?.currency),
  }));
  const lineup = (album.featuredPeople || album.lineup || []).map((p) => ({
    id: p.id || p.userId,
    userId: p.userId,
    name: p.name,
    username: p.username,
    avatarUrl: p.avatarUrl,
    role: p.role || 'Line up',
  }));
  const participants = album.previewParticipants || [];
  const ticketLabel = isPaidEvent
    ? rawTiers[0]
      ? formatTicketPrice(rawTiers[0].priceUsd, event?.currency)
      : formatTicketPrice(event?.ticketPrice, event?.currency)
    : null;
  const openInAppUrl = albumId ? `pxi://album/${albumId}` : null;

  const detailsEvent = {
    id: event?.id,
    title: albumDisplayTitle(album),
    image: event?.coverImage || album.coverImage,
    badges: [
      { label: isPublic ? 'Public' : 'Private', tone: isPublic ? 'purple' : 'neutral' },
      { label: isPaidEvent ? 'Paid' : 'Free', tone: isPaidEvent ? 'amber' : 'green' },
      ...(isFinalized ? [{ label: 'Scrapbook · Finalized', tone: 'neutral' }] : []),
    ],
    schedule: formatAlbumSchedule(event),
    location: formatLocation(event),
    description: event?.description,
    host: album.host
      ? { name: album.host.name, username: album.host.username, avatarUrl: album.host.avatarUrl }
      : null,
    ticketTiers,
    lineup,
    participants,
    memberCount: album.memberCount ?? participants.length,
    playlist: event?.id ? { eventId: event.id } : null,
  };

  let primaryAction = null;
  if (isFinalized) {
    primaryAction = { label: 'Scrapbook — finalized', disabled: true };
  } else if (event?.id) {
    primaryAction = {
      label: ticketLabel ? `Join Event · ${ticketLabel}` : 'Join Event',
      href: `/events/${event.id}/checkout`,
    };
  } else if (openInAppUrl) {
    primaryAction = { label: 'Open album in app', href: openInAppUrl };
  }

  return { event: detailsEvent, primaryAction, secondaryAction: null };
}
