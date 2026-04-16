import { cache } from 'react';
import { getServerApiBaseUrl } from '@/lib/apiBase';

const OBJECT_ID_RE = /^[0-9a-f]{24}$/i;

/** Avoid default Node `undici` user-agent; some CDNs challenge SSR egress. */
const SSR_FETCH_HEADERS = {
  Accept: 'application/json',
  'User-Agent':
    'Mozilla/5.0 (compatible; PXI-Web-SSR/1.0; +https://pxispace.com) AppleWebKit/537.36 (KHTML, like Gecko)',
};

async function fetchPublicPostUncached(postId) {
  if (!postId || !OBJECT_ID_RE.test(postId)) return null;
  const base = getServerApiBaseUrl();
  const url = `${base}/api/feed/public/${postId}`;
  const res = await fetch(url, {
    headers: SSR_FETCH_HEADERS,
    next: { revalidate: 120 },
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    console.error('[getPublicPost] upstream error', {
      status: res.status,
      statusText: res.statusText,
      base,
      path: `/api/feed/public/${postId}`,
    });
    return null;
  }
  const data = await res.json();
  return data.post ?? null;
}

/** Server-only: dedupe fetches between generateMetadata and page. */
export const getPublicPost = cache(fetchPublicPostUncached);
