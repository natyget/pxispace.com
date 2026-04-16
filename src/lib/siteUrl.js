/** Canonical site origin for Open Graph URLs (no trailing slash). */
export function getSiteUrl() {
    const u = process.env.NEXT_PUBLIC_SITE_URL || 'https://pxispace.com';
    return u.replace(/\/$/, '');
}
