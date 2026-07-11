'use client';

import Image from 'next/image';
import UserAvatar from '@/components/ui/UserAvatar';
import { displayImageSrc } from '@/lib/mediaUrl';
import { formatAlbumPostTime } from './publicAlbumDate';
import { isGifContent } from './buildPublicAlbumTimeline';

// Mirrors the mobile album thread: borderless bubbles, and GIFs render bare
// (rounded media, no tray/header) — the avatar alone carries attribution.
export default function PublicAlbumThreadMessage({ message, rotation = 0 }) {
  const author = message.author;
  const timeLabel = formatAlbumPostTime(message.createdAt);
  const isGif = isGifContent(message.content);
  const gifSrc = isGif ? displayImageSrc(message.content.trim(), null) : null;

  return (
    <div
      className="mb-3 flex w-full items-end justify-start gap-2.5"
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      <div className="mb-0.5 size-[38px] shrink-0 overflow-hidden rounded-full">
        <UserAvatar user={{ avatarUrl: author?.avatarUrl }} size={38} className="size-full" />
      </div>
      {isGif && gifSrc ? (
        <Image
          src={gifSrc}
          alt="GIF"
          width={200}
          height={150}
          unoptimized
          className="h-[150px] w-[200px] max-w-full rounded-[14px] rounded-bl-lg object-cover"
        />
      ) : (
        <div className="max-w-[300px] shrink overflow-hidden rounded-[14px] rounded-bl-lg bg-white/[0.08]">
          <div className="px-2.5 py-1.5">
            <div className="mb-1 flex items-center justify-between gap-2">
              {author?.username ? (
                <span className="truncate text-[10px] font-bold text-[#9ea2b0]">
                  {author.username}
                </span>
              ) : (
                <span />
              )}
              {timeLabel ? (
                <span className="shrink-0 text-[9px] text-[#9ea2b0]/75">{timeLabel}</span>
              ) : null}
            </div>
            <p className="whitespace-pre-wrap text-sm leading-[19px] text-white">
              {message.content}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
