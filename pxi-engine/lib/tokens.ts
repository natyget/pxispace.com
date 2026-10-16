// Design tokens for PXI Space. docs/DESIGN_SYSTEM.md is the source of truth;
// change a value there first, then here.

export const VIDEO = {
  width: 1080,
  height: 1920,
  fps: 30,
  durationInFrames: 255, // 8.5s
} as const;

export const COLOR = {
  void: '#000000',
  tungsten: '#FF8C42',
  flash: '#FFFFFF',
  paper: '#EDE6D6', // matte ticket stock
  polaroidWhite: '#F2EFE8',
  ink: '#141210',
  plastic: '#1B1B1D', // disposable camera body
  plasticAccent: '#E9E2D0',
  leak: '#FF5A1F', // light-leak hot edge (site orange)
  type: '#F4EFE6', // headline on black, warm off-white
  typeMuted: 'rgba(244, 239, 230, 0.55)',
} as const;

export const CAMERA = {
  focalLengthMm: 35,
  filmGaugeMm: 35,
  // "0.2" in the spec: max 0.2° rotation on each axis plus ~2mm of drift,
  // at handheld frequencies. World units are decimetres (a polaroid is 0.88 × 1.07).
  shakeDegrees: 0.2,
  shakeTranslate: 0.02,
  shakeHz: 1.3,
  focusRange: 1.6, // in-focus depth either side of the focus target
  bokehScale: 5,
} as const;

// Remotion's spring uses stiffness/damping; the spec's tension/friction map 1:1.
// zeta = 22 / (2 * sqrt(280)) ≈ 0.66, so one visible overshoot of ~6% then settle.
export const SNAP_SPRING = {
  stiffness: 280,
  damping: 22,
  mass: 1,
  overshootClamping: false,
} as const;

export const SAFE = {
  // Reels UI covers the top ~220px and bottom ~420px; keep type inside.
  top: 220,
  bottom: 420,
  side: 72,
} as const;

export const CTA_WORDS = 'buy the ticket.';
export const CTA_URL = 'pxispace.com';
