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

/**
 * Cookies this site sets that are NOT strictly necessary, and therefore must be
 * cleared the moment a visitor withdraws consent. Keeping a 90-day ad-click id
 * on the device of someone who just pressed "Reject all" is the exact thing
 * GDPR Art. 7(3) is about.
 *
 * `pxi_paseto` (session) is deliberately absent — it is strictly necessary and
 * only exists for a signed-in user who asked to be signed in.
 */
// Every non-essential cookie THIS SITE can cause to exist. Withdrawal has to remove
// what was already written, not merely stop future writes, so any tracker added to the
// site must add its cookies here and to the Cookie Policy in the same change.
//   _fbp/_fbc                       Meta pixel (browser id / click id)
//   _ttp/_tt_enable_cookie          TikTok pixel
//   personalization_id/muc_ads      X (Twitter) pixel
// Google's own (_ga, _gcl_au) are deliberately absent — Consent Mode's 'update' to
// denied governs those, and deleting them from JS is unreliable because the tag writes
// some of them on a parent domain.
const NON_ESSENTIAL_COOKIES = [
    'pxi_attribution',
    '_fbp',
    '_fbc',
    '_ttp',
    '_tt_enable_cookie',
    'personalization_id',
    'muc_ads',
];
const NON_ESSENTIAL_STORAGE_KEYS = ['pxi_attribution'];

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
    if (status === 'denied') forgetNonEssentialStorage();
    // Announce the DECISION, which is a different thing from the banner opening or
    // closing. Trackers that must not exist before permission (the Meta/TikTok/X
    // pixels) listen for this so a visitor who accepts starts being measured
    // immediately instead of only on their next page load.
    try {
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent(CONSENT_CHOICE_EVENT, { detail: { status } }));
        }
    } catch {
        /* never throw from consent plumbing */
    }
}

const CONSENT_CHOICE_EVENT = 'pxi:consent-choice';

/**
 * Subscribe to consent DECISIONS (granted/denied), not to the banner's visibility.
 * @param {(status: 'granted'|'denied') => void} listener
 * @returns {() => void} unsubscribe
 */
export function subscribeConsentChoice(listener) {
    if (typeof window === 'undefined') return () => {};
    const handler = (e) => listener(e?.detail?.status ?? readConsentChoice());
    window.addEventListener(CONSENT_CHOICE_EVENT, handler);
    return () => window.removeEventListener(CONSENT_CHOICE_EVENT, handler);
}

/**
 * Drop every non-essential cookie / storage key this site owns. Called on a
 * 'denied' answer so that withdrawing consent actually removes what was already
 * written, rather than only stopping future writes.
 *
 * Google's own cookies (_ga, _gcl_au) are not touched here: Consent Mode's
 * 'update' to denied is what governs them, and deleting them by hand from
 * JS is unreliable (some are set on a parent domain by the tag itself).
 */
export function forgetNonEssentialStorage() {
    try {
        if (typeof document !== 'undefined') {
            for (const name of NON_ESSENTIAL_COOKIES) {
                // Expire on the exact path it was written with (path=/).
                document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
            }
        }
        if (typeof window !== 'undefined') {
            for (const key of NON_ESSENTIAL_STORAGE_KEYS) {
                window.localStorage.removeItem(key);
            }
        }
    } catch {
        /* never throw from consent plumbing */
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

/**
 * Re-apply a previously stored choice on a cold load. Runs in EVERY region, not
 * just restricted ones: outside the EEA the default is 'granted', so a visitor
 * who opted out via the footer's Cookie settings would silently be re-granted
 * on their next page load if we only replayed inside restricted regions.
 */
export function replayStoredConsent() {
    const stored = readConsentChoice();
    if (stored) {
        updateGoogleConsent(stored);
        return stored;
    }
    // No stored answer, but the browser is broadcasting an opt-out: push the
    // denial to Google too, or GPC would only stop OUR cookies while Consent
    // Mode happily stayed 'granted' on its unscoped default.
    if (hasGlobalPrivacyControl()) {
        updateGoogleConsent('denied');
        return 'denied';
    }
    return null;
}

/** Banner auto-opens only for an un-answered visitor inside a restricted region. */
export function needsConsentBanner() {
    return isRestrictedRegion() && readConsentChoice() === null;
}

/**
 * The single predicate every non-essential tracker must consult before it
 * writes anything to the device.
 *
 *   - Restricted region: nothing is allowed until an explicit 'granted'.
 *   - Everywhere else: allowed by default (matching the unscoped Consent Mode
 *     default), but an explicit 'denied' is binding. That second clause is what
 *     makes the footer's "Cookie settings" opt-out real for a US visitor and is
 *     the mechanism behind the CCPA/CPRA opt-out right.
 */
export function isTrackingAllowed() {
    if (typeof window === 'undefined') return false;
    const stored = readConsentChoice();
    if (stored === 'denied') return false;
    // A browser-level opt-out signal is binding in California (CCPA/CPRA) and
    // several other states, and it outranks our own default — but NOT a later
    // explicit 'granted' made in the banner, which is the visitor overriding
    // their own browser on this specific site.
    if (stored !== 'granted' && hasGlobalPrivacyControl()) return false;
    if (isRestrictedRegion()) return stored === 'granted';
    return true;
}

/** True when the browser sends Global Privacy Control / legacy Do Not Track. */
export function hasGlobalPrivacyControl() {
    try {
        if (typeof navigator === 'undefined') return false;
        if (navigator.globalPrivacyControl === true) return true;
        // DNT is deprecated and inconsistently implemented, but an explicit
        // "1" is still an unambiguous statement of preference — honour it.
        return navigator.doNotTrack === '1' || window.doNotTrack === '1';
    } catch {
        return false;
    }
}

/**
 * Whether we are allowed to send hashed first-party identifiers to Google
 * (enhanced conversions).
 */
export function hasAdUserDataConsent() {
    return isTrackingAllowed();
}

// ── Consent preferences UI ──────────────────────────────────────────────────
// GDPR Art. 7(3): withdrawing consent must be as easy as giving it. The banner
// is the only consent surface we have, so it has to be re-openable on demand
// from anywhere in the app (the footer link). This is a 12-line external store
// rather than context so that a plain <button> in the footer can drive a
// component mounted somewhere else entirely in the tree.

// The open/closed flag lives on `window`, not in a module-scope `let`, and the
// notification is a real DOM event. The producer (Footer) and the consumer
// (ConsentBanner) are separate client entry points; if the bundler ever emits
// this module into two chunks, module-scope state would silently desync while a
// window event still reaches both. Cheap insurance for a control that must work.

const CONSENT_UI_EVENT = 'pxi:consent-ui';
const CONSENT_UI_FLAG = '__pxiConsentUiOpen';

function setConsentUi(open) {
    try {
        if (typeof window === 'undefined') return;
        window[CONSENT_UI_FLAG] = open;
        window.dispatchEvent(new Event(CONSENT_UI_EVENT));
    } catch {
        /* never throw from consent plumbing */
    }
}

/** Open the consent banner in "manage" mode, in ANY region. */
export const openConsentPreferences = () => setConsentUi(true);

export const closeConsentPreferences = () => setConsentUi(false);

export function subscribeConsentUi(listener) {
    if (typeof window === 'undefined') return () => {};
    window.addEventListener(CONSENT_UI_EVENT, listener);
    return () => window.removeEventListener(CONSENT_UI_EVENT, listener);
}

export const isConsentUiOpen = () =>
    typeof window !== 'undefined' && window[CONSENT_UI_FLAG] === true;
