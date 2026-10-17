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

const counterEase = Easing.out(Easing.cubic);

/** The count shown at `frame`: fast at first, slowing into the final number. */
const countAt = (frame: number, count: number, from: number, to: number) =>
  Math.round(count * counterEase(interpolate(frame, [from, to], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })));

/** One queue-tick per increment, thinned so ticks never land closer than `minGap` frames. */
export const counterCues = (count: number, from: number, to: number, minGap = 2) => {
  const cues: { at: number; sound: 'queue-tick'; volume: number }[] = [];
  let shown = 0;
  let last = -Infinity;
  for (let f = from; f <= to; f++) {
    const n = countAt(f, count, from, to);
    if (n > shown && f - last >= minGap) {
      cues.push({ at: f, sound: 'queue-tick', volume: 0.5 });
      last = f;
    }
    shown = n;
  }
  return cues;
};

/** "photos of you 0 → N" in the date-stamp corner, same LED treatment. */
export const PhotoCounter: React.FC<{ count: number; from: number; to: number; until: number }> = ({
  count,
  from,
  to,
  until,
}) => {
  const frame = useCurrentFrame();
  if (frame < from || frame >= until) return null;
  const n = countAt(frame, count, from, to);
  return (
    <AbsoluteFill
      style={{ justifyContent: 'flex-start', alignItems: 'flex-end', padding: `${SAFE.top}px ${SAFE.side}px`, pointerEvents: 'none' }}
    >
      <div
        style={{
          fontFamily: mono,
          fontSize: 34,
          color: COLOR.tungsten,
          opacity: 0.9,
          letterSpacing: '0.04em',
          textShadow: `0 0 12px ${COLOR.tungsten}`,
          fontVariantNumeric: 'tabular-nums',
          whiteSpace: 'pre',
        }}
      >
        {`photos of you  ${String(n).padStart(String(count).length, ' ')}`}
      </div>
    </AbsoluteFill>
  );
};
