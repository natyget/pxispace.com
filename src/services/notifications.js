import { api } from './api';

/**
 * Get hydrated notifications for the current user.
 * GET /api/notifications?userId=...&limit=...&unreadOnly=...
 */
export async function getNotifications(userId, limit = 50, unreadOnly = false) {
  const params = new URLSearchParams({ userId, limit: String(limit) });
  if (unreadOnly) params.set('unreadOnly', 'true');
  const data = await api.get(`/api/notifications?${params}`);
  return data;
}

/**
 * Accept an album/event invite.
 * POST /api/notifications/:id/accept
 * Returns { albumId, albumName, role, joinedAt, ticket }.
 */
export async function acceptInvite(notificationId) {
  const data = await api.post(`/api/notifications/${notificationId}/accept`, {});
  return data;
}

/**
 * Decline an album/event invite.
 * POST /api/notifications/:id/decline
 */
export async function declineInvite(notificationId) {
  const data = await api.post(`/api/notifications/${notificationId}/decline`, {});
  return data;
}

/**
 * Mark a notification as read.
 * PUT /api/notifications/:id/read
 */
export async function markAsRead(notificationId) {
  const data = await api.put(`/api/notifications/${notificationId}/read`, {});
  return data;
}

/**
 * Mark all notifications as read.
 * PUT /api/notifications/read-all
 */
export async function markAllAsRead(userId) {
  const data = await api.put('/api/notifications/read-all', { userId });
  return data;
}

/**
 * Delete a single notification (recipient only; requires auth).
 * PUT /api/notifications/:id/hide
 */
export async function hideNotification(notificationId) {
  const data = await api.put(`/api/notifications/${notificationId}/hide`, {});
  return data;
}

/**
 * Delete all notifications for the authenticated user.
 * PUT /api/notifications/hide-all
 */
export async function hideAllNotifications(userId) {
  const data = await api.put('/api/notifications/hide-all', { userId });
  return data;
}
