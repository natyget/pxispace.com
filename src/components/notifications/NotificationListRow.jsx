'use client';

import { HugeiconsIcon } from '@hugeicons/react';
import { Cancel01Icon } from '@hugeicons/core-free-icons';
import NotificationItem from './NotificationItem';
import { HIDE_NOTIF_BTN_CLASS } from './notificationStyles';

export default function NotificationListRow({
  notification,
  onDismiss,
  onAcceptFriendRequest,
  onRejectFriendRequest,
  onAcceptAlbumInvite,
  onRejectAlbumInvite,
  onClickMedia,
  onClickAlbumCover,
  onNavigateAlbum,
}) {
  return (
    <div className="relative mb-3">
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          className={HIDE_NOTIF_BTN_CLASS}
          aria-label="Delete notification"
        >
          <HugeiconsIcon icon={Cancel01Icon} size={12} />
        </button>
      ) : null}
      <NotificationItem
        notification={notification}
        onAcceptFriendRequest={onAcceptFriendRequest}
        onRejectFriendRequest={onRejectFriendRequest}
        onAcceptAlbumInvite={onAcceptAlbumInvite}
        onRejectAlbumInvite={onRejectAlbumInvite}
        onClickMedia={onClickMedia}
        onClickAlbumCover={onClickAlbumCover}
        onNavigateAlbum={onNavigateAlbum}
      />
    </div>
  );
}
