// Deterministic motion for crowds of objects: how a pile of prints is thrown
// (PROBLEM) and where each one lands when the spring snaps them (MAGIC).
// Everything is a pure function of frame + seed, so any frame renders alone.

import { random } from 'remotion';

export type Vec3 = [number, number, number];
export type Pose = { p: Vec3; r: Vec3 };

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerp3 = (a: Vec3, b: Vec3, t: number): Vec3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

/** Mix two poses. `t` may overshoot past 1 (springs do); that is the point. */
export const mixPose = (a: Pose, b: Pose, t: number): Pose => ({ p: lerp3(a.p, b.p, t), r: lerp3(a.r, b.r, t) });

export type Throw = {
  origin: Vec3;
  velocity: Vec3;
  spin: Vec3;
  rotation: Vec3;
  /** Air drag; higher stops sooner. */
  drag: number;
  gravity: number;
};

const sym = (seed: string) => random(seed) * 2 - 1;

/** `n` throws from around `origin`, spread `spread` units/s, seeded. */
export const makeThrows = (
  n: number,
  seed: string,
  { origin = [0, 0, 0] as Vec3, spread = 6, depth = 3, spin = 6, drag = 2.2, gravity = 0, jitter = 0.2 } = {},
): Throw[] =>
  Array.from({ length: n }, (_, i) => {
    const k = `${seed}-${i}`;
    return {
      origin: [origin[0] + sym(`${k}ox`) * jitter, origin[1] + sym(`${k}oy`) * jitter, origin[2] + sym(`${k}oz`) * jitter],
      velocity: [sym(`${k}vx`) * spread, sym(`${k}vy`) * spread * 1.4, sym(`${k}vz`) * depth],
      spin: [sym(`${k}sx`) * spin, sym(`${k}sy`) * spin, sym(`${k}sz`) * spin * 0.6],
      rotation: [sym(`${k}rx`) * 0.6, sym(`${k}ry`) * 0.6, sym(`${k}rz`) * Math.PI],
      drag: drag * (0.8 + random(`${k}d`) * 0.4),
      gravity,
    };
  });

/** Pose of a throw `t` seconds after release: drag-decayed flight, optional gravity, spin that slows with drag. */
export const throwPose = (th: Throw, t: number): Pose => {
  const tt = Math.max(0, t);
  const travel = (1 - Math.exp(-th.drag * tt)) / th.drag;
  return {
    p: [
      th.origin[0] + th.velocity[0] * travel,
      th.origin[1] + th.velocity[1] * travel - 0.5 * th.gravity * tt * tt,
      th.origin[2] + th.velocity[2] * travel,
    ],
    r: [
      th.rotation[0] + th.spin[0] * travel,
      th.rotation[1] + th.spin[1] * travel,
      th.rotation[2] + th.spin[2] * travel,
    ],
  };
};

/** Row-major grid slots centred on `center`, facing +z. Top-left first. */
export const gridSlots = (
  cols: number,
  rows: number,
  cell: { w: number; h: number },
  gap: number,
  center: Vec3 = [0, 0, 0],
): Pose[] => {
  const W = cols * cell.w + (cols - 1) * gap;
  const H = rows * cell.h + (rows - 1) * gap;
  const out: Pose[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      out.push({
        p: [center[0] - W / 2 + cell.w / 2 + c * (cell.w + gap), center[1] + H / 2 - cell.h / 2 - r * (cell.h + gap), center[2]],
        r: [0, 0, 0],
      });
    }
  }
  return out;
};

/** Stagger for the snap: centre-out by default, which reads as "pulled into order". */
export const snapDelay = (i: number, n: number, spreadFrames = 14, seed = 'delay') =>
  Math.round(
    (Math.abs(i - (n - 1) / 2) / ((n - 1) / 2 || 1)) * spreadFrames * 0.75 + random(`${seed}-${i}`) * spreadFrames * 0.25,
  );
