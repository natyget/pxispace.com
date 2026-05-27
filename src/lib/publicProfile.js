import { cache } from 'react';
import { getServerApiBaseUrl } from '@/lib/apiBase';
import { ssrFetchJson } from '@/lib/ssrFetch';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function fetchPublicProfileUncached(userId) {
  if (!userId || !UUID_RE.test(userId)) return null;
  const base = getServerApiBaseUrl();
  const { status, data } = await ssrFetchJson(
    `${base}/api/users/public-profile/${encodeURIComponent(userId)}`,
    { logTag: 'publicProfile' },
  );
  if (status !== 200 || !data) return null;
  return data.user ?? null;
}

export const getPublicProfile = cache(fetchPublicProfileUncached);
