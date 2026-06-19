export function isActionRequiredNotification(notification) {
  if (notification.type === 'FRIEND_REQ') {
    const decision = notification.data?.requestDecision;
    return !decision;
  }
  if (
    notification.type === 'ALBUM_INVITE' ||
    notification.type === 'LINEUP_INVITE' ||
    notification.type === 'STAFF_INVITE'
  ) {
    const inviteResponse = notification.data?.inviteResponse;
    return inviteResponse !== 'accepted' && inviteResponse !== 'declined';
  }
  return false;
}

/** Mirrors mobile `notificationSections` — Action Required + per-album groups. */
export function buildNotificationSections(displayNotifications) {
  const actionRequired = [];
  const rest = [];

  for (const n of displayNotifications) {
    if (isActionRequiredNotification(n)) {
      actionRequired.push(n);
    } else {
      rest.push(n);
    }
  }

  const sections = [];

  if (actionRequired.length > 0) {
    sections.push({ title: 'Action Required', data: actionRequired });
  }

  const map = new Map();
  for (const n of rest) {
    let key = 'general';
    let title = 'General';
    const d = n.data;
    if (d && typeof d === 'object') {
      if (d.albumId) {
        key = `album:${d.albumId}`;
        title = String(d.albumName || '').trim() || 'Album';
      } else if (d.albumName) {
        key = `name:${d.albumName}`;
        title = String(d.albumName).trim();
      }
    }
    if (!map.has(key)) {
      map.set(key, { title, data: [] });
    }
    map.get(key).data.push(n);
  }

  sections.push(...map.values());
  return sections;
}

export function notificationIdsForDismiss(notification) {
  if (notification.type === 'GROUPED_REACTION') {
    const ids = notification.notificationIds;
    if (ids?.length) return ids;
    return [notification.id];
  }
  if (notification.type === 'THREAD_MESSAGE') {
    const merged = notification.data?.mergedSourceNotificationIds;
    if (merged?.length) return merged;
  }
  return [notification.id];
}
