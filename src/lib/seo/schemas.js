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
      description:
        'PXI is a privacy-first event operating system spanning white-label ticketing, shared event photo galleries, and digital scrapbooks.',
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
      description:
        'PXI is a dual-sided event operating system for organizers and attendees, combining white-label ticketing infrastructure with privacy-first social scrapbooks.',
      featureList: [
        'White-Label Event Ticketing',
        'Real-Time Predictive Analytics',
        'Tactile Native Camera Streaming',
        'DBSCAN Clustered Digital Scrapbook',
        'Event Passport with Odyssey Scoring',
        'Wilson-Scored Engagement Graph',
        'PASETO Verified Claims',
        'Zero Location Tracking',
      ],
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.9',
        ratingCount: '342',
      },
    },
  ],
};

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
