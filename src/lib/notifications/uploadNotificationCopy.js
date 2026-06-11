/** In-app label for album upload burst notifications. */
export function uploadNotificationContentLabel({ photoCount = 0, videoCount = 0, uploadCount } = {}) {
  const photos = Math.max(0, Number(photoCount) || 0);
  const videos = Math.max(0, Number(videoCount) || 0);
  const total = Math.max(0, Number(uploadCount) || photos + videos);

  if (photos > 0 && videos > 0) return 'new content';
  if (videos === 1 && photos === 0) return 'a new video';
  if (videos > 1 && photos === 0) return `${videos} new videos`;
  if (photos === 1 && videos === 0) return 'a new photo';
  if (photos > 1 && videos === 0) return `${photos} new photos`;

  if (total === 1) return 'a new photo';
  return `${total} new photos`;
}
