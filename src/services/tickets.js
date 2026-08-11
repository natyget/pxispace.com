import { api } from './api';
import { getGaIds } from '@/lib/analytics';
import { getAttribution } from '@/lib/attribution';
import { isTrackingAllowed } from '@/lib/consent';

/** GA client/session ids rider — lets the backend fire the server-side GA4
 *  `purchase` from the Stripe webhook, attributed to this browser session.
 *  getGaIds resolves nulls fast when analytics is off/blocked.
 *
 *  gaPlatform is sent UNCONDITIONALLY. It is what tells the backend which
 *  Measurement Protocol target (web vs app) to dispatch to, so hanging it off
 *  `clientId` meant a hit that resolved only a gaSessionId had no target: the
 *  webhook silently dropped the purchase with no error on either side. */
async function gaCheckoutFields() {
  const { clientId, sessionId } = await getGaIds();
  return {
    gaPlatform: 'web',
    ...(clientId ? { gaClientId: clientId } : {}),
    ...(sessionId ? { gaSessionId: sessionId } : {}),
  };
}

/** Read a cookie by name; '' when absent or unreadable. */
function cookie(name) {
  try {
    const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : '';
  } catch {
    return '';
  }
}

/**
 * Rider for the SERVER-SIDE Meta / TikTok conversions fired from the Stripe webhook.
 *
 * Two jobs, both load-bearing:
 *
 * 1. CONSENT. The webhook runs on a server that cannot see the browser's consent
 *    choice, so without this it would send a conversion for someone who opted out —
 *    which our Cookie Policy promises we do not do, and which is a CPRA "sharing"
 *    violation. `adConsent` is the browser's answer, carried through Stripe metadata
 *    the same way the GA ids already are. The backend treats anything other than '1'
 *    as a refusal, so a missing value fails CLOSED.
 *
 * 2. MATCH QUALITY. Meta matches a server conversion to an ad click using `_fbc`
 *    (the click id cookie) and `_fbp` (the browser id cookie); TikTok uses `ttp` and
 *    `ttclid`. These live in first-party cookies written by the pixels and are simply
 *    not visible to the server. Sent without them, a conversion still lands but is
 *    largely unattributable — which defeats the point of sending it.
 */
function socialConversionFields() {
  try {
    if (!isTrackingAllowed()) return { adConsent: '0' };
    const fbc = cookie('_fbc');
    const fbp = cookie('_fbp');
    const ttp = cookie('_ttp');
    return {
      adConsent: '1',
      ...(fbc ? { fbc } : {}),
      ...(fbp ? { fbp } : {}),
      ...(ttp ? { ttp } : {}),
    };
  } catch {
    return { adConsent: '0' };
  }
}

const ATTRIBUTION_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  // Must match CLICK_ID_KEYS in src/lib/attribution.js — a key captured on landing
  // but omitted here never reaches the backend's signupAttribution/conversion path.
  'gclid',
  'gbraid',
  'wbraid',
  'fbclid',
  'ttclid',
  'twclid',
  'msclkid',
];

/** Last-touch campaign rider (falls back to first-touch), flattened one level so
 *  the backend can pass it straight into Stripe metadata, which is flat
 *  key/value only. Values are capped to stay inside Stripe's metadata limits. */
function attributionFields() {
  try {
    const stored = getAttribution();
    const touch = stored?.last ?? stored?.first;
    if (!touch) return {};
    const out = {};
    for (const key of ATTRIBUTION_KEYS) {
      const value = touch[key];
      if (typeof value === 'string' && value) out[key] = value.slice(0, 200);
    }
    return out;
  } catch {
    return {};
  }
}

/**
 * Get ticket quote (total for buyer = ticket + service fee + processing fee) for display in EULA.
 * GET /api/tickets/quote?eventId= or ?albumId=
 * @returns {Promise<{ ticketPriceUsd, serviceFeeUsd, processingFeeUsd, totalForBuyerUsd }>}
 */
export async function getTicketQuote(eventId, albumId, tierId) {
  const q = new URLSearchParams();
  if (eventId) q.set('eventId', eventId);
  else if (albumId) q.set('albumId', albumId);
  if (tierId) q.set('tierId', tierId);
  return api.get(`/api/tickets/quote?${q}`);
}

/**
 * Create a PaymentIntent for a paid ticket. Returns clientSecret for Stripe.
 * POST /api/tickets/purchase (auth required)
 */
export async function purchaseTicket(eventId, tierId, opts = {}) {
  return api.post('/api/tickets/purchase', {
    eventId,
    ...(tierId ? { tierId } : {}),
    ...(opts.applyCredits ? { applyCredits: true } : {}),
    ...(opts.promoCode ? { promoCode: opts.promoCode } : {}),
    ...(opts.emailOptIn ? { emailOptIn: true } : {}),
    ...(opts.smsOptIn ? { smsOptIn: true } : {}),
    ...(await gaCheckoutFields()),
    ...socialConversionFields(),
    ...attributionFields(),
  });
}

/**
 * Create a Stripe Checkout Session for a paid ticket. Returns { url } to open in a new tab.
 * POST /api/tickets/checkout-session (auth required)
 * @param {string} eventId
 * @param {string} successUrl - e.g. `${origin}/events?payment=success`
 * @param {string} cancelUrl - e.g. `${origin}/events?payment=cancelled`
 */
export async function createCheckoutSession(eventId, successUrl, cancelUrl, tierId, opts = {}) {
  return api.post('/api/tickets/checkout-session', {
    eventId,
    successUrl,
    cancelUrl,
    ...(tierId ? { tierId } : {}),
    ...(opts.applyCredits ? { applyCredits: true } : {}),
    ...(opts.promoCode ? { promoCode: opts.promoCode } : {}),
    ...(opts.emailOptIn ? { emailOptIn: true } : {}),
    ...(opts.smsOptIn ? { smsOptIn: true } : {}),
    ...(await gaCheckoutFields()),
    ...socialConversionFields(),
    ...attributionFields(),
  });
}

/** GET /api/promos/credits — the caller's credit balance + recent ledger. */
export async function getMyCredits() {
  return api.get('/api/promos/credits');
}

/**
 * Generate a free ticket for an event.
 * POST /api/tickets/generate
 */
export async function generateTicket(userId, eventId, opts = {}) {
  const data = await api.post('/api/tickets/generate', {
    userId,
    eventId,
    ...(opts.emailOptIn ? { emailOptIn: true } : {}),
    ...(opts.smsOptIn ? { smsOptIn: true } : {}),
    // Free RSVPs fire the authoritative `join_event` server-side; without these
    // ids the backend has no Measurement Protocol target and skips the hit.
    ...(await gaCheckoutFields()),
    ...socialConversionFields(),
  });
  return data;
}

/**
 * Get all tickets for a user (for passport stamp display).
 * GET /api/tickets/user/:userId
 */
export async function getUserTickets(userId) {
  try {
    const data = await api.get(`/api/tickets/user/${userId}`);
    return data.tickets ?? [];
  } catch {
    return [];
  }
}

// ─── Ticket delivery ─────────────────────────────────────────────────────────
// Ticket emails are sent automatically on issue (free tickets on generate, paid
// via the Stripe webhook). These endpoints power wallet buttons + email resend;
// Apple/Google availability is env-gated server-side (hide buttons when false).

export function getTicketDeliveryOptions(ticketId) {
  return api.get(`/api/tickets/${ticketId}/delivery-options`);
}

export function resendTicketEmail(ticketId, toOverride) {
  return api.post(`/api/tickets/${ticketId}/email`, toOverride ? { to: toOverride } : {});
}

export function getGoogleWalletSaveUrl(ticketId) {
  return api.get(`/api/tickets/${ticketId}/google-wallet`);
}

/** Authenticated .pkpass download — fetch as blob and hand to the browser. */
export async function downloadApplePass(ticketId) {
  const token = typeof window !== 'undefined' ? window.localStorage.getItem('pxi_token') : null;
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';
  const res = await fetch(`${base}/api/tickets/${ticketId}/apple-wallet`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(`Pass download failed (${res.status})`);
  return res.blob();
}
