// TICKET AT LENS: frame 0 is the loop flash decaying onto a ticket already in
// flight, back towards us, so the first thing you see is a face from the night.
// It accelerates at the lens, near-misses on the pop, and recoils to the handoff.

import { Easing, interpolate, spring } from 'remotion';
import { flashEnvelope } from '../components/FlashLight';
import type { Pose } from '../lib/motion';
import type { Hook } from './types';

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const IMPACT = 12;
const START_Z = -2.5; // close enough that the face on the back reads in frame 0
const NEAR_MISS_Z = 4.5; // camera sits at z 6
const REST_Z = 1.2;

// rotation y = PI shows the back (footage) to the lens.
const pose = (frame: number, fps: number): Pose => {
  const fly = interpolate(frame, [0, IMPACT], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const recoil = spring({ frame: frame - IMPACT, fps, config: { stiffness: 200, damping: 14 } });
  const z = frame < IMPACT ? lerp(START_Z, NEAR_MISS_Z, fly) : lerp(NEAR_MISS_Z, REST_Z, recoil);
  return {
    p: [lerp(-0.25, 0, fly), lerp(0.35, 0, fly), z],
    r: [lerp(-0.35, -0.06, fly), Math.PI, frame < IMPACT ? lerp(0.5, 0.04, fly) : 0.04],
  };
};

export const ticketAtLens: Hook = {
  id: 'ticket-at-lens',
  hero: 'ticket',
  at: (frame, fps) => {
    const hero = pose(frame, fps);
    const kick = frame >= IMPACT ? Math.exp(-(frame - IMPACT) / 4) : 0;
    return {
      hero,
      // The loop flash peaks on the last frame (as if at frame -1); frame 0 is one step into its decay.
      flash: flashEnvelope(frame, [-1], 4),
      shake: 1.5 + kick * 2.5,
      focus: hero.p,
    };
  },
  handoff: pose(24, 30),
  cues: [{ at: IMPACT, sound: 'pop' }],
};
