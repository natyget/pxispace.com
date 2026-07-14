'use client';

import Image from 'next/image';
import { VolumeHighIcon, VolumeOffIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import UserAvatar from '@/components/ui/UserAvatar';
import { displayImageSrc } from '@/lib/mediaUrl';
import { mediaDisplayUrl, mediaFullUrl } from './albumMediaLayout';
import {
  COMMENT_SHIFT_X,
  COMMENT_STACK_OVERLAP,
  COMMENT_TILTS_DEG,
  FOCUS_MEDIA_ZONE_PADDING_Y,
  formatFocusRelativeTime,
  getFocusModalLayout,
  sortFocusComments,
} from './albumFocusLayout';
import PublicAlbumReactionBar from './PublicAlbumReactionBar';
import { formatVideoProgressClockFromMs } from './publicAlbumDate';
import {
  albumPlaybackKey,
  useAlbumExclusiveVideoPlayback,
  useVideoElementRef,
} from './albumExclusivePlayback';
import { publicAlbumMediaId } from './useAlbumThreadActiveVideo';

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

export default function PublicAlbumFocusSlide({
  item,
  isActive,
  albumId,
  manuallyPausedIds,
  setManuallyPausedIds,
  playbackPositionsRef,
  viewportW,
  viewportH,
}) {
  const commentsRef = useRef(null);
  const { videoRef: focusVideoRef, videoEl: focusVideoEl, setVideoRef: setFocusVideoRef } =
    useVideoElementRef();
  const isVideoMutedRef = useRef(false);
  const prevActiveRef = useRef(isActive);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [playbackPositionMs, setPlaybackPositionMs] = useState(0);
  const [playbackDurationMs, setPlaybackDurationMs] = useState(0);

  const isVideo = item && String(item.type || '').toUpperCase() === 'VIDEO';
  const previewSrc = item ? displayImageSrc(mediaDisplayUrl(item), null) : null;
  const fullVideoSrc = item && isVideo ? displayImageSrc(mediaFullUrl(item), null) : null;
  const comments = useMemo(() => sortFocusComments(item), [item]);
  const openInAppUrl = albumId ? `pxi://album/${albumId}` : null;
  const mediaId = item ? publicAlbumMediaId(item) : '';
  const focusPlaybackKey = isVideo && mediaId ? albumPlaybackKey('focus', mediaId) : null;
  const isManuallyPaused = mediaId ? manuallyPausedIds.has(mediaId) : false;
  const shouldPlayFocusVideo = Boolean(isActive && isVideo && !isManuallyPaused);
  const initialPlaybackTime = mediaId ? playbackPositionsRef.current.get(mediaId) : undefined;

  const layout = useMemo(
    () => (item ? getFocusModalLayout(item, viewportW, viewportH) : null),
    [item, viewportW, viewportH],
  );
  const isPortraitMedia =
    layout != null && layout.mediaDisplay.height > layout.mediaDisplay.width;

  const progressLabel = useMemo(() => {
    if (!isVideo) return '';
    const current = formatVideoProgressClockFromMs(playbackPositionMs);
    const totalMs =
      playbackDurationMs > 0
        ? playbackDurationMs
        : item?.durationSeconds
          ? Number(item.durationSeconds) * 1000
          : 0;
    const total = formatVideoProgressClockFromMs(totalMs);
    if (!total) return current;
    return `${current}/${total}`;
  }, [isVideo, playbackPositionMs, playbackDurationMs, item?.durationSeconds]);

  const savePlaybackPosition = useCallback(
    (seconds) => {
      if (!mediaId || !Number.isFinite(seconds) || seconds < 0) return;
      playbackPositionsRef.current.set(mediaId, seconds);
    },
    [mediaId, playbackPositionsRef],
  );

  useAlbumExclusiveVideoPlayback(
    focusPlaybackKey,
    shouldPlayFocusVideo,
    focusVideoEl,
    () => isVideoMutedRef.current,
    () => setIsVideoMuted(true),
  );

  useEffect(() => {
    if (!isActive) {
      setIsVideoMuted(false);
      isVideoMutedRef.current = false;
      return;
    }
    setPlaybackPositionMs(0);
    setPlaybackDurationMs(0);
  }, [item?.id, fullVideoSrc, isVideo, isActive]);

  useEffect(() => {
    if (prevActiveRef.current && !isActive && isVideo && mediaId) {
      const video = focusVideoRef.current;
      if (video) savePlaybackPosition(video.currentTime);
    }
    prevActiveRef.current = isActive;
  }, [isActive, isVideo, mediaId, savePlaybackPosition, focusVideoRef]);

  useEffect(() => {
    return () => {
      if (!isVideo || !mediaId || !prevActiveRef.current) return;
      const video = focusVideoRef.current;
      if (video) savePlaybackPosition(video.currentTime);
    };
  }, [isVideo, mediaId, savePlaybackPosition, focusVideoRef]);

  useEffect(() => {
    if (!isActive || !isVideo || !mediaId || !focusVideoEl) return;
    const saved = initialPlaybackTime;
    if (saved != null && saved > 0.05) {
      focusVideoEl.currentTime = saved;
      setPlaybackPositionMs(Math.round(saved * 1000));
    }
  }, [isActive, isVideo, mediaId, focusVideoEl, initialPlaybackTime]);

  useEffect(() => {
    isVideoMutedRef.current = isVideoMuted;
    const video = focusVideoRef.current;
    if (video) video.muted = isVideoMuted;
  }, [isVideoMuted, focusVideoRef]);

  const scrollCommentsToEnd = useCallback(() => {
    const el = commentsRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, []);

  useEffect(() => {
    if (!isActive || !item) return;
    scrollCommentsToEnd();
    const t1 = window.setTimeout(scrollCommentsToEnd, 80);
    const t2 = window.setTimeout(scrollCommentsToEnd, 240);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [isActive, item?.id, comments.length, scrollCommentsToEnd]);

  const toggleVideoMute = useCallback(
    (e) => {
      e?.stopPropagation?.();
      e?.preventDefault?.();
      setIsVideoMuted((muted) => {
        const next = !muted;
        isVideoMutedRef.current = next;
        if (focusVideoRef.current) focusVideoRef.current.muted = next;
        return next;
      });
    },
    [focusVideoRef],
  );

  const toggleVideoPause = useCallback(() => {
    if (!mediaId) return;
    setManuallyPausedIds((prev) => {
      const next = new Set(prev);
      if (next.has(mediaId)) next.delete(mediaId);
      else next.add(mediaId);
      return next;
    });
  }, [mediaId, setManuallyPausedIds]);

  const handleVideoTimeUpdate = useCallback(() => {
    const video = focusVideoRef.current;
    if (!video) return;
    setPlaybackPositionMs(Math.max(0, video.currentTime * 1000));
    if (Number.isFinite(video.duration) && video.duration > 0) {
      setPlaybackDurationMs(video.duration * 1000);
    }
  }, [focusVideoRef]);

  const handleVideoMetadata = useCallback(() => {
    const video = focusVideoRef.current;
    if (!video || !Number.isFinite(video.duration) || video.duration <= 0) return;
    setPlaybackDurationMs(video.duration * 1000);
  }, [focusVideoRef]);

  if (!item || !layout) return null;

  const hasMedia = Boolean((isVideo && fullVideoSrc) || previewSrc);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden"
        style={{ minHeight: layout.focusMediaZoneMinHeight }}
      >
        <div
          className={`relative flex w-full items-center justify-center px-3 ${isPortraitMedia ? 'flex-row gap-2' : 'flex-col'}`}
          style={{
            paddingTop: FOCUS_MEDIA_ZONE_PADDING_Y,
            paddingBottom: FOCUS_MEDIA_ZONE_PADDING_Y,
          }}
        >
          {/* Immersive full-bleed view — no polaroid/photo-frame border (that's grid-only styling). */}
          <div
            className="relative overflow-hidden rounded-2xl bg-black"
            style={{ width: layout.mediaDisplay.width, height: layout.mediaDisplay.height, maxWidth: '100%' }}
          >
            <button
              type="button"
              className="relative block size-full"
              onClick={isVideo ? toggleVideoPause : undefined}
              aria-label={isVideo && isManuallyPaused ? 'Play video' : undefined}
            >
              {isVideo && fullVideoSrc ? (
                <video
                  ref={setFocusVideoRef}
                  src={fullVideoSrc}
                  poster={previewSrc || undefined}
                  className="size-full object-cover"
                  loop
                  playsInline
                  preload={isActive ? 'auto' : 'metadata'}
                  onLoadedMetadata={handleVideoMetadata}
                  onTimeUpdate={handleVideoTimeUpdate}
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

              {isVideo && isManuallyPaused ? (
                <span className="pointer-events-none absolute inset-0 z-[24] bg-black/28" aria-hidden />
              ) : null}

              {isVideo && isManuallyPaused ? (
                <span className="pointer-events-none absolute left-1/2 top-1/2 z-[25] flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-3xl text-white">
                  ▶
                </span>
              ) : null}

              {isVideo && progressLabel ? (
                <span className="pointer-events-none absolute bottom-1.5 left-1.5 z-[26] rounded-full bg-black/65 px-2 py-0.5 text-[11px] font-bold tabular-nums tracking-wide text-white">
                  {progressLabel}
                </span>
              ) : null}
            </button>

            {isVideo ? (
              <button
                type="button"
                onClick={toggleVideoMute}
                className="absolute bottom-1.5 right-1.5 z-[27] flex size-9 items-center justify-center rounded-full bg-black/65 text-white"
                aria-label={isVideoMuted ? 'Unmute video' : 'Mute video'}
              >
                <HugeiconsIcon icon={isVideoMuted ? VolumeOffIcon : VolumeHighIcon} size={20} />
              </button>
            ) : null}
          </div>

          <div className={isPortraitMedia ? 'shrink-0 self-center' : 'mt-1 flex w-full justify-center self-center'}>
            <PublicAlbumReactionBar
              item={item}
              layout={isPortraitMedia ? 'vertical' : 'horizontal'}
              maxWidth={isPortraitMedia ? 48 : layout.mediaDisplay.width}
              maxHeight={isPortraitMedia ? layout.mediaDisplay.height : undefined}
              openInAppUrl={openInAppUrl}
            />
          </div>
        </div>
      </div>

      <div
        className="relative shrink-0 overflow-hidden"
        style={{ height: layout.commentsSectionHeight }}
      >
        <div
          ref={commentsRef}
          data-focus-comments-scroll
          onPointerDown={(e) => e.stopPropagation()}
          className="no-scrollbar flex h-full flex-col items-center overflow-y-auto px-6 pb-3 pt-3"
          style={{ touchAction: 'pan-y' }}
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
    </div>
  );
}
