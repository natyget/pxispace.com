import { api } from './api';

export function createUploadLink({ albumId, eventId, maxUploads, maxUses, expiresInHours }) {
  return api.post('/api/upload-links', { albumId, eventId, maxUploads, maxUses, expiresInHours });
}

export function getUploadLink(token) {
  return api.get(`/api/upload-links/${token}`);
}

export function presignUploadLink(token, { filename, contentType }) {
  return api.post(`/api/upload-links/${token}/presign`, { filename, contentType });
}

export function confirmUploadLink(token, { r2Url, type, width, height, capturedAt, isFirstInSession }) {
  return api.post(`/api/upload-links/${token}/confirm`, {
    r2Url, type, width, height, capturedAt, isFirstInSession,
  });
}
