// A cheap disposable: injection-moulded black plastic, a card sleeve, a
// plastic lens, a winder wheel and the flash window that fires on cue.
// Built from primitives so it costs nothing to render and needs no model file.

import React from 'react';
import { RoundedBox } from '@react-three/drei';
import { COLOR } from '../lib/tokens';

export const CAMERA_BODY = { w: 1.3, h: 0.66, d: 0.38 } as const;

const plastic = { color: COLOR.plastic, roughness: 0.48, metalness: 0, clearcoat: 0.25, clearcoatRoughness: 0.6 };

export const DisposableCamera: React.FC<{
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  /** 0..1 from flashEnvelope(): lights the flash window. */
  flash?: number;
}> = ({ position = [0, 0, 0], rotation = [0, 0, 0], scale = 1, flash = 0 }) => {
  const { w, h, d } = CAMERA_BODY;
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <RoundedBox args={[w, h, d]} radius={0.05} smoothness={4}>
        <meshPhysicalMaterial {...plastic} />
      </RoundedBox>

      {/* Card sleeve wrapped round the front and back. */}
      <RoundedBox args={[w * 0.98, h * 0.72, d * 1.04]} radius={0.015} smoothness={2} position={[0, -h * 0.08, 0]}>
        <meshStandardMaterial color={COLOR.plasticAccent} roughness={0.92} />
      </RoundedBox>
      <mesh position={[-w * 0.18, -h * 0.08, d * 0.525]}>
        <planeGeometry args={[w * 0.5, h * 0.14]} />
        <meshStandardMaterial color={COLOR.tungsten} roughness={0.9} />
      </mesh>

      {/* Lens barrel and element. */}
      <mesh position={[w * 0.12, -h * 0.04, d * 0.56]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.16, 0.18, 0.12, 40]} />
        <meshPhysicalMaterial {...plastic} />
      </mesh>
      <mesh position={[w * 0.12, -h * 0.04, d * 0.625]}>
        <circleGeometry args={[0.1, 40]} />
        <meshPhysicalMaterial color="#0a0c10" roughness={0.05} metalness={0.2} clearcoat={1} />
      </mesh>

      {/* Flash window: frosted plastic that glows when it fires. */}
      <mesh position={[w * 0.36, h * 0.3, d * 0.505]}>
        <planeGeometry args={[0.26, 0.11]} />
        <meshStandardMaterial
          color="#d9d6cf"
          roughness={0.35}
          emissive="#ffffff"
          emissiveIntensity={flash * 12}
        />
      </mesh>

      {/* Viewfinder, winder wheel, shutter button. */}
      <mesh position={[-w * 0.3, h * 0.33, d * 0.505]}>
        <planeGeometry args={[0.14, 0.09]} />
        <meshPhysicalMaterial color="#05070a" roughness={0.1} clearcoat={1} />
      </mesh>
      <mesh position={[-w * 0.38, h * 0.52, -d * 0.1]}>
        <cylinderGeometry args={[0.1, 0.1, 0.08, 28]} />
        <meshPhysicalMaterial {...plastic} roughness={0.7} />
      </mesh>
      <mesh position={[w * 0.32, h * 0.52, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.05, 20]} />
        <meshPhysicalMaterial {...plastic} color="#2a2a2d" />
      </mesh>
    </group>
  );
};
