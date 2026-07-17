'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { HugeiconsIcon } from '@hugeicons/react';
import { Cancel01Icon } from '@hugeicons/core-free-icons';
import { PXI_IOS_DOWNLOAD_HREF, playStoreUrlWithDeepLink } from '@/lib/appStoreLinks';

/**
 * Dismissible "Open in PXI" banner.
 *
 * Behavior:
 * - On click of "Open", attempts the `deepLinkUrl` (e.g. `pxi://album/:id`).
 *   If the native app is installed, the tab visibility flips to `hidden` quickly
 *   and we abort the App Store fallback. Otherwise, after ~1.5s we redirect to
 *   the App Store / Play Store so the user can install and return.
 * - Stores the desired deep-link target in `localStorage` under
 *   `pxi_pending_deeplink` so the page can re-trigger the deep link when the
 *   user returns after installing (handled by app's universal/app-links setup).
 * - Dismissal is persisted in `sessionStorage` so the banner stays out of the
 *   way once a user closes it during a session — no global "fixed" overlay
 *   stays on top of in-page CTAs (Join Event, etc.).
 */

const DISMISS_KEY = 'pxi_app_banner_dismissed';
const PENDING_DEEPLINK_KEY = 'pxi_pending_deeplink';

function detectPlatform() {
    if (typeof navigator === 'undefined') return 'unknown';
    const ua = navigator.userAgent || '';
    if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
    if (/Android/i.test(ua)) return 'android';
    return 'desktop';
}

function storeUrlForPlatform(platform, deepLinkUrl) {
    // Android: the store URL carries the deep link through install via the
    // Play Install Referrer (deferred deep linking without Branch). iOS has
    // no free equivalent — the target page's invite code covers that flow.
    if (platform === 'android') return playStoreUrlWithDeepLink(deepLinkUrl);
    return PXI_IOS_DOWNLOAD_HREF;
}

export default function AppOpenBanner({
    deepLinkUrl,
    title = 'Open in PXI',
    subtitle = 'Get the full experience in the app',
    storageKey = DISMISS_KEY,
    /** Match the page padding-bottom your fixed primary CTA reserves (e.g. 6rem when a Join Event button sits below). */
    bottomOffset = '0px',
}) {
    const [dismissed, setDismissed] = useState(true);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            const isDismissed = window.sessionStorage.getItem(storageKey) === '1';
            setDismissed(isDismissed);
        } catch {
            setDismissed(false);
        }
    }, [storageKey]);

    const handleDismiss = useCallback(() => {
        setDismissed(true);
        try {
            window.sessionStorage.setItem(storageKey, '1');
        } catch {}
    }, [storageKey]);

    const handleOpen = useCallback(
        (event) => {
            if (!deepLinkUrl) return;
            const platform = detectPlatform();
            if (platform === 'desktop') return;
            event.preventDefault();
            try {
                window.localStorage.setItem(PENDING_DEEPLINK_KEY, deepLinkUrl);
            } catch {}
            const store = storeUrlForPlatform(platform, deepLinkUrl);
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
                    window.location.href = store;
                }
            }, 1500);
            window.location.href = deepLinkUrl;
        },
        [deepLinkUrl],
    );

    if (dismissed) return null;

    return (
        <div
            className="pointer-events-none fixed inset-x-0 z-40 flex justify-center px-4 md:hidden"
            style={{ bottom: `calc(${bottomOffset} + env(safe-area-inset-bottom, 0px) + 0.5rem)` }}
        >
            <div className="pointer-events-auto flex w-full max-w-[24rem] items-center gap-2 rounded-2xl border border-white/15 bg-black/85 px-3 py-2.5 shadow-lg backdrop-blur-md">
                <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-semibold text-white">{title}</p>
                    <p className="truncate text-[10px] text-zinc-400">{subtitle}</p>
                </div>
                {deepLinkUrl ? (
                    <a
                        href={deepLinkUrl}
                        onClick={handleOpen}
                        className="shrink-0 rounded-full bg-white px-3.5 py-2 text-xs font-bold text-black transition hover:bg-zinc-200"
                        rel="noopener noreferrer"
                    >
                        Open
                    </a>
                ) : (
                    <Link
                        href="/beta"
                        className="shrink-0 rounded-full bg-white px-3.5 py-2 text-xs font-bold text-black transition hover:bg-zinc-200"
                    >
                        Get app
                    </Link>
                )}
                <button
                    type="button"
                    onClick={handleDismiss}
                    aria-label="Dismiss banner"
                    className="inline-flex size-7 shrink-0 items-center justify-center rounded-full text-zinc-400 transition hover:bg-white/10 hover:text-white"
                >
                    <HugeiconsIcon icon={Cancel01Icon} size={14} />
                </button>
            </div>
        </div>
    );
}
