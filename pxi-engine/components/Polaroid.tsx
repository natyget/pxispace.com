// An instant print: thin top and sides, deep bottom, a corner that curls off
// the table, emulsion that develops in, and a light leak burned in from one edge.
// The photo area is a window onto the footage texture (video or still), so one
// clip can fill a whole wall of different-looking prints via `crop`.

import React, { useMemo } from 'react';
import { random } from 'remotion';
import * as THREE from 'three';
import { useFootageTexture, useProceduralFrame } from '../lib/footage';
import { PAPER_COMMON, PAPER_FRAGMENT_TAIL, PAPER_VERTEX_HEAD } from '../lib/paperShader';
import { KEY_COLOR, KEY_DIR } from './FlashLight';

export const POLAROID_SIZE = { w: 0.88, h: 1.07 } as const;
// Photo window in UV space: 6% top and sides, 24% bottom lip.
const WINDOW = { x0: 0.06, x1: 0.94, y0: 0.24, y1: 0.94 } as const;
const WINDOW_ASPECT =
  (POLAROID_SIZE.w * (WINDOW.x1 - WINDOW.x0)) / (POLAROID_SIZE.h * (WINDOW.y1 - WINDOW.y0));

export type Crop = { x: number; y: number; zoom: number };

/** UV offset/scale that covers `aspect` with the texture, then zooms/pans by `crop`. */
export const coverCrop = (texture: THREE.Texture, aspect: number, crop: Crop) => {
  const img = texture.image as { width?: number; height?: number; videoWidth?: number; videoHeight?: number } | null;
  const tw = img?.videoWidth || img?.width || 1;
  const th = img?.videoHeight || img?.height || 1;
  const texAspect = tw / th;
  let sx = 1;
  let sy = 1;
  if (texAspect > aspect) sx = aspect / texAspect;
  else sy = texAspect / aspect;
  sx /= crop.zoom;
  sy /= crop.zoom;
  const ox = (1 - sx) * THREE.MathUtils.clamp(crop.x, 0, 1);
  const oy = (1 - sy) * THREE.MathUtils.clamp(crop.y, 0, 1);
  return new THREE.Vector4(ox, oy, sx, sy);
};

const vertexShader = /* glsl */ `
${PAPER_VERTEX_HEAD}
uniform float uCurl;
uniform vec2 uSize;

void main() {
  vUv = uv;
  vec3 p = position;
  // Cupping across the width, plus the bottom-right corner lifting.
  float across = (uv.x - 0.5) * 2.0;
  float corner = clamp((uv.x + (1.0 - uv.y) - 1.25) / 0.75, 0.0, 1.0);
  p.z += uCurl * (0.035 * across * across + 0.22 * corner * corner * uSize.y);
  vec4 world = modelMatrix * vec4(p, 1.0);
  vPosW = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

const fragmentShader = /* glsl */ `
${PAPER_COMMON}
uniform sampler2D uMap;
uniform vec4 uCrop;
uniform float uDevelop;
uniform float uLeak;
uniform float uSeed;
uniform float uOpacity;

void main() {
  vec3 n = bentNormal();
  vec2 uv = vUv;

  float tooth = vnoise(uv * vec2(260.0, 320.0)) * 0.05 + vnoise(uv * 30.0 + uSeed) * 0.03;
  vec3 col = vec3(0.949, 0.937, 0.91) * (0.95 + tooth);

  if (!gl_FrontFacing) {
    // Back of an instant print: dark, slightly glossy-black card.
    col = vec3(0.06, 0.058, 0.055) * (0.9 + tooth);
  } else {
    vec2 lo = vec2(${WINDOW.x0}, ${WINDOW.y0});
    vec2 hi = vec2(${WINDOW.x1}, ${WINDOW.y1});
    if (all(greaterThan(uv, lo)) && all(lessThan(uv, hi))) {
      vec2 iuv = (uv - lo) / (hi - lo);
      vec3 img = texture2D(uMap, uCrop.xy + iuv * uCrop.zw).rgb;
      // Developing: milky blue-grey first, colour arrives from the shadows up.
      float d = smoothstep(0.0, 1.0, uDevelop);
      vec3 blank = vec3(0.30, 0.33, 0.31);
      img = mix(blank, img, d);
      // Light leak: hot orange bleeding in from the right edge, wavering.
      float edge = iuv.x + 0.18 * sin(iuv.y * 4.0 + uSeed * 6.28);
      float leak = uLeak * smoothstep(0.62, 1.05, edge);
      img = img + leak * vec3(1.0, 0.36, 0.12) * 1.4;
      // Soft inner shadow where the print meets the frame.
      vec2 e = min(iuv, 1.0 - iuv);
      img *= 0.82 + 0.18 * smoothstep(0.0, 0.03, min(e.x, e.y));
      col = img;
    }
  }

  gl_FragColor = vec4(lightPaper(col, n), uOpacity);
  ${PAPER_FRAGMENT_TAIL}
}
`;

export type PolaroidProps = {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  /** Seeds the procedural frame (no footage) and the leak wobble. */
  seed: string;
  /** Which part of the footage this print shows. */
  crop?: Crop;
  /** 0 flat, 1 fully curled corner. */
  curl?: number;
  /** 0 blank emulsion, 1 fully developed. */
  develop?: number;
  /** 0..1 light leak strength. */
  leak?: number;
  /** 0..1 from flashEnvelope(). */
  flash?: number;
  /** 0..1 tungsten key level. */
  keyLevel?: number;
  opacity?: number;
  /** Overrides the shared footage texture for this print. */
  texture?: THREE.Texture | null;
};

export const Polaroid: React.FC<PolaroidProps> = ({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  seed,
  crop = { x: 0.5, y: 0.5, zoom: 1 },
  curl = 0.4,
  develop = 1,
  leak = 0,
  flash = 0,
  keyLevel = 1,
  opacity = 1,
  texture,
}) => {
  const shared = useFootageTexture();
  const procedural = useProceduralFrame(seed);
  const map = texture ?? shared ?? procedural;

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        side: THREE.DoubleSide,
        transparent: true,
        uniforms: {
          uMap: { value: null },
          uCrop: { value: new THREE.Vector4(0, 0, 1, 1) },
          uCurl: { value: 0 },
          uSize: { value: new THREE.Vector2(POLAROID_SIZE.w, POLAROID_SIZE.h) },
          uDevelop: { value: 1 },
          uLeak: { value: 0 },
          uSeed: { value: 0 },
          uOpacity: { value: 1 },
          uFlash: { value: 0 },
          uKey: { value: 1 },
          uKeyDir: { value: KEY_DIR },
          uKeyColor: { value: KEY_COLOR },
        },
      }),
    [],
  );

  const u = material.uniforms;
  u.uMap.value = map;
  u.uCrop.value = coverCrop(map, WINDOW_ASPECT, crop);
  u.uCurl.value = curl;
  u.uDevelop.value = develop;
  u.uLeak.value = leak;
  u.uSeed.value = random(seed);
  u.uOpacity.value = opacity;
  u.uFlash.value = flash;
  u.uKey.value = keyLevel;

  return (
    <mesh position={position} rotation={rotation} scale={scale} material={material}>
      <planeGeometry args={[POLAROID_SIZE.w, POLAROID_SIZE.h, 24, 28]} />
    </mesh>
  );
};
