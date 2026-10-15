import { CANONICAL_ORIGIN } from '@/lib/siteUrl';
import { generateSitemaps } from '../sitemap';

// The index of the split sitemap (app/sitemap.js). /sitemap.xml is rewritten here (next.config.js): a route at that
// path would clash with the sitemap metadata file, and each file the index lists is /sitemap/<id>.xml.
export const revalidate = 3600;

export async function GET() {
  const sitemaps = await generateSitemaps();
  const lastmod = new Date().toISOString();
  const entries = sitemaps.map(({ id }) => (
    `  <sitemap>\n    <loc>${CANONICAL_ORIGIN}/sitemap/${id}.xml</loc>\n    <lastmod>${lastmod}</lastmod>\n  </sitemap>`
  ));
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</sitemapindex>\n`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
