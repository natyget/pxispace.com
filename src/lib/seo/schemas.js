/** Centralised JSON-LD schema definitions for PXI pages. */

export const SITE_URL = 'https://pxispace.com';

export const ORGANIZATION_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'PXI',
  url: SITE_URL,
  // Full-bleed brand mark (square) for Google's org logo slot.
  logo: `${SITE_URL}/favicon-mark.png`,
  // Branded 1200×630 card so Google prefers it for the search thumbnail
  // instead of scraping a prominent in-page content photo.
  image: `${SITE_URL}/og-hero.png`,
  sameAs: [
    'https://www.instagram.com/pxilabs/',
    'https://www.tiktok.com/@pxi.labs',
  ],
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
        'PXI is a privacy-first event operating system spanning ticketing in the organizer\'s own brand, shared event photo galleries, and digital scrapbooks.',
      potentialAction: {
        '@type': 'SearchAction',
        target: `${SITE_URL}/events?q={search_term_string}`,
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
        'PXI is a dual-sided event operating system for organizers and attendees, combining ticketing in the organizer\'s own brand with privacy-first social scrapbooks.',
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
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
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
      url: it.url.startsWith('http') ? it.url : `${SITE_URL}${it.url}`,
    })),
  };
}

/**
 * Build Event JSON-LD for a public event detail page.
 * @param {object} event — API event object
 * @param {string} siteUrl — canonical site origin (no trailing slash)
 */
export function buildEventJsonLd(event, siteUrl) {
  if (!event) return null;

  // Treat events with a lineup/performers as MusicEvent for richer results.
  const lineup = Array.isArray(event.lineup) ? event.lineup : [];
  const hasLineup = lineup.length > 0;

  const schema = {
    '@context': 'https://schema.org',
    '@type': hasLineup ? 'MusicEvent' : 'Event',
    name: event.name || 'Event',
    url: `${siteUrl}/events/${event.id}`,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
  };

  if (hasLineup) {
    schema.performer = lineup
      .map((p) => (typeof p === 'string' ? p : p?.name || p?.username))
      .filter(Boolean)
      .map((name) => ({ '@type': 'PerformingGroup', name }));
  }

  if (event.startDate) {
    schema.startDate = new Date(event.startDate).toISOString();
  }
  if (event.endDate) {
    schema.endDate = new Date(event.endDate).toISOString();
  }
  if (event.description) {
    schema.description = String(event.description).trim().slice(0, 300);
  }

  if (event.location) {
    schema.location = {
      '@type': 'Place',
      name: event.location,
    };
    if (event.latitude && event.longitude) {
      schema.location.geo = {
        '@type': 'GeoCoordinates',
        latitude: event.latitude,
        longitude: event.longitude,
      };
    }
  }

  if (event.coverImage) {
    schema.image = event.coverImage;
  }

  if (event.host?.name || event.host?.username) {
    schema.organizer = {
      '@type': 'Person',
      name: event.host.name || event.host.username,
    };
  }

  const ticketType = event.ticketType;
  const price = event.ticketPrice;
  if (ticketType === 'FREE' || (price != null && Number(price) === 0)) {
    schema.offers = {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      url: `${siteUrl}/events/${event.id}`,
    };
  } else if (ticketType === 'PAID' && price != null && Number(price) > 0) {
    schema.offers = {
      '@type': 'Offer',
      price: String(Number(price).toFixed(2)),
      priceCurrency: event.currency || 'USD',
      availability: 'https://schema.org/InStock',
      url: `${siteUrl}/events/${event.id}`,
    };
  }

  return schema;
}
