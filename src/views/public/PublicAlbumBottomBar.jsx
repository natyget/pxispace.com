'use client';

import Link from 'next/link';

/**
 * `pxi://album/...` opens the native app when installed (see app `scheme` + Android intent filters).
 */
export default function PublicAlbumBottomBar({ albumId, showNoAppHint = true }) {
  if (!albumId) return null;
  const openInAppUrl = `pxi://album/${albumId}`;
  const year = new Date().getFullYear();

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] pt-0 md:hidden">
      <div className="pointer-events-auto flex w-full max-w-md flex-col items-center gap-2">
        <div className="flex w-full max-w-[24rem] items-center gap-2 rounded-2xl border border-white/15 bg-black/85 px-3 py-2.5 shadow-lg backdrop-blur-md">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold text-white">Open in PXI</p>
            <p className="text-[10px] text-zinc-400">
              View and react in the app; album rules apply for comments and access
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
        {showNoAppHint ? (
          <div className="flex w-full max-w-[24rem] items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/60 px-3 py-2">
            <p className="text-[10px] text-zinc-500">No app on this device?</p>
            <Link
              href="/beta"
              className="shrink-0 text-[10px] font-semibold text-pxi-purple hover:text-white"
            >
              Get the app
            </Link>
          </div>
        ) : null}
        <p className="text-center text-[11px] text-zinc-500">© {year} PXI App. All rights reserved.</p>
      </div>
    </div>
  );
}
