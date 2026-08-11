import {
  getAllPublicEvents,
  eventUrl,
  eventImageUrl,
  eventPriceUsd,
  eventGenres,
  eventPerformers,
} from '@/lib/publicEvents';
import { resolveEventCity } from '@/lib/seo/cities';

/**
 * Google Ads business-data feed for dynamic remarketing, served at /feeds/events.tsv
 *
 * Upload target: Google Ads → Tools → Shared library → Business data → Custom feed.
 * Pairs with the `ecomm_prodid` / `ecomm_pagetype` / `ecomm_totalvalue` parameters the
 * event page sends to AW-18365171384, so a visitor can be retargeted with the exact event
 * they looked at. The `ID` column MUST equal the `ecomm_prodid` value (the event id) or the
 * join silently produces zero matches.
 *
 * PRICE IS FACE VALUE, deliberately. Google disapproves feeds whose price disagrees with
 * the landing page, and the event page shows face value — the service fee and processing
 * fee are only revealed at checkout. Note `ticketPrice` is a whole-dollar integer upstream,
 * so fractional prices cannot occur today.
 *
 * Only published, upcoming, PUBLIC events appear: the loader pins the query to
 * `?discover=1`, which is what constrains it to visibility PUBLIC on the backend.
 */

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const COLUMNS = [
  'ID',
  'Item title',
  'Final URL',
  'Image URL',
  'Item description',
  'Item category',
  'Price',
  'City',
  'Start date',
  'Contextual keywords',
];

/** TSV cannot carry tabs or newlines inside a field, and Ads rejects rows that do. */
function cell(value) {
  if (value == null) return '';
  return String(value)
    .replace(/[\t\r\n]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function truncate(value, max) {
  const s = cell(value);
  return s.length <= max ? s : `${s.slice(0, max - 1).trimEnd()}…`;
}

export async function GET() {
  let events = [];
  try {
    events = await getAllPublicEvents();
  } catch (error) {
    console.error('[feeds/events.tsv]', error);
    // An empty feed is recoverable; a 500 makes Ads mark the feed as failing.
    events = [];
  }

  const rows = events.map((event) => {
    const city = resolveEventCity(event);
    const genres = eventGenres(event);
    const performers = eventPerformers(event).map((p) => p.name);
    const price = eventPriceUsd(event);

    const keywords = [
      ...genres,
      ...performers,
      city?.name,
      city ? `events in ${city.name}` : null,
      'events',
      'tickets',
    ]
      .filter(Boolean)
      .map((k) => cell(k).toLowerCase())
      .filter((k, i, arr) => k && arr.indexOf(k) === i)
      .slice(0, 10);

    const description =
      truncate(event.description, 200) ||
      truncate(
        [event.name, city ? `in ${city.name}` : null, 'on PXI'].filter(Boolean).join(' '),
        200,
      );

    return [
      cell(event.id),
      truncate(event.name || 'Event', 150),
      eventUrl(event),
      eventImageUrl(event),
      description,
      // Item category maps to the primary genre; fall back to a generic so the column is
      // never blank (Ads treats blank categories as unmappable).
      cell(genres[0] || 'events'),
      // Ads wants a bare number plus currency.
      price == null ? '' : `${price.toFixed(2)} USD`,
      cell(city?.name || ''),
      event.startDate ? new Date(event.startDate).toISOString() : '',
      keywords.join(';'),
    ].join('\t');
  });

  const body = [COLUMNS.join('\t'), ...rows].join('\n');

  return new Response(`${body}\n`, {
    status: 200,
    headers: {
      'Content-Type': 'text/tab-separated-values; charset=utf-8',
      'Cache-Control': 'public, max-age=600, s-maxage=600, stale-while-revalidate=3600',
      'X-Robots-Tag': 'noindex',
      'Content-Disposition': 'inline; filename="pxi-events.tsv"',
    },
  });
}
