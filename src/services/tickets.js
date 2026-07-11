import { api } from './api';

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
