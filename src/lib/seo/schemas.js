/**
 * Centralised JSON-LD schema definitions for PXI pages.
 *
 * Everything here is SERVER-RENDERED into the initial HTML. Google does execute JS, but
 * event listings are only awarded to markup it can trust on first fetch, so no builder in
 * this file may depend on client state.
 *
 * The rule that matters most: **offers must match reality**. Advertising an InStock ticket
 * for a sold-out or finished event is the fastest way to get the whole domain demoted out
 * of the free event listings. Every builder below omits `offers` rather than guessing.
 */

import { CANONICAL_ORIGIN } from '@/lib/siteUrl';

/**
 * Structured data always names the canonical production origin, never the origin of the
 * running deployment — a preview build must not tell Google it is the real PXI.
 */
export const SITE_URL = CANONICAL_ORIGIN;

/* ────────────────────────────────────────────────────────────────────────────
 * Helpers
 * ────────────────────────────────────────────────────────────────────────── */

const abs = (pathOrUrl) =>
  !pathOrUrl ? null : String(pathOrUrl).startsWith('http') ? String(pathOrUrl) : `${SITE_URL}${pathOrUrl}`;

/**
 * ISO-8601 with a real UTC offset for the event's local timezone, e.g.
 * "2026-08-14T22:00:00-04:00". Google explicitly wants the offset on Event dates —
 * a bare "Z" is legal but tells it the party starts at 2am, which is how events end up
 * listed on the wrong day.
 * Falls back to plain ISO (Z) when no timezone is known rather than inventing one.
 */
export function isoWithOffset(value, timeZone) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  if (!timeZone) return d.toISOString();

  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
      .formatToParts(d)
      .reduce((acc, p) => {
        if (p.type !== 'literal') acc[p.type] = p.value;
        return acc;
      }, {});

    // Intl renders midnight as "24" in some ICU versions; normalise it.
    const hour = parts.hour === '24' ? '00' : parts.hour;
    const local = `${parts.year}-${parts.month}-${parts.day}T${hour}:${parts.minute}:${parts.second}`;

    // Offset = (wall-clock time in that zone) − (the same instant in UTC).
    const asUtc = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(hour),
      Number(parts.minute),
      Number(parts.second),
    );
    const offsetMinutes = Math.round((asUtc - d.getTime()) / 60000);
    const sign = offsetMinutes >= 0 ? '+' : '-';
    const mag = Math.abs(offsetMinutes);
    const oh = String(Math.floor(mag / 60)).padStart(2, '0');
    const om = String(mag % 60).padStart(2, '0');
    return `${local}${sign}${oh}:${om}`;
  } catch {
    return d.toISOString();
  }
}

/**
 * Truthful availability for an event's ticket offer.
 * Returns null when we cannot honestly claim anything — the caller then omits `offers`.
 */
export function resolveAvailability(event, { now = new Date() } = {}) {
  if (!event) return null;

  const end = event.endDate ? new Date(event.endDate) : null;
  const start = event.startDate ? new Date(event.startDate) : null;
  const finished = (end && end < now) || (!end && start && start < now);
  if (finished) return null; // a finished event has nothing to sell

  if (event.status === 'ARCHIVED' || event.status === 'CANCELLED') return null;
  if (event.salesClosed === true || event.ticketsAvailable === false) {
    return 'https://schema.org/SoldOut';
  }

  const capacity = Number(event.capacity ?? event.maxAttendees ?? NaN);
  const sold = Number(event.ticketsSold ?? event._count?.tickets ?? NaN);
  if (Number.isFinite(capacity) && capacity > 0 && Number.isFinite(sold) && sold >= capacity) {
    return 'https://schema.org/SoldOut';
  }

  if (start && start > now) return 'https://schema.org/InStock';
  return 'https://schema.org/InStock';
}

/** schema.org eventStatus from our status field. */
function resolveEventStatus(event) {
  switch (event?.status) {
    case 'CANCELLED':
      return 'https://schema.org/EventCancelled';
    case 'POSTPONED':
      return 'https://schema.org/EventPostponed';
    default:
      return 'https://schema.org/EventScheduled';
  }
}

/**
 * Best-effort PostalAddress from whatever address data an event carries.
 * `city` is the record from src/lib/seo/cities.js when the event could be placed.
 */
function buildPlace(event, city) {
  const venueName = event.venueName || event.floorPlan?.name || event.location || null;
  const street = event.streetAddress || event.floorPlan?.address || null;
  if (!venueName && !street && !city) return null;

  const place = { '@type': 'Place', name: venueName || city?.name || 'Venue TBA' };

  const address = { '@type': 'PostalAddress', addressCountry: city?.country || 'US' };
  if (street) address.streetAddress = street;
  if (city) {
    address.addressLocality = city.name;
    address.addressRegion = city.state;
  }
  if (event.postalCode) address.postalCode = event.postalCode;
  place.address = address;

  const lat = event.latitude ?? event.floorPlan?.venueLat ?? null;
  const lng = event.longitude ?? event.floorPlan?.venueLng ?? null;
  if (lat != null && lng != null) {
    place.geo = { '@type': 'GeoCoordinates', latitude: Number(lat), longitude: Number(lng) };
  }
  return place;
}

/* ────────────────────────────────────────────────────────────────────────────
 * Site-wide nodes
 * ────────────────────────────────────────────────────────────────────────── */

export const ORGANIZATION_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'PXI',
  url: SITE_URL,
  // Full-bleed brand mark (square, purple) for Google's org logo slot.
  logo: `${SITE_URL}/app-icon.png`,
  // Branded 1200×630 card so Google prefers it for the search thumbnail
  // instead of scraping a prominent in-page content photo.
  image: `${SITE_URL}/og-hero.png`,
  sameAs: ['https://www.instagram.com/pxilabs/', 'https://www.tiktok.com/@pxi.labs'],
  contactPoint: {
    '@type': 'ContactPoint',
    email: 'support@pxispace.com',
    contactType: 'customer support',
  },
};

/**
 * Homepage JSON-LD: dual-node @graph combining WebSite authority
 * with SoftwareApplication rich snippets (dual applicationCategory).
 */
export const HOMEPAGE_JSONLD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      name: 'PXI',
      url: SITE_URL,
      image: `${SITE_URL}/og-hero.png`,
      description:
        "PXI is a privacy-first event operating system spanning ticketing in the organizer's own brand, shared event photo galleries, and digital scrapbooks.",
      publisher: { '@type': 'Organization', name: 'PXI', url: SITE_URL },
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${SITE_URL}/events?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'SoftwareApplication',
      name: 'PXI',
      operatingSystem: 'iOS',
      applicationCategory: ['BusinessApplication', 'EntertainmentApplication'],
      url: SITE_URL,
      image: `${SITE_URL}/og-hero.png`,
      description:
        "PXI is a dual-sided event operating system for organizers and attendees, combining ticketing in the organizer's own brand with privacy-first social scrapbooks.",
      featureList: [
        'Branded Event Ticketing',
        'Real-Time Analytics',
        'Live Shared Event Camera',
        'Morning-After Digital Scrapbook',
        'Event Passport with Attendance Stamps',
        'One-Tap Instagram Sharing',
        'Signed, Forgery-Proof Tickets',
        'Zero Location Tracking',
      ],
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    },
  ],
};

/** AboutPage node referencing the organization. */
export function buildAboutJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: 'About PXI',
    url: `${SITE_URL}/about`,
    image: `${SITE_URL}/og-hero.png`,
    description:
      'PXI is an event platform built by operators, where the night compiles itself, the organizer keeps the money, and the memory is the point.',
    mainEntity: ORGANIZATION_JSONLD,
  };
}

/**
 * BreadcrumbList from an ordered array of {name, path} (path relative to site).
 * @param {{name:string, path:string}[]} items
 */
export function buildBreadcrumbJsonLd(items = []) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: `${SITE_URL}${it.path}`,
    })),
  };
}

/**
 * FAQPage from an array of {q, a}.
 * @param {{q:string, a:string}[]} faqs
 */
export function buildFaqJsonLd(faqs = []) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

/**
 * ItemList for a collection page (events discovery, city pages).
 * @param {{name:string, url:string}[]} items — absolute or relative urls
 * @param {string} name — list name
 */
export function buildItemListJsonLd(items = [], name = 'Events') {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      url: abs(it.url),
    })),
  };
}

/* ────────────────────────────────────────────────────────────────────────────
 * Event
 * ────────────────────────────────────────────────────────────────────────── */

/**
 * Event / MusicEvent JSON-LD for a public event detail page.
 * This is the markup that makes PXI events eligible for Google's free event listings,
 * so it is the highest-leverage structured data on the site.
 *
 * @param {object} event    — public event object from the API
 * @param {string} siteUrl  — canonical site origin (no trailing slash)
 * @param {object} [opts]
 * @param {object} [opts.city]      — record from src/lib/seo/cities.js
 * @param {string[]} [opts.genres]  — resolved genre labels
 * @param {Date}   [opts.now]
 */
export function buildEventJsonLd(event, siteUrl = SITE_URL, opts = {}) {
  if (!event) return null;
  const { city = null, genres = [], now = new Date() } = opts;

  const url = `${siteUrl}/events/${event.id}`;
  const timeZone = event.timezone || city?.timezone || null;

  // A lineup makes this a MusicEvent, which is what earns the richer music treatment.
  const lineup = Array.isArray(event.lineup) ? event.lineup : [];
  const performers = lineup
    .map((p) => (typeof p === 'string' ? { name: p } : { name: p?.name || p?.username, role: p?.lineupRole }))
    .filter((p) => p.name);

  const schema = {
    '@context': 'https://schema.org',
    '@type': performers.length ? 'MusicEvent' : 'Event',
    name: event.name || 'Event',
    url,
    eventStatus: resolveEventStatus(event),
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
  };

  const start = isoWithOffset(event.startDate, timeZone);
  if (start) schema.startDate = start;
  const end = isoWithOffset(event.endDate, timeZone);
  if (end) schema.endDate = end;

  if (event.description) schema.description = String(event.description).trim().slice(0, 300);

  // Google wants 1200×630 or larger; coverImage is our only guaranteed large asset.
  const image = event.coverImage || event.image || null;
  if (image) schema.image = [abs(image)];

  const place = buildPlace(event, city);
  if (place) schema.location = place;

  if (performers.length) {
    schema.performer = performers.map((p) => ({ '@type': 'MusicGroup', name: p.name }));
  }

  // Organizer is the host's brand, not a private individual's identity.
  const organizerName = event.organizer?.name || event.host?.name || event.host?.username || null;
  if (organizerName) {
    schema.organizer = {
      '@type': 'Organization',
      name: organizerName,
      ...(event.host?.username ? { url: `${siteUrl}/u/${event.host.username}` } : {}),
    };
  }

  if (genres.length) schema.genre = genres;

  // Offers — only when we can state availability truthfully.
  const availability = resolveAvailability(event, { now });
  if (availability) {
    const isFree = event.ticketType === 'FREE' || Number(event.ticketPrice) === 0;
    const price = isFree ? 0 : Number(event.ticketPrice);
    if (isFree || Number.isFinite(price)) {
      const offer = {
        '@type': 'Offer',
        price: String(price.toFixed(2)),
        priceCurrency: event.currency || 'USD',
        availability,
        url,
        category: isFree ? 'free' : 'primary',
      };
      const validFrom = isoWithOffset(event.salesStartDate || event.createdAt, timeZone);
      if (validFrom) offer.validFrom = validFrom;
      schema.offers = [offer];
    }
  }

  return schema;
}

/* ────────────────────────────────────────────────────────────────────────────
 * Music matchmaking surfaces — artist, genre, city hubs, playlists
 * ────────────────────────────────────────────────────────────────────────── */

/**
 * MusicGroup for an artist hub, with their upcoming PXI events as an ItemList.
 * @param {{name:string, slug:string, bio?:string, image?:string, sameAs?:string[]}} artist
 * @param {{name:string, url:string}[]} events
 */
export function buildArtistJsonLd(artist, events = []) {
  if (!artist?.name) return null;
  const url = `${SITE_URL}/artists/${artist.slug}`;
  const node = {
    '@context': 'https://schema.org',
    '@type': 'MusicGroup',
    name: artist.name,
    url,
  };
  if (artist.bio) node.description = String(artist.bio).trim().slice(0, 300);
  if (artist.image) node.image = abs(artist.image);
  if (Array.isArray(artist.sameAs) && artist.sameAs.length) node.sameAs = artist.sameAs;
  if (Array.isArray(artist.genres) && artist.genres.length) node.genre = artist.genres;
  if (events.length) {
    node.subjectOf = {
      '@type': 'ItemList',
      name: `Upcoming events with ${artist.name}`,
      itemListElement: events.map((e, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: e.name,
        url: abs(e.url),
      })),
    };
  }
  return node;
}

/**
 * CollectionPage + ItemList for a genre, city, or city×genre hub.
 * @param {{name:string, path:string, description?:string}} hub
 * @param {{name:string, url:string}[]} events
 */
export function buildCollectionJsonLd(hub, events = []) {
  if (!hub?.path) return null;
  const url = `${SITE_URL}${hub.path}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: hub.name,
    url,
    ...(hub.description ? { description: hub.description } : {}),
    isPartOf: { '@type': 'WebSite', name: 'PXI', url: SITE_URL },
    mainEntity: {
      '@type': 'ItemList',
      name: hub.name,
      numberOfItems: events.length,
      itemListElement: events.map((e, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: e.name,
        url: abs(e.url),
      })),
    },
  };
}

/**
 * Place node for a city hub, so the hub itself is an entity Google can reason about.
 * @param {object} city — record from src/lib/seo/cities.js
 */
export function buildCityPlaceJsonLd(city) {
  if (!city) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: city.name,
    url: `${SITE_URL}/discover/${city.slug}`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: city.name,
      addressRegion: city.state,
      addressCountry: city.country || 'US',
    },
    ...(city.lat != null && city.lng != null
      ? { geo: { '@type': 'GeoCoordinates', latitude: city.lat, longitude: city.lng } }
      : {}),
  };
}

/**
 * MusicPlaylist for an event or artist playlist embed.
 * @param {{name:string, url:string, trackCount?:number, description?:string}} playlist
 */
export function buildPlaylistJsonLd(playlist) {
  if (!playlist?.name || !playlist?.url) return null;
  const node = {
    '@context': 'https://schema.org',
    '@type': 'MusicPlaylist',
    name: playlist.name,
    url: playlist.url,
  };
  if (Number.isFinite(Number(playlist.trackCount))) {
    node.numTracks = Number(playlist.trackCount);
  }
  if (playlist.description) node.description = String(playlist.description).trim().slice(0, 300);
  return node;
}
