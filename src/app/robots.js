import { CANONICAL_ORIGIN, getSiteUrl } from '@/lib/siteUrl';

/** Hosts that are definitively not production. */
const NON_PRODUCTION_HOST = /^(dev|test|staging|preview)\.|(^|\.)netlify\.app$|^localhost$/i;

/**
 * True only when we can POSITIVELY identify a non-production deploy.
 *
 * Deliberately fail-OPEN: an unrecognised environment is treated as production.
 * A false positive here serves `Disallow: /` on pxispace.com and deindexes the
 * entire site — catastrophically worse than a preview host staying crawlable for
 * another week. So this never infers "not production" from the mere ABSENCE of a
 * production marker (an unset or unexpected NEXT_PUBLIC_SITE_URL must not
 * deindex us); it only reacts to a host or build context it recognises as
 * non-production.
 *
 * Netlify sets CONTEXT to 'production' | 'deploy-preview' | 'branch-deploy'.
 */
function isNonProductionDeploy() {
  const siteUrl = getSiteUrl();

  // Checked FIRST and on purpose. A build that declares itself to be the
  // canonical origin is production, whatever Netlify calls the deploy context —
  // promoting a branch deploy to the live domain must never deindex the site.
  // The cost of this ordering is that a preview which inherits the production
  // NEXT_PUBLIC_SITE_URL stays crawlable; that preview also self-canonicalises
  // to production (CANONICAL_ORIGIN is a constant), so Google folds it.
  if (siteUrl === CANONICAL_ORIGIN) return false;

  const context = process.env.CONTEXT;
  if (context === 'deploy-preview' || context === 'branch-deploy') return true;

  try {
    return NON_PRODUCTION_HOST.test(new URL(siteUrl).hostname);
  } catch {
    // Unparseable value — assume production rather than risk a blanket disallow.
    return false;
  }
}

/** Robots policy served at /robots.txt (Next.js metadata route). */
export default function robots() {
  const base = CANONICAL_ORIGIN;

  // dev.pxispace.com and test.pxispace.com were serving THIS file verbatim —
  // an allow-all policy advertising the production sitemap. Search Console duly
  // reported both hosts as crawled, and test.pxispace.com now sits in the index
  // report as a duplicate of the homepage. A preview host must never be
  // crawlable, whatever its canonical tags say.
  if (isNonProductionDeploy()) {
    return {
      rules: [{ userAgent: '*', disallow: '/' }],
    };
  }

  const disallow = [
    '/dashboard/',
    '/login',
    '/signup',
    '/verify-phone',
    '/passport-required',
    '/stripe/',
    '/api/',
  ];
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow },
      // AI answer engines are a distribution channel — explicitly allow them.
      { userAgent: 'GPTBot', allow: '/' },
      { userAgent: 'ClaudeBot', allow: '/' },
      { userAgent: 'PerplexityBot', allow: '/' },
      { userAgent: 'Google-Extended', allow: '/' },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
