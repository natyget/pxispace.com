'use client';

import React from 'react';

/**
 * Full-bleed horizontal auto-scroll strip of rounded poster/photo cards —
 * the posh "real event posters" beat. Track is duplicated so the loop is
 * seamless; pauses on hover; honors prefers-reduced-motion via CSS.
 *
 * @param {{src:string, aspect?:'poster'|'photo', alt?:string}[]} items
 * @param {'slow'|'fast'} [speed]
 * @param {number} [height] — card height in px (desktop)
 */
export default function PosterMarquee({ items = [], speed = 'slow', height = 280 }) {
  if (!items.length) return null;
  const loop = [...items, ...items];

  return (
    <div className="mkt-marquee relative w-full overflow-hidden">
      {/* edge fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[#050505] to-transparent md:w-32" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#050505] to-transparent md:w-32" />

      <div
        className={['mkt-marquee-track gap-4 md:gap-5', speed === 'fast' ? 'mkt-marquee-track--fast' : '']
          .filter(Boolean)
          .join(' ')}
      >
        {loop.map((item, i) => {
          const isPoster = (item.aspect ?? 'poster') === 'poster';
          return (
            <div
              key={`${item.src}-${i}`}
              className="relative shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]"
              style={{
                height: `clamp(200px, 22vw, ${height}px)`,
                aspectRatio: isPoster ? '3 / 4' : '4 / 3',
              }}
            >
              <img
                src={item.src}
                alt={item.alt ?? ''}
                loading="lazy"
                decoding="async"
                aria-hidden={item.alt ? undefined : true}
                className="h-full w-full object-cover"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
