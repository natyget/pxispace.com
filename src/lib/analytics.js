'use client';

// GA4 event helper — the ONLY place web code talks to gtag/dataLayer.
// GA4 loads via the direct Google tag (AnalyticsScripts); GTM (when configured)
// rides alongside purely as a pixel container for future ad platforms.
// Every function is fail-silent (mirrors src/lib/adTracking.js): analytics must
// never break the page, and everything no-ops when the env ids are unset.

import { EVENTS } from './analyticsEvents';

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export const analyticsEnabled = Boolean(GA_ID);

function gtagSafe() {
    try {
        if (typeof window === 'undefined' || !GA_ID) return;
        window.dataLayer = window.dataLayer || [];
        // gtag.js consumes `arguments` objects — a plain array is ignored.
        // eslint-disable-next-line prefer-rest-params
        window.dataLayer.push(arguments);
    } catch {
        /* never throw from analytics */
    }
}

/**
 * Fire a GA4 event. Also mirrors a `{event, ...params}` object push so GTM
 * pixel triggers (Meta/TikTok/Ads tags added later in the container) can key
 * off the same event names without extra code changes.
 */
export function track(eventName, params = {}) {
    try {
        gtagSafe('event', eventName, params);
        if (typeof window !== 'undefined' && window.dataLayer) {
            window.dataLayer.push({ event: `pxi_${eventName}`, ...params });
        }
    } catch {
        /* ignore */
    }
}

export function trackPageView({ path, title } = {}) {
    gtagSafe('event', 'page_view', {
        page_location: typeof window !== 'undefined' ? window.location.href : undefined,
        page_path: path,
        page_title: title ?? (typeof document !== 'undefined' ? document.title : undefined),
    });
}

export function setUserId(userId) {
    if (!userId) return;
    gtagSafe('set', { user_id: String(userId) });
}

export function clearUserId() {
    gtagSafe('set', { user_id: null });
    gtagSafe('set', 'user_properties', { account_tier: null, city: null, is_vendor: null });
}

/** Low-cardinality only; never PII (see docs/analytics-taxonomy.md). */
export function setUserProperties(user) {
    if (!user) return;
    const props = {};
    if (user.accountTier) props.account_tier = String(user.accountTier);
    if (typeof user.isVendor === 'boolean') props.is_vendor = user.isVendor ? 'true' : 'false';
    if (typeof user.city === 'string' && user.city.length > 0 && user.city.length <= 40) {
        props.city = user.city;
    }
    if (Object.keys(props).length > 0) gtagSafe('set', 'user_properties', props);
}

/**
 * Resolve the GA client/session ids for server-side purchase attribution.
 * Resolves { clientId: null, sessionId: null } after `timeoutMs` if gtag is
 * absent or blocked — checkout must never wait on analytics.
 */
export function getGaIds(timeoutMs = 1500) {
    return new Promise((resolve) => {
        const result = { clientId: null, sessionId: null };
        if (typeof window === 'undefined' || !GA_ID || typeof window.gtag !== 'function') {
            resolve(result);
            return;
        }
        let settled = false;
        let pending = 2;
        const finish = () => {
            if (settled) return;
            settled = true;
            resolve(result);
        };
        const one = () => {
            pending -= 1;
            if (pending <= 0) finish();
        };
        try {
            window.gtag('get', GA_ID, 'client_id', (v) => {
                result.clientId = v ? String(v) : null;
                one();
            });
            window.gtag('get', GA_ID, 'session_id', (v) => {
                result.sessionId = v ? String(v) : null;
                one();
            });
        } catch {
            finish();
        }
        setTimeout(finish, timeoutMs);
    });
}

// ── Typed wrappers (canonical taxonomy) ─────────────────────────────────────

export function trackSignUp(method) {
    track(EVENTS.SIGN_UP, { method });
}

export function trackLogin(method) {
    track(EVENTS.LOGIN, { method });
}

export function trackViewItem({ id, name, priceUsd }) {
    track(EVENTS.VIEW_ITEM, {
        currency: 'USD',
        ...(Number.isFinite(priceUsd) ? { value: priceUsd } : {}),
        items: [{ item_id: id, item_name: name, item_category: 'event' }],
    });
}

export function trackBeginCheckout({ id, name, priceUsd }) {
    track(EVENTS.BEGIN_CHECKOUT, {
        currency: 'USD',
        ...(Number.isFinite(priceUsd) ? { value: priceUsd } : {}),
        items: [{ item_id: id, item_name: name, item_category: 'event' }],
    });
}

export function trackShare({ contentType, itemId, method }) {
    track(EVENTS.SHARE, { content_type: contentType, item_id: itemId, method });
}

export function trackJoinGroup(albumId) {
    track(EVENTS.JOIN_GROUP, { group_id: albumId });
}
