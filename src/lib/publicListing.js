import { cache } from 'react';
import { getServerApiBaseUrl } from '@/lib/apiBase';
import { SSR_FETCH_HEADERS, SSR_FETCH_TIMEOUT_MS } from '@/lib/ssrFetch';
import { isListingId } from '@/lib/goListing';

// Server-side reads and writes for the /go page (contract: BRIEF-W2-CONTRACT.md, sections 2 and 3). The base is
// the same one every other server call uses (API_BASE_URL), so a local backend is one environment variable away.

/** The API asks every caller for the visitor's address (see the note on `fetchPublicListing`), so no answer is shared between visitors here. */

/**
 * One outside listing, from GET /api/public/listings/:id.
 *
 * Never throws. The answer is one of:
 *   { status: 'ok', listing }          200
 *   { status: 'missing' }              404: unknown, hidden, taken down or held back by the content guard
 *   { status: 'gone', cityName }       410: ended more than a day ago
 *   { status: 'unavailable' }          anything else (the API is down, slow or rate limiting us): say so, do not
 *                                      pretend the night does not exist
 *
 * `ssrFetchJson` is not used because it drops the body of a 410, and the city's name is in it.
 *
 * `ip` is the visitor's address, sent as X-Forwarded-For. The API limits each visitor (240 a minute) and, far more
 * loosely, each connecting address (6,000 a minute); every visitor of this site connects from the site's own
 * address, so without it they would all be one visitor and one busy link could lock out every other page.
 * The API caches an answer for 60 seconds itself, so nothing is kept here: a copy kept per visitor would only
 * add a cache write to every visit.
 */
export async function fetchPublicListing(id, ip = '') {
  if (!isListingId(id)) return { status: 'missing' };
  const url = `${getServerApiBaseUrl()}/api/public/listings/${encodeURIComponent(id)}`;
  try {
    const res = await fetch(url, {
      headers: { ...SSR_FETCH_HEADERS, ...(ip ? { 'X-Forwarded-For': ip } : {}) },
      cache: 'no-store',
      signal: AbortSignal.timeout(SSR_FETCH_TIMEOUT_MS),
    });
    if (res.status === 404) return { status: 'missing' };
    if (res.status === 410) {
      const body = await res.json().catch(() => null);
      return { status: 'gone', cityName: typeof body?.cityName === 'string' ? body.cityName.trim() : '' };
    }
    if (!res.ok) {
      console.error('[publicListing] upstream error', { status: res.status, url });
      return { status: 'unavailable' };
    }
    const data = await res.json();
    const listing = data?.listing;
    if (!listing || typeof listing !== 'object' || typeof listing.title !== 'string' || !listing.title.trim()) {
      console.error('[publicListing] unexpected body', { url });
      return { status: 'unavailable' };
    }
    return { status: 'ok', listing };
  } catch (error) {
    console.error('[publicListing] fetch failed', { url, timedOut: error?.name === 'TimeoutError', error });
    return { status: 'unavailable' };
  }
}

/** The same read, once per request (the page and its metadata both ask, with the same arguments). */
export const getPublicListing = cache(fetchPublicListing);

/**
 * One row of first-party traffic, from POST /api/listings/:id/traffic. The API stores no address and no device id;
 * the address sent here only lets it count each visitor against their own rate limit, and the agent lets it ignore
 * link-preview bots.
 *
 * Fire and forget: it never throws and never waits longer than `timeoutMs`. Any failure, a 404 from an older
 * backend included, is nothing.
 *
 * @param {string} id the listing
 * @param {{ kind: 'VIEW' | 'CLICK', surface?: string, userAgent?: string, ip?: string }} traffic
 * @param {number} [timeoutMs]
 * @returns {Promise<boolean>} true when the API took it
 */
export async function logListingTraffic(id, { kind, surface = 'go_page', userAgent, ip }, timeoutMs = 800) {
  if (!isListingId(id)) return false;
  try {
    const res = await fetch(`${getServerApiBaseUrl()}/api/listings/${encodeURIComponent(id)}/traffic`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        // The default Node agent is challenged by the API's Cloudflare (see ssrFetch.js).
        'User-Agent': SSR_FETCH_HEADERS['User-Agent'],
        ...(ip ? { 'X-Forwarded-For': ip } : {}),
      },
      body: JSON.stringify({ kind, surface, ...(userAgent ? { userAgent } : {}) }),
      cache: 'no-store',
      signal: AbortSignal.timeout(timeoutMs),
    });
    return res.ok;
  } catch {
    return false;
  }
}
