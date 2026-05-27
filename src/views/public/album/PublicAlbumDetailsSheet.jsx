'use client';

import { useEffect } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons';
import PublicAlbumDetailsPanel from './PublicAlbumDetailsPanel';

/**
 * Mobile full-screen album details (mirrors native AlbumDetailsModal from three-dot menu).
 */
export default function PublicAlbumDetailsSheet({ open, onClose, album, albumId }) {
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || !album) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-[#050505] lg:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Album details"
    >
      <header className="flex h-14 shrink-0 items-center border-b border-white/10 px-2 pt-[env(safe-area-inset-top,0px)]">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex size-10 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white"
          aria-label="Back to album"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={22} />
        </button>
        <h2 className="min-w-0 flex-1 truncate px-2 text-center text-sm font-black uppercase tracking-[0.2em] text-white">
          Event details
        </h2>
        <span className="size-10 shrink-0" aria-hidden />
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <PublicAlbumDetailsPanel album={album} albumId={albumId} layout="sheet" />
      </div>
    </div>
  );
}
