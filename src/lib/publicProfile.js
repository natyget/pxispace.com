import { cache } from 'react';
import { getServerApiBaseUrl } from '@/lib/apiBase';

const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Avoid default Node `undici` user-agent; some CDNs (e.g. Cloudflare) challenge/block SSR egress from hosts like Netlify. */
const SSR_FETCH_HEADERS = {
    Accept: 'application/json',
    'User-Agent':
        'Mozilla/5.0 (compatible; PXI-Web-SSR/1.0; +https://pxispace.com) AppleWebKit/537.36 (KHTML, like Gecko)',
};

async function fetchPublicProfileUncached(userId) {
    if (!userId || !UUID_RE.test(userId)) return null;
    const base = getServerApiBaseUrl();
    const url = `${base}/api/users/public-profile/${userId}`;
    const res = await fetch(url, {
        headers: SSR_FETCH_HEADERS,
        next: { revalidate: 120 },
    });
    if (res.status === 404) return null;
    if (!res.ok) {
        console.error('[getPublicProfile] upstream error', {
            status: res.status,
            statusText: res.statusText,
            base,
            path: `/api/users/public-profile/${userId}`,
        });
        return null;
    }
    const data = await res.json();
    return data.user ?? null;
}

/** Server-only: dedupe fetches between generateMetadata and page. */
export const getPublicProfile = cache(fetchPublicProfileUncached);
