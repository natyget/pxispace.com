// Pure helpers shared by the discovery stage, the album-cover cards and the event stamp.
// Nothing in here touches the DOM, so it is safe in server and client components alike.

const WEEKDAY_SHORT = { weekday: 'short' };

function asDate(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** "Sat, Oct 4 · 10:00 PM" — or "Date TBA". Local time of the viewer. */
export function formatWhen(value) {
  const d = asDate(value);
  if (!d) return 'Date TBA';
  const day = d.toLocaleDateString('en-US', { ...WEEKDAY_SHORT, month: 'short', day: 'numeric' });
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return `${day} · ${time}`;
}

/** "10:00 PM" — or an empty string when there is no start time. */
export function formatTime(value) {
  const d = asDate(value);
  return d ? d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '';
}

/** "OCT 4" — the short date used on cards and the private-event stamp. */
export function formatShortDate(value) {
  const d = asDate(value);
  if (!d) return 'TBA';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** "$10", "$12.50", "FREE". Reads the display string the page normalizer already built. */
export function priceLabel(event) {
  const raw = String(event?.price ?? '').trim();
  if (!raw || /^free$/i.test(raw)) return 'Free';
  // "$10.00" -> "$10", but "$12.50" stays "$12.50".
  return raw.replace(/[.,]00$/, '');
}

export function isPaid(event) {
  return event?.ticketType === 'PAID' || (event?.price && !/^free$/i.test(String(event.price)));
}

/** The existing CTA: paid events go to checkout, free ones to the event page (RSVP). */
export function ctaFor(event) {
  const paid = event?.ticketType === 'PAID';
  return {
    href: paid ? `/events/${event.id}/checkout` : `/events/${event.id}`,
    label: paid ? 'Get tickets' : 'Join',
  };
}

/** Venue line + the rest of the address. "1234 Easy Street, Boston, MA" -> ["1234 Easy Street", "Boston, MA"]. */
export function splitLocation(event) {
  const parts = String(event?.location ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const venueName = (event?.venueName || '').trim();
  if (!parts.length && !venueName) return { venue: 'Location TBA', rest: '' };
  if (venueName) return { venue: venueName, rest: parts.join(', ') };
  return { venue: parts[0], rest: parts.slice(1).join(', ') };
}

export function hostOf(event) {
  const name =
    event?.organizerName && event.organizerName !== 'Host'
      ? event.organizerName
      : event?.organizer?.name || event?.organizer?.username || event?.organizerName || '';
  const avatar = event?.organizerAvatar || event?.organizer?.avatarUrl || null;
  return { name: String(name || '').trim(), avatar };
}

export function initialsOf(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '';
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

export function attendeeCount(event) {
  const n = Number(event?.attendees ?? event?.members ?? 0);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/**
 * Font size for the cover title, in container-width percent (cqw). `available` is the width the
 * title may use, also in cqw (cards leave room for the heart button). Sized so the longest word
 * always fits on one line and the whole name stays within four lines: "ALBUM" is huge,
 * "Fashion Week Brooklyn: Season 2 Opening Night" is small but still readable.
 */
export function titleScale(title, available = 80) {
  const t = String(title || 'Untitled').trim() || 'Untitled';
  const words = t.split(/\s+/);
  const longest = Math.max(...words.map((w) => w.length));
  const byWord = available / (longest * 0.72);
  const byLength = t.length <= 6 ? 23 : t.length <= 12 ? 17.5 : t.length <= 22 ? 13.5 : t.length <= 40 ? 10.5 : 8.6;
  return Math.max(6.4, Math.min(byWord, byLength));
}

/* ── Event stamp: which of the three looks an event gets ─────────────────────────────────── */

export const STAMP_KINDS = ['star', 'orbit', 'seal'];

// Keyword signals per look. The API carries no category, so the event's own words decide:
//   star  — the layered wavy star: daytime, celebration, festival energy
//   orbit — the overlapping ellipses: nightlife, concerts, showcases
//   seal  — the distressed red rubber circle: underground, community, active
const STAMP_WORDS = {
  star: /\b(day|brunch|birthday|bday|festival|fest|carnival|pool|rooftop|roof|cookout|picnic|market|pop-?up|kids|graduation|grad|wedding|celebration|garden|summer|sunset|beach|block party|social)\b/i,
  orbit: /\b(night|nights|club|lounge|concert|live|dj|rave|gala|launch|showcase|fashion|tour|after ?party|late|midnight|groove|amapiano|afro\w*|house music|techno|disco|hip.?hop|r&b|rnb)\b/i,
  seal: /\b(warehouse|underground|house party|cypher|run|running|workout|yoga|sports?|game|tournament|meet-?up|community|potluck|open mic|mic|basement|secret|private|kickback)\b/i,
};

function hashString(input) {
  let h = 2166136261;
  const s = String(input);
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Pick the stamp look for an event. An explicit `stampKind` (or an API `category`/`eventType`
 * that names one) wins; otherwise the words in the name, description and genres vote, and a
 * stable hash of the id breaks ties so an event always keeps the same stamp.
 */
export function stampKindFor(event) {
  const explicit = String(event?.stampKind || event?.category || event?.eventType || '').toLowerCase();
  if (STAMP_KINDS.includes(explicit)) return explicit;
  const text = [event?.title, event?.description, ...(event?.genres || [])].filter(Boolean).join(' ');
  let best = null;
  let bestHits = 0;
  for (const kind of STAMP_KINDS) {
    const hits = (text.match(new RegExp(STAMP_WORDS[kind].source, 'gi')) || []).length;
    if (hits > bestHits) {
      best = kind;
      bestHits = hits;
    }
  }
  return best || STAMP_KINDS[hashString(event?.id ?? event?.title ?? '') % STAMP_KINDS.length];
}

/**
 * Greedy word wrap for the stamp. Returns at most `maxLines` lines of at most `maxChars`
 * characters (a single longer word keeps its own line and the font shrinks to fit it).
 */
export function wrapStampText(text, maxChars, maxLines) {
  const words = String(text || '').trim().toUpperCase().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const lines = [];
  let current = '';
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxChars || !current) current = next;
    else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  if (lines.length <= maxLines) return lines;
  const kept = lines.slice(0, maxLines);
  const last = kept[maxLines - 1];
  kept[maxLines - 1] = `${last.length > maxChars - 1 ? last.slice(0, maxChars - 1) : last}…`;
  return kept;
}

/** The two lines a PRIVATE event's stamp shows instead of its name: "OCT 4" over the year. */
export function stampDateLines(event) {
  const d = asDate(event?.startDate);
  if (!d) return ['DATE', 'TBA'];
  const md = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
  return [md, String(d.getFullYear())];
}
