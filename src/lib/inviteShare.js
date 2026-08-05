/**
 * Share helpers for event invite sheet (QR image + Instagram-oriented share).
 */

export function getPublicEventUrl(eventId) {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || 'https://pxispace.com').replace(/\/$/, '');
  return `${base}/events/${eventId}`;
}

export function qrImageUrlForEvent(eventId, size = 512) {
  const url = getPublicEventUrl(eventId);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}&bgcolor=ffffff&color=000000&margin=12`;
}

/**
 * Share the QR code PNG (not a plain URL string).
 * @returns {Promise<'native_share'|'download'>} the path actually taken, so the
 *   caller can report the real `method` on its GA4 `share` event.
 */
export async function shareEventQrImage(eventId, eventName) {
  const qrUrl = qrImageUrlForEvent(eventId, 512);
  const res = await fetch(qrUrl);
  if (!res.ok) throw new Error('Could not generate QR image');
  const blob = await res.blob();
  const file = new File([blob], `${(eventName || 'event').replace(/\s+/g, '-')}-qr.png`, {
    type: 'image/png',
  });

  if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({
      files: [file],
      title: eventName || 'Event QR',
      text: 'Scan to RSVP',
    });
    return 'native_share';
  }

  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = file.name;
  a.click();
  URL.revokeObjectURL(objectUrl);
  return 'download';
}

/**
 * Best-effort Stories share: native sheet with URL + title when available.
 * @returns {Promise<'native_share'|'copy_link'>} the path actually taken.
 */
export async function shareEventToInstagramStory(eventId, eventName, { coverImageUrl, scrapbookThumbUrl } = {}) {
  const url = getPublicEventUrl(eventId);
  const title = eventName || 'PXI Event';

  if (typeof navigator !== 'undefined' && navigator.share) {
    const files = [];
    const imageSrc = scrapbookThumbUrl || coverImageUrl;
    if (imageSrc) {
      try {
        const imgRes = await fetch(imageSrc);
        if (imgRes.ok) {
          const blob = await imgRes.blob();
          const type = blob.type || 'image/jpeg';
          files.push(new File([blob], 'pxi-story.jpg', { type }));
        }
      } catch {
        /* omit file */
      }
    }

    if (files.length > 0 && navigator.canShare?.({ files, url })) {
      await navigator.share({ files, url, title, text: title });
      return 'native_share';
    }
    if (files.length > 0 && navigator.canShare?.({ files })) {
      await navigator.share({ files, title, text: `${title}\n${url}` });
      return 'native_share';
    }
    await navigator.share({ title, text: title, url });
    return 'native_share';
  }

  await navigator.clipboard.writeText(`${title}\n${url}`);
  return 'copy_link';
}
