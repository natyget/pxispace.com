'use client';

import Image from 'next/image';
import { displayImageSrc } from '@/lib/mediaUrl';
import { formatAlbumPostTime } from './publicAlbumDate';
import { isGifContent } from './buildPublicAlbumTimeline';

export default function PublicAlbumThreadMessage({ message, rotation = 0 }) {
  const author = message.author;
  const avatarSrc = displayImageSrc(author?.avatarUrl, null);
  const timeLabel = formatAlbumPostTime(message.createdAt);
  const isGif = isGifContent(message.content);
  const gifSrc = isGif ? displayImageSrc(message.content.trim(), null) : null;

  return (
    <div
      className="mb-3 flex w-full items-end justify-start gap-2.5"
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      {avatarSrc ? (
        <div className="mb-0.5 size-[38px] shrink-0 overflow-hidden rounded-full border-[1.5px] border-white/40 bg-[#12141a]">
          <Image
            src={avatarSrc}
            alt=""
            width={38}
            height={38}
            unoptimized
            className="size-full object-cover"
          />
        </div>
      ) : (
        <div className="mb-0.5 size-[38px] shrink-0 rounded-full border-[1.5px] border-white/40 bg-[#12141a]" />
      )}
      <div
        className={`max-w-[300px] shrink overflow-hidden rounded-[14px] border-[1.5px] border-[rgba(52,56,64,0.92)] bg-white/[0.08] ${
          isGif ? 'border-0 bg-transparent' : 'rounded-bl-lg'
        }`}
      >
        <div className="px-2 py-1.5">
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
          {isGif && gifSrc ? (
            <Image
              src={gifSrc}
              alt="GIF"
              width={200}
              height={150}
              unoptimized
              className="mt-1 h-[150px] w-[200px] max-w-full object-contain"
            />
          ) : (
            <p className="whitespace-pre-wrap text-sm leading-[19px] text-white">
              {message.content}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
