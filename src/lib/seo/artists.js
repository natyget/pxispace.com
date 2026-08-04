import { eventPerformers, eventGenres, eventUrl } from '@/lib/publicEvents';
import { eventCanonicalGenres } from '@/lib/seo/genres';
import { resolveEventCity } from '@/lib/seo/cities';

/**
 * Artist registry for /artists and /artists/[slug].
 *
 * WHAT AN ARTIST IS HERE: a performer actually booked on a PXI event — someone carrying a
 * `lineupRole` on the event's member list. Nothing else.
 *
 * What an artist is NOT: the artists of tracks in a linked Spotify playlist. Those live on
 * `EventPlaylist.artists` and are tempting because there are far more of them, but a page
 * built from that data would claim Drake performed at an event because a DJ played one
 * Drake record. Publishing that as structured data is a factual claim we cannot support,
 * and it is the kind of thing that costs a domain its trust with Google permanently.
 *
 * Consequence: coverage is only as good as how diligently hosts fill in their lineup. Hubs
 * with no upcoming events are noindexed and kept out of the sitemap rather than published
 * thin — see `indexableArtists()`.
 */

/** URL-safe slug from a performer name. Stable, lowercase, ASCII-folded. */
export function artistSlug(name) {
  return String(name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/**
 * Build the artist index from the public event catalogue.
 * @param {object[]} events from getAllPublicEvents()
 * @returns {Map<string, {slug, name, username, roles, events, genres, cities}>}
 */
export function buildArtistIndex(events = []) {
  const index = new Map();

  for (const event of events) {
    const performers = eventPerformers(event);
    if (!performers.length) continue;

    const genres = eventCanonicalGenres(eventGenres(event));
    const city = resolveEventCity(event);

    for (const performer of performers) {
      const slug = artistSlug(performer.name);
      if (!slug) continue;

      if (!index.has(slug)) {
        index.set(slug, {
          slug,
          name: performer.name,
          username: performer.username ?? null,
          roles: new Set(),
          events: [],
          genres: new Map(),
          cities: new Map(),
        });
      }
      const entry = index.get(slug);
      // Prefer a name that carries a username — it is the real account, not a free-text label.
      if (!entry.username && performer.username) {
        entry.username = performer.username;
        entry.name = performer.name;
      }
      if (performer.role) entry.roles.add(performer.role);
      entry.events.push(event);
      for (const g of genres) entry.genres.set(g.slug, g);
      if (city) entry.cities.set(city.slug, city);
    }
  }

  // Normalise the collections into plain arrays, newest events first.
  for (const entry of index.values()) {
    entry.roles = [...entry.roles];
    entry.genres = [...entry.genres.values()];
    entry.cities = [...entry.cities.values()];
    entry.events.sort((a, b) => new Date(a.startDate ?? 0) - new Date(b.startDate ?? 0));
  }

  return index;
}

export function getArtist(index, slug) {
  return index.get(slug) ?? null;
}

/**
 * Artists worth indexing: at least one upcoming event.
 * An artist page with nothing on it is a thin page, and enough of them drag down the
 * quality signal for every other page on the domain.
 */
export function indexableArtists(index) {
  return [...index.values()]
    .filter((a) => a.events.length > 0)
    .sort((a, b) => b.events.length - a.events.length || a.name.localeCompare(b.name));
}

/** Shape an artist's events for the JSON-LD/ItemList builders. */
export function artistEventLinks(artist) {
  return (artist?.events ?? []).map((e) => ({ name: e.name || 'Event', url: eventUrl(e) }));
}

/** Other artists who have shared a genre or a city with this one. */
export function relatedArtists(index, artist, limit = 8) {
  if (!artist) return [];
  const genreSlugs = new Set(artist.genres.map((g) => g.slug));
  const citySlugs = new Set(artist.cities.map((c) => c.slug));

  return indexableArtists(index)
    .filter((other) => other.slug !== artist.slug)
    .map((other) => {
      const sharedGenres = other.genres.filter((g) => genreSlugs.has(g.slug)).length;
      const sharedCities = other.cities.filter((c) => citySlugs.has(c.slug)).length;
      return { artist: other, score: sharedGenres * 2 + sharedCities };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.artist);
}
