import { reactionHourBucketKey } from './groupReactionNotificationsByHour.js';

function threadMessageGroupKey(notification) {
  const albumId = notification.data?.albumId;
  if (!albumId) return null;
  return `${albumId}|${reactionHourBucketKey(notification.createdAt)}`;
}

function totalMessageCount(items) {
  return items.reduce((sum, item) => sum + (Number(item.data?.messageCount) || 1), 0);
}

function buildGroupedThreadMessage(items) {
  const sorted = [...items].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const newest = sorted[0];
  const data = newest.data || {};

  return {
    id: newest.id,
    type: 'THREAD_MESSAGE',
    user: newest.user,
    isRead: sorted.every((item) => item.isRead),
    createdAt: newest.createdAt,
    data: {
      albumId: data.albumId,
      albumName: data.albumName,
      messageCount: totalMessageCount(sorted),
      mergedSourceNotificationIds: sorted.map((n) => n.id),
    },
  };
}

export function groupThreadMessageNotificationsByHour(notifications) {
  const groups = new Map();

  for (const n of notifications) {
    if (n.type !== 'THREAD_MESSAGE') continue;
    const key = threadMessageGroupKey(n);
    if (!key) continue;
    const bucket = groups.get(key) ?? [];
    bucket.push(n);
    groups.set(key, bucket);
  }

  const emitted = new Set();
  const result = [];

  for (const n of notifications) {
    if (n.type !== 'THREAD_MESSAGE') {
      result.push(n);
      continue;
    }

    const key = threadMessageGroupKey(n);
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
      result.push(buildGroupedThreadMessage(bucket));
    }
  }

  return result;
}
