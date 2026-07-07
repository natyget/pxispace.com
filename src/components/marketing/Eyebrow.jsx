'use client';

import React from 'react';

/** Small uppercase label with a short neon rule — posh-style section kicker. */
export default function Eyebrow({ children, center = false, className = '' }) {
  return (
    <span
      className={['eyebrow', center ? 'eyebrow--center' : '', className]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </span>
  );
}
