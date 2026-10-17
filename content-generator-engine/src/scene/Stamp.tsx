// A rubber stamp. Local +y is the handle; the rubber face sits at y = 0
// facing -y, so rotating x by +90° makes it press onto a page facing +z.

import React from 'react';
import * as THREE from 'three';
import type { Vec3 } from '../lib/motion';
import { STAMP } from '../lib/layout';

const wood = new THREE.MeshStandardMaterial({ color: '#9a6a3f', roughness: 0.5 });
const knob = new THREE.MeshStandardMaterial({ color: '#7a4f2c', roughness: 0.3 });
const base = new THREE.MeshStandardMaterial({ color: '#2a2622', roughness: 0.7 });

export const RubberStamp: React.FC<{ ink: string; position?: Vec3; rotation?: Vec3; scale?: number }> = ({
  ink,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
}) => {
  const r = STAMP.diameter / 2;
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh position={[0, 0.04, 0]}>
        <cylinderGeometry args={[r * 0.98, r * 0.98, 0.08, 64]} />
        <meshStandardMaterial color={ink} roughness={0.9} />
      </mesh>
      <mesh material={base} position={[0, 0.2, 0]}>
        <cylinderGeometry args={[r * 1.02, r * 1.02, 0.24, 64]} />
      </mesh>
      <mesh material={wood} position={[0, 0.75, 0]}>
        <cylinderGeometry args={[0.2, 0.34, 0.9, 40]} />
      </mesh>
      <mesh material={knob} position={[0, 1.38, 0]}>
        <sphereGeometry args={[0.42, 40, 24]} />
      </mesh>
    </group>
  );
};
