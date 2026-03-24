import { api } from './api';

/**
 * Presigned R2 upload (POST /api/media/upload). Returns { uploadUrl, key, publicUrl, expiresIn }.
 */
export function requestPresignedUpload({ filename, contentType, albumId }) {
  return api.post('/api/media/upload', { filename, contentType, ...(albumId && { albumId }) });
}

/** PUT file to presigned URL; returns publicUrl from presign response. */
export async function uploadImageToR2(file, { filename, contentType, albumId } = {}) {
  const name = filename || file.name || 'cover.jpg';
  const type = contentType || file.type || 'image/jpeg';
  const { uploadUrl, publicUrl } = await requestPresignedUpload({
    filename: name,
    contentType: type,
    albumId,
  });
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
  });
  if (!res.ok) {
    const reason = await res.text().catch(() => '');
    throw new Error(`Upload failed (${res.status})${reason ? `: ${reason}` : ''}`);
  }
  return publicUrl;
}
