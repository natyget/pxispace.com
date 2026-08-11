/**
 * Operational city registry — the single source of truth for /discover/[city].
 *
 * PXI operates in NEW YORK and BOSTON only. Montréal and Toronto were listed here
 * historically; their hubs are retired and 301 to /discover/new-york (next.config.js).
 * Do not re-add a city until it is actually operational — a hub with no events is a thin
 * page, and thin templated pages drag the whole domain's quality signal down.
 *
 * Membership resolution is deliberately two-tier:
 *   1. `cityCode` — the canonical signal, once Event.cityCode ships (migration written,
 *      not yet applied). Exact, cheap, immune to how an address happens to be written.
 *   2. `match` — a case-insensitive substring scan over the event's free-text `location`,
 *      which is all we have today. Lossy by nature: an event at
 *      "Elsewhere, 599 Johnson Ave, Brooklyn NY" only lands in New York because
 *      "brooklyn" is in the list, and one written as "1 Kenmore Sq" lands nowhere at all.
 * Once cityCode is backfilled, tier 2 becomes a fallback for legacy rows only.
 */

export const CITIES = {
  'new-york': {
    slug: 'new-york',
    cityCode: 'NYC',
    name: 'New York',
    state: 'NY',
    region: 'New York',
    country: 'US',
    lat: 40.7128,
    lng: -74.006,
    timezone: 'America/New_York',
    // substrings matched (case-insensitive) against an event's location string
    match: ['new york', 'nyc', 'brooklyn', 'manhattan', 'queens', 'bronx', 'harlem', 'bushwick', 'williamsburg'],
    blurb: 'Parties, shows, and run clubs across the five boroughs.',
  },
  boston: {
    slug: 'boston',
    cityCode: 'BOS',
    name: 'Boston',
    state: 'MA',
    region: 'Massachusetts',
    country: 'US',
    lat: 42.3601,
    lng: -71.0589,
    timezone: 'America/New_York',
    match: [
      'boston',
      'cambridge',
      'somerville',
      'allston',
      'brighton',
      'dorchester',
      'roxbury',
      'jamaica plain',
      'back bay',
      'seaport',
      'fenway',
      'brookline',
    ],
    blurb: 'Afrohouse, amapiano, and community nights across the city and over the river.',
  },
};

/** Cities we no longer operate in. Kept so redirects and tests can assert against them. */
export const RETIRED_CITY_SLUGS = ['montreal', 'toronto'];

export function getCity(slug) {
  return CITIES[slug] ?? null;
}

export function allCitySlugs() {
  return Object.keys(CITIES);
}

export function allCities() {
  return Object.values(CITIES);
}

/** Resolve a city record from an event's canonical cityCode. */
export function getCityByCode(cityCode) {
  if (!cityCode) return null;
  const code = String(cityCode).toUpperCase();
  return allCities().find((c) => c.cityCode === code) ?? null;
}

/**
 * Does this event belong to this city hub? Prefers the canonical cityCode and falls
 * back to substring matching on the free-text location.
 */
export function eventMatchesCity(event, city) {
  if (!event || !city) return false;
  if (event.cityCode) return String(event.cityCode).toUpperCase() === city.cityCode;
  const haystack = String(event.location ?? '').toLowerCase();
  if (!haystack) return false;
  return city.match.some((needle) => haystack.includes(needle));
}

/** Best-effort city record for an event, or null when it cannot be placed. */
export function resolveEventCity(event) {
  if (!event) return null;
  if (event.cityCode) return getCityByCode(event.cityCode);
  return allCities().find((c) => eventMatchesCity(event, c)) ?? null;
}
