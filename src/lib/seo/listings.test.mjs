// The /e/ pages' decisions: the id in a slug, the Event JSON-LD of one outside night, the "more nights" pick, and what
// the feed and the sitemap are allowed to pass on. The feed test runs a local server on a free port.
//   node --test src/lib/seo/listings.test.mjs
import assert from 'node:assert/strict';
import http from 'node:http';
import { test } from 'node:test';
import {
  buildListingEventJsonLd,
  fetchCityListings,
  fetchListingsSitemap,
  listingIdFromSlug,
  listingPath,
  moreNightsFor,
} from './listings.js';

const ID = '5b0f6c1e-2a7d-4f3e-9c10-8e4a1d2b7f01';
const SLUG = `deep-water-nowadays-${ID}`;
const night = {
  id: ID,
  slug: SLUG,
  citySlug: 'new-york',
  title: 'Deep Water',
  startsAt: '2026-10-17T02:00:00.000Z',
  endsAt: '2026-10-17T10:00:00.000Z',
  timeZone: 'America/New_York',
  venueName: 'Nowadays',
  address: '56-06 Cooper Ave, Queens, NY 11385',
  lat: 40.7057,
  lng: -73.9104,
  cityCode: 'NYC',
  priceMinCents: 2000,
  priceMaxCents: 3500,
  currency: 'USD',
  isFree: false,
  imageUrl: null,
  imageAttribution: null,
  source: 'DICE',
  sourceName: 'DICE',
  genre: 'house',
  updatedAt: '2026-10-14T20:00:00.000Z',
};

test('the id is the last 36 characters after the dash that ends the title', () => {
  assert.equal(listingIdFromSlug(SLUG), ID);
  assert.equal(listingIdFromSlug(`-${ID}`), ID);
  assert.equal(listingIdFromSlug(ID), null, 'a bare id has no title dash in front of it');
  assert.equal(listingIdFromSlug(`deep-water${ID}`), null);
  assert.equal(listingIdFromSlug(`${SLUG.slice(0, -1)}z`), null, 'not hex');
  assert.equal(listingIdFromSlug('wp-login'), null);
  assert.equal(listingIdFromSlug(null), null);
  assert.equal(listingIdFromSlug(undefined), null);
});

test('the canonical path is /e/<city>/<slug>', () => {
  assert.equal(listingPath(night), `/e/new-york/${SLUG}`);
});

test('a free night: offset dates, free and accessible, an offer at zero', () => {
  const node = buildListingEventJsonLd({ ...night, priceMinCents: 0, priceMaxCents: 0, isFree: true });
  assert.equal(node['@type'], 'Event');
  assert.equal(node.startDate, '2026-10-16T22:00:00-04:00');
  assert.equal(node.endDate, '2026-10-17T06:00:00-04:00');
  assert.equal(node.url, `https://pxispace.com/e/new-york/${SLUG}`);
  assert.equal(node.isAccessibleForFree, true);
  assert.equal(node.offers[0].price, '0.00');
  assert.equal(node.offers[0].url, `https://pxispace.com/go/${ID}/out`);
  assert.equal(node.location.address.addressLocality, 'New York');
  assert.equal(node.location.geo.latitude, 40.7057);
});

test('a paid night: the price is priceMinCents, in stock, and not marked free', () => {
  const node = buildListingEventJsonLd(night);
  assert.equal(node.eventStatus, 'https://schema.org/EventScheduled');
  assert.equal(node.eventAttendanceMode, 'https://schema.org/OfflineEventAttendanceMode');
  assert.equal(node.offers[0].price, '20.00');
  assert.equal(node.offers[0].priceCurrency, 'USD');
  assert.equal(node.offers[0].availability, 'https://schema.org/InStock');
  assert.equal(node.isAccessibleForFree, undefined);
});

test('a Montreal night keeps the Toronto-zone offset and its own currency', () => {
  const id = '5b0f6c1e-2a7d-4f3e-9c10-8e4a1d2b7f13';
  const node = buildListingEventJsonLd({
    ...night,
    id,
    slug: `sous-terrain-stereo-${id}`,
    citySlug: 'montreal',
    cityCode: 'YUL',
    timeZone: 'America/Toronto',
    currency: 'CAD',
    priceMinCents: 2500,
    endsAt: null,
    venueName: 'Stereo',
  });
  assert.equal(node.startDate, '2026-10-16T22:00:00-04:00');
  assert.equal(node.endDate, undefined);
  assert.equal(node.offers[0].priceCurrency, 'CAD');
});

test('an ended night, or one with no known price, states no offer', () => {
  assert.equal(buildListingEventJsonLd({ ...night, ended: true }).offers, undefined);
  assert.equal(buildListingEventJsonLd({ ...night, priceMinCents: null }).offers, undefined);
  assert.equal(buildListingEventJsonLd({ ...night, currency: null }).offers, undefined);
});

test('no start means no event; images only when they are https', () => {
  assert.equal(buildListingEventJsonLd({ ...night, startsAt: 'soon' }), null);
  assert.equal(buildListingEventJsonLd(null), null);
  assert.equal(buildListingEventJsonLd({ ...night, imageUrl: 'http://example.com/a.jpg' }).image, undefined);
  assert.deepEqual(
    buildListingEventJsonLd({ ...night, coverUrl: 'https://example.com/a.jpg' }).image,
    ['https://example.com/a.jpg'],
  );
});

test('more nights leave this one out, keep the feed order and stop at the limit', () => {
  const feed = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
  assert.deepEqual(moreNightsFor(feed, 'b').map((l) => l.id), ['a', 'c']);
  assert.equal(moreNightsFor(feed, 'x', 2).length, 2);
});

test('the feed and the sitemap drop rows whose id is not the one in their slug', async () => {
  const server = http.createServer((req, res) => {
    res.setHeader('Content-Type', 'application/json');
    if (req.url.startsWith('/api/public/listings/sitemap')) {
      res.end(JSON.stringify({
        listings: [
          { id: ID, path: `/e/new-york/${SLUG}`, updatedAt: night.updatedAt },
          { id: ID, path: '/e/new-york/wp-login', updatedAt: night.updatedAt },
        ],
      }));
      return;
    }
    res.end(JSON.stringify({ city: 'NYC', listings: [night, { ...night, id: 'not-an-id' }] }));
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  process.env.API_BASE_URL = `http://127.0.0.1:${server.address().port}`;
  try {
    const cards = await fetchCityListings({ cityCode: 'NYC' });
    assert.deepEqual(cards.map((c) => c.id), [ID]);
    const rows = await fetchListingsSitemap();
    assert.deepEqual(rows.map((r) => r.path), [`/e/new-york/${SLUG}`]);
  } finally {
    server.close();
  }
});
