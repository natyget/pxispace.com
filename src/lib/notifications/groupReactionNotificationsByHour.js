export function reactionHourBucketKey(createdAt) {
  const d = typeof createdAt === 'string' ? new Date(createdAt) : createdAt;
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  const hr = String(d.getHours()).padStart(2, '0');
  return `${y}-${mo}-${da}T${hr}`;
}

function reactionGroupKey(notification) {
  const mediaId = notification.data?.mediaId;
  if (!mediaId) return null;
  const albumId = notification.data?.albumId ?? '';
  return `${mediaId}|${albumId}|${reactionHourBucketKey(notification.createdAt)}`;
}

function uniqueSendersNewestFirst(items) {
  const seen = new Set();
  const senders = [];
  for (const item of items) {
    const user = item.user;
    if (!user?.id || seen.has(user.id)) continue;
    seen.add(user.id);
    senders.push(user);
  }
  return senders;
}

function buildGroupedReaction(items) {
  const sorted = [...items].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const newest = sorted[0];
  const data = newest.data || {};

  return {
    id: newest.id,
    type: 'GROUPED_REACTION',
    count: sorted.length,
    senders: uniqueSendersNewestFirst(sorted),
    notificationIds: sorted.map((n) => n.id),
    isRead: sorted.every((n) => n.isRead),
    createdAt: newest.createdAt,
    data: {
      mediaId: data.mediaId || '',
      emoji: data.emoji || '❤️',
      albumId: data.albumId,
      albumName: data.albumName,
      previewUrl: data.previewUrl ?? data.thumbnailUrl ?? data.coverImage,
      aspectRatio: data.aspectRatio === '3:4' || data.aspectRatio === '4:3' ? data.aspectRatio : undefined,
      width: typeof data.width === 'number' ? data.width : undefined,
      height: typeof data.height === 'number' ? data.height : undefined,
    },
  };
}

export function groupReactionNotificationsByHour(notifications) {
  const groups = new Map();

  for (const n of notifications) {
    if (n.type !== 'REACTION') continue;
    const key = reactionGroupKey(n);
    if (!key) continue;
    const bucket = groups.get(key) ?? [];
    bucket.push(n);
    groups.set(key, bucket);
  }

  const emitted = new Set();
  const result = [];

  for (const n of notifications) {
    if (n.type === 'GROUPED_REACTION') {
      result.push(n);
      continue;
    }
    if (n.type !== 'REACTION') {
      result.push(n);
      continue;
    }

    const key = reactionGroupKey(n);
    if (!key) {
      result.push(n);
      continue;
    }

    if (emitted.has(key)) continue;
    emitted.add(key);

    const bucket = groups.get(key) ?? [n];
    if (bucket.length <= 1) {
      result.push(bucket[0]);
    } else {
      result.push(buildGroupedReaction(bucket));
    }
  }

  return result;
}
