// AVALANCHE — the camera is the hero.
// HOOK      a disposable lunges out of the void and fires its flash in your face (pop).
// PROBLEM   the flash keeps firing and prints pour down from above, dozens,
//           tumbling past the lens: every phone's camera roll falling on you.
// MAGIC     the spring yanks all 35 back up into one wall, each landing in its slot.
// PAYOFF    a slow crane up the wall, every frame developed: the morning after.
// CTA       mark + three words, fall to black = frame 0.

import React, { useMemo } from 'react';
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { DisposableCamera } from '../components/DisposableCamera';
import { EndCard } from '../components/EndCard';
import { flashEnvelope } from '../components/FlashLight';
import { Polaroid, POLAROID_SIZE } from '../components/Polaroid';
import { Sfx, type Cue } from '../components/Sfx';
import { Stage, type CameraPose } from '../components/Stage';
import { DateStamp, Headline } from '../components/Type';
import { BEATS, loopFade, snap } from '../lib/beats';
import { gridSlots, makeThrows, mixPose, snapDelay, throwPose, type Vec3 } from '../lib/motion';
import type { TemplateProps } from '../lib/props';

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const COLS = 5;
const ROWS = 7;
const N = COLS * ROWS;
const PRINT_SCALE = 0.6;
const YOU = [8, 17, 26]; // prints you're in: they catch a light leak in the payoff
const FIRST_FLASH = 14;
const FLASHES = [FIRST_FLASH, 28, 33, 37, 44, 49, 53, 60, 66, 71] as const;
const CUES: Cue[] = [
  { at: 12, sound: 'pop' },
  ...FLASHES.map((at, i) => ({ at, sound: 'shutter' as const, volume: i === 0 ? 1 : 0.45 + (i % 3) * 0.15 })),
  { at: BEATS.magic.from + 2, sound: 'capture-chk', volume: 0.8 },
  { at: BEATS.magic.from + 30, sound: 'success', volume: 0.9 },
];

export const Avalanche: React.FC<TemplateProps> = ({ footageUrl, headlines, eventDate }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const throws = useMemo(
    () => makeThrows(N, 'avalanche', { origin: [0, 4.4, 0.4], spread: 1.7, depth: 2.6, spin: 5, drag: 0.9, gravity: 7.5, jitter: 1.2 }),
    [],
  );
  const cell = { w: POLAROID_SIZE.w * PRINT_SCALE, h: POLAROID_SIZE.h * PRINT_SCALE };
  const grid = useMemo(() => gridSlots(COLS, ROWS, cell, 0.05, [0, 0.1, 0]), [cell.w, cell.h]);

  const flash = flashEnvelope(frame, FLASHES, 4, 0.75);
  const fade = loopFade(frame);
  const keyLevel = interpolate(frame, [BEATS.cta.from, BEATS.cta.from + 10], [1, 0.16], clamp) * fade;

  // Camera body: lunges at the lens, fires, then backs off and sinks out of the way.
  const lunge = interpolate(frame, [0, 12], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const kick = spring({ frame: frame - FIRST_FLASH, fps, config: { stiffness: 260, damping: 12 } }); // recoil from the flash
  const backOff = interpolate(frame, [30, BEATS.magic.from], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const camZ = frame < 12 ? lerp(-60, 3.4, lunge) : 3.4 - kick * 0.5 - backOff * 6;
  const bodyPos: Vec3 = [backOff * 0.4, -backOff * 2.4, camZ];
  const bodyRot: Vec3 = [(1 - lunge) * 1.4 + kick * 0.08, (1 - lunge) * -2.2 + 0.18, (1 - lunge) * 0.9 - 0.06];

  // Lens: tilts down with the pour, then cranes up the finished wall.
  const pourTilt = interpolate(frame, [BEATS.problem.from, BEATS.magic.from], [0, 1], { ...clamp, easing: Easing.out(Easing.quad) });
  const crane = interpolate(frame, [BEATS.payoff.from, BEATS.payoff.to], [0, 1], { ...clamp, easing: Easing.inOut(Easing.sin) });
  const pullBack = interpolate(frame, [BEATS.cta.from, BEATS.cta.to], [0, 1], { ...clamp, easing: Easing.out(Easing.quad) });
  const pose: CameraPose = {
    position: [0, lerp(-1.1, 1.2, crane) - pourTilt * 0.3 * (1 - crane), 6.2 - crane * 1.4 + pullBack * 3],
    target: [0, lerp(-0.9, 1.0, crane) - pourTilt * 0.6 * (1 - crane), 0],
    focus: frame < 30 ? bodyPos : [0, lerp(-0.9, 1.0, crane), 0],
    roll: -pourTilt * 0.03 * (1 - crane),
  };
  const shake =
    frame < BEATS.problem.from ? 1.8 + (frame >= FIRST_FLASH ? kick * 2 : 0) : frame < BEATS.magic.from ? 2.6 : frame < BEATS.payoff.from ? 1 : 0.7;

  const prints = throws.map((th, i) => {
    const release = 24 + Math.floor((i / N) * 30);
    if (frame < release) return null;
    const delay = snapDelay(i, N, 22, 'av');
    const landed = BEATS.magic.from + delay;
    // Freeze the fall at the moment this print's snap begins so the spring
    // starts from where it actually was.
    const chaos = throwPose(th, (Math.min(frame, landed) - release) / fps);
    const s = snap(frame, delay);
    const pose = mixPose(chaos, grid[i], s);
    const isYou = YOU.includes(i);
    return (
      <Polaroid
        key={i}
        seed={`av-${i}`}
        position={pose.p}
        rotation={pose.r}
        scale={PRINT_SCALE}
        crop={{ x: (i % COLS) / (COLS - 1), y: Math.floor(i / COLS) / (ROWS - 1), zoom: 1.8 + (i % 3) * 0.35 }}
        curl={lerp(0.85, 0.25, Math.min(1, s))}
        develop={interpolate(frame, [landed, landed + 36], [0.1, 1], clamp)}
        leak={isYou ? crane * 0.65 : 0}
        flash={flash}
        keyLevel={keyLevel * (isYou ? 1 : lerp(1, 0.78, crane))}
        opacity={fade}
      />
    );
  });

  return (
    <>
      <Stage
        footageUrl={footageUrl}
        pose={pose}
        shake={shake}
        flash={flash}
        keyLevel={keyLevel}
        overlay={
          <>
            <Headline text={headlines[0]} from={3} to={30} />
            <Headline text={headlines[1]} from={34} to={150} />
            <Headline text={headlines[2]} from={BEATS.payoff.from + 5} to={BEATS.payoff.to} />
            <DateStamp eventDate={eventDate} time="1:12 am" from={BEATS.problem.from} to={BEATS.magic.from} />
            <EndCard />
          </>
        }
      >
        <DisposableCamera position={bodyPos} rotation={bodyRot} flash={flash} />
        {prints}
      </Stage>
      <Sfx cues={CUES} />
    </>
  );
};
