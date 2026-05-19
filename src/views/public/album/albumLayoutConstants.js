/** Mirrored from `pxi-mobile-app/src/components/album/threadLayout.ts` + album screen. */

export const THREAD_PAGE_HORIZONTAL_GUTTER = 16;
export const THREAD_TOGGLE_TRACK_INNER_PADDING = 6;
export const THREAD_CHATBAR_HORIZONTAL_INSET =
  THREAD_PAGE_HORIZONTAL_GUTTER + THREAD_TOGGLE_TRACK_INNER_PADDING;
export const THREAD_LIST_EXTRA_HORIZONTAL_PADDING = 18;
export const THREAD_LIST_HORIZONTAL_INSET =
  THREAD_CHATBAR_HORIZONTAL_INSET + THREAD_LIST_EXTRA_HORIZONTAL_PADDING;

/** Public web thread list — horizontal padding (per side). */
export const PUBLIC_ALBUM_THREAD_LIST_HORIZONTAL_INSET = 24;

export const ALBUM_HEADER_HEIGHT = 56;
export const THREAD_MEDIA_TILT_DEG = 2.8;
export const THREAD_CARD_MEDIA_ROW_GAP = 4;
export const THREAD_SCRAPBOOK_BORDER_PX = 7;

/** Polaroid frame — `scrapbookFrame.ts` */
export const ALBUM_MEDIA_FRAME_COLOR = 'rgba(48, 52, 60, 0.94)';

/** iPhone 14/15 logical points (matches React Native `Dimensions` on standard devices). */
export const IPHONE_VIEWPORT_WIDTH = 390;
export const IPHONE_VIEWPORT_HEIGHT = 844;

/** Public web thread list — fixed scroll viewport (phone screen area). */
export const PUBLIC_ALBUM_THREAD_LIST_HEIGHT = 600;
