'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import UserAvatar from '@/components/ui/UserAvatar';
import { displayImageSrc } from '@/lib/mediaUrl';
import { ALBUM_MEDIA_FRAME_COLOR } from './albumLayoutConstants';
import { mediaDisplayUrl } from './albumMediaLayout';
import {
  COMMENT_SHIFT_X,
  COMMENT_STACK_OVERLAP,
  COMMENT_TILTS_DEG,
  FOCUS_MEDIA_ZONE_PADDING_Y,
  FOCUS_MODAL_HEIGHT,
  FOCUS_MODAL_RADIUS_PX,
  FOCUS_MODAL_WIDTH,
  FOCUS_SHEET_MEDIA_BORDER_PX,
  formatFocusRelativeTime,
  getFocusModalLayout,
  sortFocusComments,
} from './albumFocusLayout';
import { getThreadReactionPills, normalizeEmojiForDisplay } from './albumSocialDisplay';

function FocusCommentCard({ comment, index }) {
  const actor = comment.sender ?? comment.author ?? {};
  const rawUsername = String(actor.username ?? actor.handle ?? '').trim();
  const displayName = rawUsername.replace(/^@+/, '') || 'Member';
  const tilt = COMMENT_TILTS_DEG[index % COMMENT_TILTS_DEG.length];
  const shift = COMMENT_SHIFT_X[index % COMMENT_SHIFT_X.length];

  return (
    <div
      className="relative w-[86%] max-w-[320px] self-center"
      style={{
        marginTop: index === 0 ? 0 : -COMMENT_STACK_OVERLAP,
        zIndex: index + 1,
        transform: `rotate(${tilt}deg) translateX(${shift}px)`,
      }}
    >
      <div className="relative overflow-hidden rounded-[14px] border-[1.5px] border-[rgba(138,144,158,0.48)] bg-[rgba(24,26,32,0.35)]">
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 via-white/[0.03] to-black/20"
          aria-hidden
        />
        <div className="relative z-[2] flex items-start gap-2 px-[9px] py-[7px]">
          <span className="size-8 shrink-0 overflow-hidden rounded-full border border-white/30">
            <UserAvatar user={{ avatarUrl: actor.avatarUrl }} size={32} className="size-full" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="mb-1 flex items-center justify-between gap-2">
              <span className="truncate text-[11px] font-extrabold tracking-wide text-[rgba(158,162,176,0.98)]">
                {displayName}
              </span>
              <span className="shrink-0 text-[9px] font-semibold text-[rgba(158,162,176,0.75)]">
                {formatFocusRelativeTime(comment.createdAt)}
              </span>
            </span>
            <p className="text-[13px] font-medium leading-[18px] text-white">{comment.content}</p>
          </span>
        </div>
      </div>
    </div>
  );
}

export default function PublicAlbumThreadFocusOverlay({
  items,
  index,
  albumId,
  onClose,
  onIndexChange,
}) {
  const item = items[index] ?? null;
  const commentsRef = useRef(null);
  const [mounted, setMounted] = useState(false);

  const isVideo = item && String(item.type || '').toUpperCase() === 'VIDEO';
  const previewSrc = item ? displayImageSrc(mediaDisplayUrl(item), null) : null;
  const fullVideoSrc =
    item && isVideo ? displayImageSrc(item.r2Url || item.thumbnailUrl, null) : null;
  const comments = useMemo(() => sortFocusComments(item), [item]);
  const reactionPills = useMemo(() => (item ? getThreadReactionPills(item) : []), [item]);
  const openInAppUrl = albumId ? `pxi://album/${albumId}` : null;

  const layout = useMemo(() => (item ? getFocusModalLayout(item) : null), [item]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const scrollCommentsToEnd = useCallback(() => {
    const el = commentsRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, []);

  useEffect(() => {
    if (!item) return;
    scrollCommentsToEnd();
    const t1 = setTimeout(scrollCommentsToEnd, 80);
    const t2 = setTimeout(scrollCommentsToEnd, 240);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [item?.id, comments.length, scrollCommentsToEnd]);

  const goPrev = useCallback(() => {
    if (index > 0) onIndexChange(index - 1);
  }, [index, onIndexChange]);

  const goNext = useCallback(() => {
    if (index < items.length - 1) onIndexChange(index + 1);
  }, [index, items.length, onIndexChange]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, goPrev, goNext]);

  if (!mounted || !item || !layout) return null;

  const hasMedia = Boolean((isVideo && fullVideoSrc) || previewSrc);

  const overlay = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Thread post focus"
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
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/50">
            {index + 1} / {items.length}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-2.5 py-1 text-sm font-semibold text-white/70 hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          {/* Media — centered in modal */}
          <div
            className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden"
            style={{ paddingTop: FOCUS_MEDIA_ZONE_PADDING_Y, paddingBottom: FOCUS_MEDIA_ZONE_PADDING_Y }}
          >
            {index > 0 ? (
              <button
                type="button"
                onClick={goPrev}
                className="absolute left-1 z-30 rounded-full bg-black/50 px-2.5 py-2 text-lg text-white hover:bg-black/70"
                aria-label="Previous post"
              >
                ‹
              </button>
            ) : null}

            <div className="relative flex flex-col items-center px-3">
              <div
                className="relative overflow-hidden rounded-[23px]"
                style={{
                  width: layout.outerW,
                  maxWidth: FOCUS_MODAL_WIDTH - 32,
                  backgroundColor: ALBUM_MEDIA_FRAME_COLOR,
                  padding: FOCUS_SHEET_MEDIA_BORDER_PX,
                }}
              >
                <div
                  className="relative overflow-hidden rounded-2xl bg-black"
                  style={{ width: layout.mediaDisplay.width, height: layout.mediaDisplay.height }}
                >
                  {isVideo && fullVideoSrc ? (
                    <video
                      src={fullVideoSrc}
                      poster={previewSrc || undefined}
                      className="size-full object-cover"
                      autoPlay
                      muted
                      loop
                      playsInline
                    />
                  ) : previewSrc ? (
                    <Image
                      src={previewSrc}
                      alt=""
                      width={layout.mediaDisplay.width}
                      height={layout.mediaDisplay.height}
                      unoptimized
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="flex size-full min-h-[160px] min-w-[200px] items-center justify-center bg-zinc-900 text-xs text-zinc-500">
                      Media unavailable
                    </div>
                  )}
                  <div
                    className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/30"
                    aria-hidden
                  />

                  {item.author ? (
                    <span className="absolute right-1 top-1 z-[25] max-w-[85%] overflow-hidden rounded-full border border-white/[0.42] bg-black/55">
                      <span className="flex items-center gap-2 py-1 pl-2.5 pr-2">
                        <span className="truncate text-xs font-extrabold text-white">
                          {item.author.username || 'Member'}
                        </span>
                        <span className="relative size-7 shrink-0 overflow-hidden rounded-full border border-white/35">
                          <UserAvatar user={{ avatarUrl: item.author?.avatarUrl }} size={28} className="size-full" />
                        </span>
                      </span>
                    </span>
                  ) : null}

                  {reactionPills.length > 0 ? (
                    <div className="absolute right-1 top-12 z-[25] flex max-h-[140px] flex-col items-end gap-1 overflow-y-auto no-scrollbar">
                      {reactionPills.map((r) => (
                        <span
                          key={r.emoji}
                          className="inline-flex items-center gap-1 rounded-full border border-white/30 bg-[rgba(20,22,28,0.72)] px-1.5 py-1 text-sm"
                        >
                          <span>{normalizeEmojiForDisplay(r.emoji)}</span>
                          <span className="text-xs font-bold text-[#f3f4f7]">{r.count}</span>
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            {index < items.length - 1 ? (
              <button
                type="button"
                onClick={goNext}
                className="absolute right-1 z-30 rounded-full bg-black/50 px-2.5 py-2 text-lg text-white hover:bg-black/70"
                aria-label="Next post"
              >
                ›
              </button>
            ) : null}
          </div>

          {/* Comments */}
          <div
            className="relative shrink-0 overflow-hidden border-t border-white/10"
            style={{ height: layout.commentsSectionHeight }}
          >
            <div
              ref={commentsRef}
              className="no-scrollbar flex h-full flex-col items-center overflow-y-auto px-6 pb-3 pt-3"
            >
              {comments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <p className="text-sm font-semibold text-white/70">No comments yet</p>
                  <p className="mt-1 text-xs text-white/40">
                    {hasMedia ? 'Open the app to be the first' : 'Open the app to view this post'}
                  </p>
                </div>
              ) : (
                comments.map((comment, i) => (
                  <FocusCommentCard key={comment.id || i} comment={comment} index={i} />
                ))
              )}
            </div>
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-black/80 to-transparent"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/80 to-transparent"
              aria-hidden
            />
          </div>

          {/* Read-only CTA */}
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
    </div>
  );

  return createPortal(overlay, document.body);
}
