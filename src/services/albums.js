import { api } from './api';

export const albumsService = {
    getAlbum: (albumId) => api.get(`/api/albums/${albumId}`),
    getAlbumMedia: (albumId, limit = 60, offset = 0) =>
        api.get(`/api/albums/${albumId}/media?limit=${limit}&offset=${offset}`),
    getPublicAlbum: (albumId) => api.get(`/api/albums/public/${albumId}`),
    getPublicAlbumMedia: (albumId, limit = 60, offset = 0) =>
        api.get(`/api/albums/public/${albumId}/media?limit=${limit}&offset=${offset}`),
    getPublicAlbumThread: (albumId, limit = 40, offset = 0) =>
        api.get(`/api/albums/public/${albumId}/thread-timeline?limit=${limit}&offset=${offset}`),
};
