import { cache } from 'react';
import { getServerApiBaseUrl } from '@/lib/apiBase';
import { ssrFetchJson } from '@/lib/ssrFetch';
import { CANONICAL_ORIGIN } from '@/lib/siteUrl';
import { allCities, eventMatchesCity, resolveEventCity } from '@/lib/seo/cities';

/**
 * Server-side loader for the published, upcoming, PUBLIC event catalogue.
 *
 * This is the single source every indexable surface reads from — the sitemap, the city and
 * genre hubs, and the Google Ads business-data feed. One loader means those surfaces can
 * never disagree about what PXI publishes, which is exactly how the old hand-maintained
 * sitemap ended up advertising four URLs that 404'd.
 *
 * `?discover=1` is deliberate: on the backend that flag is what pins the query to
 * `visibility: PUBLIC`, `status != ARCHIVED` and `endDate >= now`. Do not drop it — a bare
 * `GET /api/events` returns PRIVATE events, and publishing those would be a data leak, not
 * just an SEO bug.
 */

const PAGE_SIZE = 100; // backend hard-caps `limit` at 100
const MAX_PAGES = 25; // 2,500 events; a safety stop, not an expected ceiling
const REVALIDATE_SECONDS = 600;

async function fetchPageUncached(offset) {
  const base = getServerApiBaseUrl();
  const url = `${base}/api/events?discover=1&limit=${PAGE_SIZE}&offset=${offset}`;
  const { status, data } = await ssrFetchJson(url, {
    revalidate: REVALIDATE_SECONDS,
    logTag: 'publicEvents',
  });
  if (status !== 200 || !data) return null;
  const events = Array.isArray(data) ? data : (data.events ?? data.data ?? []);
  return {
    events: Array.isArray(events) ? events : [],
    total: Number.isFinite(Number(data?.total)) ? Number(data.total) : null,
  };
}

/**
 * Every published, upcoming, public event. Returns [] rather than throwing — an SEO
 * surface must degrade to "fewer URLs", never to a 500.
 */
async function fetchAllPublicEventsUncached() {
  const out = [];
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const res = await fetchPageUncached(page * PAGE_SIZE);
    if (!res) break;
    out.push(...res.events);
    if (res.events.length < PAGE_SIZE) break;
    if (res.total != null && out.length >= res.total) break;
  }

  const now = Date.now();
  const seen = new Set();
  return out
    .filter((e) => {
      if (!e?.id || seen.has(e.id)) return false;
      seen.add(e.id);
      // Belt and braces: the backend already filters these, but this list becomes public
      // URLs, so re-assert the invariants locally rather than trusting the upstream flag.
      if (e.visibility && e.visibility !== 'PUBLIC') return false;
      if (e.status === 'ARCHIVED' || e.status === 'CANCELLED') return false;
      const end = e.endDate ? new Date(e.endDate).getTime() : null;
      const start = e.startDate ? new Date(e.startDate).getTime() : null;
      if (end != null && end < now) return false;
      if (end == null && start != null && start < now) return false;
      return true;
    })
    .sort((a, b) => new Date(a.startDate ?? 0) - new Date(b.startDate ?? 0));
}

export const getAllPublicEvents = cache(fetchAllPublicEventsUncached);

/* ────────────────────────────────────────────────────────────────────────── */

/** Canonical public URL for an event. */
export function eventUrl(event, origin = CANONICAL_ORIGIN) {
  return `${origin}/events/${event.id}`;
}

/** Best available large image for an event, absolute. */
export function eventImageUrl(event, origin = CANONICAL_ORIGIN) {
  const raw = event?.ogImageUrl || event?.coverImage || event?.image || null;
  if (!raw) return `${origin}/og-hero.png`;
  return String(raw).startsWith('http') ? String(raw) : `${origin}${raw}`;
}

/** Face-value ticket price in USD, or 0 for free events. Null when it cannot be resolved. */
export function eventPriceUsd(event) {
  if (!event) return null;
  if (event.ticketType === 'FREE') return 0;
  const p = Number(event.ticketPrice);
  return Number.isFinite(p) ? p : null;
}

/**
 * Genre labels attached to an event, lowercased and de-duplicated.
 * Genres only exist where a DJ linked a playlist, so most events legitimately have none.
 */
export function eventGenres(event) {
  const raw = Array.isArray(event?.genres)
    ? event.genres
    : Array.isArray(event?.playlist?.topGenres)
      ? event.playlist.topGenres
      : Array.isArray(event?.playlist?.genres)
        ? event.playlist.genres
        : [];
  const seen = new Set();
  return raw
    .map((g) => (typeof g === 'string' ? g : g?.name))
    .filter(Boolean)
    .map((g) => String(g).trim().toLowerCase())
    .filter((g) => g && !seen.has(g) && seen.add(g));
}

/** Lineup performers on an event, as {name, username} — the basis of the artist hubs. */
export function eventPerformers(event) {
  const lineup = Array.isArray(event?.lineup) ? event.lineup : [];
  return lineup
    .map((p) =>
      typeof p === 'string'
        ? { name: p, username: null, role: null }
        : { name: p?.name || p?.username, username: p?.username ?? null, role: p?.lineupRole ?? null },
    )
    .filter((p) => p.name);
}

/** Events belonging to a city hub. */
export function eventsInCity(events, city) {
  return events.filter((e) => eventMatchesCity(e, city));
}

/** Group the catalogue by operational city. Events we cannot place are dropped. */
export function groupEventsByCity(events) {
  const map = new Map(allCities().map((c) => [c.slug, { city: c, events: [] }]));
  for (const e of events) {
    const city = resolveEventCity(e);
    if (city && map.has(city.slug)) map.get(city.slug).events.push(e);
  }
  return [...map.values()];
}
