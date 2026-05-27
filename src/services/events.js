import { api } from './api';

/**
 * Public web discover + vendor dashboard helpers
 */

/** Search users by username or email (GET /api/users/search?q=) — min 2 chars */
export function searchUsers(q) {
  if (!q || String(q).trim().length < 2) return Promise.resolve({ results: [] });
  return api.get(`/api/users/search?q=${encodeURIComponent(q.trim())}`);
}

export const eventsService = {
  /** Vendor dashboard */
  getMyEvents: (params = {}) => {
    const q = new URLSearchParams({ mine: '1', ...params });
    return api.get(`/api/events?${q}`);
  },

  /** Create event (same body as mobile CreateEventSheet → POST /api/events). */
  createEvent: (payload) => api.post('/api/events', payload),

  /** Update event (staff on primary album — same shapes as mobile `updateEvent`). */
  updateEvent: (eventId, payload) => api.put(`/api/events/${eventId}`, payload),

  /**
   * Public discover for web — same event set as mobile Discovery (GET /api/events?discover=1)
   * @param {string} sort 'vendor' | 'date' | 'tickets'
   */
  getDiscoverEvents: (limit = 48, offset = 0, sort = 'vendor') =>
    api.get(`/api/events?discover=1&limit=${limit}&offset=${offset}&sort=${encodeURIComponent(sort)}`),

  /** @deprecated use getDiscoverEvents for web */
  getPublicEvents: (limit = 20, offset = 0) =>
    eventsService.getDiscoverEvents(limit, offset, 'vendor').then((res) => ({
      ...res,
      events: (res.events || []).filter((e) => e.visibility === 'PUBLIC'),
    })),

  getEvent: (eventId) => api.get(`/api/events/${eventId}`),

  getAlbumParticipants: (albumId) => api.get(`/api/albums/${albumId}/participants`),

  getFriends: (userId) => api.get(`/api/users/${userId}/friends`),

  inviteAlbumUser: (albumId, username, { role, lineupSubrole } = {}) =>
    api.post(`/api/albums/${albumId}/invite-user`, {
      username,
      ...(role ? { role } : {}),
      ...(lineupSubrole != null && lineupSubrole !== '' ? { lineupSubrole } : {}),
    }),

  /** Direct-user invites for an album (pending / accepted / declined). Staff or event creator. */
  getAlbumDirectInvites: (albumId) => api.get(`/api/albums/${albumId}/direct-invites`),

  getFeaturedPeople: (albumId) => api.get(`/api/albums/${albumId}/featured-people`),

  upsertFeaturedPerson: (albumId, username, role) =>
    api.post(`/api/albums/${albumId}/featured-people`, { username, role }),

  inviteStaff: (eventId, username, role = 'bouncer') =>
    api.post(`/api/events/${eventId}/staff`, { username, role }),

  updateMemberRole: (albumId, userId, role) =>
    api.put(`/api/albums/${albumId}/members/role`, { userId, role }),

  removeMember: (albumId, userId) => api.delete(`/api/albums/${albumId}/members/${userId}`),

  deleteEvent: (eventId) => api.delete(`/api/events/${eventId}`),
};

/** Events list for wallet / passport stamp display. GET /api/events */
export async function getEventsForWallet(limit = 100, offset = 0) {
  try {
    return await api.get(`/api/events?limit=${limit}&offset=${offset}`);
  } catch {
    return { events: [] };
  }
}

/** Per-event XP for the authenticated user. GET /api/users/me/event-xp */
export async function getMyEventXp() {
  try {
    const data = await api.get('/api/users/me/event-xp');
    return data.xpByEventId ?? {};
  } catch {
    return {};
  }
}

/** Per-event XP for any user (used for public passport stamp display). GET /api/users/:id/event-xp */
export async function getUserEventXp(userId) {
  if (!userId) return {};
  try {
    const data = await api.get(`/api/users/${encodeURIComponent(userId)}/event-xp`);
    return data.xpByEventId ?? {};
  } catch {
    return {};
  }
}
