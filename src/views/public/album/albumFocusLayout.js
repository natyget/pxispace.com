/** Layout math from mobile `ThreadFocusOverlay.tsx` — fixed centered modal on web. */

import { IPHONE_VIEWPORT_HEIGHT, IPHONE_VIEWPORT_WIDTH } from './albumLayoutConstants';
import { resolveIntrinsicSize } from './albumMediaLayout';

export const FOCUS_MODAL_WIDTH = IPHONE_VIEWPORT_WIDTH;
/** ~86% of iPhone logical height — matches mobile `SHEET_HEIGHT_RATIO`. */
export const FOCUS_MODAL_HEIGHT = Math.round(IPHONE_VIEWPORT_HEIGHT * 0.86);
export const FOCUS_MODAL_RADIUS_PX = 26;
export const FOCUS_MODAL_COMMENTS_HEIGHT = 140;
export const FOCUS_MODAL_CTA_HEIGHT = 72;
export const FOCUS_HEADER_ROW_H = 64;
export const FOCUS_SHEET_MEDIA_BORDER_PX = 7;
export const FOCUS_MEDIA_ZONE_PADDING_Y = 12;

export const COMMENT_TILTS_DEG = [1.1, -1.25, 0.85, -1.0, 1.35, -0.75, 1.0, -1.15];
export const COMMENT_SHIFT_X = [5, -8, 6, -5, 4, -7, 7, -4];
export const COMMENT_STACK_OVERLAP = 6;

export function fitMediaToMaxBox(srcW, srcH, maxW, maxH) {
  if (!Number.isFinite(srcW) || !Number.isFinite(srcH) || srcW <= 0 || srcH <= 0) {
    return { width: maxW, height: Math.min(maxH, Math.round((maxW * 9) / 16)) };
  }
  const ar = srcW / srcH;
  const scale = Math.min(maxW / srcW, maxH / srcH);
  let h = Math.max(1, Math.floor(srcH * scale));
  let w = Math.max(1, Math.round(h * ar));
  if (w > maxW) {
    w = maxW;
    h = Math.max(1, Math.round(w / ar));
  }
  if (h > maxH) {
    h = maxH;
    w = Math.max(1, Math.round(h * ar));
    if (w > maxW) w = maxW;
  }
  return { width: w, height: h };
}

export function getFocusModalLayout(item) {
  const modalH = FOCUS_MODAL_HEIGHT;
  const commentsSectionHeight = FOCUS_MODAL_COMMENTS_HEIGHT;
  const focusMediaColumnBudget =
    modalH -
    commentsSectionHeight -
    FOCUS_MODAL_CTA_HEIGHT -
    2 * FOCUS_MEDIA_ZONE_PADDING_Y -
    FOCUS_HEADER_ROW_H;
  const maxMediaHeight = Math.max(188, focusMediaColumnBudget * 0.96);
  const maxMediaWidth = Math.min(FOCUS_MODAL_WIDTH - 32, 420);
  const maxMediaInnerW = Math.max(1, maxMediaWidth - 2 * FOCUS_SHEET_MEDIA_BORDER_PX);
  const maxMediaInnerH = Math.max(1, maxMediaHeight - 2 * FOCUS_SHEET_MEDIA_BORDER_PX);

  const intrinsic = resolveIntrinsicSize(item);
  const mediaDisplay = fitMediaToMaxBox(intrinsic.width, intrinsic.height, maxMediaInnerW, maxMediaInnerH);

  return {
    mediaDisplay,
    outerW: mediaDisplay.width + 2 * FOCUS_SHEET_MEDIA_BORDER_PX,
    outerH: mediaDisplay.height + 2 * FOCUS_SHEET_MEDIA_BORDER_PX,
    commentsSectionHeight,
    focusMediaZoneMinHeight: focusMediaColumnBudget,
  };
}

export function formatFocusRelativeTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  const diffMin = Math.floor((Date.now() - d.getTime()) / 60000);
  if (diffMin < 1) return 'now';
  if (diffMin < 60) return `${diffMin}m`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h`;
  return `${Math.floor(diffHrs / 24)}d`;
}

export function sortFocusComments(item) {
  const list = item?.comments;
  if (!Array.isArray(list)) return [];
  return [...list].sort(
    (a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime(),
  );
}
