// Lighting for PXI Space: one warm tungsten key from top-left, a near-zero fill,
// and an on-camera flash that pops on cue. The custom paper shaders read the
// same key direction and flash value, so set them from here.

import React from 'react';
import { AbsoluteFill } from 'remotion';
import * as THREE from 'three';
import { COLOR } from '../lib/tokens';

export const KEY_DIR = new THREE.Vector3(-0.55, 0.75, 0.45).normalize();
export const KEY_COLOR = new THREE.Color(COLOR.tungsten);

/**
 * Flash intensity at `frame` for pops at `at` frames: instant attack, ~3 frame
 * decay, like a disposable's xenon tube. Returns 0..1.
 */
export const flashEnvelope = (frame: number, at: readonly number[], decayFrames = 3) =>
  at.reduce((max, f) => (frame < f ? max : Math.max(max, Math.exp(-(frame - f) / decayFrames))), 0);

export const FlashLight: React.FC<{
  /** 0..1, usually from flashEnvelope(). */
  flash: number;
  /** 0..1 dims the tungsten key, e.g. for the loop fade. */
  level?: number;
  cameraPosition: [number, number, number];
}> = ({ flash, level = 1, cameraPosition }) => (
  <>
    <ambientLight color={COLOR.tungsten} intensity={0.04 * level} />
    <spotLight
      color={COLOR.tungsten}
      position={[KEY_DIR.x * 30, KEY_DIR.y * 30, KEY_DIR.z * 30]}
      intensity={900 * level}
      angle={0.5}
      penumbra={0.9}
      decay={2}
    />
    <pointLight
      color={COLOR.flash}
      position={cameraPosition}
      intensity={260 * flash}
      decay={2}
    />
  </>
);

/** The flash as it reads on the lens: a white frame over everything, very brief. */
export const FlashFrame: React.FC<{ flash: number }> = ({ flash }) =>
  flash > 0.01 ? (
    <AbsoluteFill
      style={{
        backgroundColor: COLOR.flash,
        opacity: Math.min(1, flash * flash) * 0.85,
        mixBlendMode: 'screen',
        pointerEvents: 'none',
      }}
    />
  ) : null;
