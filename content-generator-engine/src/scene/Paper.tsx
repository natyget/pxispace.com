// One material for everything made of paper. Each object supplies a fragment
// body that sets `col` and `alpha`; the plane can bow (bend) and lift a corner
// (curl). Lighting comes from the Stage so every object sits in the same room.

import React, { useMemo } from 'react';
import * as THREE from 'three';
import { PAPER_COMMON, PAPER_FRAGMENT_TAIL, PAPER_VERTEX_HEAD } from '../lib/paperShader';
import type { Vec3 } from '../lib/motion';
import { KEY_DIR, useLight } from './Stage';

const vertexShader = /* glsl */ `
${PAPER_VERTEX_HEAD}
uniform float uBend;
uniform float uCurl;
uniform vec2 uSize;

void main() {
  vUv = uv;
  vec3 p = position;
  float x = (uv.x - 0.5) * 2.0;
  float y = (uv.y - 0.5) * 2.0;
  // Bowed along its length with a slight twist (a handled ticket, a page).
  p.z += uBend * (-0.06 * x * x * uSize.x + 0.015 * x * y * uSize.x);
  // Bottom-right corner lifting (an instant print).
  float corner = clamp((uv.x + (1.0 - uv.y) - 1.25) / 0.75, 0.0, 1.0);
  p.z += uCurl * (0.03 * x * x + 0.2 * corner * corner * uSize.y);
  vec4 world = modelMatrix * vec4(p, 1.0);
  vPosW = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

export type UniformValue = THREE.Texture | THREE.Vector4 | THREE.Vector2 | THREE.Color | number | null;

export type PaperProps = {
  size: [number, number];
  segments?: [number, number];
  /** Extra uniform declarations, e.g. "uniform sampler2D uPhoto;". */
  decl: string;
  /** Sets vec3 col and float alpha. Has n (normal), vUv, paper helpers, lightPaper(), lightPhoto(). */
  body: string;
  uniforms: Record<string, UniformValue>;
  position?: Vec3;
  rotation?: Vec3;
  scale?: number;
  bend?: number;
  curl?: number;
  opacity?: number;
  renderOrder?: number;
};

export const Paper: React.FC<PaperProps> = ({
  size,
  segments = [24, 24],
  decl,
  body,
  uniforms,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  bend = 0,
  curl = 0,
  opacity = 1,
  renderOrder,
}) => {
  const light = useLight();
  const material = useMemo(() => {
    const u: Record<string, THREE.IUniform> = {
      uBend: { value: 0 },
      uCurl: { value: 0 },
      uSize: { value: new THREE.Vector2(...size) },
      uOpacity: { value: 1 },
      uKeyDir: { value: KEY_DIR },
      uKeyColor: { value: new THREE.Color() },
      uKey: { value: 1 },
      uFlash: { value: 0 },
    };
    for (const k of Object.keys(uniforms)) u[k] = { value: null };
    return new THREE.ShaderMaterial({
      uniforms: u,
      vertexShader,
      fragmentShader: /* glsl */ `
${PAPER_COMMON}
uniform float uOpacity;
${decl}
void main() {
  vec3 n = bentNormal();
  vec3 col = vec3(0.0);
  float alpha = 1.0;
  ${body}
  gl_FragColor = vec4(col, alpha * uOpacity);
  ${PAPER_FRAGMENT_TAIL}
}`,
      side: THREE.DoubleSide,
      transparent: true,
    });
    // The shader text is fixed per object type; size only matters at creation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decl, body]);

  const u = material.uniforms;
  for (const [k, v] of Object.entries(uniforms)) u[k].value = v;
  u.uBend.value = bend;
  u.uCurl.value = curl;
  u.uOpacity.value = opacity;
  (u.uKeyColor.value as THREE.Color).copy(light.keyColor);
  u.uKey.value = light.keyIntensity;
  u.uFlash.value = light.flash;

  if (opacity <= 0.001) return null;
  return (
    <mesh position={position} rotation={rotation} scale={scale} material={material} renderOrder={renderOrder}>
      <planeGeometry args={[size[0], size[1], segments[0], segments[1]]} />
    </mesh>
  );
};

/** UV offset/scale that covers `aspect` with an image texture, panned by `focusY` (0 bottom, 1 top). */
export const cover = (texture: THREE.Texture | null, aspect: number, focusY = 0.6, zoom = 1) => {
  const img = texture?.image as { width?: number; height?: number } | undefined;
  const ta = img?.width && img?.height ? img.width / img.height : 1;
  let sx = 1;
  let sy = 1;
  if (ta > aspect) sx = aspect / ta;
  else sy = ta / aspect;
  sx /= zoom;
  sy /= zoom;
  return new THREE.Vector4((1 - sx) / 2, (1 - sy) * focusY, sx, sy);
};
