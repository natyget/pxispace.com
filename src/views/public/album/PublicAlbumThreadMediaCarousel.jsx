'use client';

// Instagram-style carousel card for a burst of media posted by the same member
// (grouped in buildPublicAlbumTimeline). One polaroid frame per slide, swipeable
// snap slides sized from each item's own orientation, bottom progress dots;
// the reaction bar targets each slide. Visual language mirrors PublicAlbumThreadMediaCard.

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
const SLIDE_GAP = 16;

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
    <div className="pointer-events-none flex items-center justify-center gap-1.5">
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

function buildSlideBoxes(items, metrics) {
  let offset = 0;
  return items.map((item, i) => {
    const intrinsic = resolveIntrinsicSize(item, { forThread: true });
    const box = threadMediaBox(intrinsic.width, intrinsic.height, metrics);
    const layout = { ...box, offset };
    offset += box.outerW + (i < items.length - 1 ? SLIDE_GAP : 0);
    return layout;
  });
}

function indexFromScrollLeft(scrollLeft, slideBoxes, clientWidth, spacerLeft) {
  if (!slideBoxes.length || clientWidth <= 0) return 0;
  const viewportCenter = scrollLeft + clientWidth / 2;
  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < slideBoxes.length; i++) {
    const slideCenter = spacerLeft + slideBoxes[i].offset + slideBoxes[i].outerW / 2;
    const d = Math.abs(slideCenter - viewportCenter);
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  }
  return best;
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

  const slideBoxes = useMemo(() => buildSlideBoxes(items, metrics), [items, metrics]);
  const firstBox = slideBoxes[0];
  const lastBox = slideBoxes[slideBoxes.length - 1] || firstBox;

  const first = items[0];
  const timeLabel = formatAlbumThreadPostTime(first?.createdAt);

  const activeItem = items[Math.min(activeIndex, items.length - 1)] || first;
  const activeMediaId = publicAlbumMediaId(activeItem);
  const activeIsVideo = String(activeItem?.type || '').toUpperCase() === 'VIDEO';

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || el.clientWidth <= 0 || !firstBox) return;
    const spacerLeft = Math.max(0, el.clientWidth / 2 - firstBox.outerW / 2);
    const next = indexFromScrollLeft(el.scrollLeft, slideBoxes, el.clientWidth, spacerLeft);
    setActiveIndex((prev) => (prev === next ? prev : next));
  }, [items.length, slideBoxes, firstBox]);

  const handleSlideKeyDown = useCallback(
    (e, index) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onPressSlide?.(index);
      }
    },
    [onPressSlide],
  );

  if (!items.length || !firstBox || !lastBox) return null;

  return (
    <article
      className="mx-auto mb-6 flex w-full max-w-full flex-col items-center"
      style={{
        maxWidth: '100%',
      }}
      {...(activeIsVideo && activeMediaId ? { 'data-thread-video-id': activeMediaId } : {})}
    >
      <div className="flex w-full flex-col items-center" style={{ maxWidth: '100%' }}>
        {timeLabel ? (
          <div className="mb-2 flex w-full justify-center px-1">
            <span className="text-[10px] text-[rgba(158,162,176,0.75)]">{timeLabel}</span>
          </div>
        ) : null}

        <div className="relative w-full max-w-full">
          <div className="mb-3 flex w-full justify-center">
            <CarouselDots count={items.length} active={activeIndex} />
          </div>

          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="no-scrollbar flex w-full snap-x snap-mandatory items-start overflow-x-auto overflow-y-hidden py-4"
          >
            <div className="shrink-0" style={{ width: `calc(50% - ${firstBox.outerW / 2}px)` }} />

            {items.map((item, index) => {
              const box = slideBoxes[index];
              if (!box) return null;
              const isVideo = String(item.type || '').toUpperCase() === 'VIDEO';
              const mediaId = publicAlbumMediaId(item);
              const posterSrc = displayImageSrc(mediaDisplayUrl(item), null);
              const isActiveSlide = index === activeIndex;
              const isLast = index === items.length - 1;
              const tilt = index % 2 === 0 ? rotation : -rotation;
              const slideLastComment = getLastThreadComment(item);
              const reactionBarMinWidth = Math.min(THREAD_REACTION_BAR_MIN_WIDTH, box.outerW);

              return (
                <div
                  key={mediaId || index}
                  className="flex shrink-0 snap-center flex-col items-center focus:outline-none"
                  style={{
                    width: box.outerW,
                    marginRight: isLast ? 0 : SLIDE_GAP,
                    transform: `rotate(${tilt}deg)`,
                  }}
                >
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => onPressSlide?.(index)}
                    onKeyDown={(e) => handleSlideKeyDown(e, index)}
                    className="relative overflow-hidden rounded-2xl bg-black shadow-[0_8px_16px_rgba(0,0,0,0.5)] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/35"
                    style={{
                      width: box.outerW,
                      height: box.outerH,
                      border: `${THREAD_SCRAPBOOK_BORDER_PX}px solid ${ALBUM_MEDIA_FRAME_COLOR}`,
                    }}
                  >
                    <div
                      className="relative overflow-hidden rounded-[9px]"
                      style={{ width: box.width, height: box.height }}
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

                      {item.author ? (
                        <>
                          <div
                            className="pointer-events-none absolute inset-x-0 bottom-0 z-[24] h-20 bg-gradient-to-t from-black/75 to-transparent"
                            aria-hidden
                          />
                          <span
                            className="absolute left-2 z-[25] flex max-w-[78%] items-center gap-2"
                            style={{ bottom: slideLastComment ? 62 : 8 }}
                          >
                            <span className="relative size-7 shrink-0 overflow-hidden rounded-full">
                              <UserAvatar user={{ avatarUrl: item.author?.avatarUrl }} size={28} className="size-full" />
                            </span>
                            <span className="truncate text-xs font-extrabold tracking-wide text-white [text-shadow:0_1px_6px_rgba(0,0,0,0.65)]">
                              {item.author.username || 'Member'}
                            </span>
                          </span>
                        </>
                      ) : null}

                      {slideLastComment ? (
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[28] px-[5px] pb-[7px] pt-[3px]">
                          <div className="overflow-hidden rounded-[14px] bg-[rgba(52,56,64,0.72)]">
                            <div className="flex items-start gap-2 px-[9px] py-[7px]">
                              <span className="size-8 shrink-0 overflow-hidden rounded-full">
                                <UserAvatar
                                  user={{ avatarUrl: slideLastComment?.sender?.avatarUrl }}
                                  size={32}
                                  className="size-full"
                                />
                              </span>
                              <span className="min-w-0 flex-1">
                                <p className="mb-1 text-[11px] font-extrabold tracking-wide text-[rgba(158,162,176,0.98)]">
                                  {slideLastComment.sender?.username || 'Member'}
                                </p>
                                <p className="line-clamp-2 text-[13px] font-medium leading-[18px] text-white">
                                  {slideLastComment.content}
                                </p>
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-3 flex w-full justify-center px-2">
                    <PublicAlbumReactionBar
                      key={mediaId || index}
                      item={item}
                      maxWidth={box.outerW}
                      minWidth={reactionBarMinWidth}
                      openInAppUrl={openInAppUrl}
                    />
                  </div>
                </div>
              );
            })}

            <div className="shrink-0" style={{ width: `calc(50% - ${lastBox.outerW / 2}px)` }} />
          </div>
        </div>
      </div>
    </article>
  );
}
