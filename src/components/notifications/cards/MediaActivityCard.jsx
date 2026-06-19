'use client';

import { useMemo } from 'react';
import { Message01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import SenderAvatar from '../SenderAvatar';
import NotificationMediaThumb from '../NotificationMediaThumb';
import { NOTIFICATION_CARD_CLASS, NOTIFICATION_ROW_CLASS } from '../notificationStyles';
import {
  NOTIFICATION_THUMB_RADIUS,
  resolveMediaThumbAspect,
  thumbnailSizeForMediaAspect,
} from '@/lib/notifications/notificationMediaThumb';
import { uploadNotificationContentLabel } from '@/lib/notifications/uploadNotificationCopy';

function truncateComment(text, max = 20) {
  const trimmed = String(text || '').trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max)}...`;
}

/** Shared layout for reaction / comment / upload rows. */
export default function MediaActivityCard({
  user,
  body,
  time,
  previewUrl,
  aspectRatio,
  mediaWidth,
  mediaHeight,
  onClick,
  avatarBadge,
}) {
  const aspect = useMemo(
    () => resolveMediaThumbAspect(aspectRatio, mediaWidth, mediaHeight),
    [aspectRatio, mediaWidth, mediaHeight],
  );
  const thumbSize = useMemo(() => thumbnailSizeForMediaAspect(aspect), [aspect]);

  return (
    <button type="button" onClick={onClick} className={`${NOTIFICATION_CARD_CLASS} text-left w-full`}>
      <div className={NOTIFICATION_ROW_CLASS}>
        <div className="relative shrink-0">
          <SenderAvatar user={{ ...user, avatarUrl: user?.avatar }} size={44} />
          {avatarBadge}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm leading-5">{body}</p>
          {time ? <p className="text-white/35 text-xs font-medium mt-1.5">{time}</p> : null}
        </div>
        <NotificationMediaThumb
          url={previewUrl}
          width={thumbSize.width}
          height={thumbSize.height}
          borderRadius={NOTIFICATION_THUMB_RADIUS}
        />
      </div>
    </button>
  );
}

export function PhotoReactionCard({ item, onClick }) {
  const senderName = item.user?.name?.trim() || 'Someone';
  const albumName = item.albumName?.trim() || 'album';
  const emoji = item.emoji?.trim() || '❤️';

  return (
    <MediaActivityCard
      user={{ id: item.user?.id, name: senderName, avatarUrl: item.user?.avatar || item.user?.avatarUrl }}
      previewUrl={item.previewUrl}
      aspectRatio={item.aspectRatio}
      mediaWidth={item.mediaWidth}
      mediaHeight={item.mediaHeight}
      time={item.time}
      onClick={() => onClick?.(item)}
      body={
        <>
          <span className="text-white font-bold">{senderName}</span>
          <span className="text-white/40 font-medium"> reacted </span>
          <span className="text-[15px]">{emoji}</span>
          <span className="text-white/40 font-medium"> in </span>
          <span className="text-white font-bold">{albumName}</span>
        </>
      }
    />
  );
}

export function PhotoCommentCard({ item, onClick }) {
  const senderName = item.user?.name?.trim() || 'Someone';
  const albumName = item.albumName?.trim() || 'album';
  const preview = item.comment?.trim() ? truncateComment(item.comment) : null;

  return (
    <MediaActivityCard
      user={{ id: item.user?.id, name: senderName, avatarUrl: item.user?.avatar || item.user?.avatarUrl }}
      previewUrl={item.previewUrl}
      aspectRatio={item.aspectRatio}
      mediaWidth={item.mediaWidth}
      mediaHeight={item.mediaHeight}
      time={item.time}
      onClick={() => onClick?.(item)}
      avatarBadge={
        <span className="absolute -bottom-0.5 -right-0.5 w-7 h-7 rounded-full bg-[#0a0a0a] border border-white/10 flex items-center justify-center">
          <HugeiconsIcon icon={Message01Icon} size={16} color="#fff" strokeWidth={2} />
        </span>
      }
      body={
        <>
          <span className="text-white font-bold">{senderName}</span>
          <span className="text-white/40 font-medium"> commented: </span>
          {preview ? <span className="text-white/75 font-medium">&quot;{preview}&quot;</span> : null}
          <span className="text-white/40 font-medium"> in </span>
          <span className="text-white font-bold">{albumName}</span>
        </>
      }
    />
  );
}

export function PhotoUploadCard({ item, onClick }) {
  const senderName = item.user?.name?.trim() || 'Someone';
  const albumName = item.albumName?.trim() || 'album';
  const label = uploadNotificationContentLabel({
    photoCount: item.photoCount,
    videoCount: item.videoCount,
    uploadCount: item.uploadCount,
  });
  const preview =
    (item.previewUrls?.length ? item.previewUrls[0] : null) || item.previewUrl || null;

  return (
    <MediaActivityCard
      user={{ id: item.user?.id, name: senderName, avatarUrl: item.user?.avatar || item.user?.avatarUrl }}
      previewUrl={preview}
      aspectRatio={item.aspectRatio}
      mediaWidth={item.mediaWidth}
      mediaHeight={item.mediaHeight}
      time={item.time}
      onClick={() => onClick?.(item)}
      body={
        <>
          <span className="text-white font-bold">{senderName}</span>
          <span className="text-white/40 font-medium"> posted {label} in </span>
          <span className="text-white font-bold">{albumName}</span>
        </>
      }
    />
  );
}
