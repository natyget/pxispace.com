'use client';

import Link from 'next/link';
import SenderAvatar from '../SenderAvatar';
import { NOTIFICATION_CARD_CLASS, NOTIFICATION_ROW_CLASS } from '../notificationStyles';

export default function FriendAcceptCard({ item }) {
  const senderName = item.user?.name?.trim() || 'Someone';

  return (
    <div className={NOTIFICATION_CARD_CLASS}>
      <div className={NOTIFICATION_ROW_CLASS}>
        <SenderAvatar user={{ id: item.user?.id, avatarUrl: item.user?.avatar }} size={44} />
        <div className="flex-1 min-w-0">
          <p className="text-sm leading-5">
            {item.user?.id ? (
              <Link href={`/u/${item.user.id}`} className="text-white font-bold hover:underline">
                {senderName}
              </Link>
            ) : (
              <span className="text-white font-bold">{senderName}</span>
            )}
            <span className="text-white/40 font-medium"> accepted </span>
            <span className="text-white font-bold">your friend request</span>
            <span className="text-white/40 font-medium">.</span>
          </p>
          {item.time ? <p className="text-white/35 text-xs font-medium mt-1.5">{item.time}</p> : null}
        </div>
      </div>
    </div>
  );
}
