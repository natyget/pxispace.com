/**
 * The Content-Security-Policy for pxispace.com. ONE definition, imported by
 * next.config.js and emitted on the document response.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHY THIS FILE EXISTS
 *
 * The policy used to live in netlify.toml. With @netlify/plugin-nextjs, pages are
 * served by the Next runtime, so a `[[headers]]` block only ever reached STATIC
 * ASSETS — and a CSP on a PNG response does nothing at all, because CSP governs what
 * a *document* is allowed to load. The net effect was that the site ran with no CSP
 * whatsoever while appearing, in the repo, to have a carefully written one.
 *
 * The CSP line has been removed from netlify.toml so there is exactly one source of
 * truth and the two cannot drift.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * HOW TO ROLL THIS OUT WITHOUT BREAKING THE SITE
 *
 * A CSP fails CLOSED: anything not named here is blocked, and the failure mode is a
 * feature that silently stops working rather than an error anyone gets paged about.
 *
 * Set `CSP_REPORT_ONLY=1` in the Netlify environment to emit
 * `Content-Security-Policy-Report-Only` instead. The browser then logs every
 * violation to the console and enforces nothing. That is the safe first deploy:
 * ship it report-only, click through checkout / face scan / Spotify / Google
 * sign-in / the dashboard with devtools open, confirm the console is clean, then
 * remove the variable and deploy again to enforce.
 *
 * ⚠ `headers()` is evaluated at BUILD time and the header NAME is baked into
 * .next/routes-manifest.json. Verified by reading that file. So CSP_REPORT_ONLY must
 * be set BEFORE the build, and flipping it requires a FULL REBUILD — a redeploy of the
 * existing artifact will keep whatever mode it was built with. Same trap as
 * NEXT_PUBLIC_*.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHY EACH NON-OBVIOUS ENTRY IS HERE
 *
 * Every origin below was found by scanning src/ AND the built client chunks, which
 * is what catches URLs baked into a dependency rather than written by us.
 *
 *   'unsafe-inline' (script)   Next inlines hydration data and we server-render
 *                              JSON-LD. Removing this needs a nonce on every inline
 *                              script, which the App Router does not do for us.
 *   'wasm-unsafe-eval'         Human/tfjs compiles WebGL + WASM kernels.
 *   cdn.jsdelivr.net           Human's tfjs backend hard-codes this as its wasmPath.
 *                              We configure `backend: 'humangl'` with local models, so
 *                              it is only reached if WebGL is unavailable and tfjs
 *                              falls back to WASM. Allowed so that fallback still
 *                              works instead of failing with an opaque CSP error.
 *   m.stripe.network           Stripe.js injects this hidden iframe for fraud
 *                              signals. Omitting it breaks the embedded
 *                              PaymentElement in ways that look like a Stripe outage.
 *   r.stripe.com               Stripe.js telemetry beacon.
 *   img-src https:             Deliberately broad. Avatars and event media come from
 *                              R2, Unsplash, Geoapify static maps and qrserver, and a
 *                              blocked <img> is a visibly broken product surface.
 *   frame-ancestors 'none'     Matches the X-Frame-Options: DENY we already send, so
 *                              it introduces no new restriction.
 *
 * NOT included on purpose:
 *   calendar.zoho.com          /book uses window.open, which no CSP directive governs.
 *   maps.geoapify.com          Static map IMAGES, covered by img-src.
 *   api.qrserver.com           Images, covered by img-src.
 */

const SELF = "'self'";

/** Ad + analytics origins. Kept apart so it is obvious what tracking can reach. */
const ANALYTICS_SCRIPT = [
  'https://*.googletagmanager.com',
  'https://www.googleadservices.com',
  // Google Ads remarketing injects a SCRIPT from googleads.g.doubleclick.net at
  // runtime. Caught only by driving a real browser — the URL is built by gtag and
  // appears nowhere in our source or bundle.
  'https://*.doubleclick.net',
  // Social pixels — see src/lib/socialPixels.js. Dormant until their env ids exist,
  // but the policy has to allow them before they are switched on, not after.
  'https://connect.facebook.net',
  'https://analytics.tiktok.com',
  'https://static.ads-twitter.com',
  'https://analytics.twitter.com',
];

const ANALYTICS_CONNECT = [
  'https://*.google-analytics.com',
  // BOTH forms are required. A CSP host wildcard matches SUBDOMAINS ONLY, so
  // `*.analytics.google.com` does NOT match the bare `analytics.google.com` — which is
  // exactly where GA4 posts every hit. Missing it silently blocked 100% of analytics.
  'https://analytics.google.com',
  'https://*.analytics.google.com',
  'https://*.googletagmanager.com',
  // Covers ad., stats.g., td. and googleads.g. — the wildcard spans multiple levels.
  'https://*.doubleclick.net',
  // Google Ads conversion pings go to the searcher's country domain (google.co.uk and
  // friends). Only the .com is allowlisted; international conversion pings will be
  // blocked until PXI operates outside the US.
  'https://www.google.com',
  'https://www.googleadservices.com',
  'https://connect.facebook.net',
  'https://*.facebook.com',
  'https://analytics.tiktok.com',
  'https://*.tiktok.com',
  'https://analytics.twitter.com',
  'https://*.ads-twitter.com',
];

/**
 * @param {{ dev?: boolean }} [options]
 * @returns {string} the policy string
 */
export function buildCsp({ dev = false } = {}) {
  const directives = {
    'default-src': [SELF],

    'script-src': [
      SELF,
      "'unsafe-inline'",
      "'wasm-unsafe-eval'",
      // React Refresh and the Next dev overlay compile with eval(). Production does
      // not, so this must never leak into a deployed policy.
      ...(dev ? ["'unsafe-eval'"] : []),
      'https://accounts.google.com',
      'https://appleid.cdn-apple.com',
      'https://js.stripe.com',
      'https://js-cdn.music.apple.com',
      'https://cdn.jsdelivr.net',
      ...ANALYTICS_SCRIPT,
    ],

    'style-src': [SELF, "'unsafe-inline'", 'https://fonts.googleapis.com'],
    'font-src': [SELF, 'data:', 'https://fonts.gstatic.com'],
    'img-src': [SELF, 'data:', 'blob:', 'https:'],
    'media-src': [SELF, 'blob:', 'https:'],

    'connect-src': [
      SELF,
      'https://*.pxispace.com',
      'https://*.r2.cloudflarestorage.com',
      'https://accounts.google.com',
      'https://api.stripe.com',
      'https://js.stripe.com',
      'https://r.stripe.com',
      'https://api.geoapify.com',
      'https://formspree.io',
      'https://*.music.apple.com',
      'https://appleid.apple.com',
      'https://cdn.jsdelivr.net',
      // Next dev server HMR runs over a websocket on the dev origin.
      ...(dev ? ['ws:', 'wss:'] : []),
      ...ANALYTICS_CONNECT,
    ],

    'frame-src': [
      'https://open.spotify.com',
      'https://www.openstreetmap.org',
      'https://js.stripe.com',
      'https://hooks.stripe.com',
      'https://m.stripe.network',
      'https://accounts.google.com',
      'https://appleid.apple.com',
      'https://www.googletagmanager.com',
      'https://td.doubleclick.net',
      'https://www.facebook.com',
      'https://analytics.tiktok.com',
    ],

    'worker-src': [SELF, 'blob:'],
    'object-src': ["'none'"],
    'base-uri': [SELF],
    'form-action': [
      SELF,
      'https://appleid.apple.com',
      'https://accounts.spotify.com',
      'https://checkout.stripe.com',
    ],
    'frame-ancestors': ["'none'"],
  };

  const serialised = Object.entries(directives)
    .map(([name, values]) => `${name} ${values.join(' ')}`)
    .join('; ');

  // Only meaningful over https; harmless locally but pointless, and it makes a
  // local http page try to upgrade its own asset requests.
  return dev ? serialised : `${serialised}; upgrade-insecure-requests`;
}

/**
 * Report-only is the safe first deploy. Enforcement is the default so that
 * forgetting to flip a switch fails SECURE rather than silently permissive.
 */
export function cspHeaderName() {
  return process.env.CSP_REPORT_ONLY === '1'
    ? 'Content-Security-Policy-Report-Only'
    : 'Content-Security-Policy';
}
