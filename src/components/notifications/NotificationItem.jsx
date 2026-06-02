'use client';

import {
  albumInviteCardItemFromNotification,
  albumMemberJoinCardItemFromNotification,
  friendAcceptCardItemFromNotification,
  groupedPhotoReactionCardItemFromNotification,
  photoCommentCardItemFromNotification,
  photoReactionCardItemFromNotification,
  photoUploadCardItemFromNotification,
  shouldRenderPhotoUploadCard,
  threadMessageCardItemFromNotification,
} from '@/lib/notifications/notificationMappers';
import { formatNotificationListTime } from '@/lib/notifications/notificationTime';
import AlbumInviteCard from './cards/AlbumInviteCard';
import FriendRequestCard from './cards/FriendRequestCard';
import { PhotoReactionCard, PhotoCommentCard, PhotoUploadCard } from './cards/MediaActivityCard';
import GroupedPhotoReactionCard from './cards/GroupedPhotoReactionCard';
import AlbumMemberJoinCard from './cards/AlbumMemberJoinCard';
import ThreadMessageCard from './cards/ThreadMessageCard';
import FriendAcceptCard from './cards/FriendAcceptCard';
import AlbumReminderCard from './cards/AlbumReminderCard';
import { NOTIFICATION_CARD_CLASS } from './notificationStyles';

export default function NotificationItem({
  notification,
  onAcceptFriendRequest,
  onRejectFriendRequest,
  onAcceptAlbumInvite,
  onRejectAlbumInvite,
  onClickMedia,
  onClickAlbumCover,
  onNavigateAlbum,
}) {
  if (shouldRenderPhotoUploadCard(notification)) {
    return (
      <PhotoUploadCard
        item={photoUploadCardItemFromNotification(notification)}
        onClick={() => {
          const mediaId = notification.data?.mediaId;
          if (mediaId) {
            onClickMedia?.(mediaId, notification);
            return;
          }
          if (notification.data?.albumId) {
            onNavigateAlbum?.(
              notification.data.albumId,
              notification.data.albumName,
              notification.id,
            );
          }
        }}
      />
    );
  }

  switch (notification.type) {
    case 'FRIEND_REQ':
      return (
        <FriendRequestCard
          notification={notification}
          onAccept={onAcceptFriendRequest}
          onReject={onRejectFriendRequest}
        />
      );

    case 'GROUPED_REACTION':
      return (
        <GroupedPhotoReactionCard
          item={groupedPhotoReactionCardItemFromNotification(notification)}
          onClick={() => onClickMedia?.(notification.data?.mediaId || '', notification)}
        />
      );

    case 'ALBUM_INVITE':
    case 'LINEUP_INVITE':
    case 'STAFF_INVITE':
      return (
        <AlbumInviteCard
          item={albumInviteCardItemFromNotification(notification)}
          onAccept={() => onAcceptAlbumInvite?.(notification.id)}
          onReject={() => onRejectAlbumInvite?.(notification.id)}
          onCoverClick={() => onClickAlbumCover?.(notification)}
        />
      );

    case 'COMMENT':
      return (
        <PhotoCommentCard
          item={photoCommentCardItemFromNotification(notification)}
          onClick={() => onClickMedia?.(notification.data?.mediaId || '', notification)}
        />
      );

    case 'REACTION':
      return (
        <PhotoReactionCard
          item={photoReactionCardItemFromNotification(notification)}
          onClick={() => onClickMedia?.(notification.data?.mediaId || '', notification)}
        />
      );

    case 'PHOTO_UPLOAD':
      return (
        <PhotoUploadCard
          item={photoUploadCardItemFromNotification(notification)}
          onClick={() => {
            const mediaId = notification.data?.mediaId;
            if (mediaId) onClickMedia?.(mediaId, notification);
            else if (notification.data?.albumId) {
              onNavigateAlbum?.(notification.data.albumId, notification.data.albumName, notification.id);
            }
          }}
        />
      );

    case 'ALBUM_REMINDER':
      return (
        <AlbumReminderCard
          albumName={notification.data?.albumName}
          time={formatNotificationListTime(notification.createdAt)}
          onClick={() => {
            if (notification.data?.albumId) {
              onNavigateAlbum?.(notification.data.albumId, notification.data.albumName, notification.id);
            }
          }}
        />
      );

    case 'ALBUM_JOIN':
      return (
        <AlbumMemberJoinCard
          item={albumMemberJoinCardItemFromNotification(notification)}
          onPress={() => {
            if (notification.data?.albumId) {
              onNavigateAlbum?.(notification.data.albumId, notification.data.albumName, notification.id);
            }
          }}
        />
      );

    case 'THREAD_MESSAGE':
      return (
        <ThreadMessageCard
          item={threadMessageCardItemFromNotification(notification)}
          onClick={() => {
            if (notification.data?.albumId) {
              onNavigateAlbum?.(notification.data.albumId, notification.data.albumName, notification.id);
            }
          }}
        />
      );

    case 'FRIEND_ACCEPT':
      return <FriendAcceptCard item={friendAcceptCardItemFromNotification(notification)} />;

    case 'SYSTEM':
      return (
        <div className={`${NOTIFICATION_CARD_CLASS} p-4`}>
          <p className="text-white font-bold text-base">{notification.title}</p>
          <p className="text-white/70 text-sm mt-1 leading-relaxed">{notification.body}</p>
          <p className="text-white/40 text-[11px] font-medium mt-2.5">
            {formatNotificationListTime(notification.createdAt)}
          </p>
        </div>
      );

    default:
      return null;
  }
}
