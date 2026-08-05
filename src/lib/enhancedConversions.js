'use client';

/**
 * Google Ads enhanced conversions — hashed first-party identifiers.
 *
 * What this does: SHA-256 the visitor's email / phone IN THE BROWSER and hand
 * only the digests to gtag via `gtag('set','user_data', …)`. Google matches the
 * digest against its own hashed store to recover conversions that cookies miss.
 *
 * Hard invariants (do not relax any of these):
 *   - PLAINTEXT NEVER LEAVES. Only the hex SHA-256 digest is set.
 *   - Runs only when consent for `ad_user_data` is granted. In the EEA/UK/CH
 *     that means the visitor accepted the banner; everywhere else the unscoped
 *     Consent Mode default is 'granted' and this is a no-op check.
 *   - Requires crypto.subtle, which browsers expose only in a secure context.
 *     On plain http (local dev over LAN) this silently does nothing rather than
 *     falling back to a weaker hash or, worse, sending plaintext.
 *   - Fail-silent, returns a boolean so the caller can log/branch.
 *
 * Call it BEFORE the conversion it should enrich: purchase (i.e. just before
 * handing off to Stripe), sign_up, and host_lead.
 */

import { hasAdUserDataConsent } from './consent';

/** Google's normalisation: trim, lowercase. Gmail dots are NOT stripped — Google does that server-side. */
function normalizeEmail(email) {
    if (typeof email !== 'string') return null;
    const value = email.trim().toLowerCase();
    // Cheap sanity check — a malformed value only wastes a hash and pollutes matching.
    return value.includes('@') && value.length > 3 ? value : null;
}

/**
 * Google requires E.164: leading '+', country code, digits only, no spaces or
 * punctuation. Anything we cannot confidently coerce is skipped rather than
 * guessed — a wrong country code is a wrong match.
 */
function normalizePhone(phone) {
    if (typeof phone !== 'string') return null;
    const trimmed = phone.trim();
    if (!trimmed.startsWith('+')) return null;
    const digits = trimmed.slice(1).replace(/\D/g, '');
    if (digits.length < 8 || digits.length > 15) return null;
    return `+${digits}`;
}

function subtleAvailable() {
    return (
        typeof window !== 'undefined' &&
        typeof window.crypto !== 'undefined' &&
        typeof window.crypto.subtle !== 'undefined' &&
        typeof window.crypto.subtle.digest === 'function'
    );
}

/**
 * Hex SHA-256 — the encoding Google expects for enhanced conversions.
 * @param {string} value already normalised
 * @returns {Promise<string|null>}
 */
async function sha256Hex(value) {
    try {
        if (!subtleAvailable()) return null;
        const bytes = new TextEncoder().encode(value);
        const digest = await window.crypto.subtle.digest('SHA-256', bytes);
        return Array.from(new Uint8Array(digest))
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('');
    } catch {
        return null;
    }
}

/**
 * Hash and attach the visitor's identifiers for Google Ads enhanced conversions.
 *
 * @param {Object} input
 * @param {string} [input.email] plaintext; hashed here, never transmitted raw
 * @param {string} [input.phone] plaintext in E.164 ('+15551234567'); non-E.164 is skipped
 * @returns {Promise<boolean>} true only when at least one digest was set
 */
export async function setEnhancedConversionData({ email, phone } = {}) {
    try {
        if (typeof window === 'undefined') return false;
        if (typeof window.gtag !== 'function') return false;
        // Consent gate. Denied ad_user_data means we may not send identifiers at all.
        if (!hasAdUserDataConsent()) return false;
        // Non-secure context (http): crypto.subtle is undefined. Do nothing.
        if (!subtleAvailable()) return false;

        const normalizedEmail = normalizeEmail(email);
        const normalizedPhone = normalizePhone(phone);
        if (!normalizedEmail && !normalizedPhone) return false;

        const [emailHash, phoneHash] = await Promise.all([
            normalizedEmail ? sha256Hex(normalizedEmail) : Promise.resolve(null),
            normalizedPhone ? sha256Hex(normalizedPhone) : Promise.resolve(null),
        ]);
        if (!emailHash && !phoneHash) return false;

        const userData = {};
        if (emailHash) userData.sha256_email_address = emailHash;
        if (phoneHash) userData.sha256_phone_number = phoneHash;

        window.gtag('set', 'user_data', userData);
        return true;
    } catch {
        return false;
    }
}

/** Drop any previously set identifiers (logout, account switch). */
export function clearEnhancedConversionData() {
    try {
        if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
        window.gtag('set', 'user_data', {});
    } catch {
        /* ignore */
    }
}
