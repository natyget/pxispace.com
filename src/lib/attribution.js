'use client';

// First-party campaign attribution: capture utm params / ad click ids /
// referrer on landing, persist first-touch (write-once) + last-touch
// (overwritten per campaign visit), and hand the pair to signup so it lands
// on User.signupAttribution in the backend. Fail-silent everywhere.
//
// CONSENT: this is a marketing cookie, not a necessary one — it stores gclid /
// fbclid / ttclid for 90 days. It used to be written on every page load, which
// meant an EEA visitor who pressed "Reject all" still got an ad-click id
// persisted to their device. Every write now goes through isTrackingAllowed(),
// and a denial clears what was already stored (see forgetNonEssentialStorage).

import { isTrackingAllowed } from './consent';

const STORAGE_KEY = 'pxi_attribution';
const COOKIE_NAME = 'pxi_attribution';
const COOKIE_MAX_AGE_DAYS = 90;
// One key per network we can buy a click from. A click id we fail to capture on landing
// cannot be recovered later, so the conversion is permanently unattributable to the ad
// that paid for it.
//
// gbraid/wbraid are not optional extras: on iOS, when ATT denies the IDFA, Google Ads
// stops sending `gclid` and sends one of these instead. Capturing only `gclid` therefore
// loses attribution for a large share of iPhone ad traffic — which for an events app is
// most of it.
//
// MUST stay in lockstep with CLICK_ID_KEYS in pxi-mobile-app/src/lib/attribution.ts and
// with TOUCH_KEYS in PXIStudio-App/src/lib/signupAttribution.ts (a server-side whitelist
// that silently drops anything it does not name).
const CLICK_ID_KEYS = ['gclid', 'gbraid', 'wbraid', 'fbclid', 'ttclid', 'twclid', 'msclkid'];
const PARAM_KEYS = [
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_term',
    'utm_content',
    ...CLICK_ID_KEYS,
];

function readStored() {
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function persist(data) {
    try {
        const json = JSON.stringify(data);
        window.localStorage.setItem(STORAGE_KEY, json);
        document.cookie = `${COOKIE_NAME}=${encodeURIComponent(json)}; path=/; max-age=${COOKIE_MAX_AGE_DAYS * 86400}; SameSite=Lax`;
    } catch {
        /* ignore */
    }
}

function buildTouch() {
    const params = new URLSearchParams(window.location.search);
    const touch = {};
    for (const key of PARAM_KEYS) {
        const value = params.get(key);
        if (value) touch[key] = value.slice(0, 500);
    }
    // Only count external referrers — internal navigation isn't a "touch".
    const referrer = document.referrer;
    if (referrer && !referrer.startsWith(window.location.origin)) {
        touch.referrer = referrer.slice(0, 500);
    }
    if (Object.keys(touch).length === 0) return null;
    touch.landing_page = window.location.pathname.slice(0, 500);
    touch.ts = new Date().toISOString();
    return touch;
}

/**
 * Call once per page load (AnalyticsProvider mount). Records a touch only
 * when the visit actually carries campaign signals (params or external ref).
 */
export function captureAttribution() {
    try {
        if (typeof window === 'undefined') return;
        // Re-checked on every call, not cached: the visitor may accept partway
        // through the session, and the next navigation should then capture.
        if (!isTrackingAllowed()) return;
        const touch = buildTouch();
        if (!touch) return;
        const stored = readStored() ?? {};
        persist({
            first: stored.first ?? touch,
            last: touch,
        });
    } catch {
        /* ignore */
    }
}

/** { first?, last? } for the signup payload, or null when nothing captured. */
export function getAttribution() {
    try {
        if (typeof window === 'undefined') return null;
        const stored = readStored();
        if (!stored || (!stored.first && !stored.last)) return null;
        return stored;
    } catch {
        return null;
    }
}
