// The hook bank: frames 0–24 (HOOK) are a swappable module, so any opener can
// sit in front of any template body. A hook owns the hero object's pose, the
// flash and the shake for its 24 frames, plus its sound cues. It hands the hero
// over at frame 24 in `handoff`, and the template body carries on from there.

import type { Cue } from '../components/Sfx';
import type { Pose, Vec3 } from '../lib/motion';

export type HookFrame = {
  /** Pose of the hero object this frame. */
  hero: Pose;
  /** 0..1 lens flash level. */
  flash: number;
  /** Multiplier on the 0.2 handheld shake. */
  shake: number;
  /** Where focus sits. */
  focus: Vec3;
};

export type Hook = {
  id: string;
  /** Which object the hook throws at the lens. The body renders it after frame 24. */
  hero: 'ticket' | 'camera';
  /** Pure function of frame: any frame 0–24 renders alone. */
  at: (frame: number, fps: number) => HookFrame;
  /** Where the hero is at frame 24. */
  handoff: Pose;
  cues: Cue[];
};
