import { loadFont } from '@remotion/fonts';
import { staticFile } from 'remotion';

// Both faces are self-hosted from public/brand/fonts (SIL OFL, licences beside
// them), so renders never depend on reaching Google Fonts.
// Instrument Serif is the spec font. ABC Diatype Mono is a paid Dinamo face we
// don't have files for, so DM Mono stands in until a licensed .woff2 lands in
// public/brand/fonts/ (see docs/DESIGN_SYSTEM.md, "Typography").
export const serif = 'Instrument Serif';
export const mono = 'DM Mono';

/** Resolves once both faces can be drawn, e.g. into a canvas texture. */
export const fontsReady = Promise.all([
  loadFont({ family: serif, url: staticFile('brand/fonts/InstrumentSerif-Regular.woff2'), weight: '400' }),
  loadFont({ family: mono, url: staticFile('brand/fonts/DMMono-Regular.woff2'), weight: '400' }),
]);
