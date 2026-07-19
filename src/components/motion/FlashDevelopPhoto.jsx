'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';

const EASE = [0.16, 1, 0.3, 1];

/**
 * Instant-camera sequence for a single photo: a strong flash that HOLDS,
 * then a deliberate fade to black, then the image develops back in with a
 * bottom-to-top wipe. Each phase is its own discrete animation target (not
 * one packed keyframe timeline) so the "hold" reads as a held beat, not a
 * blur of interpolation — and so `flashHold`/`toBlack`/`develop` can vary
 * per photo for a desynced, non-mechanical feel.
 *
 * Perf: only `opacity` + a 2-value `filter` + `clipPath` ever animate (no
 * `contrast`, no `boxShadow`) — the minimum needed for the effect.
 *
 * The photo's own window must have a dark/black backing behind this image
 * (e.g. a `bg-black` wrapper) — during the black/pre-develop phases the
 * clip-path can expose that backing, and it must read as "undeveloped
 * black", not whatever sits behind the frame.
 */
export default function FlashDevelopPhoto({
  src,
  alt = '',
  className,
  delay = 0,
  flashHold = 0.22,
  toBlack = 0.28,
  develop = 1.1,
  onDevelopStart,
}) {
  const ref = useRef(null);
  // Not `once` — leaving view resets to idle so scrolling back in replays
  // the whole flash → black → develop sequence instead of staying resolved.
  const inView = useInView(ref, { margin: '-60px' });
  const shouldReduceMotion = useReducedMotion();
  const [phase, setPhase] = useState('idle');

  useEffect(() => {
    if (!inView) {
      setPhase('idle');
      return;
    }
    if (shouldReduceMotion) {
      setPhase('develop');
      return;
    }
    const attack = 0.08;
    const timers = [
      setTimeout(() => setPhase('flash'), delay * 1000),
      setTimeout(() => setPhase('black'), (delay + attack + flashHold) * 1000),
      setTimeout(() => setPhase('preDevelop'), (delay + attack + flashHold + toBlack) * 1000),
      setTimeout(() => {
        setPhase('develop');
        onDevelopStart?.();
      }, (delay + attack + flashHold + toBlack + 0.03) * 1000),
    ];
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView]);

  const STATE = {
    idle: { opacity: 0, filter: 'brightness(1) saturate(1)', clipPath: 'inset(0% 0 0 0)' },
    flash: { opacity: 1, filter: 'brightness(3.2) saturate(0.45)', clipPath: 'inset(0% 0 0 0)' },
    black: { opacity: 1, filter: 'brightness(0.04) saturate(0)', clipPath: 'inset(0% 0 0 0)' },
    preDevelop: { opacity: 1, filter: 'brightness(0.04) saturate(0)', clipPath: 'inset(100% 0 0 0)' },
    develop: { opacity: 1, filter: 'brightness(1) saturate(1)', clipPath: 'inset(0% 0 0 0)' },
  };
  const DURATION = { idle: 0, flash: 0.08, black: toBlack, preDevelop: 0.001, develop };
  const EASE_FOR = { develop: EASE, preDevelop: 'linear', black: 'easeIn', flash: 'easeOut', idle: 'linear' };

  return (
    <motion.img
      ref={ref}
      src={src}
      alt={alt}
      className={className}
      initial={STATE.idle}
      animate={STATE[phase]}
      transition={{ duration: DURATION[phase], ease: EASE_FOR[phase] }}
    />
  );
}
