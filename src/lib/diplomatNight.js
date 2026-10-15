/**
 * Diplomat night helpers for the public event page: the referral code a visitor arrived with (kept for the
 * browser session, per night) and whether every paid tier of a night is sold out.
 */

const CODE = /^[a-z0-9]{6}$/;
const refKey = (eventId) => `pxi_ref_${eventId}`;

/**
 * Keep `?ref=<code>` for this night for the session. True when the code is new for the session, which is
 * when the click is counted once.
 */
export function rememberEventRef(eventId, code) {
  if (!CODE.test(code || '')) return false;
  try {
    if (sessionStorage.getItem(refKey(eventId)) === code) return false;
    sessionStorage.setItem(refKey(eventId), code);
    return true;
  } catch {
    return true;
  }
}

/** The referral code this session arrived with for a night, or '' (also '' on the server). */
export function readEventRef(eventId) {
  if (typeof window === 'undefined') return '';
  try {
    return sessionStorage.getItem(refKey(eventId)) || '';
  } catch {
    return '';
  }
}

/** Sold out: the night has paid tiers and the API marks every one of them soldOut. */
export function isNightSoldOut(event) {
  const tiers = Array.isArray(event?.ticketTiersJson) ? event.ticketTiersJson : [];
  return tiers.length > 0 && tiers.every((tier) => tier?.soldOut === true);
}
