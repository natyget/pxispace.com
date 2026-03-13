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

  /** Get single event (GET /api/events/:id) */
  getEvent: (eventId) => api.get(`/api/events/${eventId}`),

  /** Get album participants (staff + members) — used for staff list (GET /api/albums/:id/participants) */
  getAlbumParticipants: (albumId) => api.get(`/api/albums/${albumId}/participants`),

  /** Invite user as staff (BOUNCER) by username (POST /api/events/:id/staff) */
  inviteStaff: (eventId, username) => api.post(`/api/events/${eventId}/staff`, { username }),

  /** Remove a member from the album (owner only) (DELETE /api/albums/:id/members/:userId) */
  removeMember: (albumId, userId) => api.delete(`/api/albums/${albumId}/members/${userId}`),
};
