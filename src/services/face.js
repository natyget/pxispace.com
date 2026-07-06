import { api } from './api';

/**
 * Face match API — vectors only, never images.
 * Guest scan: single ephemeral match query against an album's photo-face vectors.
 */
export const faceService = {
  /** { mediaIds } — the vector is used once server-side and never stored. */
  matchAlbum: (albumId, vector, modelId) =>
    api.post('/api/face/match', { albumId, vector, modelId }),

  /** Authenticated enrollment (used by the in-app WebView flow / web account). */
  enroll: (vector, modelId) => api.put('/api/face/vector', { vector, modelId }),

  status: () => api.get('/api/face/status'),

  revoke: () => api.delete('/api/face/vector'),

  myAlbumMatches: (albumId) => api.get(`/api/face/albums/${albumId}/my-matches`),
};
