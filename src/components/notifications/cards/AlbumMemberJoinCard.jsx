'use client';

import { senderDisplayForInvite } from '@/lib/notifications/inviteNotificationCopy';
import SenderAvatar from '../SenderAvatar';
import NotificationMediaThumb from '../NotificationMediaThumb';
import { NOTIFICATION_CARD_CLASS } from '../notificationStyles';
import { NOTIFICATION_THUMB_RADIUS } from '@/lib/notifications/notificationMediaThumb';

const THUMB_W = 42;
const THUMB_H = 56;

export default function AlbumMemberJoinCard({ item, onPress }) {
  const senderName = senderDisplayForInvite(item.user);

  return (
    <button type="button" onClick={onPress} className={`${NOTIFICATION_CARD_CLASS} w-full text-left`}>
      <div className="flex items-center gap-3 py-3 pl-3 pr-3.5">
        <SenderAvatar user={item.user} size={48} className="mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm leading-5">
            <span className="text-white/90 font-bold">{senderName}</span>
            <span className="text-white/40 font-medium"> joined</span>
          </p>
          <p className="text-white font-bold text-sm mt-1 line-clamp-2">{item.albumName}</p>
          {item.time ? (
            <p className="text-white/35 text-[10px] font-semibold tracking-wide mt-1">{item.time}</p>
          ) : null}
        </div>
        <NotificationMediaThumb
          url={item.coverUri}
          width={THUMB_W}
          height={THUMB_H}
          borderRadius={NOTIFICATION_THUMB_RADIUS}
        />
      </div>
    </button>
  );
}
