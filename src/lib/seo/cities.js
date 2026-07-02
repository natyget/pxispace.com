/** City slug → display metadata for programmatic /discover/[city] SEO pages. */

export const CITIES = {
  'new-york': {
    slug: 'new-york',
    name: 'New York',
    // substrings matched (case-insensitive) against an event's location string
    match: ['new york', 'nyc', 'brooklyn', 'manhattan', 'queens', 'bronx'],
    blurb: 'Parties, shows, and run clubs across the five boroughs.',
  },
  montreal: {
    slug: 'montreal',
    name: 'Montréal',
    match: ['montreal', 'montréal', 'mtl', 'quebec', 'québec'],
    blurb: 'Nightlife, festivals, and after-hours across the city.',
  },
  toronto: {
    slug: 'toronto',
    name: 'Toronto',
    match: ['toronto', 'the 6ix', 'gta', 'ontario'],
    blurb: 'Concerts, club nights, and community events across the GTA.',
  },
};

export function getCity(slug) {
  return CITIES[slug] ?? null;
}

export function allCitySlugs() {
  return Object.keys(CITIES);
}
