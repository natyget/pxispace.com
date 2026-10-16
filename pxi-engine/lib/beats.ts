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
 * Fades type out over the last frames, before the loop flash takes the frame.
 */
export const loopFade = (frame: number) =>
  interpolate(frame, [VIDEO.durationInFrames - 8, VIDEO.durationInFrames - 1], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

/**
 * Loop closure, flash to flash: the disposable fires over the last 4 frames and
 * frame 254 is pure white. Frame 0 is that same flash one step into its decay,
 * so the seam reads as a single flash. Returns 0..1, a flash level.
 */
export const LOOP_FLASH_FRAMES = 4;
export const loopFlash = (frame: number) =>
  interpolate(frame, [VIDEO.durationInFrames - LOOP_FLASH_FRAMES, VIDEO.durationInFrames - 1], [0.3, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  }) * (frame >= VIDEO.durationInFrames - LOOP_FLASH_FRAMES ? 1 : 0);
