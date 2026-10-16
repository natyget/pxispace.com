// The 8.5s loop from docs/PACING.md, in frames at 30fps.
// Every template reads its timing from here so a pacing change lands everywhere.

import { interpolate, spring } from 'remotion';
import { SNAP_SPRING, VIDEO } from './tokens';

const s = (seconds: number) => Math.round(seconds * VIDEO.fps);

export const BEATS = {
  hook: { from: 0, to: s(0.8) }, // 0–24
  problem: { from: s(0.8), to: s(2.5) }, // 24–75
  magic: { from: s(2.5), to: s(5.5) }, // 75–165
  payoff: { from: s(5.5), to: s(7.5) }, // 165–225
  cta: { from: s(7.5), to: VIDEO.durationInFrames }, // 225–255
} as const;

export type BeatName = keyof typeof BEATS;

/** 0→1 across a beat (clamped). */
export const beatProgress = (frame: number, beat: BeatName) => {
  const { from, to } = BEATS[beat];
  return interpolate(frame, [from, to], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
};

/** The MAGIC snap. `delay` staggers items, in frames after the beat starts. */
export const snap = (frame: number, delay = 0) =>
  spring({
    frame: frame - BEATS.magic.from - delay,
    fps: VIDEO.fps,
    config: SNAP_SPRING,
  });

/**
 * Loop closure: 1 for most of the film, falls to 0 over the last frames so the
 * final frame is the same black void the first frame starts in.
 */
export const loopFade = (frame: number) =>
  interpolate(frame, [VIDEO.durationInFrames - 8, VIDEO.durationInFrames - 1], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
