'use client';

import Image from 'next/image';
import { useMemo } from 'react';
import UserAvatar from '@/components/ui/UserAvatar';
import { displayImageSrc } from '@/lib/mediaUrl';
import {
  getThreadLayoutMetrics,
  mediaDisplayUrl,
  resolveIntrinsicSize,
  threadMediaBox,
} from './albumMediaLayout';
import {
  ALBUM_MEDIA_FRAME_COLOR,
  THREAD_CARD_MEDIA_ROW_GAP,
  THREAD_SCRAPBOOK_BORDER_PX,
} from './albumLayoutConstants';
import { getLastThreadComment, getThreadReactionPills } from './albumSocialDisplay';
import { formatAlbumPostTime } from './publicAlbumDate';

export default function PublicAlbumScrapbookPost({
  item,
  rotation = 0,
  onPress,
  paneWidth,
}) {
  const metrics = useMemo(() => getThreadLayoutMetrics(paneWidth), [paneWidth]);

  const isVideo = String(item.type || '').toUpperCase() === 'VIDEO';
  const intrinsic = resolveIntrinsicSize(item, { canonicalImage: !isVideo });
  const box = threadMediaBox(intrinsic.width, intrinsic.height, metrics);
  const src = displayImageSrc(mediaDisplayUrl(item), null);
  const timeLabel = formatAlbumPostTime(item.createdAt);
  const reactionPills = getThreadReactionPills(item);
  const lastComment = getLastThreadComment(item);

  if (!src) return null;

  return (
    <article
      className="mx-auto mb-6 w-full max-w-full"
      style={{
        maxWidth: metrics.threadCardMaxWidth,
        transform: `rotate(${rotation}deg)`,
      }}
    >
      <button type="button" onClick={onPress} className="group w-full text-left focus:outline-none">
        <div
          className="flex w-full flex-col items-center"
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
              <Image
                src={src}
                alt=""
                width={box.width}
                height={box.height}
                unoptimized
                className="size-full object-cover transition group-hover:brightness-105"
              />
              <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/30"
                aria-hidden
              />

              {isVideo ? (
                <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20">
                  <span className="flex size-12 items-center justify-center rounded-full bg-black/50 text-lg text-white">
                    ▶
                  </span>
                </span>
              ) : null}

              {item.author ? (
                <span className="absolute right-0 top-0 z-[25] max-w-[78%] overflow-hidden rounded-full border border-white/[0.42]">
                  <span className="absolute inset-0 rounded-full bg-black/56" aria-hidden />
                  <span className="relative flex items-center gap-2 py-1.5 pl-2.5 pr-2.5">
                    <span className="truncate text-xs font-extrabold tracking-wide text-white">
                      {item.author.username || 'Member'}
                    </span>
                    <span className="relative size-7 shrink-0 overflow-hidden rounded-full border border-white/35">
                      <UserAvatar user={{ avatarUrl: item.author?.avatarUrl }} size={28} className="size-full" />
                    </span>
                  </span>
                </span>
              ) : null}

              {lastComment ? (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[28] px-[5px] pb-[7px] pt-[3px]">
                  <div className="overflow-hidden rounded-[14px] border-[1.5px] border-[rgba(138,144,158,0.48)] bg-[rgba(92,96,108,0.38)]">
                    <div className="flex items-start gap-2 px-[9px] py-[7px]">
                      <span className="size-8 shrink-0 overflow-hidden rounded-full border border-white/30">
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
          </div>

          {(reactionPills.length > 0 || timeLabel) ? (
            <div
              className="flex w-full items-center"
              style={{ width: box.outerW, maxWidth: '100%' }}
            >
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 px-1 py-1.5">
                {reactionPills.map((r) => (
                  <span
                    key={r.emoji}
                    className="inline-flex items-center gap-1 rounded-full border border-white/[0.42] bg-transparent px-1.5 py-1 text-[15px] leading-none text-white/90"
                  >
                    <span>{r.emoji}</span>
                    <span className="text-xs font-bold">×{r.count}</span>
                  </span>
                ))}
              </div>
              {timeLabel ? (
                <span className="shrink-0 pl-2 pr-1 text-[10px] text-[rgba(158,162,176,0.75)]">
                  {timeLabel}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
      </button>
    </article>
  );
}
