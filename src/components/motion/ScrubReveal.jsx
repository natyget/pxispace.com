'use client';

import React, { useRef, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'framer-motion';

/**
 * A smooth scroll-linked reveal wrapper.
 * Transforms are linked directly to scroll progress (controlled by swiping/scrolling)
 * using a robust custom viewport-tracking hook to bypass layout-shift & hydration bugs.
 * Respects OS reduced-motion preferences.
 */
export function ScrubReveal({
  children,
  className,
  distance = 32,
  scaleStart = 1,
  as = 'div',
  ...rest
}) {
  const ref = useRef(null);
  const Tag = motion[as] ?? motion.div;
  const shouldReduceMotion = useReducedMotion();

  // Create a raw motion value for progress (0 to 1)
  const progress = useMotionValue(0);

  // Snappier spring: tracks scroll tightly so reveals resolve with intent
  // instead of the old floaty lag that read as "weird" drift.
  const smoothProgress = useSpring(progress, {
    damping: 38,
    stiffness: 340,
    mass: 0.55,
  });

  // Map the smooth progress to visual transformations
  const opacity = useTransform(smoothProgress, [0, 0.85], [0, 1]);
  const y = useTransform(smoothProgress, [0, 0.85], [distance, 0]);
  const scale = useTransform(smoothProgress, [0, 0.85], [scaleStart, 1]);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleScroll = () => {
      const rect = element.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      // Start reveal when the top of the element enters the bottom of the viewport
      const startTrigger = viewportHeight;
      // Complete reveal when the top of the element reaches 55% of viewport height (just past the middle)
      const endTrigger = viewportHeight * 0.55;

      const current = rect.top;

      let val = 0;
      if (current >= startTrigger) {
        val = 0;
      } else if (current <= endTrigger) {
        val = 1;
      } else {
        val = (startTrigger - current) / (startTrigger - endTrigger);
      }

      progress.set(val);
    };

    // Initialize position and set event listeners
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [progress]);

  const animatedStyle = shouldReduceMotion
    ? { opacity }
    : { opacity, y, scale };

  return (
    <Tag
      ref={ref}
      className={className}
      style={{
        ...animatedStyle,
        willChange: 'opacity, transform',
      }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export default ScrubReveal;
