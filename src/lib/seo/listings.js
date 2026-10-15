// Outside nights as indexable pages (/e/<citySlug>/<slug>), read from the public listings feed (contract:
// BRIEF-V4-CONTRACT.md). The helpers import nothing with an alias, so listings.test.mjs runs them with node --test:
//   node --test src/lib/seo/listings.test.mjs
import { getServerApiBaseUrl } from '../apiBase.js';
import { CANONICAL_ORIGIN } from '../siteUrl.js';
import { ssrFetchJson } from '../ssrFetch.js';
import { getCityByCode } from './cities.js';
import { isoWithOffset } from './isoWithOffset.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CITY_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// The feed is read at most every 15 minutes (the API's own cache is the same order).
const FEED_REVALIDATE = 900;

// ————— The id in the slug —————

/**
 * The listing id is the last 36 characters of the slug, after the dash that ends the title. Anything else is no id,
 * so a scanner's /e/new-york/wp-login never reaches the API.
 */
export function listingIdFromSlug(slug) {
  const text = typeof slug === 'string' ? slug : '';
  if (text.length < 37 || text[text.length - 37] !== '-') return null;
  const id = text.slice(-36);
  return UUID.test(id) ? id : null;
}

/** The canonical path of a night: /e/<citySlug>/<slug>. */
export function listingPath(card) {
  return `/e/${card.citySlug}/${card.slug}`;
}

// ————— The feed —————

// A card from the feed, checked before anything is built from it: its id must be the one in its slug.
function isFeedCard(card) {
  return Boolean(
    card
      && typeof card === 'object'
      && typeof card.slug === 'string'
      && listingIdFromSlug(card.slug) === card.id
      && CITY_SLUG.test(card.citySlug || '')
      && typeof card.title === 'string'
      && card.title.trim(),
  );
}

// One sitemap row: its path is /e/<citySlug>/<slug> and the slug ends with its id.
function isSitemapEntry(entry) {
  if (!entry || typeof entry !== 'object' || typeof entry.path !== 'string') return false;
  const [, prefix, citySlug, slug] = entry.path.split('/');
  return prefix === 'e'
    && CITY_SLUG.test(citySlug || '')
    && listingIdFromSlug(slug) === entry.id;
}

/**
 * The public feed for one city, soonest first (`genre` narrows it). Never throws: an empty list when the API did
 * not answer, so a hub or a night page shows what it can and leaves the rest out.
 */
export async function fetchCityListings({ cityCode, genre, limit = 120 } = {}) {
  const query = new URLSearchParams();
  if (cityCode) query.set('city', cityCode);
  if (genre) query.set('genre', genre);
  query.set('limit', String(limit));
  const { status, data } = await ssrFetchJson(`${getServerApiBaseUrl()}/api/public/listings?${query}`, {
    revalidate: FEED_REVALIDATE,
    logTag: 'listings',
  });
  return status === 200 && Array.isArray(data?.listings) ? data.listings.filter(isFeedCard) : [];
}

/** Every outside night in the sitemap feed, all cities. Never throws. */
export async function fetchListingsSitemap() {
  const { status, data } = await ssrFetchJson(`${getServerApiBaseUrl()}/api/public/listings/sitemap`, {
    revalidate: FEED_REVALIDATE,
    logTag: 'listings',
  });
  return status === 200 && Array.isArray(data?.listings) ? data.listings.filter(isSitemapEntry) : [];
}

/** The other nights in a city's feed, soonest first, without this one. */
export function moreNightsFor(listings, listingId, max = 12) {
  return listings.filter((listing) => listing.id !== listingId).slice(0, max);
}

// ————— Event JSON-LD —————

const httpsOnly = (value) => {
  const text = typeof value === 'string' ? value.trim() : '';
  return /^https:\/\//i.test(text) ? text : null;
};

// Cents as a number, or null when the price is not known (a guessed price is worse than none).
function priceCents(listing) {
  if (listing.isFree === true) return 0;
  const raw = listing.priceMinCents ?? listing.priceFromCents;
  return typeof raw === 'number' && Number.isFinite(raw) && raw >= 0 ? raw : null;
}

function buildPlace(listing, city) {
  const venue = String(listing.venueName || '').trim();
  const address = String(listing.address || '').trim();
  if (!venue && !address) return null;
  const place = { '@type': 'Place', name: venue || address };
  const postal = { '@type': 'PostalAddress', addressCountry: city?.country || 'US' };
  if (address) postal.streetAddress = address;
  if (city) {
    postal.addressLocality = city.name;
    postal.addressRegion = city.state;
  }
  place.address = postal;
  const { lat, lng } = listing;
  if (typeof lat === 'number' && typeof lng === 'number' && Number.isFinite(lat) && Number.isFinite(lng)
    && !(lat === 0 && lng === 0)) {
    place.geo = { '@type': 'GeoCoordinates', latitude: lat, longitude: lng };
  }
  return place;
}

/**
 * Event JSON-LD for one outside night, on its /e/ page. Dates carry the night's own zone offset. Offers are only
 * stated while the night is on sale: an ended night, or one without a known price and currency, has none. The
 * ticket link is our own /go/<id>/out, which sends the visitor on (and counts the click).
 *
 * @param {object} listing a feed card, or the detail of one (priceFromCents and coverUrl are read too)
 * @returns {object | null} null when there is no start to state
 */
export function buildListingEventJsonLd(listing) {
  if (!listing || typeof listing !== 'object' || !listing.id || typeof listing.title !== 'string') return null;
  const city = getCityByCode(listing.cityCode);
  const timeZone = listing.timeZone || city?.timezone || null;
  const start = isoWithOffset(listing.startsAt, timeZone);
  if (!start) return null;

  const node = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: listing.title.trim(),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    startDate: start,
  };
  if (listing.slug && listing.citySlug) node.url = `${CANONICAL_ORIGIN}${listingPath(listing)}`;
  const end = isoWithOffset(listing.endsAt, timeZone);
  if (end) node.endDate = end;

  const place = buildPlace(listing, city);
  if (place) node.location = place;

  const image = httpsOnly(listing.imageUrl) || httpsOnly(listing.coverUrl);
  if (image) node.image = [image];

  const organizer = String(listing.organizerName || '').trim();
  if (organizer) node.organizer = { '@type': 'Organization', name: organizer };

  const cents = priceCents(listing);
  if (listing.isFree === true || cents === 0) node.isAccessibleForFree = true;

  const currency = typeof listing.currency === 'string' && /^[a-z]{3}$/i.test(listing.currency.trim())
    ? listing.currency.trim().toUpperCase()
    : null;
  if (!listing.ended && cents !== null && currency) {
    node.offers = [{
      '@type': 'Offer',
      url: `${CANONICAL_ORIGIN}/go/${encodeURIComponent(listing.id)}/out`,
      price: (cents / 100).toFixed(2),
      priceCurrency: currency,
      availability: 'https://schema.org/InStock',
    }];
  }
  return node;
}
