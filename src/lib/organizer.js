import { cache } from 'react';
import { getServerApiBaseUrl } from '@/lib/apiBase';
import { ssrFetchJson } from '@/lib/ssrFetch';
import { organizerKey, parseNights, parseOrganizer, parseScrapbooks } from '@/lib/organizerPage';

// Server-side reads for the organizer page (contract: BRIEF-N1-ORG-contract.md). The base is the same one every other
// server call uses (API_BASE_URL), and nothing here forwards the visitor's cookies: the page is public, so the API
// answers as it does for anyone signed out (`Cache-Control: public, max-age=60`).
//
// None of these throws. The page decides what a missing answer means: no organizer sends the visitor to the
// passport preview, and a list that did not come back is a section left out.

/** The API's own cap on a catalogue page (`upcoming` is never paged, `past` is: this is its first page). */
const CATALOGUE_LIMIT = 50;
/** The API's own cap on a page of public scrapbooks. */
const SCRAPBOOK_LIMIT = 100;

async function fetchOrganizerUncached(idOrUsername) {
  const key = organizerKey(idOrUsername);
  if (!key) return null;
  const base = getServerApiBaseUrl();
  const { status, data } = await ssrFetchJson(`${base}/api/users/${encodeURIComponent(key)}/organizer`, {
    logTag: 'organizer',
  });
  // 404 is "not an organizer" (a member who is not a Diplomat, a private account, a block, no such account) and also
  // what a backend that does not have the route yet answers. Either way the passport preview is the page.
  if (status !== 200 || !data) return null;
  return parseOrganizer(data.organizer);
}

/**
 * The organizer behind /u/<idOrUsername>, or null. A username may carry a leading "@". Server-only: dedupes the
 * fetch between generateMetadata and the page.
 */
export const getOrganizer = cache(fetchOrganizerUncached);

/**
 * The organizer's PUBLIC nights, by the id `getOrganizer` returned: `upcoming` soonest first, `past` newest first
 * (the first page of them). Both empty when the API did not answer.
 */
export async function getOrganizerCatalogue(organizerId) {
  const key = organizerKey(organizerId);
  if (!key) return { upcoming: [], past: [] };
  const base = getServerApiBaseUrl();
  const { status, data } = await ssrFetchJson(
    `${base}/api/users/${encodeURIComponent(key)}/catalogue?limit=${CATALOGUE_LIMIT}&offset=0`,
    { logTag: 'organizerCatalogue' },
  );
  if (status !== 200 || !data) return { upcoming: [], past: [] };
  return { upcoming: parseNights(data.upcoming), past: parseNights(data.past) };
}

/** The organizer's public scrapbooks, newest first (the first page of them). Empty when the API did not answer. */
export async function getOrganizerScrapbooks(organizerId) {
  const key = organizerKey(organizerId);
  if (!key) return [];
  const base = getServerApiBaseUrl();
  const { status, data } = await ssrFetchJson(
    `${base}/api/users/${encodeURIComponent(key)}/public-scrapbooks?limit=${SCRAPBOOK_LIMIT}&offset=0`,
    { logTag: 'organizerScrapbooks' },
  );
  if (status !== 200 || !data) return [];
  return parseScrapbooks(data.scrapbooks);
}
