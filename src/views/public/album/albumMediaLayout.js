/** Match mobile `AlbumThreadMediaCard.tsx` thread sizing heuristics. */

import {
  IPHONE_VIEWPORT_WIDTH,
  PUBLIC_ALBUM_THREAD_LIST_HEIGHT,
  PUBLIC_ALBUM_THREAD_LIST_HORIZONTAL_INSET,
  THREAD_SCRAPBOOK_BORDER_PX,
} from './albumLayoutConstants';

const INTRINSIC_MEDIA_3_4 = { width: 1200, height: 1600 };
const INTRINSIC_MEDIA_4_3 = { width: 1600, height: 1200 };

export function getThreadLayoutMetrics(
  paneWidth = IPHONE_VIEWPORT_WIDTH,
  paneHeight = PUBLIC_ALBUM_THREAD_LIST_HEIGHT,
) {
  const w = Math.max(280, paneWidth);
  const h = Math.max(400, paneHeight);
  const threadCardMaxWidth = w - PUBLIC_ALBUM_THREAD_LIST_HORIZONTAL_INSET * 2;
  const threadInnerMaxW = Math.max(160, threadCardMaxWidth - 2 * THREAD_SCRAPBOOK_BORDER_PX);
  const threadMaxMediaHeight = h * 0.62;
  const threadInnerMaxH = threadMaxMediaHeight - 2 * THREAD_SCRAPBOOK_BORDER_PX;
  return {
    threadCardMaxWidth,
    threadInnerMaxW,
    threadInnerMaxH,
  };
}

function snapToCanonical(srcW, srcH) {
  return srcH >= srcW ? INTRINSIC_MEDIA_3_4 : INTRINSIC_MEDIA_4_3;
}

export function mediaDisplayUrl(item) {
  if (!item) return null;
  const isVideo = String(item.type || '').toUpperCase() === 'VIDEO';
  if (isVideo) return item.thumbnailUrl || item.r2Url || null;
  return item.thumbnailUrl || item.r2Url || null;
}

export function mediaFullUrl(item) {
  if (!item) return null;
  return item.r2Url || item.thumbnailUrl || null;
}

export function threadMediaBox(width, height, metrics) {
  const W_MAX = metrics.threadInnerMaxW;
  const H_MAX = metrics.threadInnerMaxH;
  if (!width || !height) {
    const w = Math.max(1, W_MAX);
    const h = Math.max(1, Math.min(H_MAX, Math.round((w * 4) / 3)));
    return boxWithBorder(w, h);
  }
  const scale = Math.min(W_MAX / width, H_MAX / height);
  const w = Math.max(1, Math.round(width * scale));
  const h = Math.max(1, Math.round(height * scale));
  return boxWithBorder(w, h);
}

function boxWithBorder(width, height) {
  return {
    width,
    height,
    outerW: width + THREAD_SCRAPBOOK_BORDER_PX * 2,
    outerH: height + THREAD_SCRAPBOOK_BORDER_PX * 2,
  };
}

export function resolveIntrinsicSize(item, { canonicalImage = false, forThread = false } = {}) {
  const isVideo = String(item?.type || '').toUpperCase() === 'VIDEO';
  const mw = item?.metadata?.width;
  const mh = item?.metadata?.height;
  if (typeof mw === 'number' && typeof mh === 'number' && mw > 0 && mh > 0) {
    const px = { width: mw, height: mh };
    if (forThread || (canonicalImage && !isVideo)) {
      return snapToCanonical(px.width, px.height);
    }
    return px;
  }
  const ar = item?.metadata?.aspectRatio;
  if (ar === '3:4') return { ...INTRINSIC_MEDIA_3_4 };
  if (ar === '4:3') return { ...INTRINSIC_MEDIA_4_3 };
  if (typeof ar === 'string' && ar.includes(':')) {
    const [a, b] = ar.split(':').map(Number);
    if (a > 0 && b > 0) {
      const px = { width: a * 100, height: b * 100 };
      if (forThread) return snapToCanonical(px.width, px.height);
      return px;
    }
  }
  return { ...INTRINSIC_MEDIA_3_4 };
}
