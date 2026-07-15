'use client';

import React from 'react';

/**
 * Small rounded glass frame cropping an app screenshot (or wrapping a DOM
 * mockup). Fixed aspect crop keeps feature rows visually even.
 *
 * @param {string} [src] — screenshot to object-cover
 * @param {'4/3'|'9/16'|'16/9'} [aspect]
 * @param {React.ReactNode} [children] — render a DOM mockup instead of an image
 */
export default function UiChip({ src, alt = '', aspect = '4/3', className = '', children }) {
  // DOM mockups size to their content; only images use a fixed aspect crop.
  const style = children ? undefined : { aspectRatio: aspect.replace('/', ' / ') };
  return (
    <div
      className={[
        'glass-panel relative overflow-hidden rounded-2xl border border-white/10',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={style}
    >
      {children ? (
        children
      ) : (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          aria-hidden={alt ? undefined : true}
          className="h-full w-full object-cover"
        />
      )}
    </div>
  );
}
