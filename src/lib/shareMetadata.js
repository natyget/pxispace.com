import { resolveDisplayImageUrl } from '@/lib/mediaUrl';
import { toOpenGraphImageUrl } from '@/lib/ogImageUrl';

/** PNG fallback — iMessage / Instagram do not reliably preview SVG OG images. */
export const OG_FALLBACK_PATH = '/favicon.png';

export function getOgFallbackUrl(site) {
  const base = String(site).replace(/\/$/, '');
  return `${base}${OG_FALLBACK_PATH}`;
}

/**
 * Resolve the best absolute https OG image from API fields (cover, thumb, avatar, etc.).
 * @param {string} site
 * @param {...(string|null|undefined)} candidates
 * @returns {string}
 */
export function resolveShareOgImage(site, ...candidates) {
  for (const raw of candidates) {
    if (raw == null || typeof raw !== 'string' || !raw.trim()) continue;
    const resolved = resolveDisplayImageUrl(raw);
    const og = toOpenGraphImageUrl(site, resolved ?? raw);
    if (og) return og;
  }
  return getOgFallbackUrl(site);
}

/**
 * Standard Next.js metadata for link previews (Open Graph + Twitter).
 * @param {object} opts
 * @returns {import('next').Metadata}
 */
export function buildShareMetadata({
  site,
  canonical,
  title,
  description,
  ogImage,
  ogAlt,
  ogWidth,
  ogHeight,
  type = 'website',
  robots,
  privatePreview = false,
}) {
  const rawTitle = String(title).trim() || 'PXI';
  const fullTitle = /\bPXI\b/i.test(rawTitle) ? rawTitle : `${rawTitle} — PXI`;
  const pageTitle = rawTitle;

  const hasDims =
    typeof ogWidth === 'number' &&
    typeof ogHeight === 'number' &&
    ogWidth > 0 &&
    ogHeight > 0 &&
    Number.isFinite(ogWidth) &&
    Number.isFinite(ogHeight);

  const ogImageDescriptor = privatePreview
    ? undefined
    : {
        url: ogImage,
        alt: ogAlt || pageTitle,
        ...(hasDims ? { width: Math.round(ogWidth), height: Math.round(ogHeight) } : {}),
      };

  return {
    title: pageTitle,
    description,
    metadataBase: new URL(site),
    alternates: { canonical },
    ...(robots ? { robots } : {}),
    openGraph: {
      type,
      url: canonical,
      siteName: 'PXI',
      title: fullTitle,
      description,
      ...(ogImageDescriptor ? { images: [ogImageDescriptor] } : {}),
    },
    twitter: {
      card: privatePreview ? 'summary' : 'summary_large_image',
      title: fullTitle,
      description,
      ...(!privatePreview && ogImage ? { images: [ogImage] } : {}),
    },
  };
}
