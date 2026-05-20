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
export async function purchaseTicket(eventId, tierId) {
  return api.post('/api/tickets/purchase', {
    eventId,
    ...(tierId ? { tierId } : {}),
  });
}

/**
 * Create a Stripe Checkout Session for a paid ticket. Returns { url } to open in a new tab.
 * POST /api/tickets/checkout-session (auth required)
 * @param {string} eventId
 * @param {string} successUrl - e.g. `${origin}/events?payment=success`
 * @param {string} cancelUrl - e.g. `${origin}/events?payment=cancelled`
 */
export async function createCheckoutSession(eventId, successUrl, cancelUrl, tierId) {
  return api.post('/api/tickets/checkout-session', {
    eventId,
    successUrl,
    cancelUrl,
    ...(tierId ? { tierId } : {}),
  });
}

/**
 * Generate a free ticket for an event.
 * POST /api/tickets/generate
 */
export async function generateTicket(userId, eventId) {
  const data = await api.post('/api/tickets/generate', { userId, eventId });
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

// ─── Ticket Delivery: email + Apple/Google Wallet ────────────────────────────

/**
 * GET /api/tickets/:id/delivery-options
 * Returns `{ email, appleWallet, googleWallet }` availability flags so the UI
 * knows which buttons to render (Apple/Google return `available: false` when
 * the backend env isn't configured).
 */
export async function getTicketDeliveryOptions(ticketId) {
  return api.get(`/api/tickets/${ticketId}/delivery-options`);
}

/**
 * POST /api/tickets/:id/email
 * Send (or resend) the ticket email. Optional `to` override sends to a
 * different address than the account email.
 */
export async function sendTicketEmail(ticketId, toOverride) {
  return api.post(`/api/tickets/${ticketId}/email`, toOverride ? { to: toOverride } : {});
}

/**
 * Apple Wallet add-URL — auth-bearing fetch returns a `.pkpass` blob.
 * Use as an object URL so browsers route to Wallet via the MIME type.
 */
export async function downloadAppleWalletPass(ticketId) {
  const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('pxi_token') : null;
  const res = await fetch(`${BASE_URL}/api/tickets/${ticketId}/apple-wallet`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const err = new Error(data.error || `Apple Wallet pass failed (${res.status})`);
    err.status = res.status;
    err.code = data.code;
    throw err;
  }
  const blob = await res.blob();
  return blob;
}

/**
 * GET /api/tickets/:id/google-wallet
 * Returns `{ saveUrl }` — open in a new tab / window.location to add to Google Wallet.
 */
export async function getGoogleWalletSaveUrl(ticketId) {
  return api.get(`/api/tickets/${ticketId}/google-wallet`);
}
