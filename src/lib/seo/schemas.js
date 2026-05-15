/** Centralised JSON-LD schema definitions for PXI pages. */

const SITE_URL = 'https://pxispace.com';

export const ORGANIZATION_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'PXI',
  url: SITE_URL,
  logo: `${SITE_URL}/favicon.svg`,
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

export const SOFTWARE_APP_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'PXI',
  operatingSystem: 'iOS',
  applicationCategory: 'SocialNetworkingApplication',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  url: SITE_URL,
  description:
    'Plan events, capture moments with shared cameras, and build a living scrapbook with PXI.',
};

export const WEBSITE_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'PXI',
  url: SITE_URL,
};

/** Homepage: array of all schemas to inject. */
export const HOMEPAGE_JSONLD = [
  ORGANIZATION_JSONLD,
  SOFTWARE_APP_JSONLD,
  WEBSITE_JSONLD,
];

/**
 * Build Event JSON-LD for a public event detail page.
 * @param {object} event — API event object
 * @param {string} siteUrl — canonical site origin (no trailing slash)
 */
export function buildEventJsonLd(event, siteUrl) {
  if (!event) return null;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.name || 'Event',
    url: `${siteUrl}/events/${event.id}`,
  };

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
