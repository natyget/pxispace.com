// On-screen type. Instrument Serif for the line, mono for the date stamp,
// both lowercase. Lines enter with a fast masked rise and leave faster; they
// sit inside the Reels safe zone.

import React from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';
import { mono, serif } from '../lib/fonts';
import { COLOR, SAFE } from '../lib/tokens';

const ease = Easing.bezier(0.16, 1, 0.3, 1);

export const Headline: React.FC<{
  text: string;
  from: number;
  to: number;
  /** 'low' sits above the caption zone, 'mid' near optical centre. */
  placement?: 'low' | 'mid';
  size?: number;
}> = ({ text, from, to, placement = 'low', size = 132 }) => {
  const frame = useCurrentFrame();
  if (frame < from || frame >= to) return null;
  const enter = interpolate(frame, [from, from + 7], [1, 0], { extrapolateRight: 'clamp', easing: ease });
  const exit = interpolate(frame, [to - 4, to], [0, 1], { extrapolateLeft: 'clamp', easing: Easing.in(Easing.quad) });

  return (
    <AbsoluteFill
      style={{
        justifyContent: placement === 'low' ? 'flex-end' : 'center',
        padding: `${SAFE.top}px ${SAFE.side}px ${SAFE.bottom + 40}px`,
        pointerEvents: 'none',
      }}
    >
      <div style={{ overflow: 'hidden', paddingBottom: size * 0.18 }}>
        <div
          style={{
            fontFamily: serif,
            fontSize: size,
            lineHeight: 0.95,
            letterSpacing: '-0.02em',
            color: COLOR.type,
            textTransform: 'lowercase',
            transform: `translateY(${(enter * 0.9 + exit * -0.6) * size}px)`,
            opacity: 1 - exit,
            textShadow: '0 2px 30px rgba(0,0,0,0.55)',
          }}
        >
          {text}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** The orange date imprint a disposable burns into the corner of every frame. */
export const DateStamp: React.FC<{ eventDate: string; from: number; to: number; time?: string }> = ({
  eventDate,
  from,
  to,
  time,
}) => {
  const frame = useCurrentFrame();
  if (frame < from || frame >= to) return null;
  // Flicker on like an LED segment display.
  const on = frame - from < 3 ? (frame - from) % 2 : 1;
  return (
    <AbsoluteFill
      style={{
        justifyContent: 'flex-start',
        alignItems: 'flex-end',
        padding: `${SAFE.top}px ${SAFE.side}px`,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          fontFamily: mono,
          fontSize: 34,
          color: COLOR.tungsten,
          opacity: on * 0.9,
          letterSpacing: '0.04em',
          textTransform: 'lowercase',
          textShadow: `0 0 12px ${COLOR.tungsten}`,
        }}
      >
        {eventDate.toLowerCase()}
        {time ? `  ${time}` : ''}
      </div>
    </AbsoluteFill>
  );
};
