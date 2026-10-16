import { loadFont as loadSerif } from '@remotion/google-fonts/InstrumentSerif';
import { loadFont as loadMono } from '@remotion/google-fonts/DMMono';

// Instrument Serif is the spec font. ABC Diatype Mono is a paid Dinamo face we
// don't have files for, so DM Mono stands in until a licensed .woff2 lands in
// public/brand/ (see docs/DESIGN_SYSTEM.md, "Typography").
const serifFont = loadSerif('normal', { weights: ['400'], subsets: ['latin'] });
const monoFont = loadMono('normal', { weights: ['400'], subsets: ['latin'] });

export const serif = serifFont.fontFamily;
export const mono = monoFont.fontFamily;

/** Resolves once both faces can be drawn, e.g. into a canvas texture. */
export const fontsReady = Promise.all([serifFont.waitUntilDone(), monoFont.waitUntilDone()]);
