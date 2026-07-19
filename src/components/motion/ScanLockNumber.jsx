'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useInView, useReducedMotion } from 'framer-motion';

/**
 * "Radio-tuning" number: on first scroll-into-view it rapidly scrambles
 * through random values (a dial scanning for a frequency), then snaps and
 * locks to `to`. Used for the music-match score so it reads as PXI *finding*
 * your match rather than a value that was always there.
 *
 * `onLock` fires the moment it locks, so siblings (ring, card focus, glow)
 * can resolve on the same beat. Reduced-motion / SSR → the final value, no
 * scan, and `onLock` fires immediately once in view.
 */
export default function ScanLockNumber({
  to,
  delay = 0,
  scanDuration = 0.75,
  scanIntervalMs = 65,
  min = 30,
  max = 99,
  prefix = '',
  suffix = '',
  onLock,
}) {
  const ref = useRef(null);
  // Not `once` — leaving view lets the next entrance re-scramble and re-lock.
  const isInView = useInView(ref, { margin: '-60px' });
  const shouldReduceMotion = useReducedMotion();
  const [display, setDisplay] = useState(to);
  const [locked, setLocked] = useState(true);
  const onLockRef = useRef(onLock);
  onLockRef.current = onLock;

  useEffect(() => {
    if (!isInView) return;
    if (shouldReduceMotion) {
      setDisplay(to);
      setLocked(true);
      onLockRef.current?.();
      return;
    }
    setLocked(false);
    let interval;
    const startTimer = setTimeout(() => {
      interval = setInterval(() => {
        setDisplay(Math.round(min + Math.random() * (max - min)));
      }, scanIntervalMs);
    }, delay * 1000);
    const lockTimer = setTimeout(() => {
      clearInterval(interval);
      setDisplay(to);
      setLocked(true);
      onLockRef.current?.();
    }, (delay + scanDuration) * 1000);
    return () => {
      clearTimeout(startTimer);
      clearTimeout(lockTimer);
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInView]);

  return (
    <span ref={ref} data-locked={locked}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
}
