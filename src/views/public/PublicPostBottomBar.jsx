'use client';

import AppStoreCtaPair from '@/components/links/AppStoreCtaPair';

/**
 * `pxi://p/...` opens the native app when installed. Store badges link to iOS/Android download URLs.
 */
export default function PublicPostBottomBar({ postId }) {
  const openInAppUrl = `pxi://p/${postId}`;
  const year = new Date().getFullYear();

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] pt-0 md:hidden">
      <div className="pointer-events-auto flex w-full max-w-md flex-col items-center gap-2">
        <div className="flex w-full max-w-[24rem] items-center gap-2 rounded-2xl border border-white/15 bg-black/85 px-3 py-2.5 shadow-lg backdrop-blur-md">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold text-white">Open in PXI</p>
            <p className="text-[10px] text-zinc-400">
              Sign in to unlock private posts if you are friends or in the album
            </p>
          </div>
          <a
            href={openInAppUrl}
            className="shrink-0 rounded-full bg-white px-3.5 py-2 text-xs font-bold text-black transition hover:bg-zinc-200"
            rel="noopener noreferrer"
          >
            Open
          </a>
        </div>
        <div className="flex w-full max-w-[24rem] rounded-xl border border-white/10 bg-black/60 px-2 py-2.5 backdrop-blur-sm">
          <AppStoreCtaPair variant="row" />
        </div>
        <p className="text-center text-[11px] text-zinc-500">© {year} PXI App. All rights reserved.</p>
      </div>
    </div>
  );
}
