/** Robots policy served at /robots.txt (Next.js metadata route). */
export default function robots() {
  const base = 'https://pxispace.com';
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
