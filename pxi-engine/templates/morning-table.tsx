// MORNING TABLE — the morning after is the hero. Shot top-down onto black felt
// under one tungsten pool, like the table you empty your pockets onto at 4am.
// HOOK      the ticket shoots out of the void at the lens, then slaps down onto the felt (pop).
// PROBLEM   prints rain down onto it from every direction, a disposable lands on
//           top, flashes going off: the pile you'd spend three days asking for.
// MAGIC     the spring squares everything into a contact sheet: ticket and camera
//           up top, sixteen prints in rows beneath.
// PAYOFF    the lens lowers from top-down to a slow oblique dolly across the sheet.
// CTA       mark + three words, fall to black = frame 0.

import React, { useMemo } from 'react';
import { Easing, interpolate, random, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { DisposableCamera } from '../components/DisposableCamera';
import { EndCard } from '../components/EndCard';
import { flashEnvelope } from '../components/FlashLight';
import { Polaroid, POLAROID_SIZE } from '../components/Polaroid';
import { Sfx, type Cue } from '../components/Sfx';
import { Stage, type CameraPose } from '../components/Stage';
import { Ticket } from '../components/Ticket';
import { DateStamp, Headline } from '../components/Type';
import { BEATS, loopFade, snap } from '../lib/beats';
import { gridSlots, mixPose, snapDelay, type Pose, type Vec3 } from '../lib/motion';
import type { TemplateProps } from '../lib/props';
import { COLOR } from '../lib/tokens';

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const sym = (k: string) => random(k) * 2 - 1;

const COLS = 4;
const ROWS = 4;
const N = COLS * ROWS;
const PRINT_SCALE = 0.66;
const FLASHES = [31, 38, 46, 51, 59, 67] as const;
const CUES: Cue[] = [
  { at: 12, sound: 'pop' },
  { at: 22, sound: 'capture-chk', volume: 0.7 }, // ticket hits the felt
  ...FLASHES.map((at, i) => ({ at, sound: 'shutter' as const, volume: 0.5 + (i % 2) * 0.2 })),
  { at: BEATS.magic.from + 3, sound: 'capture-chk', volume: 0.8 },
  { at: BEATS.magic.from + 28, sound: 'success', volume: 0.9 },
];

/** A print dropped onto the pile: falls from near the lens, lands at a random spot, slight bounce. */
const dropPose = (i: number, frame: number, release: number, fps: number): Pose => {
  const k = `mt-${i}`;
  const land: Vec3 = [sym(`${k}x`) * 1.5, sym(`${k}y`) * 2.1, 0.02 + i * 0.006];
  const t = Math.max(0, (frame - release) / fps);
  const fall = Math.min(1, t / 0.32);
  const z = fall < 1 ? lerp(4.2, land[2], fall * fall) : land[2] + Math.abs(Math.sin((t - 0.32) * 18)) * Math.exp(-(t - 0.32) * 14) * 0.15;
  return {
    p: [lerp(land[0] * 0.3, land[0], Math.min(1, fall * 1.4)), lerp(land[1] * 0.3, land[1], Math.min(1, fall * 1.4)), z],
    r: [sym(`${k}rx`) * 0.4 * (1 - fall), sym(`${k}ry`) * 0.4 * (1 - fall), sym(`${k}rz`) * 1.2 + (1 - fall) * 3],
  };
};

export const MorningTable: React.FC<TemplateProps> = ({ footageUrl, headlines, eventDate }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cell = { w: POLAROID_SIZE.w * PRINT_SCALE, h: POLAROID_SIZE.h * PRINT_SCALE };
  const grid = useMemo(() => gridSlots(COLS, ROWS, cell, 0.06, [0, -0.45, 0.02]), [cell.w, cell.h]);

  const flash = flashEnvelope(frame, FLASHES);
  const fade = loopFade(frame);
  const keyLevel = interpolate(frame, [BEATS.cta.from, BEATS.cta.from + 10], [1, 0.16], clamp) * fade;

  // Ticket: out of the void at the lens, then slapped onto the felt.
  const fly = interpolate(frame, [0, 13], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const slap = spring({ frame: frame - 13, fps, config: { stiffness: 320, damping: 18 } });
  const ticketChaos: Pose = {
    p: frame < 13 ? [0, 0, lerp(-80, 5.0, fly)] : [lerp(0, -0.35, slap), lerp(0, 0.4, slap), lerp(5.0, 0.012, slap)],
    r: frame < 13 ? [(1 - fly) * 1.5, (1 - fly) * 0.6, (1 - fly) * 9] : [0, 0, lerp(0.3, -0.42, slap)],
  };
  const ticketSheet: Pose = { p: [-0.48, 1.68, 0.03], r: [0, 0, 0] };
  const ticket = mixPose(ticketChaos, ticketSheet, snap(frame, 0));
  const ticketScale = lerp(1, 0.62, Math.min(1, snap(frame, 0)));

  // Disposable: dropped on top of the pile, then squared up beside the ticket.
  const camDrop = interpolate(frame, [34, 44], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  const camChaos: Pose = { p: [0.7, -0.6, lerp(5, 0.2, camDrop)], r: [0, 0, lerp(2.4, 0.5, camDrop)] };
  const camSheet: Pose = { p: [0.92, 1.68, 0.2], r: [0, 0, 0] };
  const cam = mixPose(camChaos, camSheet, snap(frame, 6));

  // Lens: top-down, then lowers into an oblique dolly across the sheet.
  const lower = interpolate(frame, [BEATS.payoff.from, BEATS.payoff.to], [0, 1], { ...clamp, easing: Easing.inOut(Easing.sin) });
  const pullBack = interpolate(frame, [BEATS.cta.from, BEATS.cta.to], [0, 1], { ...clamp, easing: Easing.out(Easing.quad) });
  const pose: CameraPose = {
    position: [lerp(0, 0.5, lower), lerp(0, -3.6, lower), lerp(6.4, 3.9, lower) + pullBack * 3],
    target: [lerp(0, -0.1, lower), lerp(0, -0.2, lower), 0],
    focus: frame < 20 ? ticket.p : [0, lerp(0, -0.9, lower), 0],
  };
  const shake =
    frame < BEATS.problem.from ? 1.4 : frame < BEATS.magic.from ? 2.2 : frame < BEATS.payoff.from ? 1 : 0.8;

  const prints = Array.from({ length: N }, (_, i) => {
    const release = 26 + Math.floor((i / N) * 34);
    if (frame < release) return null;
    const delay = 4 + snapDelay(i, N, 20, 'mt');
    const landed = BEATS.magic.from + delay;
    const chaos = dropPose(i, Math.min(frame, landed), release, fps);
    const s = snap(frame, delay);
    const pose = mixPose(chaos, grid[i], s);
    return (
      <Polaroid
        key={i}
        seed={`mt-${i}`}
        position={pose.p}
        rotation={pose.r}
        scale={PRINT_SCALE}
        crop={{ x: (i % COLS) / (COLS - 1), y: Math.floor(i / COLS) / (ROWS - 1), zoom: 1.7 + (i % 3) * 0.3 }}
        curl={lerp(0.7, 0.2, Math.min(1, s))}
        develop={interpolate(frame, [landed, landed + 40], [0.1, 1], clamp)}
        leak={i === 5 || i === 10 ? lower * 0.55 : 0}
        flash={flash}
        keyLevel={keyLevel}
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
            <Headline text={headlines[0]} from={4} to={34} />
            <Headline text={headlines[1]} from={38} to={150} />
            <Headline text={headlines[2]} from={BEATS.payoff.from + 5} to={BEATS.payoff.to} />
            <DateStamp eventDate={eventDate} time="3:58 am" from={BEATS.problem.from} to={BEATS.magic.from} />
            <EndCard />
          </>
        }
      >
        {/* Black felt: reads as void except where the tungsten pool grazes it. */}
        <mesh position={[0, 0, -0.01]}>
          <planeGeometry args={[30, 30]} />
          {/* Fades up during the hook so frame 0 is pure void, matching the loop's last frame. */}
          <meshStandardMaterial color={COLOR.ink} roughness={1} transparent opacity={interpolate(frame, [8, 22], [0, 1], clamp)} />
        </mesh>
        <Ticket
          eventDate={eventDate}
          position={ticket.p}
          rotation={ticket.r}
          scale={ticketScale}
          bend={0.6}
          flash={flash}
          keyLevel={keyLevel}
          opacity={fade}
        />
        {frame >= 34 ? <DisposableCamera position={cam.p} rotation={cam.r} scale={0.62} flash={flash} /> : null}
        {prints}
      </Stage>
      <Sfx cues={CUES} />
    </>
  );
};
