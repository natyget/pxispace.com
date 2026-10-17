// Film grain + vignette over the whole frame. The grain tile is the PXI app's
// own luma grain (pxi-mobile-app/assets/filters/grain_luma_512.png), jumped to
// a new offset every frame the way real grain never repeats.

import React from 'react';
import { AbsoluteFill, Img, random, staticFile, useCurrentFrame } from 'remotion';

export const FilmGrain: React.FC<{ strength?: number; vignette?: number }> = ({
  strength = 0.22,
  vignette = 0.75,
}) => {
  const frame = useCurrentFrame();
  const x = Math.floor(random(`gx${frame}`) * 512);
  const y = Math.floor(random(`gy${frame}`) * 512);

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <AbsoluteFill
        style={{
          backgroundImage: `url(${staticFile('brand/grain.png')})`,
          backgroundSize: '512px 512px',
          backgroundPosition: `${x}px ${y}px`,
          mixBlendMode: 'overlay',
          opacity: strength,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 75% 60% at 50% 48%, rgba(0,0,0,0) 40%, rgba(0,0,0,${vignette}) 100%)`,
        }}
      />
      {/* Preloads the tile so the first frame isn't grain-free. */}
      <Img src={staticFile('brand/grain.png')} style={{ display: 'none' }} />
    </AbsoluteFill>
  );
};
