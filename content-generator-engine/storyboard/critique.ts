// The critic. Runs twice:
//   before render, on the storyboard (the rules Naty set, as checks);
//   after render, on sampled frames (is the hook white, is there an orange cast,
//   are the photos too dark to see faces).
// A "fail" blocks the render; the planner or the board must change first.

import { ALBUM, fitPx, MIN_PX, PAIN_CARD, PASSPORT, PRINT, screenPx, STAMP, TICKET, CAMERA_Z } from '../src/lib/layout.ts';
import type { Storyboard } from '../src/lib/storyboard.ts';
import type { Library } from './build.ts';

export type Issue = { level: 'fail' | 'warn'; rule: string; detail: string };

const BANNED = ['revolutionary', 'seamless', 'unlock', 'elevate', 'platform', 'solution', 'while you\'re still on the floor', 'the camera,'];
const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

export const critiqueBoard = (sb: Storyboard, library: Library) => {
  const issues: Issue[] = [];
  const fail = (rule: string, detail: string) => issues.push({ level: 'fail', rule, detail });
  const warn = (rule: string, detail: string) => issues.push({ level: 'warn', rule, detail });

  // 1. Hook: white flash on frame 0, something at the lens inside 0.3s.
  const flashIn = sb.timeline.find((s) => s.id === 'flash-in');
  if (!flashIn || flashIn.frames[0] !== 0 || flashIn.frames[1] > 9) fail('hook', 'No impact at the lens by frame 9 (0.3s).');

  // 2. Three words per beat, in the scene. The social-proof line and the end line are Naty's own exceptions.
  const primary: [string, string][] = [
    ['hook', sb.copy.ticketTitle],
    ['camera', sb.copy.pain],
    ['magic', sb.copy.counter.replace('{n}', String(sb.counts.photos))],
    ['payoff', sb.copy.stamp.top],
  ];
  for (const [beat, text] of primary) if (words(text) > 3) fail('three-words', `${beat}: "${text}" is ${words(text)} words.`);

  // 3. Banned words and repeats anywhere in the copy.
  const all = [sb.copy.ticketTitle, ...sb.copy.ticketMeta, sb.copy.pain, sb.copy.counter, sb.copy.socialProof, sb.copy.stamp.top, sb.copy.stamp.middle, sb.copy.stamp.bottom, ...sb.copy.endLines].join(' | ').toLowerCase();
  for (const b of BANNED) if (all.includes(b)) fail('banned', `"${b}" appears in the copy.`);
  const distinct = new Set(primary.map(([, t]) => t));
  if (distinct.size < primary.length) fail('repeat', 'Two beats show the same line.');

  // 4. Footage matches the event and has enough faces and variety.
  const type = sb.event.eventType;
  const entry = (file: string) => library.footage.find((e) => e.file === file);
  const unique = new Set(sb.footage.prints);
  if (unique.size < 6) warn('variety', `Only ${unique.size} different photos for 9 prints; repeats will show in the album.`);
  for (const file of unique) {
    const e = entry(file);
    if (!e) continue;
    if (!e.tags.includes(type)) fail('footage-match', `${file} is not tagged ${type}.`);
    if (e.tags[0] !== type) warn('footage-borrowed', `${file} is borrowed from ${e.tags[0]}.`);
    if ((type === 'brunch' || type === 'rooftop') && e.tags.includes('night')) fail('footage-match', `${file} is night footage in a day event.`);
  }
  const you = entry(sb.footage.prints[sb.footage.youIndex]);
  if (you && !you.faces) fail('finds-you', `The "you" print (${you.file}) has no face.`);
  const vf = entry(sb.footage.viewfinder);
  if (vf && !vf.faces) fail('viewfinder', `The viewfinder photo (${vf.file}) has no face.`);

  // 5. Text will be big enough on a phone (projected cap height on a 1080×1920 frame).
  const titlePx = fitPx(sb.copy.ticketTitle, TICKET.titleWidthPx, TICKET.titleMaxPx);
  const checks: [string, number, 'primary' | 'secondary'][] = [
    ['ticket title', screenPx(titlePx / 1000, CAMERA_Z - TICKET.restZ), 'primary'],
    ['ticket meta', screenPx(TICKET.metaPx / 1000, CAMERA_Z - TICKET.restZ), 'secondary'],
    ['pain card', screenPx((fitPx(sb.copy.pain, PAIN_CARD.canvas[0] * 0.86, PAIN_CARD.px) / PAIN_CARD.canvas[0]) * PAIN_CARD.w, PAIN_CARD.distance), 'primary'],
    ['album counter', screenPx((ALBUM.headerPx / ALBUM.canvas[0]) * ALBUM.w, ALBUM.distance), 'primary'],
    ['social proof', screenPx((fitPx(sb.copy.socialProof, ALBUM.canvas[0] * 0.62, ALBUM.proofPx) / ALBUM.canvas[0]) * ALBUM.w, ALBUM.distance), 'secondary'],
    ['"you" lip', screenPx((PRINT.lipPx / PRINT.lipCanvas[0]) * PRINT.w * ALBUM.youScale, ALBUM.youDistance), 'primary'],
    ['stamp top', screenPx((STAMP.topPx / STAMP.canvas) * STAMP.diameter, STAMP.distance), 'primary'],
    ['stamp date', screenPx((STAMP.bottomPx / STAMP.canvas) * STAMP.diameter, STAMP.distance), 'secondary'],
    ['end line', screenPx((PASSPORT.endPx / PASSPORT.canvas[0]) * PASSPORT.w, PASSPORT.distance), 'secondary'],
  ];
  const sizes: Record<string, number> = {};
  for (const [name, px, kind] of checks) {
    sizes[name] = Math.round(px);
    if (px < MIN_PX[kind]) fail('readable', `${name} projects to ${Math.round(px)}px; needs ${MIN_PX[kind]}px.`);
  }

  // 6. The stranger test: muted, three seconds, never heard of PXI.
  const stranger = {
    pain: Boolean(sb.copy.pain) && sb.timeline.some((s) => s.id === 'flash-burst'),
    magic: sb.timeline.some((s) => s.id === 'snap-album') && sb.copy.printLips.includes('you'),
    payoff: sb.copy.stamp.top === 'verified',
    trackRecord: sb.counts.pastStamps > 0,
  };
  if (!stranger.pain) fail('stranger', 'No visible pain beat.');
  if (!stranger.magic) fail('stranger', 'No album snap that finds you.');
  if (!stranger.payoff) fail('stranger', 'No verified stamp.');
  if (!stranger.trackRecord) warn('stranger', 'pastAlbumCount is 0: the passport has no earlier stamps, so no track record shows.');

  return { pass: !issues.some((i) => i.level === 'fail'), issues, sizes, stranger };
};

/** litFraction: share of pixels bright enough to count towards redOverBlue. */
export type FrameStats = { frame: number; meanLuma: number; redOverBlue: number; litFraction: number; photoLuma?: number };

/** After render: numbers measured from sampled frames (see generate.ts). */
export const critiqueFrames = (stats: FrameStats[]) => {
  const issues: Issue[] = [];
  const at = (f: number) => stats.find((s) => s.frame === f);
  const f0 = at(0);
  if (f0 && f0.meanLuma < 0.6) issues.push({ level: 'fail', rule: 'hook', detail: `Frame 0 mean luma ${f0.meanLuma.toFixed(2)}: not a white flash.` });
  for (const s of stats) {
    if (s.frame === 0 || s.frame >= 251) continue;
    // A small bright thing (the pink-orange PXI mark on black) is not a filter; a cast needs a lit frame.
    if (s.litFraction > 0.15 && s.redOverBlue > 1.5) issues.push({ level: 'fail', rule: 'orange-cast', detail: `Frame ${s.frame}: red/blue ${s.redOverBlue.toFixed(2)} on lit pixels reads as an orange filter.` });
    if (s.photoLuma !== undefined && s.photoLuma < 0.22) issues.push({ level: 'warn', rule: 'dark-photos', detail: `Frame ${s.frame}: photo area luma ${s.photoLuma.toFixed(2)}; faces may not read.` });
  }
  return { pass: !issues.some((i) => i.level === 'fail'), issues };
};
