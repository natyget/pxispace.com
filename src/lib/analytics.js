'use client';

/**
 * THE shared typed tracking module for pxispace.com.
 *
 * Nothing else in the web app may call gtag() or push to dataLayer directly.
 * Every surface imports a wrapper from here, so the frozen GA4 taxonomy
 * (src/lib/analyticsEvents.js) has exactly one implementation and one place to
 * audit before a launch.
 *
 * Contract rules baked into this file:
 *   - Event names are the frozen snake_case strings. Wrappers never inline a
 *     literal; they read EVENTS.
 *   - Parameter keys are the 12 registered custom dimensions. Wrappers take
 *     camelCase JS input and map it to the exact snake_case GA4 keys.
 *   - `purchase` and `refund` are SERVER-ONLY (Measurement Protocol from the
 *     Stripe webhook, transaction_id = the Stripe payment id). There is
 *     deliberately no client wrapper — do not add one.
 *   - Fail closed: no env id, no tracking. No hardcoded fallback ids.
 *   - Fail silent: analytics must never throw into the page. Every exported
 *     function swallows its own errors.
 *   - Never send PII. Hashed identifiers go through
 *     src/lib/enhancedConversions.js and only with ad_user_data consent.
 */

import { EVENTS, CURRENCY, USER_TYPES } from './analyticsEvents';
import { accessTierOf, isVendorUser } from './accountTier';
import { clearEnhancedConversionData } from './enhancedConversions';
import { getOdysseyTierFromXp } from '@/utils/odysseyTier';

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const TAG_ID = process.env.NEXT_PUBLIC_GOOGLE_TAG_ID;

/**
 * True only when a Google tag can actually load AND a GA4 destination exists to
 * receive the hit. Fail closed — a missing env id means silence, never a
 * fallback id.
 */
export const analyticsEnabled = Boolean(TAG_ID && GA_ID);

// ── Low-level plumbing ──────────────────────────────────────────────────────

function gtagSafe() {
    try {
        if (typeof window === 'undefined' || !analyticsEnabled) return;
        window.dataLayer = window.dataLayer || [];
        // gtag.js consumes `arguments` objects specifically — pushing a plain
        // array is silently ignored, which is why this is a function
        // declaration and not an arrow.
        window.dataLayer.push(arguments);
    } catch {
        /* never throw from analytics */
    }
}

/**
 * Mirror the event into GTM under a NAMESPACED key so container triggers can
 * key off the same names without ecommerce `items[]` arrays leaking into GTM's
 * persistent data model (a stale items array silently corrupts the next
 * ecommerce hit). The `{ pxi: null }` reset before the push is Google's
 * documented pattern for exactly this.
 */
function mirrorToDataLayer(eventName, params) {
    try {
        if (typeof window === 'undefined' || !Array.isArray(window.dataLayer)) return;
        window.dataLayer.push({ pxi: null });
        window.dataLayer.push({ event: `pxi_${eventName}`, pxi: { ...params } });
    } catch {
        /* ignore */
    }
}

/** Drop undefined/null/'' so GA4 never receives empty registered dimensions. */
function compact(obj) {
    const out = {};
    for (const [key, value] of Object.entries(obj || {})) {
        if (value === undefined || value === null || value === '') continue;
        out[key] = value;
    }
    return out;
}

function num(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
}

function str(value, maxLength = 100) {
    if (value === undefined || value === null) return undefined;
    const s = String(value).trim();
    return s ? s.slice(0, maxLength) : undefined;
}

/**
 * Fire a GA4 event. Prefer a typed wrapper below; use this directly only for a
 * genuinely new event that has already been added to the frozen taxonomy.
 * @param {string} eventName snake_case name from EVENTS
 * @param {Record<string, unknown>} [params]
 */
export function track(eventName, params = {}) {
    try {
        const payload = compact(params);
        gtagSafe('event', eventName, payload);
        mirrorToDataLayer(eventName, payload);
    } catch {
        /* ignore */
    }
}

// ── Page views (SPA) ────────────────────────────────────────────────────────

// GA4 config runs with send_page_view:false and Enhanced Measurement "history
// events" must stay OFF in the GA4 UI — AnalyticsProvider owns page_view, and
// this module owns the referrer chain so a client-side navigation reports the
// page it came FROM, not the original document referrer.
let lastPageLocation = null;

/**
 * Fire exactly one page_view for the current URL.
 * @param {Object} [input]
 * @param {string} [input.path] path+query, used only to build a location during SSR-ish calls
 * @param {string} [input.title] defaults to document.title
 * @param {string} [input.referrer] override; defaults to the previous SPA URL, then document.referrer
 */
export function trackPageView({ path, title, referrer } = {}) {
    try {
        if (typeof window === 'undefined') return;
        const location = window.location.href || (path ? `${window.location.origin}${path}` : undefined);
        const previous =
            referrer ?? lastPageLocation ?? (typeof document !== 'undefined' ? document.referrer || undefined : undefined);

        gtagSafe(
            'event',
            'page_view',
            compact({
                page_location: location,
                page_title: title ?? (typeof document !== 'undefined' ? document.title : undefined),
                page_referrer: previous,
            }),
        );
        lastPageLocation = location ?? lastPageLocation;
    } catch {
        /* ignore */
    }
}

// ── Identity ────────────────────────────────────────────────────────────────

/**
 * GA4 user_id — the stable opaque INTERNAL user id, identical on web and app so
 * one person is one user. NEVER an email, phone, or anything else PII.
 * @param {string|number} userId
 */
export function setUserId(userId) {
    if (!userId) return;
    gtagSafe('set', { user_id: String(userId) });
}

/**
 * Clear the user_id, every user-scoped dimension, and any hashed enhanced-
 * conversion identifiers on logout. Dropping user_data matters on a shared
 * browser: a stale sha256_email_address would otherwise be attached to the NEXT
 * person's conversions.
 */
export function clearUserId() {
    gtagSafe('set', { user_id: null });
    gtagSafe('set', 'user_properties', {
        user_type: null,
        home_city: null,
        passport_level: null,
        spotify_connected: null,
    });
    clearEnhancedConversionData();
}

/**
 * Set the four registered USER-scoped custom dimensions. Pass the GA4 keys
 * directly — this is the low-level form. Most callers want
 * setUserPropertiesFromUser(user) instead.
 * @param {Object} props
 * @param {'attendee'|'host'|'promoter'|'both'} [props.user_type]
 * @param {string} [props.home_city]
 * @param {string} [props.passport_level] e.g. 'WANDERER' … 'ODYSSEY'
 * @param {boolean|'true'|'false'} [props.spotify_connected]
 */
export function setUserProperties(props) {
    if (!props) return;
    const payload = compact({
        user_type: str(props.user_type, 40),
        home_city: str(props.home_city, 40),
        passport_level: str(props.passport_level, 40),
        spotify_connected:
            typeof props.spotify_connected === 'boolean'
                ? String(props.spotify_connected)
                : str(props.spotify_connected, 10),
    });
    if (Object.keys(payload).length > 0) gtagSafe('set', 'user_properties', payload);
}

/**
 * Map an auth user onto `user_type`.
 *
 * Host signal = the Diplomat rung (verified vendor, i.e. cleared Stripe and can
 * sell tickets), resolved through the canonical ladder in src/lib/accountTier.js.
 * NOTE: accessTierOf() also reports DIPLOMAT for platform admins, so internal
 * admin accounts read as 'host'. That is intentional — they can publish.
 *
 * There is no promoter flag on the web user object today, so 'promoter'/'both'
 * are only reachable via the explicit `isPromoter` override (a future affiliate
 * field, or a caller that knows better).
 *
 * @param {Object|null} user
 * @param {{ isPromoter?: boolean }} [overrides]
 * @returns {'attendee'|'host'|'promoter'|'both'}
 */
export function resolveUserType(user, overrides = {}) {
    const isHost = isVendorUser(user) || accessTierOf(user) === 'DIPLOMAT';
    const isPromoter =
        overrides.isPromoter === true || user?.isPromoter === true || user?.isAffiliate === true;
    if (isHost && isPromoter) return USER_TYPES.BOTH;
    if (isHost) return USER_TYPES.HOST;
    if (isPromoter) return USER_TYPES.PROMOTER;
    return USER_TYPES.ATTENDEE;
}

/**
 * Derive and set all four user-scoped dimensions from an auth user object.
 * `passport_level` is the uppercase Odyssey tier id (WANDERER · SEEKER ·
 * VOYAGER · PATHFINDER · LUMINARY · ODYSSEY) — the app must send the same
 * casing or the dimension splits in two.
 * @param {Object|null} user
 * @param {{ isPromoter?: boolean, spotifyConnected?: boolean|null }} [extra]
 */
export function setUserPropertiesFromUser(user, extra = {}) {
    if (!user) return;
    setUserProperties({
        user_type: resolveUserType(user, extra),
        home_city: user.city,
        passport_level: getOdysseyTierFromXp(user.odysseyXp ?? 0).id,
        spotify_connected:
            typeof extra.spotifyConnected === 'boolean' ? extra.spotifyConnected : undefined,
    });
}

// ── Server-side purchase attribution ────────────────────────────────────────

/**
 * gtag.js sets these globals once the real loader executes. The inline consent
 * bootstrap defines window.gtag as a dataLayer shim, so `typeof window.gtag`
 * alone can NOT tell us whether Google's script actually landed — that was the
 * bug that made a blocked/ad-blocked visitor wait the full timeout at checkout.
 */
function googleTagLoaded() {
    return (
        typeof window !== 'undefined' &&
        (typeof window.google_tag_manager === 'object' || typeof window.google_tag_data === 'object')
    );
}

const BLOCKED_PROBE_MS = 600;

/**
 * Resolve the GA client/session ids so the backend can stitch the server-side
 * Measurement Protocol `purchase` onto this browser's session.
 *
 * Resolves against NEXT_PUBLIC_GA_MEASUREMENT_ID (the G- id) — which is now
 * explicitly `config`-ed alongside the Ads destination, so `gtag('get', G-…)`
 * has a registered target even though the loader is fetched by TAG ID.
 *
 * Always resolves. Returns { clientId: null, sessionId: null } immediately when
 * gtag.js is blocked, and after `timeoutMs` in the worst case — checkout must
 * never wait on analytics.
 * @param {number} [timeoutMs]
 * @returns {Promise<{clientId: string|null, sessionId: string|null}>}
 */
export function getGaIds(timeoutMs = 1500) {
    return new Promise((resolve) => {
        const result = { clientId: null, sessionId: null };
        if (typeof window === 'undefined' || !analyticsEnabled || typeof window.gtag !== 'function') {
            resolve(result);
            return;
        }

        let settled = false;
        let pending = 2;
        let probe = null;
        let timer = null;

        const finish = () => {
            if (settled) return;
            settled = true;
            if (probe) clearInterval(probe);
            if (timer) clearTimeout(timer);
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
            return;
        }

        // Fast-fail: if Google's script has not landed within the probe window
        // it is blocked, the get() callbacks will never fire, and there is
        // nothing to wait for.
        if (!googleTagLoaded()) {
            const startedAt = Date.now();
            probe = setInterval(() => {
                if (googleTagLoaded()) {
                    clearInterval(probe);
                    probe = null;
                } else if (Date.now() - startedAt >= BLOCKED_PROBE_MS) {
                    finish();
                }
            }, 100);
        }

        timer = setTimeout(finish, timeoutMs);
    });
}

// ── OAuth redirect attribution (Spotify connect) ────────────────────────────

const OAUTH_STASH_KEY = 'pxi_oauth_attribution';
const CLICK_ID_KEYS = ['gclid', 'gbraid', 'wbraid', 'fbclid', 'ttclid', 'msclkid'];
const UTM_PREFIX = 'utm_';

/**
 * Call IMMEDIATELY BEFORE navigating away to a third-party OAuth consent screen
 * (Spotify). The round trip rewrites the URL and replaces document.referrer
 * with accounts.spotify.com, which otherwise starts a brand-new GA4 session
 * attributed to a Spotify referral and orphans the ad click id.
 *
 * Stashes { client_id, params: { gclid|gbraid|wbraid|utm_* … }, ts } in
 * sessionStorage (per-tab, dies with the tab — never persisted).
 *
 * @returns {Promise<boolean>} true when something was stashed
 */
export async function stashAttributionForRedirect() {
    try {
        if (typeof window === 'undefined') return false;
        const search = new URLSearchParams(window.location.search);
        const params = {};
        for (const [key, value] of search.entries()) {
            if (!value) continue;
            if (key.startsWith(UTM_PREFIX) || CLICK_ID_KEYS.includes(key)) {
                params[key] = String(value).slice(0, 500);
            }
        }
        const { clientId } = await getGaIds(800);
        if (!clientId && Object.keys(params).length === 0) return false;
        window.sessionStorage.setItem(
            OAUTH_STASH_KEY,
            JSON.stringify({ client_id: clientId, params, ts: Date.now() }),
        );
        return true;
    } catch {
        return false;
    }
}

/**
 * Call ONCE on the OAuth callback page, as early as possible and BEFORE the
 * page_view for that route fires.
 *
 * Reads and clears the stash. When `apply` is true (default) it replays the
 * stashed utm_* values as GA4 campaign fields and sets `ignore_referrer` so the
 * bounce-back off accounts.spotify.com cannot start a new session or overwrite
 * the campaign that actually acquired this visitor.
 *
 * Click ids (gclid/gbraid/wbraid) are returned rather than applied — gtag has
 * no setter for them; the caller decides whether to re-append them to the URL.
 *
 * @param {{ apply?: boolean }} [options]
 * @returns {{ client_id: string|null, params: Record<string,string>, ts: number }|null}
 */
export function restoreAttributionAfterRedirect({ apply = true } = {}) {
    try {
        if (typeof window === 'undefined') return null;
        const raw = window.sessionStorage.getItem(OAUTH_STASH_KEY);
        if (!raw) return null;
        window.sessionStorage.removeItem(OAUTH_STASH_KEY);

        const stash = JSON.parse(raw);
        if (!stash || typeof stash !== 'object') return null;
        const params = stash.params && typeof stash.params === 'object' ? stash.params : {};

        if (apply) {
            gtagSafe(
                'set',
                compact({
                    campaign_source: params.utm_source,
                    campaign_medium: params.utm_medium,
                    campaign_name: params.utm_campaign,
                    campaign_term: params.utm_term,
                    campaign_content: params.utm_content,
                    ignore_referrer: true,
                }),
            );
        }

        return { client_id: stash.client_id ?? null, params, ts: Number(stash.ts) || 0 };
    } catch {
        return null;
    }
}

// ── Utilities ───────────────────────────────────────────────────────────────

/**
 * Trailing-edge debounce with a .cancel(). Used so a search box cannot fire one
 * GA4 `search` hit per keystroke.
 * @template {(...args: any[]) => void} F
 * @param {F} fn
 * @param {number} [waitMs]
 * @returns {F & { cancel: () => void }}
 */
export function debounce(fn, waitMs = 700) {
    let timer = null;
    const wrapped = (...args) => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
            timer = null;
            try {
                fn(...args);
            } catch {
                /* ignore */
            }
        }, waitMs);
    };
    wrapped.cancel = () => {
        if (timer) clearTimeout(timer);
        timer = null;
    };
    return wrapped;
}

/**
 * Normalise the 8 registered EVENT-scoped dimensions from camelCase input.
 * Legacy `{ id, name }` keys are still accepted so pre-migration call sites do
 * not silently stop reporting; Wave 2 migrates them to the explicit names.
 */
function eventContext(input = {}) {
    return compact({
        event_id: str(input.eventId ?? input.id, 100),
        event_title: str(input.eventTitle ?? input.name ?? input.title, 100),
        event_city: str(input.eventCity ?? input.city, 60),
        event_genre: str(input.eventGenre ?? input.genre, 60),
        artist: str(input.artist, 100),
        ticket_tier: str(input.ticketTier ?? input.tier, 60),
        host_id: str(input.hostId, 100),
        promoter_id: str(input.promoterId, 100),
    });
}

/**
 * Build one GA4 `items[]` entry from an event-shaped object. Exported so every
 * list, detail and checkout surface produces IDENTICAL item payloads.
 * @param {Object} input
 * @param {number} [index] zero-based position in the list
 */
export function toItem(input = {}, index) {
    return compact({
        item_id: str(input.eventId ?? input.id, 100),
        item_name: str(input.eventTitle ?? input.name ?? input.title, 100),
        item_category: str(input.eventGenre ?? input.genre, 60),
        item_category2: str(input.eventCity ?? input.city, 60),
        item_brand: str(input.artist, 100),
        item_variant: str(input.ticketTier ?? input.tier, 60),
        price: num(input.value ?? input.price ?? input.priceUsd),
        quantity: num(input.quantity) ?? 1,
        index: Number.isFinite(index) ? index : undefined,
    });
}

function itemsFrom(input) {
    if (Array.isArray(input?.items) && input.items.length > 0) {
        return input.items.map((item, i) => toItem(item, i));
    }
    const single = toItem(input);
    return Object.keys(single).length > 1 ? [single] : [];
}

// ─────────────────────────────────────────────────────────────────────────────
// COMMERCE
// `purchase` and `refund` are intentionally absent — server-side only.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A list of events was rendered (browse grid, "you might like", city page).
 * @param {Object} input
 * @param {string} input.listId  stable slug, e.g. 'events_browse'
 * @param {string} input.listName human label, e.g. 'Browse events'
 * @param {Array<Object>} input.items event-shaped objects (see toItem)
 */
export function trackViewItemList({ listId, listName, items = [] }) {
    track(EVENTS.VIEW_ITEM_LIST, {
        item_list_id: str(listId, 100),
        item_list_name: str(listName, 100),
        items: items.map((item, i) => toItem(item, i)),
    });
}

/**
 * An event detail page was viewed.
 * @param {Object} input
 * @param {string} input.eventId
 * @param {string} [input.eventTitle]
 * @param {string} [input.eventCity]
 * @param {string} [input.eventGenre]
 * @param {string} [input.artist]
 * @param {string} [input.ticketTier]
 * @param {number} [input.value] ticket price in USD
 */
export function trackViewItem(input = {}) {
    const value = num(input.value ?? input.priceUsd);
    track(EVENTS.VIEW_ITEM, {
        ...eventContext(input),
        ...(value !== undefined ? { value } : {}),
        currency: CURRENCY,
        items: itemsFrom(input),
    });
}

/**
 * A card in a list was clicked.
 * @param {Object} input
 * @param {string} input.listName
 * @param {string} [input.listId]
 * @param {Object} [input.item] the event-shaped object that was clicked
 * @param {number} [input.index]
 */
export function trackSelectItem({ listId, listName, item, index, ...rest }) {
    track(EVENTS.SELECT_ITEM, {
        item_list_id: str(listId, 100),
        item_list_name: str(listName, 100),
        items: [toItem(item ?? rest, index)],
    });
}

/**
 * A ticket tier was added to the order.
 * @param {Object} input
 * @param {string} input.eventId
 * @param {string} input.ticketTier
 * @param {number} input.quantity
 * @param {number} input.value line total in USD
 */
export function trackAddToCart(input = {}) {
    track(EVENTS.ADD_TO_CART, {
        ...eventContext(input),
        quantity: num(input.quantity) ?? 1,
        value: num(input.value ?? input.priceUsd),
        currency: CURRENCY,
        items: itemsFrom(input),
    });
}

/**
 * Checkout was opened.
 * @param {Object} input
 * @param {string} input.eventId
 * @param {string} [input.ticketTier]
 * @param {number} [input.value] order total in USD
 */
export function trackBeginCheckout(input = {}) {
    const value = num(input.value ?? input.priceUsd);
    track(EVENTS.BEGIN_CHECKOUT, {
        ...eventContext(input),
        ...(value !== undefined ? { value } : {}),
        currency: CURRENCY,
        items: itemsFrom(input),
    });
}

/**
 * Payment details were submitted (fires BEFORE the Stripe confirmation — the
 * purchase itself is recorded server-side from the webhook).
 * @param {Object} input
 * @param {string} input.eventId
 * @param {string} [input.ticketTier]
 * @param {number} [input.value]
 * @param {string} [input.paymentType] e.g. 'card' | 'apple_pay'
 */
export function trackAddPaymentInfo(input = {}) {
    const value = num(input.value ?? input.priceUsd);
    track(EVENTS.ADD_PAYMENT_INFO, {
        ...eventContext(input),
        ...(value !== undefined ? { value } : {}),
        currency: CURRENCY,
        payment_type: str(input.paymentType, 40),
        items: itemsFrom(input),
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// GROWTH / SOCIAL / MATCHMAKING
// ─────────────────────────────────────────────────────────────────────────────

/** Accepts the contract object form, or a bare method string (legacy call sites). */
function methodOf(input) {
    if (typeof input === 'string') return str(input, 40);
    return str(input?.method, 40);
}

/**
 * @param {{ method: 'google'|'apple'|'email'|'phone' }|string} input
 */
export function trackSignUp(input) {
    track(EVENTS.SIGN_UP, { method: methodOf(input) });
}

/**
 * @param {{ method: 'google'|'apple'|'email'|'phone' }|string} input
 */
export function trackLogin(input) {
    track(EVENTS.LOGIN, { method: methodOf(input) });
}

/**
 * An organizer asked to be contacted (pricing form, "talk to us", demo request).
 * NOTE: host_lead, NOT the GA4 standard generate_lead.
 * @param {{ source: string }|string} input where the lead came from, e.g. 'pricing_form'
 */
export function trackHostLead(input) {
    const source = typeof input === 'string' ? input : input?.source;
    track(EVENTS.HOST_LEAD, { source: str(source, 80) });
}

/**
 * @param {{ entryPoint: string }|string} input e.g. 'dashboard_cta' | 'nav'
 */
export function trackEventCreateStart(input) {
    const entryPoint = typeof input === 'string' ? input : input?.entryPoint;
    track(EVENTS.EVENT_CREATE_START, { entry_point: str(entryPoint, 80) });
}

/**
 * An event went live. NOTE: event_create_publish, NOT event_created.
 * @param {Object} input
 * @param {string} input.eventId
 * @param {string} [input.eventCity]
 * @param {string} [input.eventGenre]
 * @param {string} [input.ticketTier]
 * @param {string} [input.hostId]
 */
export function trackEventCreatePublish(input = {}) {
    track(EVENTS.EVENT_CREATE_PUBLISH, eventContext(input));
}

/**
 * The Spotify OAuth redirect is about to happen.
 * @param {{ entryPoint: string }|string} input
 */
export function trackSpotifyConnectStart(input) {
    const entryPoint = typeof input === 'string' ? input : input?.entryPoint;
    track(EVENTS.SPOTIFY_CONNECT_START, { entry_point: str(entryPoint, 80) });
}

/**
 * Spotify came back connected. NOTE: spotify_connected, NOT music_connect.
 * @param {{ entryPoint?: string }} [input]
 */
export function trackSpotifyConnected(input = {}) {
    track(EVENTS.SPOTIFY_CONNECTED, { entry_point: str(input.entryPoint, 80) });
}

/**
 * @param {Object} input
 * @param {string} input.artist
 * @param {string} [input.eventId]
 */
export function trackArtistFollow(input = {}) {
    track(EVENTS.ARTIST_FOLLOW, eventContext(input));
}

/**
 * @param {Object} input
 * @param {string} input.eventGenre the genre followed (accepts `genre`)
 */
export function trackGenreFollow(input = {}) {
    track(EVENTS.GENRE_FOLLOW, eventContext(input));
}

/**
 * @param {Object} input
 * @param {string} [input.eventId]
 * @param {string} [input.artist]
 * @param {string} [input.playlistId]
 */
export function trackPlaylistOpen(input = {}) {
    track(EVENTS.PLAYLIST_OPEN, {
        ...eventContext(input),
        playlist_id: str(input.playlistId, 100),
    });
}

/**
 * @param {Object} input
 * @param {string} [input.eventId]
 * @param {string} [input.artist]
 * @param {string} [input.playlistId]
 */
export function trackPlaylistPlay(input = {}) {
    track(EVENTS.PLAYLIST_PLAY, {
        ...eventContext(input),
        playlist_id: str(input.playlistId, 100),
    });
}

/**
 * A recommended event was clicked — the matchmaking-quality signal.
 * @param {Object} input
 * @param {string} input.eventId
 * @param {'taste_match'|'city'|'genre'|'friend'} input.recSource
 * @param {number} input.recRank zero-based position in the recommendation set
 */
export function trackRecommendationClick(input = {}) {
    track(EVENTS.RECOMMENDATION_CLICK, {
        ...eventContext(input),
        rec_source: str(input.recSource, 40),
        rec_rank: num(input.recRank),
    });
}

/**
 * A search was performed. Prefer trackSearchDebounced from a live input.
 * @param {{ searchTerm: string }|string} input
 */
export function trackSearch(input) {
    const term = typeof input === 'string' ? input : input?.searchTerm;
    const searchTerm = str(term, 120);
    if (!searchTerm) return;
    track(EVENTS.SEARCH, { search_term: searchTerm });
}

/**
 * Debounced `search` — call this on every keystroke; it fires at most once per
 * 700ms of quiet. Shared module-level timer, which is what a single search box
 * wants. Call .cancel() on unmount if you need to be strict.
 */
export const trackSearchDebounced = debounce(trackSearch, 700);

/**
 * Results were rendered for a search.
 * @param {Object} input
 * @param {string} input.searchTerm
 * @param {number} input.resultsCount
 */
export function trackViewSearchResults(input = {}) {
    track(EVENTS.VIEW_SEARCH_RESULTS, {
        search_term: str(input.searchTerm, 120),
        results_count: num(input.resultsCount),
    });
}

/**
 * The user joined / RSVP'd to an event. NOTE: join_event, NOT rsvp or join_group.
 * @param {Object} input
 * @param {string} input.eventId
 * @param {string} [input.ticketTier]
 */
export function trackJoinEvent(input = {}) {
    track(EVENTS.JOIN_EVENT, eventContext(input));
}

/**
 * @param {Object} input
 * @param {string} input.eventId
 * @param {string} input.channel e.g. 'sms' | 'email' | 'link' | 'instagram'
 * @param {number} input.inviteCount
 */
export function trackInviteSend(input = {}) {
    track(EVENTS.INVITE_SEND, {
        ...eventContext(input),
        channel: str(input.channel, 40),
        invite_count: num(input.inviteCount),
    });
}

/**
 * @param {Object} input
 * @param {string} input.method where it was shared, e.g. 'copy_link' | 'instagram'
 * @param {string} input.contentType e.g. 'event' | 'album' | 'profile'
 * @param {string} input.itemId
 */
export function trackShare(input = {}) {
    track(EVENTS.SHARE, {
        method: str(input.method, 40),
        content_type: str(input.contentType, 40),
        item_id: str(input.itemId, 100),
    });
}

/**
 * @param {Object} input
 * @param {string} input.eventId
 * @param {number} input.mediaCount
 */
export function trackScrapbookUpload(input = {}) {
    track(EVENTS.SCRAPBOOK_UPLOAD, {
        ...eventContext(input),
        media_count: num(input.mediaCount),
    });
}

/**
 * @param {Object} input
 * @param {string} input.eventId
 */
export function trackScrapbookView(input = {}) {
    track(EVENTS.SCRAPBOOK_VIEW, eventContext(input));
}

/**
 * The passport crossed into a new Odyssey band.
 * @param {Object} input
 * @param {string} input.passportLevel uppercase tier id, e.g. 'VOYAGER'
 */
export function trackPassportLevelUp(input = {}) {
    track(EVENTS.PASSPORT_LEVEL_UP, { passport_level: str(input.passportLevel, 40) });
}

/**
 * Notifications were enabled.
 * @param {Object} input
 * @param {string} [input.channel] 'push' | 'email' | 'sms'
 * @param {string} [input.entryPoint]
 */
export function trackNotificationOptIn(input = {}) {
    track(EVENTS.NOTIFICATION_OPT_IN, {
        channel: str(input.channel, 40),
        entry_point: str(input.entryPoint, 80),
    });
}

/**
 * @param {Object} input
 * @param {string} [input.tutorialId]
 * @param {string} [input.entryPoint]
 */
export function trackTutorialBegin(input = {}) {
    track(EVENTS.TUTORIAL_BEGIN, {
        tutorial_id: str(input.tutorialId, 80),
        entry_point: str(input.entryPoint, 80),
    });
}

/**
 * @param {Object} input
 * @param {string} [input.tutorialId]
 */
export function trackTutorialComplete(input = {}) {
    track(EVENTS.TUTORIAL_COMPLETE, { tutorial_id: str(input.tutorialId, 80) });
}
