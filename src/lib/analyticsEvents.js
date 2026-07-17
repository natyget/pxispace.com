// Canonical GA4 event names + params — mirror of PXIStudio-App/docs/analytics-taxonomy.md
// and pxi-mobile-app/src/lib/analyticsEvents.ts. Add events THERE first, then here.

export const EVENTS = {
    // GA4 recommended events (standard reports / Ads conversions / predictive audiences)
    SIGN_UP: 'sign_up',
    LOGIN: 'login',
    VIEW_ITEM: 'view_item',
    BEGIN_CHECKOUT: 'begin_checkout',
    // NOTE: `purchase` is SERVER-ONLY (Measurement Protocol from the Stripe webhook).
    SHARE: 'share',
    JOIN_GROUP: 'join_group',

    // PXI custom events
    FACE_SCAN_COMPLETE: 'face_scan_complete',
    POST_CREATED: 'post_created',
    FOLLOW: 'follow',
    MUSIC_CONNECT: 'music_connect',
    INVITE_REDEEMED: 'invite_redeemed',
};

export const AUTH_METHODS = {
    EMAIL: 'email',
    GOOGLE: 'google',
    APPLE: 'apple',
};
