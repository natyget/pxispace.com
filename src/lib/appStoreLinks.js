/**
 * iOS download CTAs: default to /beta (TestFlight funnel). Set NEXT_PUBLIC_IOS_APP_URL
 * to a full App Store URL when the app is live on the store.
 */
export const PXI_IOS_DOWNLOAD_HREF =
  process.env.NEXT_PUBLIC_IOS_APP_URL || 'https://apps.apple.com/app/pxi/id6751762197';

/** @deprecated Use PXI_IOS_DOWNLOAD_HREF; kept for existing imports */
export const PXI_APP_STORE_URL = PXI_IOS_DOWNLOAD_HREF;

/** Apple TestFlight app on the App Store (Step 1 installer) */
export const PXI_TESTFLIGHT_APP_URL =
  'https://apps.apple.com/app/testflight/id899247664';

/** Public TestFlight invite for PXI (Step 2) */
export const PXI_TESTFLIGHT_JOIN_URL =
  process.env.NEXT_PUBLIC_TESTFLIGHT_INVITE_URL ||
  'https://testflight.apple.com/join/3QqyXJwa';

export const PXI_PLAY_STORE_URL =
  process.env.NEXT_PUBLIC_ANDROID_APP_URL || 'https://play.google.com/store';

/**
 * Play Store URL carrying a deferred deep link through install (free Branch
 * replacement). The `referrer` string reaches the app's first launch via the
 * Play Install Referrer API; the app reads `pxi_link` and routes to that path
 * (see pxi-mobile-app src/services/installReferrerLinks.ts). Accepts a web
 * path ('/join/ABC') or full pxispace/pxi:// URL — anything else is dropped.
 */
export function playStoreUrlWithDeepLink(target) {
  try {
    if (!PXI_PLAY_STORE_URL.includes('play.google.com') || !target) return PXI_PLAY_STORE_URL;
    let path = String(target);
    if (path.startsWith('pxi://')) path = `/${path.slice('pxi://'.length)}`;
    else if (path.startsWith('http')) path = new URL(path).pathname + new URL(path).search;
    if (!path.startsWith('/')) return PXI_PLAY_STORE_URL;
    const referrer = encodeURIComponent(`pxi_link=${encodeURIComponent(path)}`);
    const joiner = PXI_PLAY_STORE_URL.includes('?') ? '&' : '?';
    return `${PXI_PLAY_STORE_URL}${joiner}referrer=${referrer}`;
  } catch {
    return PXI_PLAY_STORE_URL;
  }
}
