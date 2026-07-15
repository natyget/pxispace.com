/**
 * Layout math for the full-bleed public focus/immersive media view.
 * Mirrors mobile `FocusOverlay.tsx` proportions (header + media + comments +
 * footer stacked in a full-viewport sheet) but sizes off the actual browser
 * viewport instead of a fixed iPhone box — the overlay is full-bleed on web,
 * not a centered phone-sized dialog.
 */

import { resolveIntrinsicSize } from './albumMediaLayout';

/** Design-law corner radius — top corners only (sheet is flush to the viewport edges). */
export const FOCUS_SHEET_RADIUS_PX = 20;
export const FOCUS_HEADER_ROW_H = 56;
export const FOCUS_MODAL_CTA_HEIGHT = 72;
export const FOCUS_MEDIA_ZONE_PADDING_Y = 12;
export const FOCUS_MEDIA_HORIZONTAL_PADDING = 12;

const COMMENTS_HEIGHT_RATIO = 0.16;
const COMMENTS_MIN_H = 120;
const COMMENTS_MAX_H = 210;

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

/**
 * @param {object} item media item
 * @param {number} viewportW live browser viewport width (`window.innerWidth`)
 * @param {number} viewportH live browser viewport height (`window.innerHeight` / `dvh`)
 */
export function getFocusModalLayout(item, viewportW, viewportH) {
  const vw = Math.max(280, viewportW || 390);
  const vh = Math.max(480, viewportH || 844);

  const commentsSectionHeight = Math.min(
    COMMENTS_MAX_H,
    Math.max(COMMENTS_MIN_H, Math.round(vh * COMMENTS_HEIGHT_RATIO)),
  );
  const focusMediaColumnBudget =
    vh - commentsSectionHeight - FOCUS_MODAL_CTA_HEIGHT - 2 * FOCUS_MEDIA_ZONE_PADDING_Y - FOCUS_HEADER_ROW_H;
  const maxMediaHeight = Math.max(160, focusMediaColumnBudget * 0.96);
  const maxMediaWidth = Math.max(240, vw - 2 * FOCUS_MEDIA_HORIZONTAL_PADDING);

  const intrinsic = resolveIntrinsicSize(item);
  const mediaDisplay = fitMediaToMaxBox(intrinsic.width, intrinsic.height, maxMediaWidth, maxMediaHeight);

  return {
    mediaDisplay,
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
