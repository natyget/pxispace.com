// A disposable camera. Lens faces local +z; the back (-z) carries the
// viewfinder, and the photo playing in it is the event footage as a texture.

import React from 'react';
import * as THREE from 'three';
import type { Vec3 } from '../lib/motion';
import { cover, Paper } from './Paper';
import { usePhoto } from './textures';

export const CAMERA_BODY = { w: 2.3, h: 1.3, d: 0.62 };
export const VIEWFINDER = { w: 0.66, h: 0.46, x: 0.62, y: 0.28 };

const shell = new THREE.MeshStandardMaterial({ color: '#141414', roughness: 0.55, metalness: 0.05 });
const wrap = new THREE.MeshStandardMaterial({ color: '#e9e2d3', roughness: 0.85 });
const glass = new THREE.MeshStandardMaterial({ color: '#0c0f12', roughness: 0.05, metalness: 0.6 });
const chrome = new THREE.MeshStandardMaterial({ color: '#9a9a96', roughness: 0.3, metalness: 0.9 });

const VIEWFINDER_BODY = /* glsl */ `
  vec2 uv = vUv;
  vec3 img = texture2D(uPhoto, uCrop.xy + uv * uCrop.zw).rgb;
  // Seen through a little glass: soft corners, a faint reflection band.
  vec2 e = min(uv, 1.0 - uv);
  img *= 0.6 + 0.4 * smoothstep(0.0, 0.12, min(e.x, e.y));
  img += 0.05 * smoothstep(0.55, 0.6, uv.x + uv.y * 0.4) * (1.0 - smoothstep(0.62, 0.7, uv.x + uv.y * 0.4));
  col = lightPhoto(img, n) * 1.15;
`;

export const DisposableCamera: React.FC<{
  photo: string;
  /** 0..1 glow of the flash window. */
  flash: number;
  position?: Vec3;
  rotation?: Vec3;
  scale?: number;
}> = ({ photo, flash, position = [0, 0, 0], rotation = [0, 0, 0], scale = 1 }) => {
  const tex = usePhoto(photo);
  const { w, h, d } = CAMERA_BODY;
  const vfAspect = VIEWFINDER.w / VIEWFINDER.h;
  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* Body, with a paper wrap round the middle. */}
      <mesh material={shell}>
        <boxGeometry args={[w, h, d]} />
      </mesh>
      <mesh material={wrap} position={[0, -0.12, 0]}>
        <boxGeometry args={[w + 0.01, h * 0.55, d + 0.01]} />
      </mesh>
      {/* Front: lens, flash window, shutter button. */}
      <mesh material={shell} position={[-0.25, 0.02, d / 2 + 0.08]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.32, 0.36, 0.16, 40]} />
      </mesh>
      <mesh material={glass} position={[-0.25, 0.02, d / 2 + 0.165]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 0.01, 40]} />
      </mesh>
      <mesh position={[0.62, 0.34, d / 2 + 0.012]}>
        <planeGeometry args={[0.62, 0.3]} />
        <meshBasicMaterial color={new THREE.Color(0.75, 0.75, 0.72).lerp(new THREE.Color(1, 1, 1), flash).multiplyScalar(0.4 + flash * 2)} toneMapped={false} />
      </mesh>
      <mesh material={chrome} position={[0.62, 0.34, d / 2 + 0.008]}>
        <planeGeometry args={[0.7, 0.38]} />
      </mesh>
      <mesh material={chrome} position={[0.75, h / 2 + 0.04, 0]}>
        <cylinderGeometry args={[0.09, 0.09, 0.08, 24]} />
      </mesh>
      {/* Winder wheel on the back top. */}
      <mesh material={shell} position={[-0.75, h / 2 + 0.03, -d / 2 + 0.12]}>
        <cylinderGeometry args={[0.2, 0.2, 0.06, 32]} />
      </mesh>
      {/* Back: viewfinder with the footage in it. */}
      <mesh material={shell} position={[-VIEWFINDER.x, VIEWFINDER.y, -d / 2 - 0.03]}>
        <boxGeometry args={[VIEWFINDER.w + 0.14, VIEWFINDER.h + 0.14, 0.06]} />
      </mesh>
      <group position={[-VIEWFINDER.x, VIEWFINDER.y, -d / 2 - 0.065]} rotation={[0, Math.PI, 0]}>
        <Paper
          size={[VIEWFINDER.w, VIEWFINDER.h]}
          segments={[2, 2]}
          decl="uniform sampler2D uPhoto; uniform vec4 uCrop;"
          body={VIEWFINDER_BODY}
          uniforms={{ uPhoto: tex, uCrop: cover(tex, vfAspect, 0.62) }}
        />
      </group>
    </group>
  );
};
