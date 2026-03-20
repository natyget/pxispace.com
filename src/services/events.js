import { api } from './api';

/**
 * Vendor Dashboard — events and staff management
 */

/** Search users by username or email (GET /api/users/search?q=) — min 2 chars */
export function searchUsers(q) {
  if (!q || String(q).trim().length < 2) return Promise.resolve({ results: [] });
  return api.get(`/api/users/search?q=${encodeURIComponent(q.trim())}`);
}

export const eventsService = {
  /** List events owned by the authenticated vendor (GET /api/events?mine=1) */
  getMyEvents: (params = {}) => {
    const q = new URLSearchParams({ mine: '1', ...params });
    return api.get(`/api/events?${q}`);
  },

  /** List public events for discover (GET /api/events, then filter by visibility) */
  getPublicEvents: (limit = 20, offset = 0) =>
    api.get(`/api/events?limit=${limit}&offset=${offset}`).then((res) => ({
      ...res,
      events: (res.events || []).filter((e) => e.visibility === 'PUBLIC'),
    })),

  /** Get single event (GET /api/events/:id) */
  getEvent: (eventId) => api.get(`/api/events/${eventId}`),

  /** Get album participants (staff + members) — used for staff list (GET /api/albums/:id/participants) */
  getAlbumParticipants: (albumId) => api.get(`/api/albums/${albumId}/participants`),

  /** Get friends for current user context (GET /api/users/:id/friends) */
  getFriends: (userId) => api.get(`/api/users/${userId}/friends`),

  /** Invite a user to album by username (POST /api/albums/:id/invite-user) */
  inviteAlbumUser: (albumId, username) => api.post(`/api/albums/${albumId}/invite-user`, { username }),

  /** Get featured people for an album (GET /api/albums/:id/featured-people) */
  getFeaturedPeople: (albumId) => api.get(`/api/albums/${albumId}/featured-people`),

  /** Upsert a featured person by username and role (POST /api/albums/:id/featured-people) */
  upsertFeaturedPerson: (albumId, username, role) =>
    api.post(`/api/albums/${albumId}/featured-people`, { username, role }),

  /** Invite user as staff by username (POST /api/events/:id/staff). role: 'co-host' | 'bouncer' | 'featured_talent' (default 'bouncer') */
  inviteStaff: (eventId, username, role = 'bouncer') =>
    api.post(`/api/events/${eventId}/staff`, { username, role }),

  /** Remove a member from the album (owner only) (DELETE /api/albums/:id/members/:userId) */
  removeMember: (albumId, userId) => api.delete(`/api/albums/${albumId}/members/${userId}`),
};
