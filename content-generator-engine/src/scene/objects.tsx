// The paper props: ticket, print, pain card, album page, passport page, stamp ink.
// Each is a Paper with its own fragment body; text and photos arrive as textures.

import React from 'react';
import * as THREE from 'three';
import { ALBUM, PAIN_CARD, PASSPORT, PRINT, STAMP, TICKET } from '../lib/layout';
import type { Vec3 } from '../lib/motion';
import { cover, Paper } from './Paper';
import {
  useAlbumPage,
  useLip,
  useMark,
  usePainCard,
  usePassportPage,
  usePhoto,
  useStampInk,
  useTicketPrint,
} from './textures';

type Placement = { position?: Vec3; rotation?: Vec3; scale?: number; opacity?: number };

const PERF = 0.8;

const TICKET_BODY = /* glsl */ `
  vec2 uv = vUv;
  vec2 hole = vec2((uv.x - ${PERF}) * ${TICKET.w.toFixed(2)}, (fract(uv.y * 14.0) - 0.5) * ${(TICKET.h / 14).toFixed(4)});
  float fib = vnoise(uv * vec2(900.0, 340.0)) * 0.04 + vnoise(uv * vec2(40.0, 12.0)) * 0.05;
  vec3 paper = vec3(0.94, 0.91, 0.85) * (0.93 + fib);
  if (gl_FrontFacing) {
    // Glitch build: the PXI mark is replaced block by block by the ticket.
    vec2 grid = vec2(40.0, 15.0);
    float row = floor(uv.y * grid.y);
    float glitch = clamp(uBuild * (1.0 - uBuild) * 4.0, 0.0, 1.0);
    float jump = step(0.72, hash(vec2(row, floor(uFrame)))) * glitch;
    vec2 guv = uv + vec2((hash(vec2(row, floor(uFrame) + 7.0)) - 0.5) * 0.18 * jump, 0.0);
    vec2 cell = floor(guv * grid);
    float order = hash(cell * 1.37 + 3.1);
    float edge = 1.0 - smoothstep(0.0, 0.07, abs(order - uBuild));
    if (order < uBuild) {
      if (length(hole) < 0.013) discard;
      vec4 ink = texture2D(uPrint, guv);
      vec3 t = mix(paper, vec3(0.086, 0.075, 0.06), ink.a);
      t *= guv.x > ${PERF} ? 0.95 : 1.0;
      col = lightPaper(t, n);
    } else {
      vec2 luv = (guv - 0.5) * vec2(${(TICKET.w / TICKET.h).toFixed(3)}, 1.0) * 1.08 + 0.5;
      vec4 mark = (luv.x > 0.0 && luv.x < 1.0 && luv.y > 0.0 && luv.y < 1.0) ? texture2D(uMark, luv) : vec4(0.0);
      if (mark.a < 0.05 && edge < 0.5) discard;
      col = mark.rgb * 1.15;
      alpha = max(mark.a, edge);
    }
    // Pixels caught mid-swap flash white and split.
    col = mix(col, vec3(1.0, 0.98 * (1.0 - jump * 0.3), 1.0), edge * glitch);
  } else {
    if (length(hole) < 0.013) discard;
    vec2 buv = vec2(1.0 - uv.x, uv.y);
    vec3 img = texture2D(uPhoto, uCrop.xy + buv * uCrop.zw).rgb;
    col = lightPhoto(img, n);
  }
`;

export const Ticket: React.FC<Placement & { title: string; meta: string[]; photo: string; build: number; frame: number; bend?: number }> = ({
  title,
  meta,
  photo,
  build,
  frame,
  bend = 1,
  ...place
}) => {
  const mark = useMark();
  const print = useTicketPrint(title, meta);
  const photoTex = usePhoto(photo);
  return (
    <Paper
      size={[TICKET.w, TICKET.h]}
      segments={[48, 18]}
      decl="uniform sampler2D uMark; uniform sampler2D uPrint; uniform sampler2D uPhoto; uniform vec4 uCrop; uniform float uBuild; uniform float uFrame;"
      body={TICKET_BODY}
      uniforms={{ uMark: mark, uPrint: print, uPhoto: photoTex, uCrop: cover(photoTex, TICKET.w / TICKET.h, 0.62), uBuild: build, uFrame: frame }}
      bend={bend * build}
      {...place}
    />
  );
};

// Instant print: 6% top and sides, 24% lip. Name on the lip.
const WIN = { x0: 0.06, x1: 0.94, y0: 0.24, y1: 0.94 };
const WIN_ASPECT = (PRINT.w * (WIN.x1 - WIN.x0)) / (PRINT.h * (WIN.y1 - WIN.y0));
const PRINT_BODY = /* glsl */ `
  vec2 uv = vUv;
  float tooth = vnoise(uv * vec2(260.0, 320.0)) * 0.05;
  vec3 frameCol = vec3(0.95, 0.94, 0.91) * (0.95 + tooth);
  if (!gl_FrontFacing) {
    col = lightPaper(vec3(0.07, 0.066, 0.06), n);
  } else if (uv.x > ${WIN.x0} && uv.x < ${WIN.x1} && uv.y > ${WIN.y0} && uv.y < ${WIN.y1}) {
    vec2 iuv = (uv - vec2(${WIN.x0}, ${WIN.y0})) / vec2(${WIN.x1 - WIN.x0}, ${WIN.y1 - WIN.y0});
    vec3 img = texture2D(uPhoto, uCrop.xy + iuv * uCrop.zw).rgb;
    img = mix(vec3(0.42, 0.44, 0.42), img, uDevelop);
    vec2 e = min(iuv, 1.0 - iuv);
    img *= 0.85 + 0.15 * smoothstep(0.0, 0.03, min(e.x, e.y));
    col = lightPhoto(img, n);
  } else {
    vec3 c = frameCol;
    if (uv.y < ${WIN.y0}) {
      vec4 lip = texture2D(uLip, vec2(uv.x, uv.y / ${WIN.y0}));
      c = mix(c, vec3(0.09, 0.08, 0.07), lip.a);
    }
    col = lightPaper(c, n);
  }
`;

export const Print: React.FC<Placement & { photo: string; name: string; develop?: number; curl?: number }> = ({
  photo,
  name,
  develop = 1,
  curl = 0.3,
  ...place
}) => {
  const tex = usePhoto(photo);
  const lip = useLip(name);
  return (
    <Paper
      size={[PRINT.w, PRINT.h]}
      decl="uniform sampler2D uPhoto; uniform sampler2D uLip; uniform vec4 uCrop; uniform float uDevelop;"
      body={PRINT_BODY}
      uniforms={{ uPhoto: tex, uLip: lip, uCrop: cover(tex, WIN_ASPECT, 0.62), uDevelop: develop }}
      curl={curl}
      {...place}
    />
  );
};

/** A torn card. Edges are ragged; ink is the text. */
export const PainCard: React.FC<Placement & { text: string }> = ({ text, ...place }) => {
  const tex = usePainCard(text);
  return (
    <Paper
      size={[PAIN_CARD.w, PAIN_CARD.h]}
      decl="uniform sampler2D uText;"
      body={/* glsl */ `
        vec2 uv = vUv;
        float rag = vnoise(vec2(uv.x * 40.0, uv.y * 40.0)) * 0.035;
        if (uv.y < 0.02 + rag || uv.y > 0.98 - rag) discard;
        float fib = vnoise(uv * vec2(500.0, 200.0)) * 0.05;
        vec3 c = vec3(0.96, 0.95, 0.92) * (0.93 + fib);
        if (gl_FrontFacing) c = mix(c, vec3(0.08, 0.07, 0.06), texture2D(uText, uv).a);
        col = lightPaper(c, n);
      `}
      uniforms={{ uText: tex }}
      bend={0.6}
      {...place}
    />
  );
};

const PRINTED_BODY = /* glsl */ `
  vec4 t = texture2D(uTex, vUv);
  col = lightPaper(t.rgb, n);
`;

export const AlbumPage: React.FC<Placement & { counter: string; proof: string; avatars: string[]; proofOn: boolean }> = ({
  counter,
  proof,
  avatars,
  proofOn,
  ...place
}) => {
  const tex = useAlbumPage(counter, proof, avatars, proofOn);
  return <Paper size={[ALBUM.w, ALBUM.h]} decl="uniform sampler2D uTex;" body={PRINTED_BODY} uniforms={{ uTex: tex }} bend={0.15} {...place} />;
};

export const PassportPage: React.FC<Placement & { pastStamps: number; city: string; endLines: [string, string]; url: string }> = ({
  pastStamps,
  city,
  endLines,
  url,
  ...place
}) => {
  const tex = usePassportPage(pastStamps, city, endLines, url);
  return <Paper size={[PASSPORT.w, PASSPORT.h]} decl="uniform sampler2D uTex;" body={PRINTED_BODY} uniforms={{ uTex: tex }} bend={0.1} {...place} />;
};

/** Fresh ink, laid just above the passport page. `spread` > 1 right at impact. */
export const StampInk: React.FC<Placement & { top: string; middle: string; bottom: string; color: string }> = ({
  top,
  middle,
  bottom,
  color,
  ...place
}) => {
  const tex = useStampInk(top, middle, bottom, color);
  return (
    <Paper
      size={[STAMP.diameter, STAMP.diameter]}
      segments={[2, 2]}
      decl="uniform sampler2D uTex;"
      body={/* glsl */ `
        vec4 t = texture2D(uTex, vUv);
        if (t.a < 0.02) discard;
        col = lightPaper(t.rgb * 1.6, n);
        alpha = t.a * 0.92;
      `}
      uniforms={{ uTex: tex }}
      {...place}
    />
  );
};

export const INK = new THREE.Color('#d8402c');
