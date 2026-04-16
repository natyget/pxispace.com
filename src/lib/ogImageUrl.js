import { resolveDisplayImageUrl } from '@/lib/mediaUrl';

/**
 * Open Graph / Twitter crawlers require a stable absolute https URL.
 * Resolves R2 keys like the profile page, then normalizes scheme and path.
 *
 * @param {string} siteOrigin Canonical site origin, no trailing slash (e.g. from getSiteUrl()).
 * @param {string | null | undefined} rawUrl Value from API or same shape as avatarUrl / image URL.
 * @returns {string | null}
 */
export function toOpenGraphImageUrl(siteOrigin, rawUrl) {
  const resolved = resolveDisplayImageUrl(rawUrl);
  if (resolved == null || typeof resolved !== 'string') return null;
  let u = resolved.trim();
  if (!u) return null;

  if (/^https:\/\//i.test(u)) return u;

  if (/^http:\/\//i.test(u)) {
    return `https://${u.slice('http://'.length)}`;
  }

  if (u.startsWith('//')) {
    return `https:${u}`;
  }

  const base = String(siteOrigin).replace(/\/$/, '');
  if (u.startsWith('/')) {
    return `${base}${u}`;
  }

  try {
    return new URL(u, `${base}/`).href;
  } catch {
    return null;
  }
}
