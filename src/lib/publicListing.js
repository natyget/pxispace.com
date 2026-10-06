import { cache } from 'react';
import { getServerApiBaseUrl } from '@/lib/apiBase';
import { SSR_FETCH_HEADERS, SSR_FETCH_TIMEOUT_MS } from '@/lib/ssrFetch';
import { isListingId } from '@/lib/goListing';

// Server-side reads and writes for the /go page (contract: BRIEF-W2-CONTRACT.md, sections 2 and 3). The base is
// the same one every other server call uses (API_BASE_URL), so a local backend is one environment variable away.

/** The API caches an answer for 60 seconds as well, so asking again sooner learns nothing. */
const REVALIDATE_SECONDS = 60;

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
 */
export async function fetchPublicListing(id) {
  if (!isListingId(id)) return { status: 'missing' };
  const url = `${getServerApiBaseUrl()}/api/public/listings/${encodeURIComponent(id)}`;
  try {
    // `revalidate` keeps one visitor's read useful to the next: every visitor reaches the API from the site's one
    // server address, and the API limits each caller. Only 200s are stored, so a missing night is asked again.
    const res = await fetch(url, {
      headers: SSR_FETCH_HEADERS,
      next: { revalidate: REVALIDATE_SECONDS },
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

/** The same read, once per request: the page and its metadata both ask. */
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
