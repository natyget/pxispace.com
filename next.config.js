import { buildCsp, cspHeaderName } from './csp.js';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Face scanning runs client-side only; always bundle Human's browser ESM
  // build. The package's default "node" entry hard-requires
  // @tensorflow/tfjs-node, and its exports map lacks "./"-prefixed subpaths,
  // so we alias the bare specifier straight to the file.
  turbopack: {
    resolveAlias: {
      '@vladmandic/human': './node_modules/@vladmandic/human/dist/human.esm.js',
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@vladmandic/human': './node_modules/@vladmandic/human/dist/human.esm.js',
    };
    return config;
  },


  async redirects() {
    return [
      // One canonical host. Everything else 301s to it so link equity and cookies do not
      // split across www/non-www variants.
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.pxispace.com' }],
        destination: 'https://pxispace.com/:path*',
        permanent: true,
      },
      {
        source: '/login/email',
        destination: '/login',
        permanent: false,
      },
      {
        // /platform is canonical; /organizers is a permanent alias
        source: '/organizers',
        destination: '/platform',
        permanent: true,
      },
      {
        source: '/features/white-label-event-ticketing',
        destination: '/features/branded-event-ticketing',
        permanent: true,
      },
      // Editorial lives at /editorial. The routes were once at /story, but every
      // canonical, OG url, breadcrumb, ItemList and sitemap entry we ever published
      // said /editorial — so the pages were self-canonicalising to a 404 and Google
      // was being told to drop them. The routes moved to match the published URLs;
      // these 301s carry the /story links.
      // Order matters: Next matches top-down, so the renamed slug must resolve
      // before the generic /story/:slug rule turns it into /editorial/afrodisiac-boston.
      {
        source: '/story/afrodisiac-boston',
        destination: '/editorial/sanaa-groove-boston',
        permanent: true,
      },
      {
        source: '/editorial/afrodisiac-boston',
        destination: '/editorial/sanaa-groove-boston',
        permanent: true,
      },
      {
        source: '/story/:slug',
        destination: '/editorial/:slug',
        permanent: true,
      },
      {
        source: '/story',
        destination: '/editorial',
        permanent: true,
      },

      // Operational cities are New York and Boston only. Montréal and Toronto hubs
      // are retired — 301 rather than 404 so their link equity flows somewhere real.
      {
        source: '/discover/montreal',
        destination: '/discover/new-york',
        permanent: true,
      },
      {
        source: '/discover/toronto',
        destination: '/discover/new-york',
        permanent: true,
      },
    ];
  },
  // Security + robots headers live HERE, not in netlify.toml.
  // Verified against production: the netlify.toml [[headers]] block never reaches HTML
  // documents (only static assets carry it), so the CSP and X-Frame-Options that block
  // was meant to enforce have been inert on every page. Next's headers() runs on the
  // document response, which is the only place they do anything.
  async headers() {
    const securityHeaders = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      {
        key: 'Permissions-Policy',
        value: 'accelerometer=(), geolocation=(), gyroscope=(), camera=(self), microphone=(), usb=()',
      },
      { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
      // The CSP is defined once in ./csp.js. It lived in netlify.toml until now, where
      // it only ever reached static assets and therefore did nothing — see that file
      // for the rollout procedure and the CSP_REPORT_ONLY escape hatch.
      {
        key: cspHeaderName(),
        value: buildCsp({ dev: process.env.NODE_ENV !== 'production' }),
      },
    ];

    // Thin, duplicate, or private-by-nature templates. These must stay CRAWLABLE and carry
    // noindex — a robots.txt Disallow would stop Google fetching them and it would never
    // see the noindex, so anything already indexed would stay indexed forever.
    const noindexPaths = [
      '/events-old/:path*',
      '/dj/:path*',
      '/upload/:path*',
      '/open/:path*',
      '/unsubscribe',
      '/passport-required',
      '/verify-phone',
      '/apple-music-connect-embed',
      '/spotify-callback',
      '/403',
      '/503',
    ];

    return [
      { source: '/:path*', headers: securityHeaders },
      ...noindexPaths.map((source) => ({
        source,
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, follow' }],
      })),
      // Non-production hosts must never be indexed, whatever their pages claim.
      {
        source: '/:path*',
        has: [{ type: 'host', value: '(?<sub>.*\\.netlify\\.app|test\\.pxispace\\.com|dev\\.pxispace\\.com)' }],
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
    ];
  },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'plus.unsplash.com' },
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'i.pravatar.cc' },
    ],
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;
