'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, animate, useMotionValue, useInView, useReducedMotion } from 'framer-motion';

const ROW_HEIGHT = 34;
const LAPS = 3;

/**
 * A slot-machine reel: spins down through `options` and click-stops on
 * `finalValue`, like a dial landing on a station. Builds the spin sequence
 * as N full laps through the option list plus a final partial lap ending
 * exactly on `finalValue`, then animates a single `translateY` with a
 * decisive deceleration ease (no bounce/overshoot — it *lands*, it doesn't
 * wobble). `onLock` fires the instant it stops.
 */
export default function ReelPicker({
  options,
  finalValue,
  delay = 0,
  spinDuration = 0.95,
  onLock,
}) {
  const ref = useRef(null);
  // Not `once` — leaving view resets the reel so scrolling back in respins
  // it from the top instead of sitting locked.
  const isInView = useInView(ref, { margin: '-60px' });
  const shouldReduceMotion = useReducedMotion();
  const y = useMotionValue(0);
  const [locked, setLocked] = useState(false);
  const onLockRef = useRef(onLock);
  onLockRef.current = onLock;

  const sequence = useMemo(() => {
    const finalIndex = Math.max(0, options.indexOf(finalValue));
    const seq = [];
    for (let lap = 0; lap < LAPS; lap += 1) seq.push(...options);
    seq.push(...options.slice(0, finalIndex + 1));
    return seq;
  }, [options, finalValue]);

  useEffect(() => {
    if (!isInView) {
      // Reset while off-screen so the next entrance is a genuine respin, not
      // a no-op animation from an already-settled position.
      y.set(0);
      setLocked(false);
      return;
    }
    if (shouldReduceMotion) {
      setLocked(true);
      onLockRef.current?.();
      return;
    }
    const startTimer = setTimeout(() => {
      const target = -(sequence.length - 1) * ROW_HEIGHT;
      const controls = animate(y, target, {
        duration: spinDuration,
        ease: [0.12, 0.8, 0.32, 1], // fast spin-up, decisive slow-down to a stop
        onComplete: () => {
          setLocked(true);
          onLockRef.current?.();
        },
      });
      return () => controls.stop();
    }, delay * 1000);
    return () => clearTimeout(startTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInView]);

  return (
    <div
      ref={ref}
      className="relative h-[34px] w-full overflow-hidden rounded-lg bg-black/40"
      style={{
        maskImage: 'linear-gradient(to bottom, transparent 0%, black 30%, black 70%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 30%, black 70%, transparent 100%)',
      }}
    >
      {/* center selection window */}
      <div className="pointer-events-none absolute inset-x-0 top-1/2 z-10 h-[1px] -translate-y-1/2 bg-white/10" />
      <motion.div
        className="flex flex-col items-center"
        style={{ y, filter: locked ? 'blur(0px)' : 'blur(1.1px)' }}
      >
        {(shouldReduceMotion ? [finalValue] : sequence).map((opt, i) => (
          <div
            key={i}
            style={{ height: ROW_HEIGHT }}
            className="flex shrink-0 items-center justify-center text-[13px] font-bold uppercase tracking-wide text-white"
          >
            {opt}
          </div>
        ))}
      </motion.div>
    </div>
  );
}
