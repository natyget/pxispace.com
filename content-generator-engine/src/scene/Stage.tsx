// Pitch-black room, one warm-white key from top-left (faces read true), a low
// tungsten rim from behind, a lens flash, 35mm camera with micro handheld shake,
// grain and vignette. No tone mapping, no colour grade: no orange filter.

import React, { createContext, useContext } from 'react';
import { useThree } from '@react-three/fiber';
import { DepthOfField, EffectComposer } from '@react-three/postprocessing';
import { ThreeCanvas } from '@remotion/three';
import { noise2D } from '@remotion/noise';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import * as THREE from 'three';
import type { Vec3 } from '../lib/motion';
import { FPS, HEIGHT, WIDTH, type Storyboard } from '../lib/storyboard';
import { FilmGrain } from './FilmGrain';

export const KEY_DIR = new THREE.Vector3(-0.5, 0.7, 0.55).normalize();

export type CameraPose = { position: Vec3; target: Vec3; focus: Vec3; roll?: number };

/** What every paper shader needs to light itself like the scene. */
export type Light = { keyColor: THREE.Color; keyIntensity: number; flash: number };
const LightContext = createContext<Light>({ keyColor: new THREE.Color('#fff'), keyIntensity: 1, flash: 0 });
export const useLight = () => useContext(LightContext);

const deg = THREE.MathUtils.degToRad;

const Rig: React.FC<{ pose: CameraPose; shake: number }> = ({ pose, shake }) => {
  const frame = useCurrentFrame();
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const t = (frame / FPS) * 1.3;
  const n = (k: string) => noise2D(k, t, 0) + 0.35 * noise2D(`${k}-hi`, t * 3.1, 0);
  camera.filmGauge = 35;
  camera.setFocalLength(35);
  camera.near = 0.05;
  camera.far = 200;
  camera.position.set(pose.position[0] + n('px') * 0.02 * shake, pose.position[1] + n('py') * 0.02 * shake, pose.position[2]);
  camera.up.set(0, 1, 0);
  camera.lookAt(...pose.target);
  camera.rotateX(deg(n('rx') * 0.2 * shake));
  camera.rotateY(deg(n('ry') * 0.2 * shake));
  camera.rotateZ(deg(n('rz') * 0.2 * shake) + (pose.roll ?? 0));
  camera.updateProjectionMatrix();
  return null;
};

/** On-lens flash: white over everything, squared so a full pop is pure white. */
const FlashFrame: React.FC<{ flash: number }> = ({ flash }) =>
  flash > 0.01 ? <AbsoluteFill style={{ backgroundColor: '#fff', opacity: Math.min(1, flash * flash) }} /> : null;

export const Stage: React.FC<{
  look: Storyboard['look'];
  pose: CameraPose;
  shake: number;
  flash: number;
  children: React.ReactNode;
}> = ({ look, pose, shake, flash, children }) => {
  const light: Light = { keyColor: new THREE.Color(look.key), keyIntensity: look.keyIntensity, flash };
  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      <ThreeCanvas width={WIDTH} height={HEIGHT} gl={{ antialias: true, toneMapping: THREE.NoToneMapping }}>
        <color attach="background" args={['#000000']} />
        <Rig pose={pose} shake={shake} />
        <ambientLight intensity={0.05} />
        <directionalLight color={look.key} position={[KEY_DIR.x * 10, KEY_DIR.y * 10, KEY_DIR.z * 10]} intensity={2.2 * look.keyIntensity} />
        <directionalLight color={look.rim} position={[4, 3, -6]} intensity={1.4} />
        <pointLight color="#ffffff" position={pose.position} intensity={120 * flash} decay={2} />
        <LightContext.Provider value={light}>{children}</LightContext.Provider>
        <EffectComposer multisampling={0}>
          <DepthOfField target={pose.focus} worldFocusRange={2.2} bokehScale={3} />
        </EffectComposer>
      </ThreeCanvas>
      <FilmGrain strength={0.18} vignette={0.6} />
      <FlashFrame flash={flash} />
    </AbsoluteFill>
  );
};
