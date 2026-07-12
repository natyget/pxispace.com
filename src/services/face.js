import { api } from './api';

/**
 * Face match API — pxi-face-v2. Captured frames are sent for one-time
 * server-side embedding (held in memory only, never stored); all matching
 * runs against vectors. Client-computed vectors are no longer accepted.
 */
export const faceService = {
  /** Guest scan: one selfie frame (base64/data-URL) → { mediaIds, processing }. */
  matchAlbum: (albumId, image) => api.post('/api/face/match', { albumId, image }),

  /** Authenticated enrollment: 1-6 guided pose frames (base64/data-URL). */
  enrollImages: (images) => api.put('/api/face/enrollment', { images }),

  status: () => api.get('/api/face/status'),

  revoke: () => api.delete('/api/face/vector'),

  myAlbumMatches: (albumId) => api.get(`/api/face/albums/${albumId}/my-matches`),
};
