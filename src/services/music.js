import { api } from './api';

const env = globalThis.process?.env || {};
const SPOTIFY_CLIENT_ID = env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || '';
const SPOTIFY_REDIRECT_URI = env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI || '';

function spotifyConnectPayload(platform = 'web') {
  const payload = { platform };
  if (SPOTIFY_CLIENT_ID) payload.clientId = SPOTIFY_CLIENT_ID;
  if (SPOTIFY_REDIRECT_URI) payload.redirectUri = SPOTIFY_REDIRECT_URI;
  return payload;
}

/**
 * Music taste / Spotify profile helpers (used for "match" sort on the events discover page).
 */
export const musicService = {
  /** Start the Spotify connect flow — POST returns { authorizeUrl } to redirect the user to. */
  startSpotifyConnect: () => api.post('/api/music/spotify/session', spotifyConnectPayload('web')),

  /** GET /api/music/profile — { connected, topGenres, ... } */
  getProfile: () => api.get('/api/music/profile'),

  disconnect: () => api.delete('/api/music/profile'),

  // Apple Music connect (developer-token + connect) was removed from the
  // product; those backend endpoints now return 410 Gone. Historical
  // 'APPLE_MUSIC' profiles are still readable via getProfile()/disconnect().

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
