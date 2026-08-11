/**
 * Meta / TikTok / X advertising pixels.
 *
 * WHY THIS EXISTS
 * The site carried Google tags only. Google remarketing can follow someone around the
 * Display network and YouTube, but it cannot put an ad in front of them on Instagram,
 * Facebook or TikTok — those inventories are sold by Meta and TikTok and are only
 * addressable from their own pixels. "Someone read our ticketing page, then saw a PXI
 * ad on Instagram" was not a configuration gap; there was no mechanism for it at all.
 *
 * DESIGN RULES (same as the Google tag)
 *   - FAIL CLOSED. No id in env => that network's script is never injected. There is no
 *     hardcoded fallback id: a wrong pixel id silently trains a stranger's audience.
 *   - CONSENT FIRST. These are advertising cookies in the plainest sense. Nothing is
 *     injected until `isTrackingAllowed()` is true, which is denial-binding in every
 *     region, honours GPC, and is the same single gate the Google tag obeys.
 *   - ONE TAXONOMY. Callers never touch `fbq`/`ttq`/`twq`. They call `track()` in
 *     lib/analytics.js and the fan-out happens here, so a funnel step cannot exist in
 *     GA4 but be missing from Meta.
 *   - NO PII. Advanced Matching is deliberately NOT enabled. Meta accepts hashed email,
 *     but the brief's rule is that no personally identifying value leaves the client for
 *     an ad network, and Meta's SDK hashes in-page rather than accepting our own digest.
 */

import { isTrackingAllowed } from '@/lib/consent';

const META_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const TIKTOK_ID = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID;
const X_ID = process.env.NEXT_PUBLIC_X_PIXEL_ID;

// Pixel ids are interpolated into a <script> body, so they are pattern-checked first.
const ID_PATTERN = /^[A-Za-z0-9_-]{4,32}$/;
const safeId = (v) => (typeof v === 'string' && ID_PATTERN.test(v) ? v : null);

export const META_PIXEL_ID = safeId(META_ID);
export const TIKTOK_PIXEL_ID = safeId(TIKTOK_ID);
export const X_PIXEL_ID = safeId(X_ID);

export const anySocialPixelConfigured = Boolean(META_PIXEL_ID || TIKTOK_PIXEL_ID || X_PIXEL_ID);

/**
 * PXI event name -> each network's nearest standard event.
 *
 * Only standard names are used. Every network optimises delivery against its own
 * standard events; a custom name still records but the algorithm has nothing to bid
 * toward, which is the single most common reason social retargeting underperforms.
 *
 * `null` means "this network has no sensible standard equivalent" — the event is then
 * skipped for that network rather than mapped onto something misleading.
 */
const EVENT_MAP = {
  page_view: { meta: 'PageView', tiktok: 'Pageview', x: 'PageView' },
  view_item: { meta: 'ViewContent', tiktok: 'ViewContent', x: 'ContentView' },
  view_item_list: { meta: 'ViewContent', tiktok: 'ViewContent', x: null },
  search: { meta: 'Search', tiktok: 'Search', x: 'Search' },
  add_to_cart: { meta: 'AddToCart', tiktok: 'AddToCart', x: 'AddToCart' },
  begin_checkout: { meta: 'InitiateCheckout', tiktok: 'InitiateCheckout', x: 'Checkout' },
  add_payment_info: { meta: 'AddPaymentInfo', tiktok: 'AddPaymentInfo', x: null },
  purchase: { meta: 'Purchase', tiktok: 'CompletePayment', x: 'Purchase' },
  sign_up: { meta: 'CompleteRegistration', tiktok: 'CompleteRegistration', x: 'SignUp' },
  join_event: { meta: 'Schedule', tiktok: 'SubmitForm', x: null },
  host_lead: { meta: 'Lead', tiktok: 'SubmitForm', x: 'Lead' },
  event_create_publish: { meta: 'SubmitApplication', tiktok: 'CompleteRegistration', x: null },
  notification_opt_in: { meta: 'Subscribe', tiktok: 'Subscribe', x: null },
};

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
};

/**
 * Seeded by the injector so the very first navigation does not re-fire the PageView the
 * base snippet already sent.
 */
let lastPageViewUrl = null;

/**
 * Must produce the same string PageViewTracker passes in (`pathname` + `?search`), or
 * the "already fired for this URL" comparison never matches and every landing page
 * reports twice.
 */
function currentUrl() {
  if (typeof window === 'undefined') return '';
  const { pathname = '', search = '' } = window.location ?? {};
  return search ? `${pathname}${search}` : pathname;
}

/**
 * Fire a PageView on a client-side route change.
 *
 * WHY THIS IS NOT OPTIONAL
 * Both networks build their URL-based Custom Audiences ("everyone who viewed
 * /event/*") out of PageView events and the URL attached to them. The base pixel
 * snippet fires exactly one PageView, on injection. This site is an App Router SPA,
 * so after the first paint every subsequent navigation is client-side — meaning Meta
 * and TikTok would have seen the landing URL and nothing else, for the entire session.
 *
 * The practical effect was that the retargeting pool could only ever contain people
 * who arrived directly on a page, and browsing ten events looked identical to bouncing.
 * That is precisely the audience this whole layer exists to build.
 *
 * Kept out of `mirrorToSocialPixels` on purpose: web's `trackPageView` talks to gtag
 * directly rather than going through `track()`, so there is no shared path to hook.
 *
 * @param {string} [url] the URL now showing — read from `location` when omitted
 */
export function mirrorPageViewToSocialPixels(url) {
  if (typeof window === 'undefined') return;
  if (!isTrackingAllowed()) return;
  // The injector already fired one PageView for the URL it loaded on. Firing again for
  // the same URL would double every landing page in Meta's reporting.
  const here = url || currentUrl();
  if (here && here === lastPageViewUrl) return;
  lastPageViewUrl = here;

  try {
    if (typeof window.fbq === 'function') window.fbq('track', 'PageView');
  } catch { /* never let an ad pixel break navigation */ }

  try {
    if (typeof window.ttq?.page === 'function') window.ttq.page();
  } catch { /* ignore */ }

  // X is deliberately absent: uwt.js counts a page view off `twq('config')` itself and
  // has no documented SPA re-fire, so calling one would either no-op or double-count.
}

/** Called by SocialPixels.jsx immediately after injection. */
export function notePixelInjectionUrl(url) {
  lastPageViewUrl = url ?? (typeof window !== 'undefined' ? window.location?.pathname ?? null : null);
}

/** Shape GA4-style params into the value/currency/content triple every network expects. */
function commerce(params = {}) {
  const value = num(params.value);
  const ids = Array.isArray(params.items)
    ? params.items.map((i) => i?.item_id).filter(Boolean).slice(0, 10)
    : [params.item_id].filter(Boolean);
  return { value, currency: value !== undefined ? params.currency || 'USD' : undefined, ids };
}

/**
 * Mirror one PXI event to every configured social pixel.
 * Never throws: an ad pixel failing must not break the page or the GA4 hit.
 * @param {string} eventName snake_case name from EVENTS
 * @param {Record<string, unknown>} [params]
 */
export function mirrorToSocialPixels(eventName, params = {}) {
  if (typeof window === 'undefined') return;
  const map = EVENT_MAP[eventName];
  if (!map) return;
  // Re-checked per event, not just at load: consent can be withdrawn mid-session.
  if (!isTrackingAllowed()) return;

  const { value, currency, ids } = commerce(params);

  try {
    if (map.meta && typeof window.fbq === 'function') {
      window.fbq('track', map.meta, {
        ...(value !== undefined ? { value, currency } : {}),
        ...(ids.length ? { content_ids: ids, content_type: 'product' } : {}),
        ...(params.search_term ? { search_string: String(params.search_term).slice(0, 100) } : {}),
      });
    }
  } catch { /* never let an ad pixel break the page */ }

  try {
    if (map.tiktok && typeof window.ttq?.track === 'function') {
      window.ttq.track(map.tiktok, {
        ...(value !== undefined ? { value, currency } : {}),
        ...(ids.length ? { contents: ids.map((id) => ({ content_id: id, content_type: 'product' })) } : {}),
        ...(params.search_term ? { query: String(params.search_term).slice(0, 100) } : {}),
      });
    }
  } catch { /* ignore */ }

  try {
    if (map.x && typeof window.twq === 'function') {
      window.twq('event', map.x, {
        ...(value !== undefined ? { value, currency } : {}),
        ...(ids.length ? { contents: ids.map((id) => ({ content_id: id })) } : {}),
      });
    }
  } catch { /* ignore */ }
}
