import { api } from './api';

export const albumsService = {
    getAlbum: (albumId) => api.get(`/api/albums/${albumId}`),
    getAlbumMedia: (albumId, limit = 60, offset = 0) =>
        api.get(`/api/albums/${albumId}/media?limit=${limit}&offset=${offset}`),
};
