/**
 * Diplomat night helpers for the public event page: the referral code a visitor arrived with (kept in a cookie for
 * 30 days, per night) and whether every paid tier of a night is sold out.
 */

const CODE = /^[a-z0-9]{6}$/;
const EVENT_ID = /^[A-Za-z0-9_-]+$/;
const REF_MAX_AGE = 60 * 60 * 24 * 30;
const refCookie = (eventId) => `pxi_ref_${eventId}`;

/** The value of a cookie, or '' when it is absent or there is no document (on the server). */
function readCookie(name) {
  if (typeof document === 'undefined') return '';
  try {
    const prefix = `${name}=`;
    const hit = document.cookie.split('; ').find((part) => part.startsWith(prefix));
    return hit ? hit.slice(prefix.length) : '';
  } catch {
    return '';
  }
}

/**
 * Keep `?ref=<code>` for this night for 30 days; a new code replaces the old one. True when the code is new (the
 * cookie is absent or holds another code), which is when the click is counted once.
 */
export function rememberEventRef(eventId, code) {
  if (!CODE.test(code || '') || !EVENT_ID.test(eventId || '')) return false;
  if (readCookie(refCookie(eventId)) === code) return false;
  try {
    const secure = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${refCookie(eventId)}=${code}; Max-Age=${REF_MAX_AGE}; Path=/; SameSite=Lax${secure}`;
  } catch {
    // Cookies blocked: the click is still counted, as it was before.
  }
  return true;
}

/** The referral code this visitor arrived with for a night (within 30 days), or '' (also '' on the server). */
export function readEventRef(eventId) {
  if (!EVENT_ID.test(eventId || '')) return '';
  const code = readCookie(refCookie(eventId));
  return CODE.test(code) ? code : '';
}

/** Sold out: the night has paid tiers and the API marks every one of them soldOut. */
export function isNightSoldOut(event) {
  const tiers = Array.isArray(event?.ticketTiersJson) ? event.ticketTiersJson : [];
  return tiers.length > 0 && tiers.every((tier) => tier?.soldOut === true);
}
