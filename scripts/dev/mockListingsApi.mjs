#!/usr/bin/env node
/**
 * Stand-in for the outside-listings feed (contract: BRIEF-V4-CONTRACT.md), for working on the /e/ pages locally.
 * Serves the public routes on :3196 with 15 upcoming nights (NYC, BOS, YUL) and one ended night.
 *
 *   node scripts/dev/mockListingsApi.mjs
 *   API_BASE_URL=http://127.0.0.1:3196 npx next dev -p 5191
 *
 * Times are built from today in each city's zone, so the nights stay upcoming.
 */

import http from 'node:http';

const PORT = Number(process.env.PORT || 3196);
const HOST = '127.0.0.1';
const HOUR = 3600 * 1000;
const DAY = 24 * HOUR;

const CITIES = {
  NYC: { slug: 'new-york', name: 'New York', zone: 'America/New_York', currency: 'USD' },
  BOS: { slug: 'boston', name: 'Boston', zone: 'America/New_York', currency: 'USD' },
  YUL: { slug: 'montreal', name: 'Montréal', zone: 'America/Toronto', currency: 'CAD' },
};

// days: calendar days from today (in the city's zone); start: local hour; hours: length of the night.
const NIGHTS = [
  { n: 1, cityCode: 'NYC', days: 2, start: 22, hours: 8, title: 'Deep Water', venueName: 'Nowadays', address: '56-06 Cooper Ave, Queens, NY 11385', lat: 40.7057, lng: -73.9104, genre: 'house', source: 'DICE', sourceName: 'DICE', priceMinCents: 2000, priceMaxCents: 3500, organizerName: 'Deep Water Collective' },
  { n: 2, cityCode: 'NYC', days: 3, start: 23, hours: 9, title: 'Hard Floor Sunday', venueName: 'Good Room', address: '98 Meserole Ave, Brooklyn, NY 11222', lat: 40.7226, lng: -73.9463, genre: 'techno', source: 'RA', sourceName: 'Resident Advisor', priceMinCents: 2500, priceMaxCents: 3000, organizerName: 'Hard Floor' },
  { n: 3, cityCode: 'NYC', days: 5, start: 21, hours: 5, title: 'Sugar Pop', venueName: 'Elsewhere', address: '599 Johnson Ave, Brooklyn, NY 11237', lat: 40.7059, lng: -73.9318, genre: 'pop', source: 'POSH', sourceName: 'Posh', priceMinCents: 1500, priceMaxCents: 2500, organizerName: 'Sugar Club' },
  { n: 4, cityCode: 'NYC', days: 6, start: 22, hours: 7, title: 'Mirror Disco', venueName: 'Public Records', address: '233 Varick St, New York, NY 10014', lat: 40.7312, lng: -74.0077, genre: 'disco', source: 'SHOTGUN', sourceName: 'Shotgun', priceMinCents: 1800, priceMaxCents: 2800, organizerName: 'Mirror Works' },
  { n: 5, cityCode: 'NYC', days: 7, start: 22, hours: 6, title: 'Late Lines', venueName: 'Newspeak', address: '848 Washington St, New York, NY 10014', lat: 40.7399, lng: -74.0082, genre: 'indie-dance', source: 'EVENTBRITE', sourceName: 'Eventbrite', priceMinCents: 2000, priceMaxCents: 2000, organizerName: 'Late Lines' },
  { n: 6, cityCode: 'NYC', days: 9, start: 23, hours: 10, title: 'Sunrise Afro', venueName: 'Bossa Nova Civic Club', address: '1271 Bushwick Ave, Brooklyn, NY 11207', lat: 40.7029, lng: -73.9205, genre: 'afrohouse', source: 'DICE', sourceName: 'DICE', priceMinCents: 3000, priceMaxCents: 4000, organizerName: 'Sunrise Afro' },
  { n: 7, cityCode: 'NYC', days: 10, start: 20, hours: 4, title: 'Free Pop Mixer', venueName: 'Public Records', address: '233 Varick St, New York, NY 10014', lat: 40.7312, lng: -74.0077, genre: 'pop', source: 'POSH', sourceName: 'Posh', priceMinCents: 0, priceMaxCents: 0, organizerName: 'Mixer Club' },
  { n: 8, cityCode: 'NYC', days: 12, start: 22, hours: 6, title: 'Open Format', venueName: 'Newspeak', address: '848 Washington St, New York, NY 10014', lat: 40.7399, lng: -74.0082, genre: null, source: 'TICKETMASTER', sourceName: 'Ticketmaster', priceMinCents: 2500, priceMaxCents: 4500, organizerName: 'Open Format' },
  { n: 9, cityCode: 'BOS', days: 4, start: 22, hours: 6, title: 'Afro Gathering', venueName: 'Royale', address: '279 Tremont St, Boston, MA 02116', lat: 42.3504, lng: -71.0654, genre: 'afrohouse', source: 'POSH', sourceName: 'Posh', priceMinCents: 2500, priceMaxCents: 3500, organizerName: 'Afro Gathering' },
  { n: 10, cityCode: 'BOS', days: 6, start: 21, hours: 6, title: 'Deep Brighton', venueName: 'Brighton Music Hall', address: '175 Brighton Ave, Allston, MA 02134', lat: 42.3527, lng: -71.133, genre: 'house', source: 'EVENTBRITE', sourceName: 'Eventbrite', priceMinCents: 1500, priceMaxCents: 2000, organizerName: 'Brighton Nights' },
  { n: 11, cityCode: 'BOS', days: 8, start: 21, hours: 5, title: 'Indie Cambridge', venueName: 'Middle East Downstairs', address: '472 Massachusetts Ave, Cambridge, MA 02139', lat: 42.3644, lng: -71.1027, genre: 'indie-dance', source: 'SHOTGUN', sourceName: 'Shotgun', priceMinCents: 1200, priceMaxCents: 1500, organizerName: 'Indie Cambridge' },
  { n: 12, cityCode: 'BOS', days: 13, start: 22, hours: 5, title: 'Lansdowne Pop', venueName: 'Lansdowne Loft', address: '1 Lansdowne St, Boston, MA 02215', lat: 42.3485, lng: -71.0966, genre: 'pop', source: 'TICKETMASTER', sourceName: 'Ticketmaster', priceMinCents: 3500, priceMaxCents: 6000, organizerName: 'Lansdowne Loft' },
  { n: 13, cityCode: 'YUL', days: 3, start: 22, hours: 7, title: 'Sous Terrain', venueName: 'Stereo', address: '858 Rue Sainte-Catherine E, Montréal, QC H2L 2C4', lat: 45.5157, lng: -73.5654, genre: 'house', source: 'EVENTBRITE', sourceName: 'Eventbrite', priceMinCents: 2500, priceMaxCents: 4000, organizerName: 'Sous Terrain' },
  { n: 14, cityCode: 'YUL', days: 5, start: 23, hours: 8, title: 'Night Shift', venueName: 'Le Belmont', address: '4483 Rue Saint-Denis, Montréal, QC H2J 2L2', lat: 45.5199, lng: -73.5822, genre: 'techno', source: 'RA', sourceName: 'Resident Advisor', priceMinCents: 2000, priceMaxCents: 2500, organizerName: 'Night Shift' },
  { n: 15, cityCode: 'YUL', days: 11, start: 22, hours: 6, title: 'Disco Parade', venueName: 'Club Soda', address: '1225 Boulevard Saint-Laurent, Montréal, QC H2X 2S6', lat: 45.5107, lng: -73.5688, genre: 'disco', source: 'SHOTGUN', sourceName: 'Shotgun', priceMinCents: 1800, priceMaxCents: 2200, organizerName: 'Disco Parade' },
  // Ended three days ago: the detail answers 410 (gone), the feed leaves it out.
  { n: 16, cityCode: 'NYC', days: -3, start: 22, hours: 6, title: 'Last Call Warehouse', venueName: 'Good Room', address: '98 Meserole Ave, Brooklyn, NY 11222', lat: 40.7226, lng: -73.9463, genre: 'house', source: 'DICE', sourceName: 'DICE', priceMinCents: 2000, priceMaxCents: 2000, organizerName: 'Last Call' },
];

// ————— Time, in a city's zone —————

function parts(zone, instant) {
  const formatted = new Intl.DateTimeFormat('en-US', {
    timeZone: zone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(instant));
  return Object.fromEntries(formatted.filter((p) => p.type !== 'literal').map((p) => [p.type, Number(p.value)]));
}

// Wall-clock time in the zone minus UTC, at one instant.
function offsetMs(zone, instant) {
  const p = parts(zone, instant);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - Math.floor(instant / 1000) * 1000;
}

// A wall-clock time in the zone as an instant (two passes, so a DST change on the day is right).
function zonedToUtc(zone, y, mo, d, h, mi) {
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  const first = guess - offsetMs(zone, guess);
  return guess - offsetMs(zone, first);
}

const iso = (ms) => new Date(ms).toISOString();

function nightOf(startMs, zone) {
  const p = parts(zone, startMs - 5 * HOUR);
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
}

function slugify(text) {
  return String(text)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// The contract's listing slug: title and venue, at most 80 characters, then the id.
function listingSlug(title, venueName, id) {
  const head = slugify(`${title} ${venueName || ''}`).slice(0, 80).replace(/-+$/, '');
  return `${head}-${id}`;
}

// ————— The feed —————

const idFor = (n) => `5b0f6c1e-2a7d-4f3e-9c10-8e4a1d2b7f${String(n).padStart(2, '0')}`;

function toCard(night, index, now) {
  const city = CITIES[night.cityCode];
  const local = parts(city.zone, now + night.days * DAY);
  const startsAt = zonedToUtc(city.zone, local.year, local.month, local.day, night.start, 0);
  const endsAt = startsAt + night.hours * HOUR;
  const id = idFor(night.n);
  return {
    id,
    slug: listingSlug(night.title, night.venueName, id),
    citySlug: city.slug,
    title: night.title,
    startsAt: iso(startsAt),
    endsAt: iso(endsAt),
    timeZone: city.zone,
    venueName: night.venueName,
    address: night.address,
    lat: night.lat,
    lng: night.lng,
    cityCode: night.cityCode,
    priceMinCents: night.priceMinCents,
    priceMaxCents: night.priceMaxCents,
    currency: city.currency,
    isFree: night.priceMinCents === 0,
    imageUrl: null,
    imageAttribution: null,
    source: night.source,
    sourceName: night.sourceName,
    genre: night.genre,
    updatedAt: iso(now - (index + 1) * 2 * HOUR),
    // Not on the card: the detail adds them (contract: the detail keeps its shape).
    _startMs: startsAt,
    _endMs: endsAt,
  };
}

function buildNights(now) {
  return NIGHTS.map((night, i) => ({ night, card: toCard(night, i, now) }));
}

function publicCard(card) {
  const { _startMs, _endMs, ...rest } = card;
  return rest;
}

function detailFor(night, card) {
  const city = CITIES[night.cityCode];
  return {
    ...publicCard(card),
    priceFromCents: card.priceMinCents,
    coverUrl: null,
    coverAttribution: null,
    organizerName: night.organizerName,
    ticketUrl: `https://example.com/tickets/${night.n}`,
    alsoOn: [],
    night: nightOf(card._startMs, city.zone),
    ended: card._endMs < Date.now(),
    topSong: null,
  };
}

// ————— HTTP —————

const CACHE = 'public, max-age=300, s-maxage=900';

function send(res, status, body, headers = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', ...headers });
  res.end(JSON.stringify(body));
}

const server = http.createServer((req, res) => {
  if (req.method !== 'GET') return send(res, 405, { error: 'method not allowed' });
  const url = new URL(req.url, `http://${HOST}`);
  const now = Date.now();
  const built = buildNights(now);
  const upcoming = built.filter(({ card }) => card._endMs > now).sort((a, b) => a.card._startMs - b.card._startMs);

  if (url.pathname === '/api/events') return send(res, 200, []);

  if (url.pathname === '/api/public/listings') {
    const city = url.searchParams.get('city');
    const genre = url.searchParams.get('genre');
    const limit = Number(url.searchParams.get('limit') || 120);
    if (city && !CITIES[city]) return send(res, 400, { error: 'unknown city' });
    if (!Number.isInteger(limit) || limit < 1 || limit > 300) return send(res, 400, { error: 'limit' });
    const listings = upcoming
      .filter(({ card }) => (!city || card.cityCode === city) && (!genre || card.genre === genre))
      .slice(0, limit)
      .map(({ card }) => publicCard(card));
    return send(res, 200, { city: city || null, listings }, { 'Cache-Control': CACHE });
  }

  if (url.pathname === '/api/public/listings/sitemap') {
    const listings = upcoming.map(({ card }) => ({
      id: card.id,
      path: `/e/${card.citySlug}/${card.slug}`,
      updatedAt: card.updatedAt,
    }));
    return send(res, 200, { listings }, { 'Cache-Control': CACHE });
  }

  const byId = url.pathname.match(/^\/api\/public\/listings\/([^/]+)$/);
  if (byId) {
    const hit = built.find(({ card }) => card.id === decodeURIComponent(byId[1]));
    if (!hit) return send(res, 404, { error: 'not found' });
    if (hit.card._endMs < now - DAY) {
      return send(res, 410, { error: 'gone', cityName: CITIES[hit.night.cityCode].name });
    }
    return send(res, 200, { listing: detailFor(hit.night, hit.card) }, { 'Cache-Control': CACHE });
  }

  return send(res, 404, { error: 'not found' });
});

server.listen(PORT, HOST, () => {
  process.stdout.write(`Mock listings API on http://${HOST}:${PORT} (${NIGHTS.length} nights)\n`);
});
