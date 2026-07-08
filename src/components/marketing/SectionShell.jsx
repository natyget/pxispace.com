'use client';

import React from 'react';

/**
 * Editorial section wrapper — consistent max width, horizontal padding and
 * vertical rhythm across every marketing page. Sections are separated by a
 * hairline top border (never a background band) per the redesign rules.
 *
 * @param {boolean} [border] — draw a top hairline separator (default true)
 * @param {boolean} [fullBleed] — skip the inner max-width container
 * @param {'default'|'tight'|'loose'} [pad] — vertical padding rhythm
 */
export default function SectionShell({
  eyebrow,
  border = true,
  fullBleed = false,
  pad = 'default',
  id,
  className = '',
  eyebrowCenter = false,
  children,
}) {
  const padY =
    pad === 'tight'
      ? 'py-16 md:py-24'
      : pad === 'loose'
        ? 'py-28 md:py-40'
        : 'py-20 md:py-32';

  return (
    <section
      id={id}
      className={[
        'relative w-full',
        border ? 'border-t border-white/[0.06]' : '',
        padY,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {fullBleed ? (
        children
      ) : (
        <div className="mx-auto w-full max-w-[1200px] px-6">
          {children}
        </div>
      )}
    </section>
  );
}
