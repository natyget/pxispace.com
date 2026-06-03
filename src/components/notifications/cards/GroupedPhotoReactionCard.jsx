'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import UserAvatar from '@/components/ui/UserAvatar';
import { senderDisplayForInvite } from '@/lib/notifications/inviteNotificationCopy';
import NotificationMediaThumb from '../NotificationMediaThumb';
import { NOTIFICATION_CARD_CLASS, NOTIFICATION_ROW_CLASS } from '../notificationStyles';
import {
  NOTIFICATION_THUMB_RADIUS,
  resolveMediaThumbAspect,
  thumbnailSizeForMediaAspect,
} from '@/lib/notifications/notificationMediaThumb';

function DiagonalAvatarStack({ senders }) {
  const primary = senders[0];
  const secondary = senders[1];

  if (!primary) return <div className="w-12 h-12 shrink-0" />;

  if (!secondary) {
    return (
      <Link href={primary.id ? `/u/${primary.id}` : '#'} className="w-12 h-12 shrink-0">
        <UserAvatar user={primary} size={48} />
      </Link>
    );
  }

  return (
    <div className="relative w-12 h-12 shrink-0">
      <Link
        href={secondary.id ? `/u/${secondary.id}` : '#'}
        className="absolute bottom-0 right-0 w-[34px] h-[34px] rounded-full border-2 border-[#050505] overflow-hidden"
      >
        <UserAvatar user={secondary} size={34} />
      </Link>
      <Link
        href={primary.id ? `/u/${primary.id}` : '#'}
        className="absolute top-0 left-0 w-[34px] h-[34px] rounded-full border-2 border-[#050505] overflow-hidden z-[1]"
      >
        <UserAvatar user={primary} size={34} />
      </Link>
    </div>
  );
}

export default function GroupedPhotoReactionCard({ item, onClick }) {
  const albumName = item.albumName?.trim() || 'album';
  const thumbUri = item.previewUrl?.trim() || null;
  const primaryName = item.senders[0] ? senderDisplayForInvite(item.senders[0]) : 'Someone';
  const secondaryName = item.senders[1] ? senderDisplayForInvite(item.senders[1]) : null;
  const othersCount = Math.max(0, item.count - 1);

  const aspect = useMemo(
    () => resolveMediaThumbAspect(item.aspectRatio, item.mediaWidth, item.mediaHeight),
    [item.aspectRatio, item.mediaWidth, item.mediaHeight],
  );
  const thumbSize = useMemo(() => thumbnailSizeForMediaAspect(aspect), [aspect]);

  return (
    <button type="button" onClick={() => onClick?.(item)} className={`${NOTIFICATION_CARD_CLASS} w-full text-left`}>
      <div className={NOTIFICATION_ROW_CLASS}>
        <DiagonalAvatarStack senders={item.senders} />
        <div className="flex-1 min-w-0">
          <p className="text-sm leading-5">
            <span className="text-white font-bold">{primaryName}</span>
            {item.count === 2 && secondaryName ? (
              <>
                <span className="text-white/40 font-medium"> and </span>
                <span className="text-white font-bold">{secondaryName}</span>
              </>
            ) : othersCount > 0 ? (
              <>
                <span className="text-white/40 font-medium"> and </span>
                <span className="text-white font-bold">
                  {othersCount} {othersCount === 1 ? 'other' : 'others'}
                </span>
              </>
            ) : null}
            <span className="text-white/40 font-medium"> reacted to your post in </span>
            <span className="text-white font-bold">{albumName}</span>
            <span className="text-white/40 font-medium">.</span>
          </p>
          {item.time ? <p className="text-white/35 text-xs font-medium mt-1.5">{item.time}</p> : null}
        </div>
        <NotificationMediaThumb
          uri={thumbUri}
          width={thumbSize.width}
          height={thumbSize.height}
          borderRadius={NOTIFICATION_THUMB_RADIUS}
        />
      </div>
    </button>
  );
}
