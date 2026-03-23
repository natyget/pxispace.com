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
