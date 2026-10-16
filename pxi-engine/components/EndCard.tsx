// CTA beat: the PXI mark and three words, then a fall to black that matches
// frame 0, so the Reel loops without a seam.

import React from 'react';
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { BEATS, loopFade } from '../lib/beats';
import { mono, serif } from '../lib/fonts';
import { COLOR, CTA_URL, CTA_WORDS } from '../lib/tokens';

export const EndCard: React.FC<{ words?: string }> = ({ words = CTA_WORDS }) => {
  const frame = useCurrentFrame();
  const { from } = BEATS.cta;
  if (frame < from) return null;
  const inT = interpolate(frame, [from, from + 8], [0, 1], {
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const fade = loopFade(frame);

  return (
    <AbsoluteFill
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        gap: 36,
        opacity: inT * fade,
        pointerEvents: 'none',
      }}
    >
      <Img
        src={staticFile('brand/pxi-mark.png')}
        style={{ width: 132, height: 132, transform: `scale(${0.92 + 0.08 * inT})` }}
      />
      <div
        style={{
          fontFamily: serif,
          fontSize: 104,
          color: COLOR.type,
          letterSpacing: '-0.02em',
          textTransform: 'lowercase',
          transform: `translateY(${(1 - inT) * 24}px)`,
        }}
      >
        {words}
      </div>
      <div style={{ fontFamily: mono, fontSize: 30, color: COLOR.typeMuted, letterSpacing: '0.06em' }}>
        {CTA_URL}
      </div>
    </AbsoluteFill>
  );
};
