'use client';

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

export default function PublicAlbumThreadMediaCard({
  item,
  rotation = 0,
  onPress,
  paneWidth,
  isPlaybackActive = false,
  openInAppUrl = null,
}) {
  const metrics = useMemo(() => getThreadLayoutMetrics(paneWidth), [paneWidth]);
  const { videoRef, videoEl, setVideoRef } = useVideoElementRef();
  const isVideoMutedRef = useRef(false);
  const [videoDurationSec, setVideoDurationSec] = useState(null);
  const [isVideoMuted, setIsVideoMuted] = useState(false);

  const isVideo = String(item.type || '').toUpperCase() === 'VIDEO';
  const intrinsic = resolveIntrinsicSize(item, { forThread: true });
  const box = threadMediaBox(intrinsic.width, intrinsic.height, metrics);
  const posterSrc = displayImageSrc(mediaDisplayUrl(item), null);
  const videoSrc = isVideo ? displayImageSrc(mediaFullUrl(item), null) : null;
  const mediaId = publicAlbumMediaId(item);
  const timeLabel = formatAlbumThreadPostTime(item.createdAt);
  const lastComment = getLastThreadComment(item);
  const durationLabel =
    isVideo && videoDurationSec != null && videoDurationSec > 0
      ? formatVideoDuration(videoDurationSec)
      : '';

  const timestampOnRight = rotation > 0;
  const posterOnRight = rotation < 0;

  const threadPlaybackKey = isVideo && mediaId ? albumPlaybackKey('thread', mediaId) : null;
  const shouldPlayThreadVideo = Boolean(isVideo && isPlaybackActive);

  const reactionBarWidth = box.outerW;
  const reactionBarMinWidth = Math.min(THREAD_REACTION_BAR_MIN_WIDTH, reactionBarWidth);

  useAlbumExclusiveVideoPlayback(
    threadPlaybackKey,
    shouldPlayThreadVideo,
    videoEl,
    () => isVideoMutedRef.current,
    () => setIsVideoMuted(true),
  );

  useEffect(() => {
    isVideoMutedRef.current = isVideoMuted;
    if (videoRef.current) videoRef.current.muted = isVideoMuted;
  }, [isVideoMuted, videoRef]);

  useEffect(() => {
    setVideoDurationSec(null);
    setIsVideoMuted(false);
    isVideoMutedRef.current = false;
  }, [item.id, videoSrc, isVideo]);

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

  const handleCardPress = useCallback(() => {
    onPress?.();
  }, [onPress]);

  const handleCardKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onPress?.();
      }
    },
    [onPress],
  );

  if (!posterSrc && !videoSrc) return null;

  return (
    <article
      className="mx-auto mb-6 flex w-full max-w-full flex-col items-center"
      style={{
        maxWidth: metrics.threadCardMaxWidth,
        transform: `rotate(${rotation}deg)`,
      }}
      {...(isVideo && mediaId ? { 'data-thread-video-id': mediaId } : {})}
    >
      <div
        className="flex w-full flex-col"
        style={{ width: box.outerW, maxWidth: '100%' }}
      >
        {timeLabel ? (
          <div
            className={`mb-1 flex w-full px-1 ${timestampOnRight ? 'justify-end' : 'justify-start'}`}
          >
            <span className="text-[10px] text-[rgba(158,162,176,0.75)]">{timeLabel}</span>
          </div>
        ) : null}

        <div
          className="flex w-full flex-col"
          style={{ gap: THREAD_CARD_MEDIA_ROW_GAP }}
        >
          <div
            className="relative overflow-hidden rounded-2xl bg-black shadow-[0_8px_16px_rgba(0,0,0,0.5)]"
            style={{
              width: box.outerW,
              maxWidth: '100%',
              height: box.outerH,
              border: `${THREAD_SCRAPBOOK_BORDER_PX}px solid ${ALBUM_MEDIA_FRAME_COLOR}`,
            }}
          >
            <div
              className="relative overflow-hidden rounded-[9px]"
              style={{ width: box.width, height: box.height }}
            >
              <div
                role="button"
                tabIndex={0}
                onClick={handleCardPress}
                onKeyDown={handleCardKeyDown}
                className="group relative block size-full cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-white/35"
              >
                {isVideo && videoSrc ? (
                  <video
                    ref={setVideoRef}
                    src={videoSrc}
                    poster={posterSrc || undefined}
                    className="size-full object-cover transition group-hover:brightness-105"
                    loop
                    playsInline
                    preload="metadata"
                    onLoadedMetadata={handleVideoMetadata}
                  />
                ) : (
                  <Image
                    src={posterSrc}
                    alt=""
                    width={box.width}
                    height={box.height}
                    unoptimized
                    className="size-full object-cover transition group-hover:brightness-105"
                  />
                )}
                <div
                  className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/30"
                  aria-hidden
                />

                {durationLabel ? (
                  <span className="pointer-events-none absolute left-1.5 top-1.5 z-[26] rounded-full bg-black/65 px-2 py-0.5 text-[11px] font-bold tabular-nums tracking-wide text-white">
                    {durationLabel}
                  </span>
                ) : null}

                {item.author ? (
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
                        <UserAvatar user={{ avatarUrl: item.author?.avatarUrl }} size={28} className="size-full" />
                      </span>
                      <span className="truncate text-xs font-extrabold tracking-wide text-white [text-shadow:0_1px_6px_rgba(0,0,0,0.65)]">
                        {item.author.username || 'Member'}
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
              </div>

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
          </div>
        </div>

        <div className="mt-1 flex w-full justify-center self-center">
          <PublicAlbumReactionBar
            item={item}
            maxWidth={reactionBarWidth}
            minWidth={reactionBarMinWidth}
            openInAppUrl={openInAppUrl}
          />
        </div>
      </div>
    </article>
  );
}
