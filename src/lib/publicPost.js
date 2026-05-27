import { cache } from 'react';
import { getServerApiBaseUrl } from '@/lib/apiBase';
import { ssrFetchJson } from '@/lib/ssrFetch';

const OBJECT_ID_RE = /^[0-9a-f]{24}$/i;

async function fetchPublicPostUncached(postId) {
  if (!postId || !OBJECT_ID_RE.test(postId)) return null;
  const base = getServerApiBaseUrl();
  const { status, data } = await ssrFetchJson(
    `${base}/api/feed/public/${encodeURIComponent(postId)}`,
    { logTag: 'publicPost' },
  );
  if (status !== 200 || !data) return null;
  return data.post ?? null;
}

export const getPublicPost = cache(fetchPublicPostUncached);
