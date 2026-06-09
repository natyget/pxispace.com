/** Sidebar badge + inbox refresh after mark-read / delete on notifications page. */
export const NOTIFICATIONS_REFRESH_EVENT = 'pxi:notifications-refresh';

export function emitNotificationsRefresh() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(NOTIFICATIONS_REFRESH_EVENT));
  }
}
