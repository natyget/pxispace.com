// Sizes and distances shared by the renderer (which draws text onto objects)
// and the critic (which checks that text will be big enough on a phone
// before anything renders). World units are decimetres.

export const CAMERA_Z = 6;
// 35mm lens on a 35mm gauge, vertical: fov 53.13°, tan(fov/2) = 0.5, so the
// visible frame height at distance d is exactly d world units.
export const screenPx = (worldHeight: number, distance: number) => (worldHeight * 1920) / distance;

/** Minimum on-screen cap-ish height (px on a 1080×1920 frame) for text to read on a phone. */
export const MIN_PX = { primary: 60, secondary: 28 } as const;

/** Instrument Serif averages ~0.43em per lowercase glyph. */
const SERIF_EM = 0.43;
export const fitPx = (text: string, widthPx: number, maxPx: number) =>
  Math.min(maxPx, Math.floor(widthPx / Math.max(1, text.length * SERIF_EM)));

export const TICKET = {
  w: 1.9,
  h: 0.72,
  canvas: [1900, 720] as const, // 1000 px per world unit
  titleWidthPx: 1080,
  titleMaxPx: 190,
  metaPx: 62,
  restZ: 2.4, // where it hangs to be read, 3.6 from the lens (94% of the frame width)
};

export const PAIN_CARD = {
  w: 1.5,
  h: 0.62,
  canvas: [1500, 620] as const,
  px: 150,
  distance: 3.3,
};

export const PRINT = { w: 0.88, h: 1.07, lipCanvas: [880, 240] as const, lipPx: 132 };

export const ALBUM = {
  w: 3.1,
  h: 4.6,
  canvas: [1240, 1840] as const, // 400 px per world unit
  cols: 3,
  rows: 3,
  printScale: 0.82,
  gap: 0.1,
  headerPx: 130,
  proofPx: 58,
  distance: 6.6, // camera pulls back to frame the whole page
  youDistance: 3.2, // the "you" print lifts towards the lens
  youScale: 1.35, // and grows so its lip reads
};

export const STAMP = {
  diameter: 1.7,
  canvas: 1024, // ~600 px per world unit
  topPx: 140,
  middlePx: 74,
  bottomPx: 56,
  distance: 5.45, // ink sits on the passport page
};

export const PASSPORT = {
  w: 3.2,
  h: 5.2,
  canvas: [1280, 2080] as const, // 400 px per world unit
  endPx: 74,
  urlPx: 46,
  distance: 5.45, // lens to page at the slam; the dolly closes to 4.95
};
