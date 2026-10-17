// The renderer. It reads a storyboard and draws it; it decides nothing.
// Every pose is a pure function of the frame, so any frame renders alone.
//
//   hook    0–30    white flash, the PXI mark flies at the lens and glitch-builds into the ticket
//   camera  30–90   a disposable, the event in its viewfinder, three flashes: prints everywhere, "send the pics??"
//   magic   90–180  every print springs into one album, the count ticks, the centre print is you, who was there
//   payoff  180–255 the album becomes a stamp, slams "verified" onto a passport of earlier stamps; end line

import React from 'react';
import { Html5Audio, random, Sequence, spring, staticFile, useCurrentFrame } from 'remotion';
import { ALBUM, PASSPORT, PRINT, TICKET } from './lib/layout';
import { gridSlots, mixPose, snapDelay, throwPose, type Pose, type Throw, type Vec3 } from './lib/motion';
import { FPS, type Storyboard } from './lib/storyboard';
import { CAMERA_BODY, DisposableCamera, VIEWFINDER } from './scene/Camera';
import { AlbumPage, INK, PainCard, PassportPage, Print, StampInk, Ticket } from './scene/objects';
import { RubberStamp } from './scene/Stamp';
import { Stage, type CameraPose } from './scene/Stage';

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerp3 = (a: Vec3, b: Vec3, t: number): Vec3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const ramp = (f: number, from: number, to: number) => clamp01((f - from) / (to - from));
const easeIn = (t: number) => t * t * t;
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const sp = (f: number, from: number, stiffness = 280, damping = 22, mass = 1) =>
  spring({ frame: f - from, fps: FPS, config: { stiffness, damping, mass } });
const pulse = (f: number, at: number, decay: number) => (f >= at ? Math.exp(-(f - at) / decay) : 0);

// Key moments, in frames.
const T = {
  hit: 9, // mark reaches the lens
  build: [5, 22],
  ticketOut: 30,
  cameraIn: 30,
  push: [34, 54],
  spin: 56,
  flashes: [64, 72, 80],
  painIn: 68,
  cameraOut: 86,
  painOut: 98,
  albumIn: 90,
  snap: 94,
  count: [100, 140],
  youLift: 136,
  proof: 142,
  youBack: 168,
  collapse: 182,
  passportIn: 186,
  stampIn: 194,
  slam: 206,
  stampOff: 212,
  endFlash: 248,
} as const;

const CAMERA_HOME: Vec3 = [0, 0, 6];
const ALBUM_Z = -0.6;
const PASSPORT_Z = -0.66;
const INK_AT: Vec3 = [0, 0.55, PASSPORT_Z + 0.012];
const STAMP_FORM: Vec3 = [0.1, 0.3, 2.0];

// Prints leave the flash window towards the lens and out to the edges.
const FLASH_WINDOW: Vec3 = [0.62, 0.34, CAMERA_BODY.d / 2 + 0.05];
const throwFor = (i: number, seed: string): Throw => {
  const k = `${seed}-print-${i}`;
  const s = (n: string) => random(`${k}-${n}`) * 2 - 1;
  const side = i % 2 ? 1 : -1;
  return {
    origin: FLASH_WINDOW,
    velocity: [side * (2.2 + random(`${k}-vx`) * 2.4), 1.6 + s('vy') * 2.2, 1.6 + random(`${k}-vz`) * 1.6],
    spin: [s('sx') * 5, s('sy') * 5, s('sz') * 4],
    rotation: [s('rx') * 0.4, s('ry') * 0.4, s('rz') * 0.6],
    drag: 1.5 + random(`${k}-d`) * 0.5,
    gravity: 2.4,
  };
};

const Sfx: React.FC<{ at: number; sound: string; volume?: number }> = ({ at, sound, volume = 1 }) => (
  <Sequence from={at} durationInFrames={30} layout="none">
    <Html5Audio src={staticFile(`sfx/${sound}.wav`)} volume={volume} />
  </Sequence>
);

export const Film: React.FC<Storyboard> = (sb) => {
  const f = useCurrentFrame();
  const { footage, copy, counts, look, seed } = sb;

  // ---- Flash: frame 0 is white; three camera flashes; the last frame ramps back to white.
  const burst = Math.max(...T.flashes.map((at) => pulse(f, at, 1.6) * 0.78));
  const endFlash = easeIn(ramp(f, T.endFlash, 254));
  const hookFlash = f < 6 ? Math.pow(1 - f / 6, 2) : 0;
  const flash = Math.max(hookFlash, burst, endFlash);

  // ---- Hook: ticket.
  let ticketPos: Vec3;
  let ticketRot: Vec3;
  if (f < T.hit) {
    const k = Math.pow(f / T.hit, 2);
    ticketPos = [lerp(0.12, 0, k), lerp(-0.08, 0.02, k), lerp(1.5, 4.55, k)];
    ticketRot = [(1 - k) * 0.5, (1 - k) * -0.7, (1 - k) * 0.9];
  } else {
    const s = sp(f, T.hit, 200, 14);
    ticketPos = [0, 0.02 + 0.06 * (1 - s), lerp(4.55, TICKET.restZ, s)];
    ticketRot = [0.06 * Math.sin(f * 0.21) * (1 - s * 0.6), -0.1 * (1 - s), 0.04 * Math.sin(f * 0.17)];
  }
  const out = ramp(f, T.ticketOut, T.ticketOut + 12);
  if (out > 0) {
    ticketPos = add(ticketPos, [0.3 * out, -4.5 * out * out, -1.2 * out]);
    ticketRot = add(ticketRot, [Math.PI * 1.15 * easeOut(out), 0.3 * out, -0.4 * out]);
  }
  const build = easeInOut(ramp(f, T.build[0], T.build[1]));

  // ---- Camera beat: the disposable swings in back-first, spins to face us, fires.
  const swing = sp(f, T.cameraIn, 170, 18);
  const spin = sp(f, T.spin, 160, 16);
  const camOut = ramp(f, T.cameraOut, T.cameraOut + 12);
  const camPos: Vec3 = [lerp(3.6, 0, swing), lerp(-0.6, 0, swing) - 5 * camOut * camOut, 0];
  const camRot: Vec3 = [0.12 * (1 - swing) + 1.2 * camOut, Math.PI + 1.3 * (1 - swing) + Math.PI * spin, 0.15 * (1 - swing)];
  const camFlash = Math.max(...T.flashes.map((at) => pulse(f, at, 2)));
  // Where the viewfinder sits while the back faces the lens.
  const vf: Vec3 = [VIEWFINDER.x, VIEWFINDER.y, CAMERA_BODY.d / 2 + 0.065];

  // ---- Lens.
  let lens: CameraPose = { position: CAMERA_HOME, target: [0, 0, 0], focus: f < T.ticketOut ? ticketPos : [0, 0, 0] };
  if (f >= T.push[0] && f < T.spin) {
    const k = easeInOut(ramp(f, T.push[0], T.push[1]));
    lens = { position: lerp3(CAMERA_HOME, add(vf, [0, 0, 1.45]), k), target: lerp3([0, 0, 0], vf, k), focus: vf };
  } else if (f >= T.spin && f < T.albumIn) {
    const s = sp(f, T.spin, 110, 20);
    lens = { position: lerp3(add(vf, [0, 0, 1.45]), CAMERA_HOME, s), target: lerp3(vf, [0, 0, 0], s), focus: [0, 0.6, 2.4] };
  } else if (f >= T.albumIn && f < T.collapse) {
    lens = { position: CAMERA_HOME, target: [0, 0, 0], focus: [0, 0, ALBUM_Z] };
  } else if (f >= T.collapse) {
    const k = easeInOut(ramp(f, T.collapse, T.collapse + 18));
    const dolly = easeInOut(ramp(f, T.slam, 254));
    const z = lerp(lerp(6, PASSPORT_Z + PASSPORT.distance, k), PASSPORT_Z + PASSPORT.distance - 0.5, dolly);
    lens = { position: [0, 0, z], target: [0, lerp(0, 0.1, dolly), PASSPORT_Z], focus: f < T.stampOff ? STAMP_FORM : INK_AT };
    if (f >= T.stampIn && f < T.stampOff) lens.focus = [0, 0.55, 0.6];
  }
  const kick = pulse(f, T.slam, 3);
  const shake = 1 + 7 * kick + 2 * pulse(f, T.hit, 3);

  // ---- Prints: ejected by the flashes, sprung into the album, collapsed into the stamp.
  const slots = gridSlots(
    ALBUM.cols,
    ALBUM.rows,
    { w: PRINT.w * ALBUM.printScale, h: PRINT.h * ALBUM.printScale },
    ALBUM.gap,
    [0, -0.1, ALBUM_Z + 0.02],
  );
  const prints = footage.prints.map((photo, i) => {
    const eject = T.flashes[Math.floor(i / 3)] + (i % 3);
    const th = throwFor(i, seed);
    const start = T.snap + snapDelay(i, footage.prints.length, 14, `${seed}-snap`);
    const tilt = (random(`${seed}-tilt-${i}`) * 2 - 1) * 0.05;
    const slot: Pose = { p: slots[i].p, r: [0, 0, tilt] };
    let pose: Pose;
    let scale: number;
    if (f < start) {
      pose = throwPose(th, (f - eject) / FPS);
      scale = lerp(0.35, 1, easeOut(ramp(f, eject, eject + 6)));
    } else {
      const from = throwPose(th, (start - eject) / FPS);
      const s = sp(f, start);
      pose = mixPose(from, slot, s);
      scale = lerp(1, ALBUM.printScale, Math.min(1, s));
    }
    if (i === footage.youIndex) {
      const lift = sp(f, T.youLift, 200, 18) - sp(f, T.youBack, 200, 20);
      pose = mixPose(pose, { p: [0, -0.15, 6 - ALBUM.youDistance], r: [0.04, -0.06, 0.02] }, lift);
      scale = lerp(scale, ALBUM.youScale, lift);
    }
    let opacity = f >= eject ? 1 : 0;
    const c = easeIn(ramp(f, T.collapse + i * 0.6, T.collapse + 12 + i * 0.6));
    if (c > 0) {
      pose = mixPose(pose, { p: STAMP_FORM, r: [0, 0, (i - 4) * 0.3] }, c);
      scale *= 1 - 0.8 * c;
      opacity = c > 0.98 ? 0 : 1;
    }
    const develop = 0.25 + 0.75 * easeOut(ramp(f, eject, eject + 22));
    return { photo, name: copy.printLips[i], pose, scale, opacity, develop, i };
  });

  // ---- Pain card: tumbles in through the burst, hangs readable, falls away.
  const painIn = sp(f, T.painIn, 120, 12);
  const painOut = ramp(f, T.painOut, T.painOut + 10);
  const painPos: Vec3 = [-0.05, lerp(2.6, 0.95, painIn) - 3.5 * painOut * painOut, 2.7];
  const painRot: Vec3 = [0.1 * Math.sin(f * 0.11) + 1.4 * painOut, 0.12 * Math.sin(f * 0.07), lerp(0.5, 0, painIn) + 0.05 * Math.sin(f * 0.09)];

  // ---- Album and count.
  const albumIn = sp(f, T.albumIn, 150, 18);
  const albumOut = easeIn(ramp(f, T.collapse + 2, T.collapse + 18));
  const n = f < T.count[0] ? 0 : Math.max(1, Math.round(counts.photos * easeOut(ramp(f, T.count[0], T.count[1]))));
  const counter = n ? copy.counter.replace('{n}', String(n)) : '';
  const ticks: number[] = [];
  for (let fr = T.count[0], last = 0; fr <= T.count[1]; fr++) {
    const v = Math.max(1, Math.round(counts.photos * easeOut(ramp(fr, T.count[0], T.count[1]))));
    if (v !== last && (ticks.length === 0 || fr - ticks[ticks.length - 1] >= 2)) ticks.push(fr);
    last = v;
  }

  // ---- Passport, stamp, ink.
  const passportIn = sp(f, T.passportIn, 140, 18);
  const formed = sp(f, T.stampIn, 220, 16);
  const down = easeIn(ramp(f, T.stampIn + 4, T.slam));
  const up = easeIn(ramp(f, T.stampOff, T.stampOff + 12));
  // Held just off the page: tilted, so the handle reads side-on rather than as a knob.
  const contact: Vec3 = add(INK_AT, [0.05, 0, 0.3]);
  let stampPos = lerp3(STAMP_FORM, contact, down);
  stampPos = lerp3(stampPos, add(contact, [2.4, 3.6, 3.2]), up);
  if (f >= T.slam && f < T.stampOff) stampPos = add(contact, [0, 0, -0.02 * kick]);
  const tiltX = Math.PI / 2 - lerp(1.0, 0.75, down) - 0.4 * up;
  const stampRot: Vec3 = [tiltX, lerp(0.5, 0.35, down), lerp(-0.45, -0.3, down) - 0.3 * up];
  const inkOn = f >= T.slam;
  const inkScale = 1 + 0.04 * pulse(f, T.slam, 2);

  return (
    <>
      <Stage look={look} pose={lens} shake={shake} flash={flash}>
        {f < T.ticketOut + 13 ? (
          <Ticket
            title={copy.ticketTitle}
            meta={copy.ticketMeta}
            photo={footage.viewfinder}
            build={build}
            frame={f}
            position={ticketPos}
            rotation={ticketRot}
            scale={lerp(1.6, 1, clamp01((f - 4) / 10))}
          />
        ) : null}

        {f >= T.cameraIn && f < T.cameraOut + 13 ? (
          <DisposableCamera photo={footage.viewfinder} flash={camFlash} position={camPos} rotation={camRot} />
        ) : null}

        {prints.map((p) =>
          f >= T.flashes[0] && f < T.collapse + 16 ? (
            <Print
              key={p.i}
              photo={p.photo}
              name={p.name}
              develop={p.develop}
              curl={0.25}
              position={p.pose.p}
              rotation={p.pose.r}
              scale={p.scale}
              opacity={p.opacity}
            />
          ) : null,
        )}

        {f >= T.painIn && f < T.painOut + 11 ? <PainCard text={copy.pain} position={painPos} rotation={painRot} /> : null}

        {f >= T.albumIn && f < T.collapse + 19 ? (
          <AlbumPage
            counter={counter}
            proof={copy.socialProof}
            avatars={footage.avatars}
            proofOn={f >= T.proof}
            position={[0, lerp(-6.5, 0, albumIn) - 7 * albumOut, ALBUM_Z]}
            rotation={[0.25 * (1 - albumIn), 0, 0]}
          />
        ) : null}

        {f >= T.passportIn ? (
          <PassportPage
            pastStamps={counts.pastStamps}
            city={sb.event.city.toLowerCase()}
            endLines={copy.endLines}
            url={copy.url}
            position={[0, lerp(-7, 0, passportIn), PASSPORT_Z]}
            rotation={[0.3 * (1 - passportIn), 0, 0]}
          />
        ) : null}

        {inkOn ? (
          <StampInk
            top={copy.stamp.top}
            middle={copy.stamp.middle}
            bottom={copy.stamp.bottom}
            color={'#' + INK.getHexString()}
            position={INK_AT}
            rotation={[0, 0, -0.05]}
            scale={inkScale}
          />
        ) : null}

        {f >= T.stampIn && f < T.stampOff + 13 ? (
          <RubberStamp ink={'#' + INK.getHexString()} position={stampPos} rotation={stampRot} scale={Math.max(0.001, formed)} />
        ) : null}
      </Stage>

      <Sfx at={2} sound="pop" volume={0.9} />
      {T.flashes.map((at) => (
        <Sfx key={at} at={at} sound="shutter" volume={0.8} />
      ))}
      {ticks.map((at) => (
        <Sfx key={`t${at}`} at={at} sound="queue-tick" volume={0.35} />
      ))}
      <Sfx at={T.proof} sound="success" volume={0.6} />
      <Sfx at={T.slam} sound="capture-chk" volume={1} />
      <Sfx at={T.slam} sound="pop" volume={0.7} />
      <Sfx at={T.endFlash} sound="shutter" volume={0.7} />
    </>
  );
};
