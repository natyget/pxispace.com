import { CANONICAL_ORIGIN } from '@/lib/siteUrl';

/**
 * The one way to declare page metadata.
 *
 * Two bugs this exists to make structurally impossible:
 *
 * 1. MISSING og:image. In the App Router a page's `openGraph` object REPLACES the parent
 *    layout's — it does not deep-merge. Several pages set `openGraph: { title, description,
 *    url }` and silently dropped the inherited `images`, so they shipped with no og:image
 *    at all and every share preview and search thumbnail came up blank.
 *    Here `images` is never caller-optional: it always resolves to something.
 *
 * 2. IDENTICAL og:image everywhere. Every page pointed at the same static og-hero.png, so a
 *    link to /about, /faq and /pricing previewed identically and told the reader nothing.
 *    The default is now a per-page card rendered by /og from the page's own title.
 *
 * Canonicals always use CANONICAL_ORIGIN, never the deployment origin — a preview build
 * must not tell Google it is the real site.
 */

const DEFAULT_OG_ALT = 'PXI — tickets, one shared camera roll, and the morning-after scrapbook';

/**
 * URL of the dynamically rendered 1200×630 card for a page.
 * @param {{title: string, eyebrow?: string, kicker?: string}} input
 */
export function ogImageUrl({ title, eyebrow, kicker } = {}) {
  const params = new URLSearchParams();
  params.set('title', String(title ?? 'PXI'));
  if (eyebrow) params.set('eyebrow', String(eyebrow));
  if (kicker) params.set('kicker', String(kicker));
  return `${CANONICAL_ORIGIN}/og?${params.toString()}`;
}

/**
 * Build a complete, correct metadata object for a marketing page.
 *
 * @param {object}  input
 * @param {string}  input.title        <title> and og:title (the layout appends "| PXI")
 * @param {string}  input.description  meta description and og:description
 * @param {string}  input.path         site-relative path, e.g. '/about'
 * @param {string} [input.ogTitle]     override the card headline when the <title> is long
 * @param {string} [input.eyebrow]     small uppercase label on the generated card
 * @param {string} [input.image]       explicit image (absolute, or site-relative). Use for
 *                                     pages with real photography; omit to generate a card.
 * @param {string} [input.imageAlt]
 * @param {object} [input.robots]      e.g. { index: false, follow: true } for thin pages
 * @param {'website'|'article'} [input.type]
 */
export function buildPageMetadata({
  title,
  description,
  path = '/',
  ogTitle,
  eyebrow,
  image,
  imageAlt,
  robots,
  type = 'website',
} = {}) {
  const url = `${CANONICAL_ORIGIN}${path.startsWith('/') ? path : `/${path}`}`;

  const resolved = image
    ? String(image).startsWith('http')
      ? String(image)
      : `${CANONICAL_ORIGIN}${image}`
    : ogImageUrl({ title: ogTitle || title, eyebrow });

  // Absolute URLs and explicit dimensions: several crawlers (notably older Slack and
  // LinkedIn agents) will not resolve a relative og:image and skip cards with no size.
  const images = [{ url: resolved, width: 1200, height: 630, alt: imageAlt || title || DEFAULT_OG_ALT }];

  return {
    title,
    description,
    alternates: { canonical: url },
    ...(robots ? { robots } : {}),
    openGraph: {
      type,
      siteName: 'PXI',
      locale: 'en_US',
      title: ogTitle || title,
      description,
      url,
      images,
    },
    twitter: {
      card: 'summary_large_image',
      site: '@pxilabs',
      title: ogTitle || title,
      description,
      images: [resolved],
    },
  };
}
