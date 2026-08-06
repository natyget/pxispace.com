/**
 * The four owned social profiles — one source of truth.
 *
 * These strings are load-bearing in two places that must never disagree:
 *
 *   1. The footer links a human clicks.
 *   2. `sameAs` in the Organization JSON-LD, which is how Google ties pxispace.com to
 *      the profiles and builds a Knowledge Panel. A wrong handle there does not just
 *      404 — it asserts to Google that we are a different account than we are, and the
 *      entity link silently never forms.
 *
 * The footer previously linked `tiktok.com/@pxi.labs` (with a dot) and the JSON-LD
 * repeated it. Both were wrong, and X and YouTube were absent from both.
 */

export const SOCIAL_PROFILES = [
  { key: 'instagram', label: 'Instagram', handle: '@pxilabs', url: 'https://www.instagram.com/pxilabs/' },
  { key: 'tiktok', label: 'TikTok', handle: '@pxilabs', url: 'https://www.tiktok.com/@pxilabs' },
  { key: 'x', label: 'X', handle: '@PXILabs', url: 'https://x.com/PXILabs' },
  { key: 'youtube', label: 'YouTube', handle: '@PXILabs', url: 'https://www.youtube.com/@PXILabs' },
];

/** Handle used for `twitter:site` / `twitter:creator` card attribution. */
export const X_HANDLE = '@PXILabs';

/** Profile URLs in `sameAs` order. */
export const SOCIAL_SAME_AS = SOCIAL_PROFILES.map((p) => p.url);
