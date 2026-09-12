/**
 * Store links for the native app. PXI ships on both stores, so nothing here may
 * assume iOS: pick with `storeUrlForPlatform`, or link to `PXI_GET_APP_HREF`
 * and let the server decide from the User-Agent.
 */

/** iOS App Store listing. */
export const PXI_IOS_DOWNLOAD_HREF =
  process.env.NEXT_PUBLIC_IOS_APP_URL || 'https://apps.apple.com/app/pxi/id6751762197';

/** @deprecated Use PXI_IOS_DOWNLOAD_HREF; kept for existing imports */
export const PXI_APP_STORE_URL = PXI_IOS_DOWNLOAD_HREF;

/** Google Play listing. Package id matches /.well-known/assetlinks.json. */
export const PXI_PLAY_STORE_URL =
  process.env.NEXT_PUBLIC_ANDROID_APP_URL ||
  'https://play.google.com/store/apps/details?id=com.pxistudio.PXIStudio';

/** Apple TestFlight app on the App Store (Step 1 installer) */
export const PXI_TESTFLIGHT_APP_URL =
  'https://apps.apple.com/app/testflight/id899247664';

/** Public TestFlight invite for PXI (Step 2) */
export const PXI_TESTFLIGHT_JOIN_URL =
  process.env.NEXT_PUBLIC_TESTFLIGHT_INVITE_URL ||
  'https://testflight.apple.com/join/3QqyXJwa';

/**
 * Server-side store picker (see src/app/get/route.js). Use this for any CTA
 * whose label does not name a store ("Get the app"): it resolves on the server
 * from the User-Agent, so there is no flash and no JS needed.
 */
export const PXI_GET_APP_HREF = '/get';

/**
 * @param {string} userAgent
 * @returns {'ios' | 'android' | 'desktop'}
 */
export function detectAppPlatform(userAgent) {
  const ua = typeof userAgent === 'string' ? userAgent : '';
  // Android must be tested first: Android tablet UAs can also carry "Linux" and
  // some carry "Silk"/"Mobile", but none of the iOS device tokens.
  if (/Android/i.test(ua)) return 'android';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
  return 'desktop';
}

/**
 * Store URL for a platform. Desktop and unknown keep the App Store — the same
 * link the site served before there was an Android build — while every surface
 * that can show two buttons offers both.
 * @param {'ios' | 'android' | 'desktop' | 'unknown'} platform
 */
export function storeUrlForPlatform(platform) {
  return platform === 'android' ? PXI_PLAY_STORE_URL : PXI_IOS_DOWNLOAD_HREF;
}

/**
 * Badge copy matching each store's own wording.
 * @param {'ios' | 'android' | 'desktop' | 'unknown'} platform
 */
export function storeLabelForPlatform(platform) {
  return platform === 'android'
    ? { eyebrow: 'Get it on', name: 'Google Play' }
    : { eyebrow: 'Download on', name: 'App Store' };
}
