import { api } from './api';

/**
 * Music taste helpers (used for the "match" sort on the events discover page). Apple Music is the connect option
 * (src/lib/appleMusicConnect.js); Spotify connect was retired on 2026-10-06 and its endpoints answer 410.
 */
export const musicService = {
  /** GET /api/music/profile — { connected, topGenres, ... } */
  getProfile: () => api.get('/api/music/profile'),

  disconnect: () => api.delete('/api/music/profile'),

  /** GET /api/music/events/:eventId/match (auth) — { connected, score, matchedArtists, sharedGenres } */
  getEventMatch: (eventId) => api.get(`/api/music/events/${eventId}/match`),

  /**
   * Event lineup playlist (Spotify/Apple Music) — dashboard management + public DJ submission flow.
   */

  /** GET /api/music/events/:eventId/playlist (public) — { playlist: null | {...} } */
  getEventPlaylist: (eventId) => api.get(`/api/music/events/${eventId}/playlist`),

  /** POST /api/music/events/:eventId/playlist (auth staff) — ingests a Spotify/Apple Music URL */
  setEventPlaylist: (eventId, url) => api.post(`/api/music/events/${eventId}/playlist`, { url }),

  /** POST /api/music/events/:eventId/playlist-link (auth staff) — { token, expiresAt } */
  createPlaylistLink: (eventId) => api.post(`/api/music/events/${eventId}/playlist-link`),

  /** GET /api/music/playlist-link/:token (public) — { eventName, eventCover, startDate, currentPlaylist } */
  getPlaylistLinkInfo: (token) => api.get(`/api/music/playlist-link/${token}`),

  /** POST /api/music/playlist-link/:token (public) — DJ submits a playlist URL */
  submitPlaylistLink: (token, url) => api.post(`/api/music/playlist-link/${token}`, { url }),

  /** GET /api/music/lineup-playlist/:token (public) — shared lineup playlist landing { playlist, event } */
  getLineupPlaylistLanding: (token) => api.get(`/api/music/lineup-playlist/${token}`),

  /** GET /api/music/events/:eventId/playlists (public/auth) — { playlists, averageScore } */
  getLineupPlaylists: (eventId) => api.get(`/api/music/events/${eventId}/playlists`),
};
