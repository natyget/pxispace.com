/**
 * Curated genre vocabulary for the /genres and /discover/[city]/[genre] hubs.
 *
 * Why a closed list. The raw genre strings on an event come from Spotify/Apple metadata via
 * the playlist a DJ linked, and they are uncurated: "afro house", "afrohouse", "nigerian
 * pop", "alte", "azonto" all show up for what is commercially one or two scenes. Minting a
 * URL per raw string would produce hundreds of near-duplicate thin pages — the exact
 * doorway-page pattern Google penalises. So raw strings are MAPPED onto this fixed set, and
 * anything that does not map simply does not get a hub.
 *
 * Adding a genre is a deliberate act: it creates an indexable URL. Only add one when PXI
 * actually runs enough events in it to make the page worth crawling.
 */

export const GENRES = {
  afrobeats: {
    slug: 'afrobeats',
    name: 'Afrobeats',
    blurb: 'Afrobeats nights, Naija parties, and the sound moving dancefloors worldwide.',
    aliases: ['afrobeats', 'afrobeat', 'afro beats', 'afropop', 'afro pop', 'nigerian pop', 'naija', 'alte', 'azonto', 'ghanaian'],
  },
  amapiano: {
    slug: 'amapiano',
    name: 'Amapiano',
    blurb: 'Log drums, piano lines, and the South African sound that took over the night.',
    aliases: ['amapiano', 'piano', 'yanos', 'private school piano'],
  },
  afrohouse: {
    slug: 'afrohouse',
    name: 'Afro House',
    blurb: 'Afro house, 3-step, and the deeper end of the diaspora dancefloor.',
    aliases: ['afro house', 'afrohouse', 'afro tech', 'afrotech', 'gqom', '3 step', 'afro deep'],
  },
  house: {
    slug: 'house',
    name: 'House',
    blurb: 'House in all its forms — deep, soulful, tech, and everything between.',
    aliases: ['house', 'deep house', 'tech house', 'soulful house', 'jackin house', 'garage house'],
  },
  techno: {
    slug: 'techno',
    name: 'Techno',
    blurb: 'Warehouse techno, industrial, and after-hours rooms that do not stop.',
    aliases: ['techno', 'minimal techno', 'industrial techno', 'hard techno', 'melodic techno'],
  },
  'hip-hop': {
    slug: 'hip-hop',
    name: 'Hip Hop',
    blurb: 'Rap, trap, and hip hop nights.',
    aliases: ['hip hop', 'hip-hop', 'hiphop', 'rap', 'trap', 'drill', 'conscious hip hop'],
  },
  rnb: {
    slug: 'rnb',
    name: 'R&B and Soul',
    blurb: 'R&B, neo-soul, and slow-burn rooms.',
    aliases: ['r&b', 'rnb', 'r and b', 'randb', 'soul', 'neo soul', 'neo-soul', 'contemporary r&b'],
  },
  dancehall: {
    slug: 'dancehall',
    name: 'Dancehall and Reggae',
    blurb: 'Dancehall, reggae, soca, and Caribbean nights.',
    aliases: ['dancehall', 'reggae', 'soca', 'bashment', 'ragga', 'dub', 'caribbean'],
  },
  kompa: {
    slug: 'kompa',
    name: 'Kompa and Zouk',
    blurb: 'Kompa, zouk, and the Haitian and Antillean floor.',
    aliases: ['kompa', 'compas', 'zouk', 'kizomba', 'haitian'],
  },
  latin: {
    slug: 'latin',
    name: 'Latin and Reggaeton',
    blurb: 'Reggaeton, salsa, bachata, and Latin nights.',
    aliases: ['latin', 'reggaeton', 'salsa', 'bachata', 'merengue', 'perreo', 'latin pop', 'cumbia'],
  },
  disco: {
    slug: 'disco',
    name: 'Disco and Funk',
    blurb: 'Disco, funk, boogie, and rooms built on a groove.',
    aliases: ['disco', 'funk', 'boogie', 'nu disco', 'nu-disco'],
  },
  jazz: {
    slug: 'jazz',
    name: 'Jazz',
    blurb: 'Live jazz, jam sessions, and listening rooms.',
    aliases: ['jazz', 'nu jazz', 'jazz fusion', 'bebop', 'afro jazz'],
  },
};

/** Longest aliases first, so "afro house" wins over "house" on the same string. */
const ALIAS_INDEX = Object.values(GENRES)
  .flatMap((g) => g.aliases.map((alias) => ({ alias, slug: g.slug })))
  .sort((a, b) => b.alias.length - a.alias.length);

export function getGenre(slug) {
  return GENRES[slug] ?? null;
}

export function allGenreSlugs() {
  return Object.keys(GENRES);
}

export function allGenres() {
  return Object.values(GENRES);
}

/**
 * Map one raw genre string onto a canonical genre, or null when it does not belong to the
 * curated vocabulary. Matching is substring-based because the source strings are messy
 * ("south african amapiano", "afro house / 3 step").
 */
export function canonicalizeGenre(raw) {
  if (!raw) return null;
  const value = String(raw).trim().toLowerCase();
  if (!value) return null;
  if (GENRES[value]) return GENRES[value];
  const hit = ALIAS_INDEX.find(({ alias }) => value === alias || value.includes(alias));
  return hit ? GENRES[hit.slug] : null;
}

/** Canonical genres for an event, de-duplicated and stable-ordered. */
export function eventCanonicalGenres(rawGenres = []) {
  const seen = new Set();
  const out = [];
  for (const raw of rawGenres) {
    const genre = canonicalizeGenre(raw);
    if (genre && !seen.has(genre.slug)) {
      seen.add(genre.slug);
      out.push(genre);
    }
  }
  return out;
}

/** Does this event belong under this genre hub? */
export function eventMatchesGenre(eventGenreStrings, genre) {
  if (!genre) return false;
  return eventCanonicalGenres(eventGenreStrings).some((g) => g.slug === genre.slug);
}
