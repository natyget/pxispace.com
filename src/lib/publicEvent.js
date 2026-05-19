import { cache } from 'react';
import { getServerApiBaseUrl } from '@/lib/apiBase';

const SSR_FETCH_HEADERS = {
  Accept: 'application/json',
  'User-Agent':
    'Mozilla/5.0 (compatible; PXI-Web-SSR/1.0; +https://pxispace.com) AppleWebKit/537.36 (KHTML, like Gecko)',
};

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: SSR_FETCH_HEADERS,
    next: { revalidate: 120 },
  });
  if (res.status === 404) return { status: 404, data: null };
  if (!res.ok) {
    console.error('[publicEvent] upstream error', { status: res.status, statusText: res.statusText, url });
    return { status: res.status, data: null };
  }
  const data = await res.json();
  return { status: 200, data };
}

async function fetchPublicEventUncached(eventId) {
  if (!eventId || typeof eventId !== 'string') return null;
  const base = getServerApiBaseUrl();
  const { status, data } = await fetchJson(`${base}/api/events/${encodeURIComponent(eventId)}`);
  if (status !== 200 || !data) return null;
  return data.event ?? data ?? null;
}

/** Server-only: dedupe fetches between generateMetadata and page. */
export const getPublicEvent = cache(fetchPublicEventUncached);
