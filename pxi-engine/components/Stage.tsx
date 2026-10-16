// PXI Space: the black void every template plays in. Owns the 35mm camera
// (with handheld shake, so the frame is never static), the lights, depth of
// field, the footage texture, grain and vignette. Templates only say where the
// camera is and what is in the room.

import React, { useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { DepthOfField, EffectComposer } from '@react-three/postprocessing';
import { ThreeCanvas } from '@remotion/three';
import { noise2D } from '@remotion/noise';
import { AbsoluteFill, Html5Video, useCurrentFrame, useRemotionEnvironment } from 'remotion';
import * as THREE from 'three';
import { FootageProvider, footageKind, resolveFootage } from '../lib/footage';
import { CAMERA, COLOR, VIDEO } from '../lib/tokens';
import { FilmGrain } from './FilmGrain';
import { FlashFrame, FlashLight } from './FlashLight';

export type Vec3 = [number, number, number];

export type CameraPose = {
  position: Vec3;
  target: Vec3;
  /** Where focus sits; defaults to `target`. */
  focus?: Vec3;
  /** Extra roll in radians, for a dutch moment. */
  roll?: number;
};

const deg = THREE.MathUtils.degToRad;

const Rig: React.FC<{ pose: CameraPose; shake: number }> = ({ pose, shake }) => {
  const frame = useCurrentFrame();
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const t = (frame / VIDEO.fps) * CAMERA.shakeHz;
  const n = (k: string, f = 1) => noise2D(k, t * f, 0) + 0.35 * noise2D(`${k}-hi`, t * f * 3.1, 0);
  const a = CAMERA.shakeDegrees * shake;
  const m = CAMERA.shakeTranslate * shake;

  camera.filmGauge = CAMERA.filmGaugeMm;
  camera.setFocalLength(CAMERA.focalLengthMm);
  camera.near = 0.05;
  camera.far = 400;
  camera.position.set(pose.position[0] + n('px') * m, pose.position[1] + n('py') * m, pose.position[2] + n('pz') * m);
  camera.up.set(0, 1, 0);
  camera.lookAt(...pose.target);
  camera.rotateX(deg(n('rx') * a));
  camera.rotateY(deg(n('ry') * a));
  camera.rotateZ(deg(n('rz') * a) + (pose.roll ?? 0));
  camera.updateProjectionMatrix();
  return null;
};

export type StageProps = {
  footageUrl: string;
  pose: CameraPose;
  /** Multiplies the 0.2 handheld shake; >1 for the chaos beat. */
  shake?: number;
  flash?: number;
  keyLevel?: number;
  /** 3D content. */
  children: React.ReactNode;
  /** DOM layers above the grain: headlines, CTA. */
  overlay?: React.ReactNode;
};

export const Stage: React.FC<StageProps> = ({
  footageUrl,
  pose,
  shake = 1,
  flash = 0,
  keyLevel = 1,
  children,
  overlay,
}) => {
  const { isRendering } = useRemotionEnvironment();
  const videoRef = useRef<HTMLVideoElement>(null);
  const kind = footageKind(footageUrl);

  return (
    <AbsoluteFill style={{ backgroundColor: COLOR.void }}>
      {/* In Studio a hidden <video> feeds the texture; during render the offthread extractor does. */}
      {kind === 'video' && !isRendering ? (
        <Html5Video
          ref={videoRef}
          src={resolveFootage(footageUrl)}
          muted
          loop
          style={{ position: 'absolute', width: 2, height: 2, opacity: 0 }}
        />
      ) : null}

      <ThreeCanvas
        width={VIDEO.width}
        height={VIDEO.height}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
        style={{ backgroundColor: COLOR.void }}
      >
        <color attach="background" args={[COLOR.void]} />
        <Rig pose={pose} shake={shake} />
        <FlashLight flash={flash} level={keyLevel} cameraPosition={pose.position} />
        <FootageProvider url={footageUrl} isRendering={isRendering} videoRef={videoRef}>
          {children}
        </FootageProvider>
        <EffectComposer multisampling={0}>
          <DepthOfField
            target={pose.focus ?? pose.target}
            worldFocusRange={CAMERA.focusRange}
            bokehScale={CAMERA.bokehScale}
          />
        </EffectComposer>
      </ThreeCanvas>

      <FlashFrame flash={flash} />
      <FilmGrain />
      {overlay}
    </AbsoluteFill>
  );
};
