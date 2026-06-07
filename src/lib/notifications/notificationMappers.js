import { senderDisplayForInvite } from './inviteNotificationCopy';
import { formatNotificationCompactTime, formatNotificationListTime } from './notificationTime';
import { senderDisplayForThreadMessage, threadMessageNotificationCopy } from './threadMessageNotificationCopy';

export function userAvatarForCard(user) {
  return user?.avatarUrl || null;
}

export function albumInviteCardItemFromNotification(notification) {
  const data = notification.data || {};
  const ir = data.inviteResponse;
  return {
    id: notification.id,
    notificationType: notification.type,
    user: notification.user,
    target: data.eventName || data.albumName,
    albumType: data.albumType || 'public',
    time: formatNotificationListTime(notification.createdAt),
    postImage: data.coverImage ?? null,
    isAccepted: ir === 'accepted',
    inviteResponse: ir,
    inviteRespondedAt: data.inviteRespondedAt,
    data,
  };
}

export function photoReactionCardItemFromNotification(notification) {
  const data = notification.data || {};
  return {
    id: notification.id,
    user: {
      id: notification.user?.id,
      name: senderDisplayForInvite(notification.user),
      avatar: userAvatarForCard(notification.user),
    },
    emoji: String(data.emoji || '').trim() || '❤️',
    albumId: data.albumId,
    albumName: data.albumName,
    mediaId: data.mediaId,
    time: formatNotificationCompactTime(notification.createdAt),
    previewUrl: data.previewUrl ?? data.thumbnailUrl ?? data.coverImage ?? null,
    aspectRatio: data.aspectRatio === '3:4' || data.aspectRatio === '4:3' ? data.aspectRatio : undefined,
    mediaWidth: typeof data.width === 'number' ? data.width : undefined,
    mediaHeight: typeof data.height === 'number' ? data.height : undefined,
  };
}

export function photoCommentCardItemFromNotification(notification) {
  const data = notification.data || {};
  return {
    id: notification.id,
    user: {
      id: notification.user?.id,
      name: senderDisplayForInvite(notification.user),
      avatar: userAvatarForCard(notification.user),
    },
    albumId: data.albumId,
    albumName: data.albumName,
    mediaId: data.mediaId,
    commentId: data.commentId,
    comment: data.comment,
    time: formatNotificationCompactTime(notification.createdAt),
    previewUrl: data.previewUrl ?? data.thumbnailUrl ?? data.coverImage ?? null,
    aspectRatio: data.aspectRatio === '3:4' || data.aspectRatio === '4:3' ? data.aspectRatio : undefined,
    mediaWidth: typeof data.width === 'number' ? data.width : undefined,
    mediaHeight: typeof data.height === 'number' ? data.height : undefined,
  };
}

export function groupedPhotoReactionCardItemFromNotification(notification) {
  const data = notification.data || {};
  return {
    id: notification.id,
    senders: notification.senders ?? [],
    count: notification.count,
    albumId: data.albumId,
    albumName: data.albumName,
    mediaId: data.mediaId,
    time: formatNotificationCompactTime(notification.createdAt),
    previewUrl: data.previewUrl ?? data.coverImage ?? null,
    aspectRatio: data.aspectRatio === '3:4' || data.aspectRatio === '4:3' ? data.aspectRatio : undefined,
    mediaWidth: typeof data.width === 'number' ? data.width : undefined,
    mediaHeight: typeof data.height === 'number' ? data.height : undefined,
  };
}

export function shouldRenderPhotoUploadCard(notification) {
  if (String(notification.type || '').toUpperCase() === 'PHOTO_UPLOAD') return true;
  if (notification.type === 'GROUPED_REACTION' || notification.type === 'SYSTEM') return false;
  if (!notification.user || !notification.data) return false;
  const d = notification.data;
  if (d.uploadCount != null && Number(d.uploadCount) >= 1 && typeof d.albumId === 'string') {
    return true;
  }
  const hasPreview =
    typeof d.previewUrl === 'string' ||
    (Array.isArray(d.previewUrls) && d.previewUrls.length > 0);
  return (
    typeof d.albumId === 'string' &&
    typeof d.mediaId === 'string' &&
    hasPreview &&
    !d.emoji &&
    !d.comment &&
    !d.requestId &&
    !d.inviteListId &&
    !d.inviteRole &&
    d.messageCount == null
  );
}

export function photoUploadCardItemFromNotification(notification) {
  const data = notification.data || {};
  const previewUrls = Array.isArray(data.previewUrls)
    ? data.previewUrls.filter((u) => Boolean(String(u || '').trim()))
    : [];
  return {
    id: notification.id,
    user: {
      id: notification.user?.id,
      name: senderDisplayForInvite(notification.user),
      avatar: userAvatarForCard(notification.user),
    },
    albumId: data.albumId,
    albumName: String(data.albumName || '').trim() || 'album',
    mediaId: data.mediaId,
    uploadCount: Math.max(1, Number(data.uploadCount) || 1),
    time: formatNotificationCompactTime(notification.createdAt),
    previewUrls,
    previewUrl: data.previewUrl ?? null,
    aspectRatio: data.aspectRatio === '3:4' || data.aspectRatio === '4:3' ? data.aspectRatio : undefined,
    mediaWidth: typeof data.width === 'number' ? data.width : undefined,
    mediaHeight: typeof data.height === 'number' ? data.height : undefined,
  };
}

export function albumMemberJoinCardItemFromNotification(notification) {
  const data = notification.data || {};
  return {
    id: notification.id,
    user: notification.user,
    albumName: String(data.albumName || '').trim() || 'the album',
    coverUri: data.thumbnailUrl?.trim() || data.coverImage?.trim() || null,
    time: formatNotificationListTime(notification.createdAt),
  };
}

export function threadMessageCardItemFromNotification(notification) {
  const data = notification.data || {};
  return {
    id: notification.id,
    albumId: data.albumId,
    albumName: String(data.albumName || '').trim() || 'album',
    messageCount: Math.max(1, Number(data.messageCount) || 1),
    senderName: senderDisplayForThreadMessage(notification.user),
    messagePreview: data.lastMessagePreview,
    isGif: Boolean(data.hasGif),
    time: formatNotificationCompactTime(notification.createdAt),
    copy: threadMessageNotificationCopy({
      senderName: senderDisplayForThreadMessage(notification.user),
      albumName: data.albumName,
      messageCount: Math.max(1, Number(data.messageCount) || 1),
      messagePreview: data.lastMessagePreview,
      isGif: Boolean(data.hasGif),
    }),
  };
}

export function friendAcceptCardItemFromNotification(notification) {
  return {
    id: notification.id,
    user: {
      id: notification.user?.id,
      name: senderDisplayForInvite(notification.user),
      avatar: userAvatarForCard(notification.user),
    },
    time: formatNotificationCompactTime(notification.createdAt),
  };
}
