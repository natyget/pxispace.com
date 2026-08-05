/**
 * Region-scoped Consent Mode v2 — the ONE place the web app decides whether a
 * visitor sits in a jurisdiction that requires opt-in before Google's ad and
 * analytics storage may be used.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * The defaults themselves are declared inline in AnalyticsScripts.jsx, BEFORE
 * the Google tag loads (a consent default that runs after gtag.js is worthless).
 * This module owns two things the inline script cannot:
 *
 *   1. RESTRICTED_REGIONS — the ISO-3166-1 alpha-2 list, serialised into that
 *      inline `gtag('consent','default',{ …denied…, region:[…] })` call.
 *   2. Client-side region detection + the persisted user choice, so
 *      ConsentBanner knows whether to render and enhancedConversions.js knows
 *      whether it is allowed to hash a user's email.
 *
 * Everywhere OUTSIDE the restricted list the unscoped default is 'granted', so
 * a US visitor sees no banner and loses no data — `isRestrictedRegion()`
 * returns false and every consent check short-circuits to true.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * There is no server geo signal available on this deployment: middleware.ts
 * only matches /dashboard, and Next 16 removed NextRequest.geo. Detection is
 * therefore client-side and best-effort — IANA time zone first (stable, not
 * user-set in practice), navigator.language only as a weak tiebreaker and only
 * when the time zone is European-or-unknown, so a US visitor running a German
 * browser is never mislabelled.
 */

/**
 * The 27 EU member states + the 3 non-EU EEA states (IS, LI, NO) + the UK and
 * Switzerland. GDPR / UK GDPR / Swiss FADP all require opt-in for the storage
 * that Consent Mode gates. Keep alphabetical inside each group.
 */
export const RESTRICTED_REGIONS = [
    // EU-27
    'AT', 'BE', 'BG', 'CY', 'CZ', 'DE', 'DK', 'EE', 'ES', 'FI', 'FR', 'GR',
    'HR', 'HU', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT', 'NL', 'PL', 'PT', 'RO',
    'SE', 'SI', 'SK',
    // EEA, non-EU
    'IS', 'LI', 'NO',
    // UK GDPR + Swiss FADP
    'CH', 'GB',
];

const RESTRICTED_SET = new Set(RESTRICTED_REGIONS);

/**
 * IANA time zone → ISO country, restricted regions ONLY. An unlisted zone is
 * not automatically "safe" — see `isRestrictedRegion` for the ambiguity rule.
 * Crown dependencies (Jersey/Guernsey/Isle of Man) map to GB: their data-
 * protection law mirrors UK GDPR, so failing safe costs nothing.
 */
const TZ_TO_COUNTRY = {
    'Europe/Vienna': 'AT',
    'Europe/Brussels': 'BE',
    'Europe/Sofia': 'BG',
    'Europe/Nicosia': 'CY',
    'Asia/Nicosia': 'CY',
    'Asia/Famagusta': 'CY',
    'Europe/Prague': 'CZ',
    'Europe/Berlin': 'DE',
    'Europe/Busingen': 'DE',
    'Europe/Copenhagen': 'DK',
    'Europe/Tallinn': 'EE',
    'Europe/Madrid': 'ES',
    'Africa/Ceuta': 'ES',
    'Atlantic/Canary': 'ES',
    'Europe/Helsinki': 'FI',
    'Europe/Mariehamn': 'FI',
    'Europe/Paris': 'FR',
    'Europe/Athens': 'GR',
    'Europe/Zagreb': 'HR',
    'Europe/Budapest': 'HU',
    'Europe/Dublin': 'IE',
    'Europe/Rome': 'IT',
    'Europe/Vilnius': 'LT',
    'Europe/Luxembourg': 'LU',
    'Europe/Riga': 'LV',
    'Europe/Malta': 'MT',
    'Europe/Amsterdam': 'NL',
    'Europe/Warsaw': 'PL',
    'Europe/Lisbon': 'PT',
    'Atlantic/Madeira': 'PT',
    'Atlantic/Azores': 'PT',
    'Europe/Bucharest': 'RO',
    'Europe/Stockholm': 'SE',
    'Europe/Ljubljana': 'SI',
    'Europe/Bratislava': 'SK',
    'Atlantic/Reykjavik': 'IS',
    'Europe/Vaduz': 'LI',
    'Europe/Oslo': 'NO',
    'Arctic/Longyearbyen': 'NO',
    'Europe/Zurich': 'CH',
    'Europe/London': 'GB',
    'Europe/Belfast': 'GB',
    'Europe/Guernsey': 'GB',
    'Europe/Jersey': 'GB',
    'Europe/Isle_of_Man': 'GB',
};

/** Zone prefixes that can plausibly contain a restricted country we did not map. */
const AMBIGUOUS_TZ_PREFIXES = ['Europe/', 'Atlantic/', 'Arctic/'];

export const CONSENT_STORAGE_KEY = 'pxi_consent_v2';

/** Consent Mode v2 signal set — everything Google gates. */
export const CONSENT_GRANTED = Object.freeze({
    ad_storage: 'granted',
    ad_user_data: 'granted',
    ad_personalization: 'granted',
    analytics_storage: 'granted',
});

export const CONSENT_DENIED = Object.freeze({
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
});

function readLanguageRegion() {
    try {
        const tag = typeof navigator !== 'undefined' ? navigator.language : '';
        if (!tag) return null;
        // Intl.Locale is everywhere we support; the regex is the paranoia path.
        if (typeof Intl !== 'undefined' && typeof Intl.Locale === 'function') {
            const region = new Intl.Locale(tag).region;
            if (region) return String(region).toUpperCase();
        }
        const match = /^[a-z]{2,3}[-_]([A-Za-z]{2})\b/.exec(tag);
        return match ? match[1].toUpperCase() : null;
    } catch {
        return null;
    }
}

/**
 * Resolved ISO country for the visitor, or null when we genuinely cannot tell.
 * Exported mostly so the banner copy and any future debugging can show it.
 * @returns {string|null}
 */
export function detectRegion() {
    try {
        if (typeof window === 'undefined') return null;
        let timeZone = '';
        try {
            timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
        } catch {
            timeZone = '';
        }

        const mapped = TZ_TO_COUNTRY[timeZone];
        if (mapped) return mapped;

        // A known non-European zone is a hard "not restricted": do NOT let a
        // German-language browser in Chicago trigger the banner.
        const ambiguous =
            !timeZone || AMBIGUOUS_TZ_PREFIXES.some((prefix) => timeZone.startsWith(prefix));
        if (!ambiguous) return null;

        return readLanguageRegion();
    } catch {
        return null;
    }
}

/**
 * True when the visitor looks like they are in the EEA / UK / CH, i.e. the
 * region-scoped 'denied' default applies to them and a banner is required.
 * Always false during SSR and always false for the US.
 */
export function isRestrictedRegion() {
    const region = detectRegion();
    return Boolean(region && RESTRICTED_SET.has(region));
}

/**
 * The visitor's persisted answer.
 * @returns {'granted'|'denied'|null} null = never asked.
 */
export function readConsentChoice() {
    try {
        if (typeof window === 'undefined') return null;
        const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return parsed?.status === 'granted' || parsed?.status === 'denied' ? parsed.status : null;
    } catch {
        return null;
    }
}

/** @param {'granted'|'denied'} status */
export function writeConsentChoice(status) {
    try {
        if (typeof window === 'undefined') return;
        window.localStorage.setItem(
            CONSENT_STORAGE_KEY,
            JSON.stringify({ status, ts: new Date().toISOString() }),
        );
    } catch {
        /* private mode / quota — the banner just asks again next visit */
    }
}

/**
 * Push a Consent Mode v2 update. Safe to call before gtag.js finishes loading —
 * the inline bootstrap defines window.gtag as a dataLayer shim, so the update
 * queues and replays in order.
 * @param {'granted'|'denied'} status
 */
export function updateGoogleConsent(status) {
    try {
        if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
        window.gtag('consent', 'update', status === 'granted' ? { ...CONSENT_GRANTED } : { ...CONSENT_DENIED });
    } catch {
        /* never throw from consent plumbing */
    }
}

/** Re-apply a previously stored choice on a cold load (defaults start denied). */
export function replayStoredConsent() {
    const stored = readConsentChoice();
    if (stored) updateGoogleConsent(stored);
    return stored;
}

/** Banner renders only for an un-answered visitor inside a restricted region. */
export function needsConsentBanner() {
    return isRestrictedRegion() && readConsentChoice() === null;
}

/**
 * Whether we are allowed to send hashed first-party identifiers to Google
 * (enhanced conversions). Outside restricted regions the unscoped default is
 * 'granted', so this is true without any interaction.
 */
export function hasAdUserDataConsent() {
    if (typeof window === 'undefined') return false;
    if (!isRestrictedRegion()) return true;
    return readConsentChoice() === 'granted';
}
