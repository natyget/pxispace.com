// TICKET FLIP — the ticket is the hero.
// HOOK      the ticket hurtles out of the void at the lens and stops an inch away (pop).
// PROBLEM   it flips: the back is the night. Twelve prints burst out of it under
//           flashes and shutters, everyone's camera roll at once.
// MAGIC     the spring snaps them into one 3×4 roll; each print develops as it lands.
// PAYOFF    a slow dolly into the one print you're in: the morning after.
// CTA       mark + three words, fall to black = frame 0.

import React, { useMemo } from 'react';
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { DateStamp, Headline } from '../components/Type';
import { EndCard } from '../components/EndCard';
import { flashEnvelope } from '../components/FlashLight';
import { Polaroid, POLAROID_SIZE } from '../components/Polaroid';
import { Sfx, type Cue } from '../components/Sfx';
import { Stage, type CameraPose } from '../components/Stage';
import { Ticket } from '../components/Ticket';
import { BEATS, loopFade, snap } from '../lib/beats';
import { gridSlots, makeThrows, mixPose, snapDelay, throwPose, type Vec3 } from '../lib/motion';
import type { TemplateProps } from '../lib/props';

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const N = 12;
const YOU = 7; // the print the payoff lands on
const RELEASE = 30; // frame the prints leave the ticket
const FLASHES = [32, 39, 45, 52, 58, 63, 69] as const;
const CUES: Cue[] = [
  { at: 12, sound: 'pop' },
  ...FLASHES.map((at, i) => ({ at, sound: 'shutter' as const, volume: 0.55 + (i % 3) * 0.15 })),
  { at: BEATS.magic.from + 4, sound: 'capture-chk', volume: 0.8 },
  { at: BEATS.magic.from + 26, sound: 'success', volume: 0.9 },
];

export const TicketFlip: React.FC<TemplateProps> = ({ footageUrl, headlines, eventDate }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const throws = useMemo(
    () => makeThrows(N, 'ticket-flip', { origin: [0, 0, 0.6], spread: 4.6, depth: 2.2, spin: 7, drag: 2.6 }),
    [],
  );
  const grid = useMemo(() => gridSlots(3, 4, POLAROID_SIZE, 0.08, [0, 0.15, 0]), []);

  const flash = flashEnvelope(frame, FLASHES);
  const fade = loopFade(frame);
  const keyLevel = interpolate(frame, [BEATS.cta.from, BEATS.cta.from + 10], [1, 0.16], clamp) * fade;

  // Ticket: accelerates out of the void, near-miss, recoils, flips, retreats.
  const fly = interpolate(frame, [0, 14], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const recoil = spring({ frame: frame - 14, fps, config: { stiffness: 200, damping: 14 } });
  const flip = interpolate(frame, [24, 33], [0, Math.PI], { ...clamp, easing: Easing.out(Easing.cubic) });
  const retreat = interpolate(frame, [34, BEATS.magic.from], [0, 1], { ...clamp, easing: Easing.out(Easing.quad) });
  const ticketZ = frame < 14 ? lerp(-80, 4.5, fly) : lerp(4.5, 1.2, recoil) - retreat * 4.2;
  const ticketPos: Vec3 = [0, -retreat * 0.6, ticketZ];
  const ticketRot: Vec3 = [(1 - fly) * 1.2 - 0.25 * (1 - retreat), flip, (1 - fly) * Math.PI * 5 + 0.12];

  // Camera.
  const dolly = interpolate(frame, [BEATS.payoff.from, BEATS.payoff.to], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.sin),
  });
  const pullBack = interpolate(frame, [BEATS.cta.from, BEATS.cta.to], [0, 1], { ...clamp, easing: Easing.out(Easing.quad) });
  const you = grid[YOU].p;
  const pose: CameraPose = {
    position: [lerp(0, you[0] * 0.6, dolly), lerp(0.15, you[1] * 0.6, dolly), lerp(6, 3.4, dolly) + pullBack * 3],
    target: [lerp(0, you[0], dolly), lerp(0.15, you[1], dolly), 0],
    focus: frame < 34 ? ticketPos : frame < BEATS.payoff.from ? [0, 0.15, 0] : you,
  };
  const shake =
    frame < BEATS.problem.from ? 1.5 : frame < BEATS.magic.from ? 2.4 : frame < BEATS.payoff.from ? 1 : 0.7;

  const prints = throws.map((th, i) => {
    if (frame < RELEASE) return null;
    const delay = snapDelay(i, N, 16, 'tf');
    const s = snap(frame, delay);
    const chaos = throwPose(th, (frame - RELEASE) / fps);
    const pose = mixPose(chaos, grid[i], s);
    const landed = BEATS.magic.from + delay;
    const isYou = i === YOU;
    const payoffLift = isYou ? dolly : 0;
    return (
      <Polaroid
        key={i}
        seed={`tf-${i}`}
        position={[pose.p[0], pose.p[1], pose.p[2] + payoffLift * 0.15]}
        rotation={pose.r}
        scale={interpolate(frame, [RELEASE, RELEASE + 4], [0.3, 1], clamp)}
        crop={{ x: (i % 3) / 2, y: Math.floor(i / 3) / 3, zoom: 1.6 + (i % 4) * 0.2 }}
        curl={lerp(0.9, 0.3, Math.min(1, s))}
        develop={interpolate(frame, [landed, landed + 40], [0.12, 1], clamp)}
        leak={isYou ? 0.25 + payoffLift * 0.35 : i % 5 === 2 ? 0.5 : 0}
        flash={flash}
        keyLevel={keyLevel * (isYou ? 1 : lerp(1, 0.7, dolly))}
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
            <Headline text={headlines[0]} from={4} to={40} />
            <Headline text={headlines[1]} from={44} to={150} />
            <Headline text={headlines[2]} from={BEATS.payoff.from + 5} to={BEATS.payoff.to} />
            <DateStamp eventDate={eventDate} time="11:47 pm" from={BEATS.problem.from} to={BEATS.magic.from} />
            <EndCard />
          </>
        }
      >
        <Ticket eventDate={eventDate} position={ticketPos} rotation={ticketRot} flash={flash} keyLevel={keyLevel} opacity={fade} />
        {prints}
      </Stage>
      <Sfx cues={CUES} />
    </>
  );
};
