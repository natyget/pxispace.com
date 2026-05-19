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
  if (res.status === 403) return { status: 403, data: null };
  if (!res.ok) {
    console.error('[publicAlbum] upstream error', { status: res.status, url });
    return { status: res.status, data: null };
  }
  const data = await res.json();
  return { status: 200, data };
}

async function fetchPublicAlbumUncached(albumId) {
  if (!albumId || typeof albumId !== 'string') return { album: null, denied: false };
  const base = getServerApiBaseUrl();
  const { status, data } = await fetchJson(`${base}/api/albums/public/${encodeURIComponent(albumId)}`);
  if (status === 403) return { album: null, denied: true };
  if (status !== 200 || !data?.album) return { album: null, denied: false };
  return { album: data.album, denied: false };
}

export const getPublicAlbumMeta = cache(fetchPublicAlbumUncached);
