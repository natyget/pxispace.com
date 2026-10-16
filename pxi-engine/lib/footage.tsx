// Event footage only ever reaches the screen as a texture on a 3D object.
// This file turns `footageUrl` into that texture, or into procedural film frames
// when there is no footage at all.

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { random, staticFile, useDelayRender } from 'remotion';
import { useOffthreadVideoTexture, useVideoTexture } from '@remotion/three';
import * as THREE from 'three';

export type FootageKind = 'video' | 'image' | 'none';

export const footageKind = (url: string): FootageKind => {
  if (!url.trim()) return 'none';
  if (/\.(mp4|mov|webm|m4v)(\?|$)/i.test(url)) return 'video';
  return 'image';
};

/** File names resolve inside /footage; full URLs pass through. */
export const resolveFootage = (url: string) =>
  /^(https?:|data:|blob:)/.test(url) ? url : staticFile(`footage/${url.replace(/^\/?footage\//, '')}`);

const FootageContext = createContext<THREE.Texture | null>(null);

/** The shared footage texture, or null when the engine runs footage-free. */
export const useFootageTexture = () => useContext(FootageContext);

const Provide: React.FC<{ texture: THREE.Texture | null; children: React.ReactNode }> = ({
  texture,
  children,
}) => {
  if (texture) texture.colorSpace = THREE.SRGBColorSpace;
  return <FootageContext.Provider value={texture}>{children}</FootageContext.Provider>;
};

const OffthreadVideoSource: React.FC<{ src: string; children: React.ReactNode }> = ({ src, children }) => (
  <Provide texture={useOffthreadVideoTexture({ src })}>{children}</Provide>
);

const PreviewVideoSource: React.FC<{
  videoRef: React.RefObject<HTMLVideoElement | null>;
  children: React.ReactNode;
}> = ({ videoRef, children }) => <Provide texture={useVideoTexture(videoRef)}>{children}</Provide>;

const ImageSource: React.FC<{ src: string; children: React.ReactNode }> = ({ src, children }) => {
  const { delayRender, continueRender, cancelRender } = useDelayRender();
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    const handle = delayRender(`footage image ${src}`);
    new THREE.TextureLoader().load(
      src,
      (t) => {
        setTexture(t);
        continueRender(handle);
      },
      undefined,
      (err) => cancelRender(err),
    );
  }, [src, delayRender, continueRender, cancelRender]);
  return <Provide texture={texture}>{children}</Provide>;
};

/** Mount inside <ThreeCanvas>. Stage does this for you. */
export const FootageProvider: React.FC<{
  url: string;
  isRendering: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  children: React.ReactNode;
}> = ({ url, isRendering, videoRef, children }) => {
  const kind = footageKind(url);
  if (kind === 'video') {
    return isRendering ? (
      <OffthreadVideoSource src={resolveFootage(url)}>{children}</OffthreadVideoSource>
    ) : (
      <PreviewVideoSource videoRef={videoRef}>{children}</PreviewVideoSource>
    );
  }
  if (kind === 'image') return <ImageSource src={resolveFootage(url)}>{children}</ImageSource>;
  return <Provide texture={null}>{children}</Provide>;
};

/**
 * A deterministic "flash photo of a dark room" for running with no footage:
 * near-black frame, tungsten blobs for practicals, one hot flash falloff,
 * a couple of silhouettes. Abstract on purpose, so it never reads as stock.
 */
export const useProceduralFrame = (seed: string) =>
  useMemo(() => {
    const w = 384;
    const h = 480;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    const r = (k: string) => random(`${seed}-${k}`);

    ctx.fillStyle = '#0b0806';
    ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < 7; i++) {
      const x = r(`bx${i}`) * w;
      const y = r(`by${i}`) * h * 0.6;
      const rad = 20 + r(`br${i}`) * 90;
      const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
      g.addColorStop(0, `rgba(255, ${120 + Math.round(r(`bc${i}`) * 60)}, 60, 0.55)`);
      g.addColorStop(1, 'rgba(255, 140, 66, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }

    // On-camera flash: hot centre, fast falloff.
    const fx = w * (0.35 + r('fx') * 0.3);
    const fy = h * (0.45 + r('fy') * 0.2);
    const flash = ctx.createRadialGradient(fx, fy, 0, fx, fy, w * 0.75);
    flash.addColorStop(0, 'rgba(255, 246, 232, 0.85)');
    flash.addColorStop(0.35, 'rgba(240, 200, 170, 0.35)');
    flash.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = flash;
    ctx.fillRect(0, 0, w, h);

    // Two or three heads and shoulders, lit from the front.
    ctx.fillStyle = 'rgba(20, 12, 8, 0.85)';
    const people = 2 + Math.floor(r('n') * 2);
    for (let i = 0; i < people; i++) {
      const px = w * (0.2 + (i / people) * 0.7 + r(`px${i}`) * 0.08);
      const py = h * (0.55 + r(`py${i}`) * 0.1);
      ctx.beginPath();
      ctx.ellipse(px, py, 34, 42, 0, 0, Math.PI * 2);
      ctx.ellipse(px, py + 150, 90, 100, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [seed]);
