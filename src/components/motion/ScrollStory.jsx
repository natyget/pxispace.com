'use client';

import React, { createContext, useContext, useMemo, useRef } from 'react';
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'framer-motion';

/**
 * Scroll-driven storytelling primitives (the "Canva landing page" pattern):
 * a section pins to the viewport while scroll advances through steps; each
 * step's content sweeps in and out, scrubbed by the scroll position itself
 * (swipe-controlled, reversible), with a light spring for fluidity.
 *
 * <ScrollStory steps={3}>        pinned stage, N steps of scroll travel
 *   <StoryDots />                step indicator rail
 *   <StoryStep index={0}>        one screenful; fades/slides in+out on scrub
 *     <StepItem start={0} end={0.4}>  staggered reveal within the step
 *
 * ScrubWords — word-by-word text reveal ("loading text"), standalone
 * (lights up as it crosses the viewport) or driven by a step's progress.
 * ScrollFadeOut — in-flow sections dissolve upward as they leave the top.
 *
 * Reduced motion: stories render as plain stacked sections, words render as
 * plain text — MotionConfig reducedMotion="user" covers the transforms, and
 * these components additionally drop pinning entirely.
 */

const StoryContext = createContext(null);
const StepContext = createContext(null);

const SCRUB_SPRING = { damping: 30, stiffness: 200, mass: 0.5, restDelta: 0.001 };

export function ScrollStory({ steps, perStep = 85, className = '', stageClassName = '', children }) {
  const ref = useRef(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const progress = useSpring(scrollYProgress, SCRUB_SPRING);
  const ctx = useMemo(() => ({ progress, steps, reduced }), [progress, steps, reduced]);

  if (reduced) {
    return (
      <StoryContext.Provider value={ctx}>
        <section ref={ref} className={className}>
          {children}
        </section>
      </StoryContext.Provider>
    );
  }

  return (
    <StoryContext.Provider value={ctx}>
      <section
        ref={ref}
        className={`relative ${className}`}
        style={{ height: `calc(${steps * perStep}svh + 100svh)` }}
      >
        <div className={`sticky top-0 h-svh overflow-hidden ${stageClassName}`}>{children}</div>
      </section>
    </StoryContext.Provider>
  );
}

export function StoryStep({ index, className = '', children }) {
  const { progress, steps, reduced } = useContext(StoryContext);
  const start = index / steps;
  const end = (index + 1) / steps;
  const span = end - start;
  const isFirst = index === 0;
  const isLast = index === steps - 1;

  // Keyframes: middle steps sweep in over the first 38% of their window and
  // out over the last 30%; the first step starts visible, the last stays.
  const inputs = [];
  const opacityOut = [];
  const yOut = [];
  const scaleOut = [];
  if (isFirst) {
    inputs.push(start);
    opacityOut.push(1);
    yOut.push(0);
    scaleOut.push(1);
  } else {
    inputs.push(start, start + span * 0.38);
    opacityOut.push(0, 1);
    yOut.push(64, 0);
    scaleOut.push(0.985, 1);
  }
  if (isLast) {
    inputs.push(end);
    opacityOut.push(1);
    yOut.push(0);
    scaleOut.push(1);
  } else {
    inputs.push(end - span * 0.3, end);
    opacityOut.push(1, 0);
    yOut.push(0, -56);
    scaleOut.push(1, 0.99);
  }

  const opacity = useTransform(progress, inputs, opacityOut);
  const y = useTransform(progress, inputs, yOut);
  const scale = useTransform(progress, inputs, scaleOut);
  const pointerEvents = useTransform(opacity, (v) => (v > 0.6 ? 'auto' : 'none'));

  // Local 0→1 progress across the step's dwell — StepItems stagger off this.
  const local = useTransform(progress, [start, start + span * 0.75], [0, 1]);
  const staticLocal = useMotionValue(1);
  const stepCtx = useMemo(
    () => ({ local: reduced ? staticLocal : local, reduced }),
    [local, staticLocal, reduced],
  );

  if (reduced) {
    return (
      <StepContext.Provider value={stepCtx}>
        <div className={`relative py-16 ${className}`}>{children}</div>
      </StepContext.Provider>
    );
  }

  return (
    <StepContext.Provider value={stepCtx}>
      <motion.div
        className={`absolute inset-0 ${className}`}
        style={{ opacity, y, scale, pointerEvents, willChange: 'opacity, transform' }}
      >
        {children}
      </motion.div>
    </StepContext.Provider>
  );
}

/** The active step's local 0→1 progress — for driving ScrubWords etc. */
export function useStepProgress() {
  return useContext(StepContext).local;
}

export function StepItem({ start = 0, end = 0.5, distance = 40, className = '', children }) {
  const { local, reduced } = useContext(StepContext);
  const opacity = useTransform(local, [start, end], [0, 1]);
  const y = useTransform(local, [start, end], [distance, 0]);
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div className={className} style={{ opacity, y }}>
      {children}
    </motion.div>
  );
}

export function StoryDots({ className = '' }) {
  const { steps, reduced } = useContext(StoryContext);
  if (reduced) return null;
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute right-5 top-1/2 z-10 hidden -translate-y-1/2 flex-col gap-2.5 md:flex ${className}`}
    >
      {Array.from({ length: steps }).map((_, i) => (
        <Dot key={i} index={i} />
      ))}
    </div>
  );
}

function Dot({ index }) {
  const { progress, steps } = useContext(StoryContext);
  const start = index / steps;
  const end = (index + 1) / steps;
  const opacity = useTransform(progress, (v) =>
    (v >= start && v < end) || (index === steps - 1 && v >= end) ? 1 : 0.28,
  );
  return <motion.span className="h-1.5 w-1.5 rounded-full bg-white" style={{ opacity }} />;
}

/**
 * Word-by-word scrubbed text reveal. Standalone by default (words light up
 * as the element crosses the lower viewport); pass `progress` (e.g. from
 * useStepProgress) + `range` to drive it from a story step instead.
 */
export function ScrubWords({
  text,
  as = 'h2',
  className = '',
  progress: progressProp,
  range = [0, 1],
  baseOpacity = 0.14,
}) {
  const ref = useRef(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.9', 'start 0.5'] });
  const own = useSpring(scrollYProgress, SCRUB_SPRING);
  const source = progressProp ?? own;
  const words = useMemo(() => String(text).split(/\s+/).filter(Boolean), [text]);
  const Tag = motion[as] ?? motion.h2;

  if (reduced) {
    const Plain = as;
    return <Plain className={className}>{text}</Plain>;
  }

  const [r0, r1] = range;
  const spanR = r1 - r0;
  return (
    <Tag ref={ref} className={className} aria-label={text}>
      {words.map((w, i) => {
        const wStart = r0 + (i / words.length) * spanR * 0.8;
        return (
          <Word
            key={`${w}-${i}`}
            progress={source}
            start={wStart}
            end={Math.min(wStart + spanR * 0.25, r1)}
            base={baseOpacity}
            text={w}
            last={i === words.length - 1}
          />
        );
      })}
    </Tag>
  );
}

function Word({ progress, start, end, base, text, last }) {
  const opacity = useTransform(progress, [start, end], [base, 1]);
  return (
    <motion.span aria-hidden style={{ opacity }}>
      {text}
      {last ? '' : ' '}
    </motion.span>
  );
}

/**
 * In-flow sections dissolve upward as they leave the top of the viewport —
 * the "animate out on swipe" counterpart to entrance reveals. Scrubbed and
 * reversible. Don't wrap sections containing position:fixed descendants.
 */
export function ScrollFadeOut({ children, className = '' }) {
  const ref = useRef(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['end 0.45', 'end 0.05'] });
  const smooth = useSpring(scrollYProgress, SCRUB_SPRING);
  const opacity = useTransform(smooth, [0, 1], [1, 0]);
  const y = useTransform(smooth, [0, 1], [0, -48]);
  const scale = useTransform(smooth, [0, 1], [1, 0.985]);
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ opacity, y, scale, willChange: 'opacity, transform' }}
    >
      {children}
    </motion.div>
  );
}

export default ScrollStory;
