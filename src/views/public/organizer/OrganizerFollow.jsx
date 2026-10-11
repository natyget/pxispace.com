'use client';

import { useAppPlatform } from '@/hooks/useAppPlatform';
import { PXI_GET_APP_HREF, storeUrlForPlatform } from '@/lib/appStoreLinks';
import { organizerAppLink } from '@/lib/organizerPage';

/**
 * Follow. The site has no fan sign-in, so following happens in the app: on a phone the button opens the organizer
 * there, and if the app is not installed it lands on the phone's store a moment later (the same hand-off as
 * "Open in PXI" on /go and the profile banner). Anywhere the app cannot open, it is a plain link to /get, which the
 * server sends to the visitor's own store. That link is also what the page holds before this script runs.
 *
 * @param {{ organizerId: string, name: string }} props
 */
export default function OrganizerFollow({ organizerId, name }) {
  // 'unknown' on the server and through hydration, then the real platform (an iPad reports a Mac; this tells it apart).
  const platform = useAppPlatform();
  const canOpenApp = platform === 'ios' || platform === 'android';
  const appLink = organizerAppLink(organizerId);

  // Try the app. If this page is still showing a moment later, the app is not installed: go to the store.
  const follow = (event) => {
    if (!canOpenApp) return;
    event.preventDefault();
    const started = Date.now();
    let timer = null;
    const cleanup = () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', cleanup);
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') cleanup();
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', cleanup);
    timer = setTimeout(() => {
      cleanup();
      if (Date.now() - started < 2500 && document.visibilityState === 'visible') {
        window.location.href = storeUrlForPlatform(platform);
      }
    }, 1500);
    window.location.href = appLink;
  };

  return (
    <a
      href={canOpenApp ? appLink : PXI_GET_APP_HREF}
      onClick={follow}
      aria-label={`Follow ${name} in the PXI app`}
      className="inline-flex h-12 w-full max-w-[320px] items-center justify-center rounded-full bg-pxi-purple px-6 text-[15px] font-extrabold text-white outline-offset-4 focus-visible:outline-2 focus-visible:outline-white motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-out motion-safe:active:scale-[0.97]"
    >
      Follow in PXI
    </a>
  );
}
