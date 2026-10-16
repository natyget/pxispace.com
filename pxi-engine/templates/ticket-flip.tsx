// TICKET FLIP — the ticket is the hero.
// HOOK      from the hook bank (default ticket-at-lens): the loop flash decays onto a
//           ticket in flight, back to us with a face on it; it near-misses the lens (pop).
// PROBLEM   it flips to its printed front. Twelve prints burst out of it under
//           flashes and shutters, everyone's camera roll at once.
// MAGIC     the spring snaps them into one 3×4 roll; each print develops as it lands,
//           and "photos of you" counts up to photoCount.
// PAYOFF    a slow dolly into the one print you're in: the morning after.
// CTA       mark + three words, then the disposable fires: the last frame is the
//           white that frame 0 decays from.

import React, { useMemo } from 'react';
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { EndCard } from '../components/EndCard';
import { flashEnvelope } from '../components/FlashLight';
import { Polaroid, POLAROID_SIZE } from '../components/Polaroid';
import { Sfx, type Cue } from '../components/Sfx';
import { Stage, type CameraPose } from '../components/Stage';
import { Ticket } from '../components/Ticket';
import { counterCues, DateStamp, Headline, PhotoCounter } from '../components/Type';
import { getHook } from '../hooks';
import { BEATS, loopFlash, snap } from '../lib/beats';
import { FootageSlice } from '../lib/footage';
import { gridSlots, makeThrows, mixPose, snapDelay, throwPose, type Pose, type Vec3 } from '../lib/motion';
import { DEFAULT_PHOTO_COUNT, type TemplateProps } from '../lib/props';

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const N = 12;
const YOU = 7; // the print the payoff lands on
const RELEASE = 30; // frame the prints leave the ticket
const FOOTAGE_STRIDE = 47; // frames between the moments each print shows
const FLASHES = [32, 39, 45, 52, 58, 63, 69] as const;
const COUNT_FROM = BEATS.magic.from + 6;
const COUNT_TO = BEATS.magic.to - 10;

export const TicketFlip: React.FC<TemplateProps> = ({ footageUrl, headlines, eventDate, photoCount, hook: hookId }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const hook = getHook(hookId);
  const count = photoCount ?? DEFAULT_PHOTO_COUNT;
  const inHook = frame < BEATS.problem.from;
  const h = inHook ? hook.at(frame, fps) : null;

  const throws = useMemo(
    () => makeThrows(N, 'ticket-flip', { origin: [0, 0, 0.6], spread: 4.6, depth: 2.2, spin: 7, drag: 2.6 }),
    [],
  );
  const grid = useMemo(() => gridSlots(3, 4, POLAROID_SIZE, 0.08, [0, 0.15, 0]), []);
  const cues = useMemo<Cue[]>(
    () => [
      ...hook.cues,
      ...FLASHES.map((at, i) => ({ at, sound: 'shutter' as const, volume: 0.55 + (i % 3) * 0.15 })),
      { at: BEATS.magic.from + 4, sound: 'capture-chk', volume: 0.8 },
      ...counterCues(count, COUNT_FROM, COUNT_TO),
      { at: BEATS.magic.from + 26, sound: 'success', volume: 0.9 },
      { at: BEATS.cta.to - 4, sound: 'shutter', volume: 1 }, // the loop flash
    ],
    [hook, count],
  );

  const flash = Math.max(h?.flash ?? 0, flashEnvelope(frame, FLASHES, 3, 0.75), loopFlash(frame));
  const keyLevel = interpolate(frame, [BEATS.cta.from, BEATS.cta.from + 10], [1, 0.07], clamp);

  // Ticket: the hook owns frames 0–24; then it flips to its front and retreats behind the prints.
  const flip = interpolate(frame, [24, 33], [0, Math.PI], { ...clamp, easing: Easing.out(Easing.cubic) });
  const retreat = interpolate(frame, [34, BEATS.magic.from], [0, 1], { ...clamp, easing: Easing.out(Easing.quad) });
  const ticket: Pose = h
    ? h.hero
    : {
        p: [hook.handoff.p[0], hook.handoff.p[1] - retreat * 0.6, hook.handoff.p[2] - retreat * 4.2],
        r: [hook.handoff.r[0] * (1 - retreat), hook.handoff.r[1] + flip, hook.handoff.r[2]],
      };

  // Camera.
  const dolly = interpolate(frame, [BEATS.payoff.from, BEATS.payoff.to], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.sin),
  });
  const pullBack = interpolate(frame, [BEATS.cta.from, BEATS.cta.to], [0, 1], { ...clamp, easing: Easing.out(Easing.quad) });
  const you = grid[YOU].p;
  const focus: Vec3 = h ? h.focus : frame < 34 ? ticket.p : frame < BEATS.payoff.from ? [0, 0.15, 0] : you;
  const pose: CameraPose = {
    position: [lerp(0, you[0] * 0.6, dolly), lerp(0.15, you[1] * 0.6, dolly), lerp(6, 3.4, dolly) + pullBack * 3],
    target: [lerp(0, you[0], dolly), lerp(0.15, you[1], dolly), 0],
    focus,
  };
  const shake = h ? h.shake : frame < BEATS.magic.from ? 2.4 : frame < BEATS.payoff.from ? 1 : 0.7;

  const prints = throws.map((th, i) => {
    if (frame < RELEASE) return null;
    const delay = snapDelay(i, N, 16, 'tf');
    const s = snap(frame, delay);
    const chaos = throwPose(th, (frame - RELEASE) / fps);
    const p = mixPose(chaos, grid[i], s);
    const landed = BEATS.magic.from + delay;
    const isYou = i === YOU;
    const payoffLift = isYou ? dolly : 0;
    return (
      <FootageSlice key={i} offsetFrames={i * FOOTAGE_STRIDE}>
        <Polaroid
          seed={`tf-${i}`}
          position={[p.p[0], p.p[1], p.p[2] + payoffLift * 0.15]}
          rotation={p.r}
          scale={interpolate(frame, [RELEASE, RELEASE + 4], [0.3, 1], clamp)}
          crop={{ x: 0.5, y: 0.55, zoom: 1.05 + (i % 3) * 0.1 }}
          curl={lerp(0.9, 0.3, Math.min(1, s))}
          develop={interpolate(frame, [landed, landed + 40], [0.12, 1], clamp)}
          leak={isYou ? 0.25 + payoffLift * 0.35 : i % 5 === 2 ? 0.5 : 0}
          flash={flash}
          keyLevel={keyLevel * (isYou ? 1 : lerp(1, 0.7, dolly))}
        />
      </FootageSlice>
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
            <PhotoCounter count={count} from={COUNT_FROM} to={COUNT_TO} until={BEATS.cta.from} />
            <EndCard />
          </>
        }
      >
        <Ticket eventDate={eventDate} position={ticket.p} rotation={ticket.r} flash={flash} keyLevel={keyLevel} />
        {prints}
      </Stage>
      <Sfx cues={cues} />
    </>
  );
};
