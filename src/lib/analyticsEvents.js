// FROZEN GA4 TAXONOMY — the exact event names, identical on web (this file) and
// app (pxi-mobile-app/src/lib/analyticsEvents.ts). snake_case, no aliases.
//
// These strings are a contract with GA4 property 514139578: renaming one
// orphans every report, audience and Ads conversion built on it. Add a new
// event to the contract doc FIRST, then here and in the app file together.
//
// Traps that bit us before, spelled out so nobody "fixes" them back:
//   event_title      NOT event_name
//   host_lead        NOT generate_lead
//   event_create_publish  NOT event_created
//   spotify_connected     NOT music_connect
//   join_event       NOT rsvp / join_group

export const EVENTS = {
    // ── Commerce (GA4 standard — never rename, standard reports key off these)
    VIEW_ITEM_LIST: 'view_item_list',
    VIEW_ITEM: 'view_item',
    SELECT_ITEM: 'select_item',
    ADD_TO_CART: 'add_to_cart',
    BEGIN_CHECKOUT: 'begin_checkout',
    ADD_PAYMENT_INFO: 'add_payment_info',
    // purchase + refund are SERVER-ONLY (Measurement Protocol, Stripe webhook).
    // Listed for name parity; there is deliberately no client wrapper for them.
    PURCHASE: 'purchase',
    REFUND: 'refund',

    // ── Growth / social / matchmaking
    SIGN_UP: 'sign_up',
    LOGIN: 'login',
    HOST_LEAD: 'host_lead',
    EVENT_CREATE_START: 'event_create_start',
    EVENT_CREATE_PUBLISH: 'event_create_publish',
    SPOTIFY_CONNECT_START: 'spotify_connect_start',
    SPOTIFY_CONNECTED: 'spotify_connected',
    ARTIST_FOLLOW: 'artist_follow',
    GENRE_FOLLOW: 'genre_follow',
    PLAYLIST_OPEN: 'playlist_open',
    PLAYLIST_PLAY: 'playlist_play',
    RECOMMENDATION_CLICK: 'recommendation_click',
    SEARCH: 'search',
    VIEW_SEARCH_RESULTS: 'view_search_results',
    JOIN_EVENT: 'join_event',
    INVITE_SEND: 'invite_send',
    SHARE: 'share',
    SCRAPBOOK_UPLOAD: 'scrapbook_upload',
    SCRAPBOOK_VIEW: 'scrapbook_view',
    PASSPORT_LEVEL_UP: 'passport_level_up',
    NOTIFICATION_OPT_IN: 'notification_opt_in',
    TUTORIAL_BEGIN: 'tutorial_begin',
    TUTORIAL_COMPLETE: 'tutorial_complete',
};

/**
 * The 12 registered GA4 custom dimensions. Any other parameter still reaches
 * GA4 but will not be reportable, so prefer these keys.
 */
export const EVENT_SCOPED_PARAMS = [
    'event_id',
    'event_title',
    'event_city',
    'event_genre',
    'artist',
    'ticket_tier',
    'host_id',
    'promoter_id',
];

export const USER_SCOPED_PARAMS = [
    'user_type',
    'home_city',
    'passport_level',
    'spotify_connected',
];

/** The only legal `user_type` values. */
export const USER_TYPES = {
    ATTENDEE: 'attendee',
    HOST: 'host',
    PROMOTER: 'promoter',
    BOTH: 'both',
};

/** The only legal `method` values on sign_up / login. */
export const AUTH_METHODS = {
    GOOGLE: 'google',
    APPLE: 'apple',
    EMAIL: 'email',
    PHONE: 'phone',
};

/** The only legal `rec_source` values on recommendation_click. */
export const REC_SOURCES = {
    TASTE_MATCH: 'taste_match',
    CITY: 'city',
    GENRE: 'genre',
    FRIEND: 'friend',
};

export const CURRENCY = 'USD';
