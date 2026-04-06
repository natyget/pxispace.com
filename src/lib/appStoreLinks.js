/**
 * iOS download CTAs: default to /beta (TestFlight funnel). Set NEXT_PUBLIC_IOS_APP_URL
 * to a full App Store URL when the app is live on the store.
 */
export const PXI_IOS_DOWNLOAD_HREF =
  process.env.NEXT_PUBLIC_IOS_APP_URL || '/beta';

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
