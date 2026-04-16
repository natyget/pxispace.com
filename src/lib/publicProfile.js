import { cache } from 'react';

const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function fetchPublicProfileUncached(userId) {
    if (!userId || !UUID_RE.test(userId)) return null;
    const base = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
    const res = await fetch(`${base}/api/users/public-profile/${userId}`, {
        next: { revalidate: 120 },
    });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    const data = await res.json();
    return data.user ?? null;
}

/** Server-only: dedupe fetches between generateMetadata and page. */
export const getPublicProfile = cache(fetchPublicProfileUncached);
