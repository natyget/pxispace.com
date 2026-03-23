/**
 * Resolve image URLs for the browser when the API returns R2 keys or site-relative paths.
 * Set NEXT_PUBLIC_R2_PUBLIC_URL to the same value as backend R2_PUBLIC_URL (no trailing slash).
 */

const r2Base = (process.env.NEXT_PUBLIC_R2_PUBLIC_URL || '').replace(/\/$/, '');
const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '');

export function resolveDisplayImageUrl(url) {
  if (url == null || typeof url !== 'string') return null;
  const t = url.trim();
  if (!t) return null;
  if (/^https?:\/\//i.test(t)) return t;
  if (t.startsWith('//')) return `https:${t}`;
  if (t.startsWith('data:image/')) return t;
  if (/^file:/i.test(t)) return null;

  const path = t.replace(/^\/+/, '');
  if (r2Base && (path.startsWith('albums/') || path.startsWith('uploads/'))) {
    return `${r2Base}/${path}`;
  }
  if (apiBase && t.startsWith('/')) {
    return `${apiBase}${t}`;
  }
  if (r2Base) {
    return `${r2Base}/${path}`;
  }
  return null;
}

export function displayImageSrc(url, fallback) {
  return resolveDisplayImageUrl(url) || fallback || null;
}
