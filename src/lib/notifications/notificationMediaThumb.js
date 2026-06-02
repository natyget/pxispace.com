export const NOTIFICATION_THUMB_MAX_EDGE = 56;
export const NOTIFICATION_THUMB_RADIUS = 10;

/** @typedef {'4:3' | '3:4'} MediaThumbAspect */

/** @returns {MediaThumbAspect} */
export function resolveMediaThumbAspect(aspectRatio, mediaWidth, mediaHeight) {
  if (aspectRatio === '3:4' || aspectRatio === '4:3') return aspectRatio;
  if (typeof mediaWidth === 'number' && typeof mediaHeight === 'number' && mediaWidth > 0 && mediaHeight > 0) {
    return mediaWidth >= mediaHeight ? '4:3' : '3:4';
  }
  return '4:3';
}

/** @param {MediaThumbAspect} aspect */
export function thumbnailSizeForMediaAspect(aspect) {
  if (aspect === '3:4') {
    return {
      width: NOTIFICATION_THUMB_MAX_EDGE,
      height: Math.round((NOTIFICATION_THUMB_MAX_EDGE * 3) / 4),
    };
  }
  return {
    width: Math.round((NOTIFICATION_THUMB_MAX_EDGE * 3) / 4),
    height: NOTIFICATION_THUMB_MAX_EDGE,
  };
}
