import { displayImageSrc } from '@/lib/mediaUrl';
import { previewSrc } from '@/lib/songPreview';

/* ───────────────────────────── formatting (the app's eventFormat.ts) ───────────────────────────── */

const LOCALE = 'en-US';
const DAY_MS = 24 * 60 * 60 * 1000;

function parseDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** DATE: "SAT, OCT 4"; the year joins it only when it is not this year. */
function formatDateShort(start) {
  const sameYear = start.getFullYear() === new Date().getFullYear();
  return start
    .toLocaleDateString(LOCALE, { weekday: 'short', month: 'short', day: 'numeric', ...(sameYear ? {} : { year: 'numeric' }) })
    .toUpperCase();
}

/** TIME: "9:00 PM", then "UNTIL 2:00 AM" (the date joins it when it ends a day or more later). */
function formatTimeParts(start, end) {
  const time = (d) => d.toLocaleTimeString(LOCALE, { hour: 'numeric', minute: '2-digit' }).toUpperCase();
  const first = time(start);
  if (!end || end.getTime() <= start.getTime()) return { start: first, until: '' };
  const day = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const dayDiff = Math.round((day(end) - day(start)) / DAY_MS);
  const sameNight = dayDiff === 0 || (dayDiff === 1 && end.getTime() - start.getTime() < DAY_MS);
  const until = sameNight
    ? time(end)
    : end.toLocaleDateString(LOCALE, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).toUpperCase();
  return { start: first, until: `UNTIL ${until}` };
}

/**
 * The callers send either ISO `startDate` / `endDate` (formatted here the app's way) or an older
 * `schedule` of { primary, secondary }: the album adapter's is a weekday plus "OCT 12, 9:00 PM –
 * 2:00 AM", which becomes DATE "SATURDAY, OCT 12" and TIME "9:00 PM – 2:00 AM". Anything without a
 * time stays under DATE as a note.
 */
export function toWhen(event) {
  const start = parseDate(event?.startDate);
  if (start) {
    const parts = formatTimeParts(start, parseDate(event?.endDate));
    return { date: formatDateShort(start), time: parts.start, until: parts.until, note: '' };
  }
  const s = event?.schedule;
  const primary = String((typeof s === 'string' ? s : s?.primary) || '').trim();
  const secondary = String((typeof s === 'string' ? '' : s?.secondary) || '').trim();
  if (!primary) return { date: '', time: '', until: '', note: '' };
  if (!secondary) return { date: primary.toUpperCase(), time: '', until: '', note: '' };
  if (!/\d/.test(secondary)) return { date: primary.toUpperCase(), time: '', until: '', note: secondary };
  // The first comma ends the date; older callers used a middle dot there.
  const parts = secondary.split(/\s*(?:,|\u00b7)\s*/); // allow-dot
  if (parts.length >= 2) {
    return { date: `${primary}, ${parts[0]}`.toUpperCase(), time: parts.slice(1).join(', '), until: '', note: '' };
  }
  return { date: primary.toUpperCase(), time: secondary, until: '', note: '' };
}

const COORDINATE = /^-?\d{1,3}(\.\d+)?$/;
const NO_PLACE = /^location tb[ad]$/i;

/**
 * The place: the venue's own name is the big purple title (the first segment only), the rest of the
 * address is printed once, on the map card. Callers send a string ("venue, street, city") or
 * { primary, secondary, address?, latitude?, longitude? }.
 */
export function toPlace(event) {
  const loc = event?.location;
  if (!loc) return null;
  const isObj = typeof loc === 'object';
  const raw = String((isObj ? loc.primary : loc) || '').trim();
  if (!raw) return null;
  const parts = raw.split(/\n|,|\u2022/).map((p) => p.trim()).filter(Boolean); // allow-dot: older callers separate with a bullet
  const secondary = isObj ? String(loc.secondary || '').trim().replace(/\s*\u00b7\s*/g, ', ') : ''; // allow-dot
  const isPin = parts.length === 2 && parts.every((p) => COORDINATE.test(p));
  const none = NO_PLACE.test(raw);
  const num = (v) => (v != null && v !== '' && Number.isFinite(Number(v)) ? Number(v) : null);
  // Coordinates: the caller's, else the ones a dropped pin prints as its name.
  const latitude = num(event?.latitude ?? loc?.latitude ?? (isPin ? parts[0] : null));
  const longitude = num(event?.longitude ?? loc?.longitude ?? (isPin ? parts[1] : null));
  const hasCoords = latitude != null && longitude != null;
  // What Maps searches for.
  const address = none || isPin ? '' : String((isObj && loc.address) || '').trim() || [raw, secondary].filter(Boolean).join(', ');
  return {
    // The title is the first segment only; a dropped pin with no name says what it is.
    venue: none ? 'Location TBD' : isPin ? 'Pinned location' : isObj ? raw : parts[0] || raw,
    address,
    // What the map card prints: the address without the venue in front.
    addressLine: isPin ? raw : secondary || (isObj ? '' : parts.slice(1).join(', ')) || address,
    latitude: hasCoords ? latitude : null,
    longitude: hasCoords ? longitude : null,
    hasMap: !none && (!!address || hasCoords),
  };
}

/** PUBLIC / PRIVATE first, then any other badge the caller sent (PAID, FINALIZED...), as one quiet line. */
export function toCapsLine(event) {
  const labels = (Array.isArray(event?.badges) ? event.badges : []).map((b) => String(b?.label || '').trim()).filter(Boolean);
  const isVis = (l) => /^(public|private)$/i.test(l);
  const vis = String(event?.visibility || '').trim() || labels.find(isVis) || '';
  return [vis, ...labels.filter((l) => !isVis(l))]
    .filter(Boolean)
    .map((s) => s.toUpperCase())
    .join(', ');
}

/** The event's top song ({ title, artist, artworkUrl }); `topSongArtworkUrl`, the art the host uploaded, wins over the song's own. */
export function readTopSong(event) {
  const raw = event?.topSong;
  if (!raw || typeof raw !== 'object') return null;
  const title = typeof raw.title === 'string' ? raw.title.trim() : '';
  if (!title) return null;
  const artist = typeof raw.artist === 'string' ? raw.artist.trim() : '';
  const hostArt = typeof event?.topSongArtworkUrl === 'string' ? event.topSongArtworkUrl.trim() : '';
  const artwork = hostArt || (typeof raw.artworkUrl === 'string' ? raw.artworkUrl.trim() : '');
  return { title, artist, artwork: artwork ? displayImageSrc(artwork, null) : null, previewUrl: previewSrc(raw.previewUrl) };
}

