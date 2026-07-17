'use client';

// First-party campaign attribution: capture utm params / ad click ids /
// referrer on landing, persist first-touch (write-once) + last-touch
// (overwritten per campaign visit), and hand the pair to signup so it lands
// on User.signupAttribution in the backend. Fail-silent everywhere.

const STORAGE_KEY = 'pxi_attribution';
const COOKIE_NAME = 'pxi_attribution';
const COOKIE_MAX_AGE_DAYS = 90;
const PARAM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid', 'ttclid'];

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
