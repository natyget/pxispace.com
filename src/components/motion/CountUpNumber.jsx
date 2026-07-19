'use client';

import React, { useEffect, useRef, useState } from 'react';
import { animate, useInView, useReducedMotion } from 'framer-motion';

/**
 * Ticks an existing stat number up from 0 to its real value once, the first
 * time it scrolls into view — an odometer settling on the dashboard mocks'
 * live figures (admitted count, payout, hype score…) instead of appearing
 * pre-filled. Renders the exact same text node the static value would.
 */
export default function CountUpNumber({ to, duration = 1.1, prefix = '', suffix = '', decimals = 0 }) {
  const ref = useRef(null);
  // Not `once` — leaving view lets the next entrance re-count from 0.
  const isInView = useInView(ref, { margin: '-60px' });
  const shouldReduceMotion = useReducedMotion();
  const [display, setDisplay] = useState(shouldReduceMotion ? to : 0);

  useEffect(() => {
    if (!isInView || shouldReduceMotion) return;
    const controls = animate(0, to, {
      duration,
      ease: 'easeOut',
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
  }, [isInView, to, duration, shouldReduceMotion]);

  const formatted = display.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span ref={ref}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
