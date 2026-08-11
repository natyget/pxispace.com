/**
 * Site origins.
 *
 * There are two distinct notions here and conflating them is how a deploy ends up telling
 * Google that the canonical version of every page lives on a preview host:
 *
 *  - CANONICAL_ORIGIN is the one true public home of this content. It is deliberately a
 *    constant, NOT env-driven. `rel=canonical`, JSON-LD `url`/`@id`, breadcrumbs and the
 *    sitemap must always name it, on every deploy, including previews — a preview that
 *    self-canonicalises to itself is a duplicate of production, and one that inherits a
 *    stale NEXT_PUBLIC_SITE_URL points production at a host that should never be indexed.
 *
 *  - getSiteUrl() is the origin of the *running* deployment, used for links and OG assets
 *    that should resolve against wherever the user actually is. It honours
 *    NEXT_PUBLIC_SITE_URL so previews load their own images.
 */

export const CANONICAL_ORIGIN = 'https://pxispace.com';

/** Origin of the running deployment (no trailing slash). Use for OG assets and links. */
export function getSiteUrl() {
  const u = process.env.NEXT_PUBLIC_SITE_URL || CANONICAL_ORIGIN;
  return u.replace(/\/$/, '');
}

/** Absolute canonical URL for a site-relative path. Always on the production origin. */
export function canonicalUrl(path = '/') {
  const p = String(path || '/');
  return `${CANONICAL_ORIGIN}${p.startsWith('/') ? p : `/${p}`}`.replace(/\/$/, '') || CANONICAL_ORIGIN;
}

/** True when the running deployment is the production host. */
export function isProductionOrigin() {
  return getSiteUrl() === CANONICAL_ORIGIN;
}
