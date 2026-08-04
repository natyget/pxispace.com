import { EDITORIAL_STORIES } from '@/content/editorial';
import { allCities } from '@/lib/seo/cities';
import { getAllPublicEvents, eventsInCity } from '@/lib/publicEvents';
import { CANONICAL_ORIGIN } from '@/lib/siteUrl';

/**
 * Sitemap served at /sitemap.xml — generated, never hand-maintained.
 *
 * It used to be a static list and it drifted badly: four /editorial URLs that 404'd, two
 * cities we do not operate in, and a live city hub missing entirely. Everything here is now
 * derived from the same sources the pages themselves render from, so it cannot disagree
 * with the site again.
 *
 * INVARIANTS (enforced in CI by scripts/check-sitemap.mjs):
 *   - Every URL returns 200. No 404s, no redirects — a sitemap listing a 301 is telling
 *     Google we do not know our own canonical URLs.
 *   - Retired cities (montreal, toronto) are absent; they 301 to /discover/new-york.
 *   - Hubs with no events are omitted. An empty hub is a thin page, and thin templated
 *     pages drag down the quality signal for the whole domain.
 *   - Only PUBLIC, published, upcoming events appear (see src/lib/publicEvents.js).
 */

// Events change constantly; regenerate hourly rather than baking the list at build time.
export const revalidate = 3600;

export default async function sitemap() {
  const base = CANONICAL_ORIGIN;
  const now = new Date();

  const core = [
    { url: base, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${base}/events`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/platform`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/pricing`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/features/branded-event-ticketing`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/features/event-promoter-analytics`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/features/shared-event-photo-gallery`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/features/digital-event-passport`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/features/instagram-event-sharing`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/competitors/partiful-luma-alternative`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/editorial`, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${base}/about`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/beta`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/support`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/faq`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/legal`, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${base}/privacy`, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${base}/terms`, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${base}/child-safety`, changeFrequency: 'yearly', priority: 0.2 },
  ];

  const editorial = EDITORIAL_STORIES.map((s) => ({
    url: `${base}/editorial/${s.slug}`,
    changeFrequency: 'monthly',
    priority: 0.5,
    lastModified: s.date ? new Date(s.date) : now,
  }));

  // A hub is only worth indexing once it has something in it. If the API is unreachable we
  // still list the city hubs — they are real pages with real copy — but we list no events.
  let events = [];
  try {
    events = await getAllPublicEvents();
  } catch {
    events = [];
  }

  const cities = allCities().map((city) => {
    const cityEvents = eventsInCity(events, city);
    const newest = cityEvents.reduce((acc, e) => {
      const t = e.updatedAt ? new Date(e.updatedAt) : null;
      return t && (!acc || t > acc) ? t : acc;
    }, null);
    return {
      url: `${base}/discover/${city.slug}`,
      changeFrequency: 'daily',
      priority: cityEvents.length ? 0.8 : 0.5,
      lastModified: newest ?? now,
    };
  });

  const eventPages = events.map((e) => ({
    url: `${base}/events/${e.id}`,
    changeFrequency: 'daily',
    // Upcoming events are the freshest, most crawl-worthy thing on the site.
    priority: 0.7,
    lastModified: e.updatedAt ? new Date(e.updatedAt) : (e.createdAt ? new Date(e.createdAt) : now),
  }));

  return [...core, ...cities, ...editorial, ...eventPages].map((e) => ({
    lastModified: now,
    ...e,
  }));
}
