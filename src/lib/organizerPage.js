// The decisions behind the organizer page (/u/<username or id>), kept apart from the markup so they can be tested
// (organizerPage.test.mjs). Nothing here fetches and nothing here reads the request: every function takes what it
// needs, so the page, its metadata and the host link in the event view all say the same thing.
//   npm run test:organizer

import { INVITE_FALLBACK_TIMEZONE, formatInviteVenue, formatInviteWhen } from './eventInviteCard.js';
import { resolveEventCity } from './seo/cities.js';

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

// ————— Numbers and words —————

/** At most one decimal and never a trailing ".0": 1 is "1", 1.2 is "1.2". */
const tenths = (value) => String(Number(value.toFixed(1)));

/**
 * A count as it is printed. An exact one is written out ("7", "1,204"). One the API rounded down (it sends
 * `Rounded: true` from 20 up, so no one can follow a person by watching a number) is written as a floor: "20+",
 * "340+", "1.2k+".
 */
export function countLabel(value, rounded) {
  const n = whole(value);
  if (!rounded) return n.toLocaleString('en-US');
  if (n >= 1_000_000) return `${tenths(Math.floor(n / 100_000) / 10)}M+`;
  if (n >= 1000) return `${tenths(Math.floor(n / 100) / 10)}k+`;
  return `${n}+`;
}

const STAT_WORDS = { nights: ['night', 'nights'], people: ['person', 'people'], followers: ['follower', 'followers'] };

/** The one small word under a number: "night" for exactly 1, "nights" otherwise (and for any rounded count). */
export function statWord(kind, value, rounded) {
  const [one, many] = STAT_WORDS[kind];
  return !rounded && whole(value) === 1 ? one : many;
}

// ————— Where things lead —————

/**
 * Where a host's name and picture lead: their organizer page, by username when they have one. null when the host
 * has neither a username nor an id. The username is checked against the API's own rule, so what reaches the address
 * is only ever a-z, 0-9, dot and underscore.
 */
export function organizerHref(host) {
  if (!isRecord(host)) return null;
  const username = text(host.username)?.replace(/^@/, '');
  if (username && USERNAME.test(username)) return `/u/${username.toLowerCase()}`;
  const id = text(host.id);
  return id && UUID.test(id) ? `/u/${id.toLowerCase()}` : null;
}

/**
 * The address the Follow button opens in the app. It is the profile address the site's other profile pages open
 * (PublicProfileClient): the https page does not reliably open the app from Safari, the app's own scheme does.
 */
export function organizerAppLink(organizerId) {
  return `pxi://u/${encodeURIComponent(String(organizerId))}`;
}

/** The organizer's Instagram page, or null for a handle that is not one. */
export function instagramUrl(handle) {
  const clean = instagramHandle(handle);
  return clean ? `https://www.instagram.com/${clean}/` : null;
}

// ————— Time, in the night's own zone —————

function validZone(zone) {
  if (!zone) return null;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: zone });
    return zone;
  } catch {
    return null;
  }
}

/**
 * The zone a night's clock is read in: the event's own, else its city's, else the one the event link preview falls
 * back to (both operating cities are Eastern). The server runs in UTC, so reading the clock without one would be
 * hours off.
 */
export function zoneOf(night) {
  return (
    validZone(night?.timezone) ??
    resolveEventCity({ cityCode: night?.cityCode, location: night?.location })?.timezone ??
    INVITE_FALLBACK_TIMEZONE
  );
}

function localParts(date, zone, options) {
  const formatter = new Intl.DateTimeFormat('en-US', { timeZone: zone, ...options });
  return Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]));
}

/**
 * When a night is, as the event pages print it ("FRI, OCT 9", "10 PM – 4 AM"), read in the night's own zone. The
 * year joins only when it is not this year. null for a night with no usable start.
 *
 *   { weekday: 'FRI', month: 'OCT', day: '9', year: '' | '2025', label: 'FRI, OCT 9', hours: '10 PM – 4 AM', spoken }
 *
 * `spoken` is the same in words, for a link's accessible name.
 */
export function nightWhen(night, now = new Date()) {
  const zone = zoneOf(night);
  const when = formatInviteWhen(night?.startDate, night?.endDate, zone);
  if (!when) return null;
  const start = new Date(night.startDate);
  const short = localParts(start, zone, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  const long = localParts(start, zone, { weekday: 'long', month: 'long', day: 'numeric' });
  const year = short.year !== localParts(now, zone, { year: 'numeric' }).year ? short.year : '';
  return {
    weekday: short.weekday.toUpperCase(),
    month: short.month.toUpperCase(),
    day: short.day,
    year,
    label: year ? `${when.day}, ${year}` : when.day,
    hours: when.hours,
    spoken: `${long.weekday}, ${long.month} ${long.day}${year ? `, ${year}` : ''}, ${when.hours.replace(' – ', ' to ')}`,
  };
}

// ————— Captions —————

/**
 * What a scrapbook's print is called: its name without a year at the end, and the year of the night. "Dunes 2025"
 * on a night of 2025 is "Dunes" and "2025", so the year is not written twice. (The app's wall does the same.)
 */
export function scrapbookCaption(scrapbook) {
  const raw = text(scrapbook?.name) ?? 'Scrapbook';
  const start = scrapbook?.startDate ? new Date(scrapbook.startDate) : null;
  const zone = zoneOf({ location: scrapbook?.location });
  const year = start && !Number.isNaN(start.getTime()) ? localParts(start, zone, { year: 'numeric' }).year : null;
  const title = year ? raw.replace(new RegExp(`[\\s,.-]*\\b${year}\\b\\s*$`), '').trim() || raw : raw;
  return { title, year, label: year ? `${title} ${year}` : title };
}

// ————— The link preview —————

/** "Pix 2 Party (@pix2party)": the name and the handle, whichever of them there are. */
export function organizerTitle(organizer) {
  const name = text(organizer?.name);
  const username = text(organizer?.username);
  if (name && username && name.toLowerCase() !== username.toLowerCase()) return `${name} (@${username})`;
  return name ?? (username ? `@${username}` : 'Organizer');
}

/** Their own words if they wrote any (cut to fit a preview), else one line that says what the page holds. */
export function organizerDescription(organizer) {
  const bio = text(organizer?.bio)?.replace(/\s+/g, ' ');
  if (bio) return bio.length > 160 ? `${bio.slice(0, 157).trimEnd()}…` : bio;
  return `Nights and scrapbooks from ${text(organizer?.name) ?? 'this organizer'}, on PXI.`;
}
