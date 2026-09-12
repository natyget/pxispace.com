'use client';

import { useSyncExternalStore } from 'react';
import { detectAppPlatform } from '@/lib/appStoreLinks';

/**
 * The visitor's platform, for CTAs whose LABEL changes with the store
 * ("App Store" vs "Google Play"). When only the href changes, prefer linking to
 * PXI_GET_APP_HREF — the server resolves that one with no flash at all.
 *
 * Returns 'unknown' on the server and through hydration, then the real platform.
 * That ordering is the point: the server cannot know the device, so every caller
 * must render its iOS/neutral default first and swap after mount. Reading
 * navigator during render instead would change the first client paint and
 * mismatch the server HTML.
 */

/** Never changes for the life of the page — subscribing is a no-op. */
function subscribe() {
  return () => {};
}

let cached = null;

function getSnapshot() {
  // Cached because useSyncExternalStore re-renders forever if getSnapshot is not
  // referentially stable. A string is, but the detection work should run once.
  if (cached) return cached;
  const ua = typeof navigator === 'undefined' ? '' : navigator.userAgent || '';
  const detected = detectAppPlatform(ua);
  // iPadOS 13+ reports a desktop Safari UA; touch points are what separate an
  // iPad from a Mac. Both would get the App Store anyway — this keeps anything
  // branching on 'ios' (deep links, "open in app") correct on iPad.
  if (
    detected === 'desktop' &&
    /Macintosh/i.test(ua) &&
    typeof navigator !== 'undefined' &&
    navigator.maxTouchPoints > 1
  ) {
    cached = 'ios';
    return cached;
  }
  cached = detected;
  return cached;
}

function getServerSnapshot() {
  return 'unknown';
}

/** @returns {'ios' | 'android' | 'desktop' | 'unknown'} */
export function useAppPlatform() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
