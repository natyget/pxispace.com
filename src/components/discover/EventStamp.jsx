'use client';

import './discover.css';
import { useId } from 'react';
import { stampDateLines, stampKindFor, wrapStampText } from './discoverEvent';

/**
 * The event stamp, drawn in the three "new stamp looks":
 *   star  — layered, wavy five-lobed blob (green / orange / magenta)
 *   orbit — two overlapping translucent ellipses with a heavy blue stroke
 *   seal  — a distressed red rubber-stamp circle with a dotted inner ring
 *
 * The look is picked by event category (see stampKindFor). PRIVATE events show only their
 * date — never the name — and PUBLIC events show only their name. Text is wrapped, sized from
 * the shape's inner box, and squeezed with textLength as a last resort, so it always fits.
 */

const SERIF = '"Iowan Old Style","Palatino Linotype",Palatino,Georgia,"Times New Roman",serif';
const SANS = '"Stack Sans Notch","Inter",system-ui,sans-serif';

// Inner text box (viewBox units), glyph width per em, wrap limits and the biggest font per look.
const BOX = {
  star: { w: 116, h: 78, charW: 0.7, maxChars: 8, maxLines: 3, maxFs: 34, font: SERIF, weight: 500, fill: '#fff' },
  orbit: { w: 138, h: 62, charW: 0.7, maxChars: 10, maxLines: 3, maxFs: 38, font: SERIF, weight: 500, fill: '#fff' },
  seal: { w: 110, h: 82, charW: 0.66, maxChars: 9, maxLines: 3, maxFs: 30, font: SANS, weight: 700, fill: '#ff3b2b' },
};

/** Smooth n-lobed blob: r = R(1 + a·cos(n(θ − θ0))), one lobe pointing up. */
function blob(radius, amp, lobes = 5, steps = 220) {
  const rot = -Math.PI / 2;
  let d = '';
  for (let i = 0; i <= steps; i += 1) {
    const t = (i / steps) * Math.PI * 2;
    const r = radius * (1 + amp * Math.cos(lobes * (t - rot)));
    d += `${i ? 'L' : 'M'}${(100 + r * Math.cos(t)).toFixed(1)} ${(100 + r * Math.sin(t)).toFixed(1)}`;
  }
  return `${d}Z`;
}

const STAR_LAYERS = [
  { d: blob(80, 0.2), fill: '#4fd15e' },
  { d: blob(62, 0.23), fill: '#f4891e' },
  { d: blob(44, 0.28), fill: '#ff1ae0' },
];

function fitLines(lines, spec, scales) {
  const longest = Math.max(...lines.map((l) => l.length), 1);
  const weights = scales.reduce((a, b) => a + b, 0);
  const fsW = spec.w / (longest * spec.charW);
  const fsH = spec.h / (weights * 1.14);
  const raw = Math.min(fsW, fsH, spec.maxFs);
  const fs = Math.max(8, raw);
  return { fs, squeezed: raw < 8 };
}

function StampText({ lines, scales, spec, cx = 100, cy = 100, filter }) {
  const { fs, squeezed } = fitLines(lines, spec, scales);
  const heights = scales.map((s) => fs * s * 1.14);
  const total = heights.reduce((a, b) => a + b, 0);
  // Top of each line: a running sum, computed up front so nothing is reassigned while rendering.
  const tops = heights.map((_, i) => cy - total / 2 + heights.slice(0, i).reduce((a, b) => a + b, 0));
  return (
    <g filter={filter} fill={spec.fill} fontFamily={spec.font} fontWeight={spec.weight} textAnchor="middle">
      {lines.map((line, i) => {
        const size = fs * scales[i];
        const yy = tops[i] + heights[i] / 2;
        const width = line.length * size * spec.charW;
        return (
          <text
            key={`${line}-${i}`}
            x={cx}
            y={yy}
            fontSize={size}
            dominantBaseline="central"
            letterSpacing={spec.font === SERIF ? '0.04em' : '0.02em'}
            {...(squeezed || width > spec.w * 1.02
              ? { textLength: Math.min(spec.w, width), lengthAdjust: 'spacingAndGlyphs' }
              : {})}
          >
            {line}
          </text>
        );
      })}
    </g>
  );
}

/**
 * @param {{ event: object, size?: number|string, className?: string }} props
 *   event: { title, visibility, startDate, stampImageUrl?, stampKind?, id }
 */
export default function EventStamp({ event, size = '100%', className = '' }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const kind = stampKindFor(event);
  const spec = BOX[kind];
  const isPrivate = event?.visibility === 'PRIVATE';

  // The host uploaded their own stamp artwork: show it as-is.
  if (event?.stampImageUrl) {
    return (
      <img
        src={event.stampImageUrl}
        alt=""
        draggable={false}
        className={`dsc-stamp-img ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  const dateLines = stampDateLines(event);
  const lines = isPrivate ? dateLines : wrapStampText(event?.title || 'Event', spec.maxChars, spec.maxLines);
  const scales = isPrivate ? [1, 0.58] : lines.map(() => 1);
  const label = isPrivate ? `Event stamp, ${dateLines.join(' ')}` : `Event stamp, ${event?.title || 'Event'}`;

  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      role="img"
      aria-label={label}
      className={`dsc-stamp dsc-stamp-${kind} ${className}`}
      style={kind === 'seal' ? { filter: 'drop-shadow(0 0 5px rgba(255,59,43,.5))' } : undefined}
    >
      <defs>
        <linearGradient id={`o1${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2fd7ff" />
          <stop offset="1" stopColor="#19a9e8" />
        </linearGradient>
        <linearGradient id={`o2${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#38dcff" />
          <stop offset="1" stopColor="#1cb6ee" />
        </linearGradient>
        <filter id={`rub${uid}`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.95" numOctaves="2" seed="7" result="noise" />
          <feColorMatrix
            in="noise"
            type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -10 6.7"
            result="worn"
          />
          <feComposite in="SourceGraphic" in2="worn" operator="in" />
        </filter>
      </defs>

      {kind === 'star' &&
        STAR_LAYERS.map((layer) => <path key={layer.fill} d={layer.d} fill={layer.fill} />)}

      {kind === 'orbit' && (
        <>
          <ellipse
            cx="100"
            cy="100"
            rx="40"
            ry="88"
            transform="rotate(-56 100 100)"
            fill={`url(#o1${uid})`}
            stroke="#0f7bff"
            strokeWidth="9"
          />
          <ellipse
            cx="100"
            cy="100"
            rx="90"
            ry="44"
            fill={`url(#o2${uid})`}
            fillOpacity="0.78"
            stroke="#0f7bff"
            strokeWidth="9"
          />
        </>
      )}

      {kind === 'seal' && (
        <g filter={`url(#rub${uid})`}>
          <circle cx="100" cy="100" r="88" fill="none" stroke="#ff3b2b" strokeWidth="9" />
          <circle cx="100" cy="100" r="76" fill="none" stroke="#ff3b2b" strokeWidth="2.4" strokeDasharray="2.4 5.2" />
          <g stroke="#ff3b2b" strokeWidth="3" strokeLinecap="round">
            <path d="M148 46v14M141 53h14" />
            <path d="M52 154v10M47 159h10" />
          </g>
        </g>
      )}

      <StampText
        lines={lines}
        scales={scales}
        spec={spec}
        filter={kind === 'seal' ? `url(#rub${uid})` : undefined}
      />
    </svg>
  );
}
