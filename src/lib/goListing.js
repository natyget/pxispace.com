// The decisions behind the /go page (one outside listing on a PXI page), kept apart from the markup so they can
// be tested (goListing.test.mjs). Nothing here fetches and nothing here reads the request: every function takes
// what it needs, so the page, the redirect route and the link-preview image all say the same thing.
//   npm run test:go

// ————— The listing id —————

/** Listing ids are UUIDs today. Anything shaped like a plain token is let through so a later id format still works. */
const LISTING_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{5,63}$/;

export function isListingId(id) {
    return typeof id === 'string' && LISTING_ID.test(id);
}

// ————— Time, in the listing's own zone —————

function formatter(options, timeZone) {
    // No zone means we cannot say what the clock read there. The caller shows nothing rather than a time in the
    // wrong place (the server runs in UTC, so a guess would be hours off).
    if (!timeZone) return null;
    try {
        return new Intl.DateTimeFormat('en-US', { ...options, timeZone });
    } catch {
        // A zone this runtime does not know.
        return null;
    }
}

function asDate(value) {
    if (!value) return null;
    const d = value instanceof Date ? value : new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
}

/** "10 PM", "10:30 PM", "12 AM". Built from parts, because newer ICU puts a narrow no-break space before AM and PM. */
export function formatClock(value, timeZone) {
    const d = asDate(value);
    const f = d && formatter({ hour: 'numeric', minute: '2-digit', hourCycle: 'h12' }, timeZone);
    if (!f) return '';
    const parts = Object.fromEntries(f.formatToParts(d).map((p) => [p.type, p.value]));
    const minutes = parts.minute && parts.minute !== '00' ? `:${parts.minute}` : '';
    return `${parts.hour}${minutes} ${String(parts.dayPeriod || '').toUpperCase()}`.trim();
}

const DAY = 24 * 3600 * 1000;

/**
 * "10 PM to 4 AM", or just "10 PM" when the night has no end. A listing that runs longer than a day (a festival)
 * names the weekday it ends: "6 PM to Sun 6 PM".
 */
export function formatTimeLine(startsAt, endsAt, timeZone) {
    const start = formatClock(startsAt, timeZone);
    if (!start) return '';
    const s = asDate(startsAt);
    const e = asDate(endsAt);
    if (!e || e.getTime() <= s.getTime()) return start;
    const end = formatClock(e, timeZone);
    if (!end) return start;
    if (e.getTime() - s.getTime() >= DAY) {
        const weekday = formatter({ weekday: 'short' }, timeZone)?.format(e);
        return `${start} to ${weekday ? `${weekday} ` : ''}${end}`;
    }
    return `${start} to ${end}`;
}

const NIGHT = /^(\d{4})-(\d{2})-(\d{2})$/;

/** A night ("2026-10-09") as a date at noon UTC, formatted in UTC so no zone can move it a day. null when it is not a date. */
function nightDate(night) {
    const m = NIGHT.exec(String(night || ''));
    if (!m) return null;
    const [y, mo, day] = [Number(m[1]), Number(m[2]), Number(m[3])];
    const d = new Date(Date.UTC(y, mo - 1, day, 12));
    return d.getUTCFullYear() === y && d.getUTCMonth() === mo - 1 && d.getUTCDate() === day ? d : null;
}

/**
 * The night an event belongs to when the API did not say: the zone's calendar date of the start, five hours back, so
 * a 1 AM start is the night before (the same rule the backend uses).
 */
export function nightFromStart(startsAt, timeZone) {
    const d = asDate(startsAt);
    const f = d && formatter({ year: 'numeric', month: '2-digit', day: '2-digit' }, timeZone);
    if (!f) return '';
    const parts = Object.fromEntries(f.formatToParts(new Date(d.getTime() - 5 * 3600 * 1000)).map((p) => [p.type, p.value]));
    return `${parts.year}-${parts.month}-${parts.day}`;
}

function nightOf(listing) {
    return nightDate(listing?.night) ? listing.night : nightFromStart(listing?.startsAt, listing?.timeZone);
}

const UTC = 'UTC';

/** "Friday, Oct 9": the night, not the calendar day of the start. */
export function formatNightLine(listing) {
    const d = nightDate(nightOf(listing));
    return d ? formatter({ weekday: 'long', month: 'short', day: 'numeric' }, UTC).format(d) : '';
}

/** "Friday": the night's weekday alone, for the link-preview line. */
export function formatNightWeekday(listing) {
    const d = nightDate(nightOf(listing));
    return d ? formatter({ weekday: 'long' }, UTC).format(d) : '';
}

/** "Oct 9": the night's date alone, for the handwriting on the album polaroid. */
export function formatNightShort(listing) {
    const d = nightDate(nightOf(listing));
    return d ? formatter({ month: 'short', day: 'numeric' }, UTC).format(d) : '';
}

/** The night is over: the API says so (`ended`), and that is the only thing that decides it. */
export function isEnded(listing) {
    return listing?.ended === true;
}

// ————— Price —————

/** "Free", "From $20", "From $12.50", or an empty string when the source gave no price. */
export function priceLabel(listing) {
    if (!listing) return '';
    if (listing.isFree === true || listing.priceFromCents === 0) return 'Free';
    const cents = listing.priceFromCents;
    if (typeof cents !== 'number' || !Number.isFinite(cents) || cents < 0) return '';
    const amount = cents / 100;
    const whole = Number.isInteger(amount);
    const code = String(listing.currency || 'USD').trim().toUpperCase();
    let text;
    try {
        text = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: code,
            minimumFractionDigits: whole ? 0 : 2,
            maximumFractionDigits: whole ? 0 : 2,
        }).format(amount);
    } catch {
        // Not a currency code Intl knows: say the code, so the number still means something.
        text = `${code} ${whole ? amount : amount.toFixed(2)}`;
    }
    return `From ${text}`;
}

// ————— Where —————

/** Apple devices open Apple Maps. iPadOS 13 and later (and every Mac) report a Macintosh agent, so that counts too. */
export function isAppleDevice(userAgent) {
    return /iPhone|iPad|iPod|Macintosh|Mac OS X/i.test(String(userAgent || ''));
}

const validCoords = (lat, lng) =>
    typeof lat === 'number' && typeof lng === 'number' && Number.isFinite(lat) && Number.isFinite(lng)
    && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && !(lat === 0 && lng === 0);

/** "1 Seaport Blvd, Boston, MA 02210": the address without a country at the end and without the venue repeated at the start. */
export function addressLine(venueName, address) {
    const name = String(venueName || '').trim();
    const parts = String(address || '').split(',').map((p) => p.trim()).filter(Boolean);
    const last = parts[parts.length - 1];
    if (last && /^(USA|US|United States(?: of America)?)$/i.test(last)) parts.pop();
    if (name && parts[0] && parts[0].toLowerCase() === name.toLowerCase()) parts.shift();
    return parts.join(', ');
}

/** The venue as a person says it: its name, else the first part of its address. */
export function venueLabel(listing) {
    const name = String(listing?.venueName || '').trim();
    if (name) return name;
    return String(listing?.address || '').split(',')[0].trim();
}

/**
 * A Directions link: Apple Maps on Apple devices, Google Maps everywhere else. It goes to the coordinates when the
 * listing has them, else to the address; null when it has neither (there is nothing to navigate to).
 */
export function directionsUrl(listing, userAgent) {
    if (!listing) return null;
    const label = venueLabel(listing);
    const place = [String(listing.venueName || '').trim(), String(listing.address || '').trim()].filter(Boolean).join(', ');
    const hasCoords = validCoords(listing.lat, listing.lng);
    if (!hasCoords && !place) return null;
    const target = hasCoords ? `${listing.lat},${listing.lng}` : place;
    if (isAppleDevice(userAgent)) {
        const q = hasCoords && label ? `&q=${encodeURIComponent(label)}` : '';
        return `https://maps.apple.com/?daddr=${encodeURIComponent(target)}${q}`;
    }
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(target)}`;
}

// ————— Where the ticket button goes —————

/** Any character below a space, or DEL. A loop, because a regex for these trips the linter's no-control-regex. */
function hasControlCharacter(text) {
    for (let i = 0; i < text.length; i += 1) {
        const code = text.charCodeAt(i);
        if (code < 0x20 || code === 0x7f) return true;
    }
    return false;
}

/**
 * The only addresses the ticket button may leave for: http and https, no credentials in them, nothing odd inside.
 * Returns the normalised address, or null. The address comes from our own API, never from the request, so this is
 * the second lock on the door, not the first.
 */
export function safeRedirectUrl(raw) {
    if (typeof raw !== 'string') return null;
    const text = raw.trim();
    if (!text || text.length > 2048 || /\s/.test(text) || hasControlCharacter(text)) return null;
    // The URL parser forgives "https:/host", "https:host" and "https:///host". Only the plain "scheme://host" form passes.
    if (!/^https?:\/\/[^/\\]/i.test(text)) return null;
    let url;
    try {
        url = new URL(text);
    } catch {
        return null;
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    if (url.username || url.password || !url.hostname) return null;
    return url.href;
}

// ————— Names —————

const SOURCE_NAMES = {
    DICE: 'DICE',
    POSH: 'Posh',
    EVENTBRITE: 'Eventbrite',
    TICKETMASTER: 'Ticketmaster',
    PARTIFUL: 'Partiful',
    SHOTGUN: 'Shotgun',
    RA: 'RA',
    RESIDENT_ADVISOR: 'RA',
    SEATGEEK: 'SeatGeek',
};

// Sources whose page is an invitation to RSVP, not a box office. The button says "Open on" for these.
const RSVP_SOURCES = new Set(['PARTIFUL']);

const sourceKey = (source) => String(source || '').trim().toUpperCase().replace(/[\s-]+/g, '_');

/** How a ticket source is written: "DICE", "Posh", "Eventbrite", "Ticketmaster", "Partiful". */
export function sourceDisplayName(source) {
    const key = sourceKey(source);
    if (SOURCE_NAMES[key]) return SOURCE_NAMES[key];
    const words = String(source || '').trim().toLowerCase().replace(/[_-]+/g, ' ');
    return words ? words.replace(/\b\w/g, (c) => c.toUpperCase()) : '';
}

/** The name of the listing's own source: what the API calls it, else the code written out. */
export function ticketSourceName(listing) {
    return String(listing?.sourceName || '').trim() || sourceDisplayName(listing?.source);
}

/** The primary button: "Tickets on DICE", "Open on Partiful" for an RSVP page, plain "Get tickets" when the source is unknown. */
export function ticketLabel(listing) {
    const name = ticketSourceName(listing);
    if (!name) return 'Get tickets';
    return RSVP_SOURCES.has(sourceKey(listing?.source)) ? `Open on ${name}` : `Tickets on ${name}`;
}

const VIA_KEY = /^[a-z0-9][a-z0-9-]{0,31}$/;

/** A source as it travels in a query string: lower case, letters, digits and dashes. */
export function viaKey(source) {
    return String(source || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 32);
}

/** The path of the ticket button: through our redirect, which logs the click. `via` names another place the night is sold. */
export function outPath(listingId, via) {
    const base = `/go/${encodeURIComponent(String(listingId))}/out`;
    return via && VIA_KEY.test(via) ? `${base}?via=${encodeURIComponent(via)}` : base;
}

/**
 * The other places the same night is sold, written for a person. An entry may be a bare code, or an object with a
 * `source` (and `sourceName`) and the `url` of the page there. The listing's own source is never repeated, and a
 * source appears once.
 * @returns {{ key: string, name: string, label: string, url: string | null }[]}
 */
export function alsoOnEntries(listing) {
    const own = viaKey(listing?.source) || viaKey(ticketSourceName(listing));
    const out = [];
    for (const entry of Array.isArray(listing?.alsoOn) ? listing.alsoOn : []) {
        const obj = entry && typeof entry === 'object' ? entry : { source: entry };
        const name = String(obj.sourceName || '').trim() || sourceDisplayName(obj.source);
        const key = viaKey(obj.source) || viaKey(name);
        if (!name || !key || key === own || out.some((o) => o.key === key)) continue;
        out.push({ key, name, label: `Also on ${name}`, url: safeRedirectUrl(obj.url) });
    }
    return out;
}

/**
 * Where /go/[id]/out sends the visitor: the listing's own ticket page, or (with `via`) the page of another source it
 * is sold on. Always read from the listing, never from the request. null when there is nowhere safe to go.
 */
export function outTarget(listing, via) {
    if (!listing) return null;
    if (!via) return safeRedirectUrl(listing.ticketUrl);
    if (!VIA_KEY.test(via)) return null;
    return alsoOnEntries(listing).find((e) => e.key === via)?.url ?? null;
}

// ————— The link preview —————

/** "Friday 10 PM at Elsewhere". Whatever is missing is left out, never replaced by a guess. */
export function metaDescription(listing) {
    const when = [formatNightWeekday(listing), formatClock(listing?.startsAt, listing?.timeZone)].filter(Boolean).join(' ');
    const venue = venueLabel(listing);
    return [when, venue ? `${when ? 'at ' : ''}${venue}` : ''].filter(Boolean).join(' ');
}

// ————— The PXI block —————

/** The App Store button: /get picks the visitor's own store, and the three parameters say which page sent them. */
export function appStoreHref(listingId) {
    const params = new URLSearchParams({ utm_source: 'go', utm_campaign: 'allevents', utm_content: String(listingId) });
    return `/get?${params.toString()}`;
}

/** Opens the app on this night's All events sheet. */
export function openInPxiHref(listingId) {
    return `pxi://go/${encodeURIComponent(String(listingId))}`;
}

// ————— Who is looking —————

// Link-preview and search bots, plus anything that is not a browser. They fetch pages without anyone looking. The
// word "bot" covers Twitterbot, Slackbot, Discordbot, TelegramBot, LinkedInBot, Googlebot, bingbot and Pinterestbot;
// the rest are agents that do not carry it. Kept in step with the backend's list (contract section 3).
const BOT = /bot|crawl|spider|slurp|facebookexternalhit|facebot|whatsapp|embedly|iframely|skypeuripreview|vkshare|preview|headlesschrome|lighthouse|pingdom|uptimerobot|curl\/|wget\/|python-requests|go-http-client|node-fetch|axios\/|okhttp\//i;

/** True for link-preview bots and other agents that are not a person looking. A missing agent counts as not a person. */
export function isPreviewBot(userAgent) {
    const ua = String(userAgent || '').trim();
    return !ua || BOT.test(ua);
}

/** A browser warming a page up (prefetch, prerender, an old Safari link preview): nobody has looked yet. */
export function isSpeculativeRequest(headers) {
    const get = (name) => String(headers?.get?.(name) || '').toLowerCase();
    return /prefetch|prerender/.test(get('sec-purpose'))
        || get('purpose') === 'prefetch'
        || get('x-moz') === 'prefetch'
        || get('x-purpose') === 'preview';
}

/** Keeps what looks like an IP address and drops a port, brackets or a zone; everything else is not an address. */
function cleanIp(raw) {
    let ip = String(raw || '').trim().replace(/^::ffff:/i, '');
    const bracketed = ip.match(/^\[(.+)\](?::\d+)?$/);
    if (bracketed) ip = bracketed[1];
    else if ((ip.match(/:/g) || []).length === 1) ip = ip.split(':')[0];
    ip = ip.split('%')[0];
    return ip.length <= 45 && /^[0-9a-f.:]+$/i.test(ip) && /[.:]/.test(ip) ? ip : '';
}

/**
 * The visitor's agent and address, from the request headers, to be forwarded with the traffic call. Netlify's own
 * header comes first (a visitor cannot write it); then the first address of X-Forwarded-For; then X-Real-IP.
 */
export function visitorFromHeaders(headers) {
    const get = (name) => String(headers?.get?.(name) || '');
    const userAgent = get('user-agent').trim().slice(0, 300);
    const forwarded = get('x-forwarded-for').split(',')[0];
    const ip = cleanIp(get('x-nf-client-connection-ip')) || cleanIp(forwarded) || cleanIp(get('x-real-ip'));
    return { userAgent, ip };
}
