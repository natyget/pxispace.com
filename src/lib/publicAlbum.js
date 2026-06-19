import { cache } from 'react';
import { getServerApiBaseUrl } from '@/lib/apiBase';
import { ssrFetchJson } from '@/lib/ssrFetch';

async function fetchPublicAlbumUncached(albumId) {
  if (!albumId || typeof albumId !== 'string') return { album: null, denied: false };
  const base = getServerApiBaseUrl();
  const { status, data } = await ssrFetchJson(
    `${base}/api/albums/public/${encodeURIComponent(albumId)}`,
    { logTag: 'publicAlbum' },
  );
  if (status === 403) return { album: null, denied: true };
  if (status !== 200 || !data?.album) return { album: null, denied: false };
  return { album: data.album, denied: false };
}

export const getPublicAlbumMeta = cache(fetchPublicAlbumUncached);
