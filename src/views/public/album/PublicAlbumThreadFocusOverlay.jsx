'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft01Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import UserAvatar from '@/components/ui/UserAvatar';
import {
  FOCUS_MODAL_HEIGHT,
  FOCUS_MODAL_RADIUS_PX,
  FOCUS_MODAL_WIDTH,
} from './albumFocusLayout';
import PublicAlbumFocusSlide from './PublicAlbumFocusSlide';
import { useFocusOverlayPager } from './useFocusOverlayPager';
import { publicAlbumMediaId } from './useAlbumThreadActiveVideo';

export default function PublicAlbumThreadFocusOverlay({
  items,
  index,
  albumId,
  onClose,
  onIndexChange,
}) {
  const item = items[index] ?? null;
  const playbackPositionsRef = useRef(new Map());
  const [mounted, setMounted] = useState(false);
  const [manuallyPausedIds, setManuallyPausedIds] = useState(() => new Set());

  const { pagerRef, handlePagerScroll, goPrev, goNext } = useFocusOverlayPager({
    index,
    itemCount: items.length,
    onIndexChange,
  });

  useEffect(() => {
    setMounted(true);
    return () => {
      setManuallyPausedIds(new Set());
      playbackPositionsRef.current.clear();
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        goNext();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, goPrev, goNext]);

  const openInAppUrl = albumId ? `pxi://album/${albumId}` : null;

  const canGoPrev = index > 0;
  const canGoNext = index < items.length - 1;

  if (!mounted || !item) return null;

  const overlay = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Album media focus"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/62"
        onClick={onClose}
        aria-label="Close"
      />

      <div
        className="relative flex w-full flex-col overflow-hidden border border-white/10 bg-[rgba(0,0,0,0.88)] shadow-2xl"
        style={{
          width: FOCUS_MODAL_WIDTH,
          maxWidth: 'calc(100vw - 2rem)',
          height: FOCUS_MODAL_HEIGHT,
          maxHeight: 'calc(100dvh - 2rem)',
          borderRadius: FOCUS_MODAL_RADIUS_PX,
        }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        role="presentation"
      >
        <div className="shrink-0 border-b border-white/10 px-3 pb-2.5 pt-2.5">
          <div className="relative flex min-h-[44px] items-center">
            <div className="flex min-w-0 flex-1 items-center gap-2 pr-2">
              {item.author ? (
                <>
                  <span className="size-9 shrink-0 overflow-hidden rounded-full border border-white/35">
                    <UserAvatar user={{ avatarUrl: item.author?.avatarUrl }} size={36} className="size-full" />
                  </span>
                  <span className="truncate text-[13px] font-extrabold text-white">
                    {item.author.username || 'Member'}
                  </span>
                </>
              ) : null}
            </div>
            <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1">
              <button
                type="button"
                onClick={goPrev}
                disabled={!canGoPrev}
                className="flex size-8 items-center justify-center rounded-full text-white/85 transition hover:bg-white/10 disabled:pointer-events-none disabled:opacity-30"
                aria-label="Previous post"
              >
                <HugeiconsIcon icon={ArrowLeft01Icon} size={20} />
              </button>
              <p className="min-w-[2.75rem] text-center text-[11px] font-black uppercase tracking-[0.12em] text-white/85">
                {index + 1}/{items.length}
              </p>
              <button
                type="button"
                onClick={goNext}
                disabled={!canGoNext}
                className="flex size-8 items-center justify-center rounded-full text-white/85 transition hover:bg-white/10 disabled:pointer-events-none disabled:opacity-30"
                aria-label="Next post"
              >
                <HugeiconsIcon icon={ArrowRight01Icon} size={20} />
              </button>
            </div>
            <div className="flex min-w-0 flex-1 justify-end pl-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full px-2.5 py-1 text-sm font-semibold text-white/70 hover:bg-white/10 hover:text-white"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        <div
          ref={pagerRef}
          className="no-scrollbar flex min-h-0 flex-1 snap-x snap-mandatory overflow-x-auto overflow-y-hidden outline-none"
          onScroll={handlePagerScroll}
          tabIndex={-1}
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {items.map((slideItem, slideIndex) => (
            <div
              key={publicAlbumMediaId(slideItem) || slideIndex}
              className="flex h-full w-full shrink-0 snap-start snap-always flex-col"
              aria-hidden={slideIndex !== index}
            >
              <PublicAlbumFocusSlide
                item={slideItem}
                isActive={slideIndex === index}
                albumId={albumId}
                manuallyPausedIds={manuallyPausedIds}
                setManuallyPausedIds={setManuallyPausedIds}
                playbackPositionsRef={playbackPositionsRef}
              />
            </div>
          ))}
        </div>

        <div className="shrink-0 border-t border-white/10 px-[22px] py-3">
          <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-black/50 px-3 py-2.5">
            <p className="min-w-0 flex-1 text-[11px] leading-snug text-zinc-400">
              React and comment in the PXI app — this page is read-only
            </p>
            {openInAppUrl ? (
              <a
                href={openInAppUrl}
                className="shrink-0 rounded-full bg-white px-3.5 py-2 text-xs font-bold text-black hover:bg-zinc-200"
              >
                Open
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}
