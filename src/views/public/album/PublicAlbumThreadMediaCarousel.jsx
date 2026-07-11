'use client';

// Instagram-style carousel card for a burst of media posted by the same member
// (grouped in buildPublicAlbumTimeline). One polaroid frame, swipeable snap
// slides, bottom progress dots; the reaction bar targets the ACTIVE slide.
// Visual language mirrors PublicAlbumThreadMediaCard.

import Image from 'next/image';
import { VolumeHighIcon, VolumeOffIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import UserAvatar from '@/components/ui/UserAvatar';
import { displayImageSrc } from '@/lib/mediaUrl';
import {
  getThreadLayoutMetrics,
  mediaDisplayUrl,
  mediaFullUrl,
  resolveIntrinsicSize,
  threadMediaBox,
} from './albumMediaLayout';
import {
  ALBUM_MEDIA_FRAME_COLOR,
  THREAD_CARD_MEDIA_ROW_GAP,
  THREAD_REACTION_BAR_MIN_WIDTH,
  THREAD_SCRAPBOOK_BORDER_PX,
} from './albumLayoutConstants';
import { getLastThreadComment } from './albumSocialDisplay';
import PublicAlbumReactionBar from './PublicAlbumReactionBar';
import { formatAlbumThreadPostTime, formatVideoDuration } from './publicAlbumDate';
import {
  albumPlaybackKey,
  useAlbumExclusiveVideoPlayback,
  useVideoElementRef,
} from './albumExclusivePlayback';
import { publicAlbumMediaId } from './useAlbumThreadActiveVideo';

const MAX_VISIBLE_DOTS = 10;

function CarouselDots({ count, active }) {
  if (count <= 1) return null;
  let start = 0;
  let end = count;
  if (count > MAX_VISIBLE_DOTS) {
    start = Math.min(Math.max(0, active - Math.floor(MAX_VISIBLE_DOTS / 2)), count - MAX_VISIBLE_DOTS);
    end = start + MAX_VISIBLE_DOTS;
  }
  const dots = [];
  for (let i = start; i < end; i++) {
    const isEdge = count > MAX_VISIBLE_DOTS && ((i === start && start > 0) || (i === end - 1 && end < count));
    dots.push(
      <span
        key={i}
        className={`rounded-full transition ${isEdge ? 'size-1' : 'size-1.5'} ${
          i === active ? 'bg-white' : 'bg-white/35'
        }`}
      />,
    );
  }
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-2 z-[29] flex items-center justify-center gap-1.5">
      {dots}
    </div>
  );
}

function CarouselVideoSlide({ item, posterSrc, isPlaybackActive, playbackKey }) {
  const { videoRef, videoEl, setVideoRef } = useVideoElementRef();
  const isVideoMutedRef = useRef(false);
  const [videoDurationSec, setVideoDurationSec] = useState(null);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const videoSrc = displayImageSrc(mediaFullUrl(item), null);

  useAlbumExclusiveVideoPlayback(
    playbackKey,
    isPlaybackActive,
    videoEl,
    () => isVideoMutedRef.current,
    () => setIsVideoMuted(true),
  );

  useEffect(() => {
    isVideoMutedRef.current = isVideoMuted;
    if (videoRef.current) videoRef.current.muted = isVideoMuted;
  }, [isVideoMuted, videoRef]);

  const handleVideoMetadata = useCallback(() => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(video.duration) || video.duration <= 0) return;
    setVideoDurationSec(Math.max(1, Math.round(video.duration)));
  }, [videoRef]);

  const toggleVideoMute = useCallback(
    (e) => {
      e?.stopPropagation?.();
      e?.preventDefault?.();
      setIsVideoMuted((muted) => {
        const next = !muted;
        isVideoMutedRef.current = next;
        if (videoRef.current) videoRef.current.muted = next;
        return next;
      });
    },
    [videoRef],
  );

  const durationLabel =
    videoDurationSec != null && videoDurationSec > 0 ? formatVideoDuration(videoDurationSec) : '';

  return (
    <>
      <video
        ref={setVideoRef}
        src={videoSrc || undefined}
        poster={posterSrc || undefined}
        className="size-full object-cover"
        loop
        playsInline
        preload="metadata"
        onLoadedMetadata={handleVideoMetadata}
      />
      {durationLabel ? (
        <span className="pointer-events-none absolute bottom-1.5 left-1.5 z-[26] rounded-full bg-black/65 px-2 py-0.5 text-[11px] font-bold tabular-nums tracking-wide text-white">
          {durationLabel}
        </span>
      ) : null}
      <button
        type="button"
        onClick={toggleVideoMute}
        className="absolute bottom-1.5 right-1.5 z-[27] flex size-9 items-center justify-center rounded-full bg-black/65 text-white"
        aria-label={isVideoMuted ? 'Unmute video' : 'Mute video'}
      >
        <HugeiconsIcon icon={isVideoMuted ? VolumeOffIcon : VolumeHighIcon} size={20} />
      </button>
    </>
  );
}

export default function PublicAlbumThreadMediaCarousel({
  items,
  rotation = 0,
  paneWidth,
  openInAppUrl = null,
  activeVideoId = null,
  onPressSlide,
}) {
  const metrics = useMemo(() => getThreadLayoutMetrics(paneWidth), [paneWidth]);
  const scrollRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const first = items[0];
  const intrinsic = resolveIntrinsicSize(first, { forThread: true });
  const box = threadMediaBox(intrinsic.width, intrinsic.height, metrics);
  const timeLabel = formatAlbumThreadPostTime(first?.createdAt);
  const timestampOnRight = rotation > 0;
  const posterOnRight = rotation < 0;

  const activeItem = items[Math.min(activeIndex, items.length - 1)] || first;
  const activeMediaId = publicAlbumMediaId(activeItem);
  const activeIsVideo = String(activeItem?.type || '').toUpperCase() === 'VIDEO';
  const lastComment = getLastThreadComment(activeItem);

  const reactionBarWidth = box.outerW;
  const reactionBarMinWidth = Math.min(THREAD_REACTION_BAR_MIN_WIDTH, reactionBarWidth);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || el.clientWidth <= 0) return;
    const slideW = el.clientWidth * 0.88; // keep in sync with the slides' basis-[88%] peek layout
    const next = Math.max(0, Math.min(items.length - 1, Math.round(el.scrollLeft / slideW)));
    setActiveIndex((prev) => (prev === next ? prev : next));
  }, [items.length]);

  const handleSlideKeyDown = useCallback(
    (e, index) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onPressSlide?.(index);
      }
    },
    [onPressSlide],
  );

  return (
    <article
      className="mx-auto mb-6 flex w-full max-w-full flex-col items-center"
      style={{
        maxWidth: metrics.threadCardMaxWidth,
        transform: `rotate(${rotation}deg)`,
      }}
      {...(activeIsVideo && activeMediaId ? { 'data-thread-video-id': activeMediaId } : {})}
    >
      <div className="flex w-full flex-col" style={{ width: box.outerW, maxWidth: '100%' }}>
        {timeLabel ? (
          <div className={`mb-1 flex w-full px-1 ${timestampOnRight ? 'justify-end' : 'justify-start'}`}>
            <span className="text-[10px] text-[rgba(158,162,176,0.75)]">{timeLabel}</span>
          </div>
        ) : null}

        <div className="flex w-full flex-col" style={{ gap: THREAD_CARD_MEDIA_ROW_GAP }}>
          <div
            className="relative overflow-hidden rounded-2xl bg-black shadow-[0_8px_16px_rgba(0,0,0,0.5)]"
            style={{
              width: box.outerW,
              maxWidth: '100%',
              height: box.outerH,
              border: `${THREAD_SCRAPBOOK_BORDER_PX}px solid ${ALBUM_MEDIA_FRAME_COLOR}`,
            }}
          >
            <div className="relative overflow-hidden rounded-[9px]" style={{ width: box.width, height: box.height }}>
              <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="no-scrollbar flex size-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden"
              >
                {items.map((item, index) => {
                  const isVideo = String(item.type || '').toUpperCase() === 'VIDEO';
                  const mediaId = publicAlbumMediaId(item);
                  const posterSrc = displayImageSrc(mediaDisplayUrl(item), null);
                  const isActiveSlide = index === activeIndex;
                  return (
                    <div
                      key={mediaId || index}
                      role="button"
                      tabIndex={0}
                      onClick={() => onPressSlide?.(index)}
                      onKeyDown={(e) => handleSlideKeyDown(e, index)}
                      className="relative h-full shrink-0 basis-[88%] snap-center cursor-pointer overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-white/35"
                    >
                      {isVideo ? (
                        <CarouselVideoSlide
                          item={item}
                          posterSrc={posterSrc}
                          isPlaybackActive={Boolean(
                            isActiveSlide && mediaId && activeVideoId === mediaId,
                          )}
                          playbackKey={mediaId ? albumPlaybackKey('thread', mediaId) : null}
                        />
                      ) : posterSrc ? (
                        <Image
                          src={posterSrc}
                          alt=""
                          width={box.width}
                          height={box.height}
                          unoptimized
                          className="size-full object-cover"
                        />
                      ) : null}
                      <div
                        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/30"
                        aria-hidden
                      />
                    </div>
                  );
                })}
              </div>

              {/* Slide count chip (top corner opposite the author pill) */}
              <span
                className={`pointer-events-none absolute top-1.5 z-[26] rounded-full bg-black/65 px-2 py-0.5 text-[10px] font-bold tabular-nums text-white ${
                  posterOnRight ? 'left-1.5' : 'right-1.5'
                }`}
              >
                {activeIndex + 1}/{items.length}
              </span>

              {first?.author ? (
                <>
                  {/* Bottom gradient keeps the author legible over any media (mobile parity). */}
                  <div
                    className="pointer-events-none absolute inset-x-0 bottom-0 z-[24] h-20 bg-gradient-to-t from-black/75 to-transparent"
                    aria-hidden
                  />
                  <span
                    className="absolute left-2 z-[25] flex max-w-[78%] items-center gap-2"
                    style={{ bottom: lastComment ? 62 : 8 }}
                  >
                    <span className="relative size-7 shrink-0 overflow-hidden rounded-full">
                      <UserAvatar user={{ avatarUrl: first.author?.avatarUrl }} size={28} className="size-full" />
                    </span>
                    <span className="truncate text-xs font-extrabold tracking-wide text-white [text-shadow:0_1px_6px_rgba(0,0,0,0.65)]">
                      {first.author.username || 'Member'}
                    </span>
                  </span>
                </>
              ) : null}

              {lastComment ? (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[28] px-[5px] pb-[7px] pt-[3px]">
                  <div className="overflow-hidden rounded-[14px] bg-[rgba(52,56,64,0.72)]">
                    <div className="flex items-start gap-2 px-[9px] py-[7px]">
                      <span className="size-8 shrink-0 overflow-hidden rounded-full">
                        <UserAvatar
                          user={{ avatarUrl: lastComment?.sender?.avatarUrl }}
                          size={32}
                          className="size-full"
                        />
                      </span>
                      <span className="min-w-0 flex-1">
                        <p className="mb-1 text-[11px] font-extrabold tracking-wide text-[rgba(158,162,176,0.98)]">
                          {lastComment.sender?.username || 'Member'}
                        </p>
                        <p className="line-clamp-2 text-[13px] font-medium leading-[18px] text-white">
                          {lastComment.content}
                        </p>
                      </span>
                    </div>
                  </div>
                </div>
              ) : null}

              <CarouselDots count={items.length} active={activeIndex} />
            </div>
          </div>
        </div>

        <div className="mt-1 flex w-full justify-center self-center">
          <PublicAlbumReactionBar
            key={activeMediaId || activeIndex}
            item={activeItem}
            maxWidth={reactionBarWidth}
            minWidth={reactionBarMinWidth}
            openInAppUrl={openInAppUrl}
          />
        </div>
      </div>
    </article>
  );
}
