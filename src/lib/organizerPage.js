// The decisions behind the organizer page (/u/<username or id>), kept apart from the markup so they can be tested
// (organizerPage.test.mjs). Nothing here fetches and nothing here reads the request: every function takes what it
// needs, so the page, its metadata and the host link in the event view all say the same thing.
//   npm run test:organizer

import { formatInviteVenue } from './eventInviteCard.js';

// ————— Who is asked for —————

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// The API's own rule for a username (1 to 30 of a-z, 0-9, dot and underscore), case-insensitive here because the
// API lowercases what it is given.
const USERNAME = /^[a-z0-9._]{1,30}$/i;

/**
 * What the address names: a user id or a username, with a leading "@" and any percent-escaping (an "@" in a path can
 * arrive as %40) taken off. null when it is neither, so a scanner walking /u/wp-login or /u/..%2f cannot spend the
 * API's rate limit on junk.
 */
export function organizerKey(raw) {
  let value = String(raw ?? '');
  try {
    value = decodeURIComponent(value);
  } catch {
    return null;
  }
  value = value.trim().replace(/^@/, '');
  return UUID.test(value) || USERNAME.test(value) ? value.toLowerCase() : null;
}

// ————— What the API said —————
//
// Tolerant on purpose: the page is rendered from an API that is deployed on its own schedule, so a field that is
// missing or the wrong kind is left out, never thrown over. What is checked is what would put something wrong on
// a public page.

const isRecord = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);
const text = (value) => (typeof value === 'string' && value.trim() ? value.trim() : null);
const whole = (value) => (typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0);
const isoDate = (value) => {
  const iso = text(value);
  return iso && !Number.isNaN(new Date(iso).getTime()) ? iso : null;
};

// Instagram's own rule for a handle. It goes into a link's address, so anything else is not shown.
const INSTAGRAM = /^[a-z0-9._]{1,30}$/i;

/** An Instagram handle without the "@", or null when it is empty or not one. */
export function instagramHandle(raw) {
  const handle = text(raw)?.replace(/^@/, '');
  return handle && INSTAGRAM.test(handle) ? handle : null;
}

function parseHype(raw) {
  if (!isRecord(raw)) return null;
  const label = text(raw.label);
  const letter = text(raw.badgeLetter);
  if (!label || !letter) return null;
  return { tier: text(raw.tier) ?? '', label, letter: letter.slice(0, 1).toUpperCase(), score: whole(raw.score) };
}

/**
 * The organizer header from GET /api/users/:idOrUsername/organizer (`data.organizer`), or null when it is not one.
 * The id has to be a user id: everything else on the page is looked up by it.
 */
export function parseOrganizer(raw) {
  if (!isRecord(raw)) return null;
  const id = text(raw.id);
  if (!id || !UUID.test(id)) return null;
  const username = text(raw.username);
  const totals = isRecord(raw.totals) ? raw.totals : {};
  return {
    id,
    username,
    name: text(raw.name) ?? username ?? 'Organizer',
    bio: text(raw.bio),
    avatarUrl: text(raw.avatarUrl),
    instagramHandle: instagramHandle(raw.instagramHandle),
    isVerified: raw.isVerified === true,
    hype: parseHype(raw.hype),
    totals: {
      events: whole(totals.events),
      upcoming: whole(totals.upcoming),
      attendees: whole(totals.attendees),
      attendeesRounded: totals.attendeesRounded === true,
      scrapbooks: whole(totals.scrapbooks),
    },
    followers: whole(raw.followers),
    followersRounded: raw.followersRounded === true,
  };
}

/**
 * One night from the catalogue (`upcoming` or `past`), or null when it cannot be shown or opened. The API lists
 * PUBLIC nights only; this page is public, so a row that says otherwise is dropped here as well.
 */
export function parseNight(raw) {
  if (!isRecord(raw)) return null;
  const id = text(raw.id);
  if (!id) return null;
  if (raw.visibility != null && raw.visibility !== 'PUBLIC') return null;
  return {
    id,
    name: text(raw.name) ?? 'Night',
    startDate: isoDate(raw.startDate),
    endDate: isoDate(raw.endDate),
    // The venue's own name, else the first piece of the address (the event view's rule).
    venue: formatInviteVenue(raw.location, raw.venueName),
    coverImage: text(raw.coverImage),
    // Where the clock is read: the event's own zone, else its city's (see `zoneOf`).
    timezone: text(raw.timezone),
    cityCode: text(raw.cityCode),
    location: text(raw.location),
  };
}

/** The nights of one catalogue list, once each, in the order the API sent them. */
export function parseNights(rows) {
  const seen = new Set();
  const out = [];
  for (const row of Array.isArray(rows) ? rows : []) {
    const night = parseNight(row);
    if (!night || seen.has(night.id)) continue;
    seen.add(night.id);
    out.push(night);
  }
  return out;
}

/** One scrapbook from /public-scrapbooks: it needs an album to open and a cover to show, or it is dropped. */
export function parseScrapbook(raw) {
  if (!isRecord(raw)) return null;
  const albumId = text(raw.albumId);
  const coverImage = text(raw.coverImage);
  if (!albumId || !coverImage) return null;
  return {
    id: text(raw.id) ?? albumId,
    albumId,
    name: text(raw.name) ?? 'Scrapbook',
    coverImage,
    startDate: isoDate(raw.startDate),
    location: text(raw.location),
    hideNameOnCover: raw.hideNameOnCover === true,
  };
}

/** The scrapbooks of one /public-scrapbooks answer, one tile per album, in the order the API sent them. */
export function parseScrapbooks(rows) {
  const seen = new Set();
  const out = [];
  for (const row of Array.isArray(rows) ? rows : []) {
    const scrapbook = parseScrapbook(row);
    if (!scrapbook || seen.has(scrapbook.albumId)) continue;
    seen.add(scrapbook.albumId);
    out.push(scrapbook);
  }
  return out;
}
