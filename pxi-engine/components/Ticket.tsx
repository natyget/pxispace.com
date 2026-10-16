// The ticket: matte card stock, slightly bent, with a perforated stub.
// Front is the print (date, admit one, serial, and a duotone window of the
// footage). Back is the footage full bleed, printed onto the same paper, so a
// flip reads as "the ticket was the night all along".

import React, { useMemo } from 'react';
import { random } from 'remotion';
import * as THREE from 'three';
import { useAsyncTexture } from '../lib/asyncTexture';
import { useFootageTexture, useProceduralFrame } from '../lib/footage';
import { fontsReady, mono, serif } from '../lib/fonts';
import { PAPER_COMMON, PAPER_FRAGMENT_TAIL, PAPER_VERTEX_HEAD } from '../lib/paperShader';
import { COLOR } from '../lib/tokens';
import { coverCrop } from './Polaroid';
import { KEY_COLOR, KEY_DIR } from './FlashLight';

export const TICKET_SIZE = { w: 1.9, h: 0.72 } as const;
const PERF_X = 0.765; // perforation line, in UV
const WINDOW = { x0: 0.04, x1: 0.3, y0: 0.12, y1: 0.88 } as const; // footage window on the front

const vertexShader = /* glsl */ `
${PAPER_VERTEX_HEAD}
uniform float uBend;

void main() {
  vUv = uv;
  vec3 p = position;
  float x = (uv.x - 0.5) * 2.0;
  float y = (uv.y - 0.5) * 2.0;
  // Bowed along its length, a little twist, and the stub hinging at the perforation.
  p.z += uBend * (-0.09 * x * x + 0.025 * x * y);
  p.z += uBend * 0.06 * max(uv.x - ${PERF_X}, 0.0) / (1.0 - ${PERF_X});
  vec4 world = modelMatrix * vec4(p, 1.0);
  vPosW = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

const fragmentShader = /* glsl */ `
${PAPER_COMMON}
uniform sampler2D uMap;
uniform sampler2D uPrint;
uniform vec4 uCropWindow;
uniform vec4 uCropBack;
uniform vec3 uPaper;
uniform vec3 uInk;
uniform float uOpacity;

void main() {
  vec2 uv = vUv;

  // Perforation: a row of punched holes along the stub line.
  vec2 hole = vec2((uv.x - ${PERF_X}) * ${TICKET_SIZE.w.toFixed(3)}, (fract(uv.y * 14.0) - 0.5) * ${(TICKET_SIZE.h / 14).toFixed(4)});
  if (length(hole) < 0.013) discard;

  vec3 n = bentNormal();
  float fibre = vnoise(uv * vec2(900.0, 340.0)) * 0.04 + vnoise(uv * vec2(40.0, 12.0)) * 0.05;
  vec3 paper = uPaper * (0.93 + fibre);
  vec3 col = paper;

  if (gl_FrontFacing) {
    vec2 lo = vec2(${WINDOW.x0}, ${WINDOW.y0});
    vec2 hi = vec2(${WINDOW.x1}, ${WINDOW.y1});
    if (all(greaterThan(uv, lo)) && all(lessThan(uv, hi))) {
      vec2 iuv = (uv - lo) / (hi - lo);
      vec3 img = texture2D(uMap, uCropWindow.xy + iuv * uCropWindow.zw).rgb;
      // Two-ink print: ink in the shadows, tungsten in the mids, paper in the highlights.
      float l = dot(img, vec3(0.299, 0.587, 0.114));
      vec3 duo = mix(uInk, vec3(1.0, 0.55, 0.26), smoothstep(0.08, 0.55, l));
      duo = mix(duo, paper, smoothstep(0.6, 0.95, l));
      col = duo * (0.92 + fibre);
    }
    vec4 print = texture2D(uPrint, uv);
    col = mix(col, uInk, print.a * 0.92);
    // Stub is a shade darker, as if handled.
    col *= uv.x > ${PERF_X} ? 0.94 : 1.0;
  } else {
    vec2 buv = vec2(1.0 - uv.x, uv.y);
    vec3 img = texture2D(uMap, uCropBack.xy + buv * uCropBack.zw).rgb;
    col = mix(img, img * paper, 0.35) * (0.92 + fibre);
  }

  gl_FragColor = vec4(lightPaper(col, n), uOpacity);
  ${PAPER_FRAGMENT_TAIL}
}
`;

/** Draws the ticket's type into a transparent canvas. */
const drawPrint = (eventDate: string, seed: string) => {
  const W = 1900;
  const H = 720;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#000';
  ctx.textBaseline = 'alphabetic';

  const left = W * 0.33;
  const serial = String(Math.floor(random(`serial-${seed}`) * 9000) + 1000).padStart(6, '0');

  ctx.font = `30px "${mono}"`;
  ctx.fillText('admit one · keep this', left, 110);
  ctx.font = `200px "${serif}"`;
  ctx.fillText('the night', left - 8, 360);
  ctx.font = `44px "${mono}"`;
  ctx.fillText(eventDate.toLowerCase(), left, 470);
  ctx.font = `30px "${mono}"`;
  ctx.fillText(`no. ${serial}`, left, 620);
  ctx.fillText('doors 22:00', W * 0.56, 620);

  // Stub, rotated.
  ctx.save();
  ctx.translate(W * 0.88, H / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.font = `64px "${serif}"`;
  ctx.fillText('pxi', 0, -40);
  ctx.font = `26px "${mono}"`;
  ctx.fillText(eventDate.toLowerCase(), 0, 20);
  ctx.fillText(`no. ${serial}`, 0, 64);
  ctx.restore();

  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 8;
  return t;
};

const loadPrint = (key: string) => {
  const [eventDate, seed] = JSON.parse(key) as [string, string];
  return fontsReady.then(() => drawPrint(eventDate, seed));
};

export type TicketProps = {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  eventDate: string;
  seed?: string;
  /** 0 flat, 1 normal handled-ticket bow. */
  bend?: number;
  flash?: number;
  keyLevel?: number;
  opacity?: number;
  texture?: THREE.Texture | null;
};

export const Ticket: React.FC<TicketProps> = ({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  eventDate,
  seed = 'ticket',
  bend = 1,
  flash = 0,
  keyLevel = 1,
  opacity = 1,
  texture,
}) => {
  const shared = useFootageTexture();
  const procedural = useProceduralFrame(`${seed}-photo`);
  const map = texture ?? shared ?? procedural;
  const print = useAsyncTexture(JSON.stringify([eventDate, seed]), loadPrint);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        side: THREE.DoubleSide,
        transparent: true,
        uniforms: {
          uMap: { value: null },
          uPrint: { value: null },
          uCropWindow: { value: new THREE.Vector4(0, 0, 1, 1) },
          uCropBack: { value: new THREE.Vector4(0, 0, 1, 1) },
          uBend: { value: 1 },
          uPaper: { value: new THREE.Color(COLOR.paper) },
          uInk: { value: new THREE.Color(COLOR.ink) },
          uOpacity: { value: 1 },
          uFlash: { value: 0 },
          uKey: { value: 1 },
          uKeyDir: { value: KEY_DIR },
          uKeyColor: { value: KEY_COLOR },
        },
      }),
    [],
  );

  const windowAspect =
    (TICKET_SIZE.w * (WINDOW.x1 - WINDOW.x0)) / (TICKET_SIZE.h * (WINDOW.y1 - WINDOW.y0));
  const u = material.uniforms;
  u.uMap.value = map;
  u.uPrint.value = print;
  u.uCropWindow.value = coverCrop(map, windowAspect, { x: 0.5, y: 0.5, zoom: 1.1 });
  // Biased up so a face in the middle third of a vertical clip lands in the band.
  u.uCropBack.value = coverCrop(map, TICKET_SIZE.w / TICKET_SIZE.h, { x: 0.5, y: 0.62, zoom: 1 });
  u.uBend.value = bend;
  u.uOpacity.value = opacity;
  u.uFlash.value = flash;
  u.uKey.value = keyLevel;

  return (
    <mesh position={position} rotation={rotation} scale={scale} material={material}>
      <planeGeometry args={[TICKET_SIZE.w, TICKET_SIZE.h, 48, 18]} />
    </mesh>
  );
};
