import { cache } from 'react';
import { getServerApiBaseUrl } from '@/lib/apiBase';
import { ssrFetchJson } from '@/lib/ssrFetch';

async function fetchPublicEventUncached(eventId) {
  if (!eventId || typeof eventId !== 'string') return null;
  const base = getServerApiBaseUrl();
  const { status, data } = await ssrFetchJson(
    `${base}/api/events/${encodeURIComponent(eventId)}`,
    { logTag: 'publicEvent' },
  );
  if (status !== 200 || !data) return null;
  return data.event ?? data ?? null;
}

export const getPublicEvent = cache(fetchPublicEventUncached);
