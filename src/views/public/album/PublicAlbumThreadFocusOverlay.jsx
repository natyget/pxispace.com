'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { ArrowLeft01Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import UserAvatar from '@/components/ui/UserAvatar';
import { FOCUS_SHEET_RADIUS_PX } from './albumFocusLayout';
import PublicAlbumFocusSlide from './PublicAlbumFocusSlide';
import { useFocusOverlayPager } from './useFocusOverlayPager';
import { publicAlbumMediaId } from './useAlbumThreadActiveVideo';

/** Mirrors mobile `FocusOverlay` DRAG_CLOSE_THRESHOLD / DRAG_CLOSE_VELOCITY. */
const DRAG_CLOSE_THRESHOLD = 120;
const DRAG_CLOSE_VELOCITY = 800;
/** Drag distance (px) over which the backdrop scrim fully fades — live-tracked, not a snap. */
const SCRIM_FADE_DISTANCE = 480;

/** Full-bleed immersive media viewer — mirrors mobile `FocusOverlay.tsx`: full-viewport
 * sheet, drag-down (touch or pointer) to dismiss with a live-tracked scrim, no polaroid
 * frame around the media (that's grid-thumbnail-only styling). */
export default function PublicAlbumThreadFocusOverlay({
  items,
  index,
  albumId,
  onClose,
  onIndexChange,
}) {
  const item = items[index] ?? null;
  const playbackPositionsRef = useRef(new Map());
  const rootRef = useRef(null);
  const [mounted, setMounted] = useState(false);
  const [manuallyPausedIds, setManuallyPausedIds] = useState(() => new Set());
  const [viewport, setViewport] = useState({ width: 390, height: 844 });

  const { pagerRef, handlePagerScroll, goPrev, goNext } = useFocusOverlayPager({
    index,
    itemCount: items.length,
    onIndexChange,
  });

  const y = useMotionValue(0);
  const scrimOpacity = useTransform(y, [0, SCRIM_FADE_DISTANCE], [1, 0], { clamp: true });

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
    const measure = () => setViewport({ width: window.innerWidth, height: window.innerHeight });
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
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

  const dismiss = useMemo(
    () => () => {
      animate(y, viewport.height, { duration: 0.22, ease: 'easeIn' });
      onClose();
    },
    [y, viewport.height, onClose],
  );

  const handleDragEnd = (_e, info) => {
    if (info.offset.y > DRAG_CLOSE_THRESHOLD || info.velocity.y > DRAG_CLOSE_VELOCITY) {
      dismiss();
      return;
    }
    animate(y, 0, { type: 'spring', damping: 24, stiffness: 300 });
  };

  const openInAppUrl = albumId ? `pxi://album/${albumId}` : null;

  const canGoPrev = index > 0;
  const canGoNext = index < items.length - 1;

  if (!mounted || !item) return null;

  const overlay = (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[9999]"
      role="dialog"
      aria-modal="true"
      aria-label="Album media focus"
    >
      {/* Scrim — opacity is live-linked to drag offset, not a snap. Only visible while the
          sheet is being dragged down, since the sheet is full-bleed at rest. */}
      <motion.div className="absolute inset-0 bg-black" style={{ opacity: scrimOpacity }} aria-hidden />

      <motion.div
        className="absolute inset-0 flex flex-col overflow-hidden bg-[#050505]"
        style={{
          y,
          borderTopLeftRadius: FOCUS_SHEET_RADIUS_PX,
          borderTopRightRadius: FOCUS_SHEET_RADIUS_PX,
        }}
        drag="y"
        dragConstraints={{ top: 0, bottom: viewport.height }}
        dragElastic={{ top: 0, bottom: 1 }}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
      >
        <div className="shrink-0 bg-[rgba(26,26,26,0.6)] px-3 pb-2.5 pt-2.5 backdrop-blur-xl">
          {/* Drag handle affordance */}
          <div className="mb-1.5 flex justify-center">
            <span className="h-1 w-9 rounded-full bg-white/25" aria-hidden />
          </div>
          <div className="relative flex min-h-[44px] items-center">
            <div className="flex min-w-0 flex-1 items-center gap-2 pr-2">
              {item.author ? (
                <>
                  <span className="size-9 shrink-0 overflow-hidden rounded-full">
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
                onClick={dismiss}
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
          style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x' }}
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
                viewportW={viewport.width}
                viewportH={viewport.height}
              />
            </div>
          ))}
        </div>

        <div className="shrink-0 bg-[rgba(26,26,26,0.6)] px-[22px] py-3 backdrop-blur-xl">
          <div className="flex items-center gap-3 rounded-2xl bg-black/40 px-3 py-2.5">
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
      </motion.div>
    </div>
  );

  return createPortal(overlay, document.body);
}
