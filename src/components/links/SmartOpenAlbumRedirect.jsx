'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { HugeiconsIcon } from '@hugeicons/react';
import { Loading02Icon } from '@hugeicons/core-free-icons';
const PENDING_DEEPLINK_KEY = 'pxi_pending_deeplink';

function detectPlatform() {
  if (typeof navigator === 'undefined') return 'unknown';
  const ua = navigator.userAgent || '';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  return 'desktop';
}

/**
 * Email / share links land here first: try native app, then fall back to web album.
 */
export default function SmartOpenAlbumRedirect({ albumId, title = '' }) {
  const router = useRouter();

  useEffect(() => {
    if (!albumId) return;

    const deepLink = `pxi://album/${albumId}`;
    const titleQuery = title ? `?title=${encodeURIComponent(title)}` : '';
    const webFallback = `/album/${albumId}${titleQuery}`;
    const platform = detectPlatform();

    try {
      window.localStorage.setItem(PENDING_DEEPLINK_KEY, deepLink);
    } catch {
      /* ignore */
    }

    if (platform === 'desktop') {
      router.replace(webFallback);
      return;
    }

    const start = Date.now();
    let fallbackTimer = null;

    const cleanup = () => {
      if (fallbackTimer) clearTimeout(fallbackTimer);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', onPageHide);
    };

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') cleanup();
    };

    const onPageHide = () => cleanup();

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', onPageHide);

    fallbackTimer = setTimeout(() => {
      cleanup();
      if (Date.now() - start < 2500 && document.visibilityState === 'visible') {
        router.replace(webFallback);
      }
    }, 1500);

    window.location.href = deepLink;

    return cleanup;
  }, [albumId, title, router]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center bg-black px-6 text-center text-white">
      <HugeiconsIcon icon={Loading02Icon} size={28} className="animate-spin text-pxi-purple" />
      <p className="mt-4 text-sm font-semibold">Opening thread in PXI…</p>
      <p className="mt-2 max-w-xs text-xs text-zinc-500">
        If the app doesn&apos;t open, you&apos;ll continue in your browser.
      </p>
    </div>
  );
}
