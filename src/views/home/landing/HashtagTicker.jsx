'use client';

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const tagData = [
  { name: 'Weddings', desc: 'Capture vows, first dance, and candid moments.' },
  { name: 'Camping Trips', desc: 'Campfire stories and starlit memories.' },
  { name: 'Rooftop Parties', desc: 'Sunset cocktails and skyline DJs.' },
  { name: 'Birthdays', desc: 'Celebrate milestones with friends and surprises.' },
  { name: 'Concerts', desc: 'Live shows, lights, and unforgettable energy.' },
  { name: 'Hikes', desc: 'Trail photos and scenic vistas.' },
  { name: 'Festivals', desc: 'Multi-stage music and immersive installations.' },
  { name: 'Corporate Events', desc: 'Professional event highlights and recaps.' },
];

const COPY_COUNT = 3;
/** Horizontal auto-flow speed (px per frame @ ~60fps). */
const AUTO_SCROLL_PER_FRAME = 0.975;

function TagItem({ tag, onCarouselPauseChange }) {
  const anchorRef = useRef(null);
  const [tipPos, setTipPos] = useState(null);
  const hideTimerRef = useRef(null);

  const clearHide = useCallback(() => {
    if (hideTimerRef.current != null) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const updateTipPosition = useCallback(() => {
    const el = anchorRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setTipPos({ top: r.bottom + 12, left: r.left + r.width / 2 });
  }, []);

  const showTip = useCallback(() => {
    clearHide();
    onCarouselPauseChange?.(true);
    updateTipPosition();
  }, [clearHide, updateTipPosition, onCarouselPauseChange]);

  const scheduleHide = useCallback(() => {
    clearHide();
    hideTimerRef.current = window.setTimeout(() => {
      setTipPos(null);
      hideTimerRef.current = null;
      onCarouselPauseChange?.(false);
    }, 120);
  }, [clearHide, onCarouselPauseChange]);

  useEffect(() => {
    if (!tipPos) return;
    const onWinScroll = () => {
      setTipPos(null);
      onCarouselPauseChange?.(false);
    };
    const onResize = () => updateTipPosition();
    window.addEventListener('scroll', onWinScroll, true);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', onWinScroll, true);
      window.removeEventListener('resize', onResize);
    };
  }, [tipPos, updateTipPosition, onCarouselPauseChange]);

  const tooltip =
    tipPos &&
    typeof document !== 'undefined' &&
    createPortal(
      <div
        role="tooltip"
        style={{
          position: 'fixed',
          top: tipPos.top,
          left: tipPos.left,
          transform: 'translateX(-50%)',
          zIndex: 9999,
        }}
        className="relative w-max max-w-[270px] rounded-lg border border-white/30 bg-black/95 px-4 py-3 text-center shadow-2xl"
        onMouseEnter={clearHide}
        onMouseLeave={scheduleHide}
      >
        <p className="mb-1 text-sm font-black text-pxi-purple">#{tag.name}</p>
        <p className="text-xs leading-relaxed text-gray-300">{tag.desc}</p>
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-8 border-transparent border-b-gray-900" />
      </div>,
      document.body
    );

  return (
    <>
      <a
        ref={anchorRef}
        href={`#${tag.name.replace(/\s+/g, '')}`}
        className="relative inline-flex shrink-0 select-none"
        draggable={false}
        onMouseEnter={showTip}
        onMouseLeave={scheduleHide}
        onFocus={showTip}
        onBlur={scheduleHide}
      >
        <span className="whitespace-nowrap text-3xl font-black uppercase text-transparent bg-clip-text bg-gradient-to-b from-gray-700 to-gray-900 transition-colors hover:from-pxi-purple hover:to-white md:text-5xl">
          #{tag.name}
        </span>
      </a>
      {tooltip}
    </>
  );
}

export default function HashtagTicker() {
  const stripRef = useRef(null);
  const set0Ref = useRef(null);
  const set1Ref = useRef(null);
  const loopWidthRef = useRef(0);
  const pausedRef = useRef(false);
  const reduceMotionRef = useRef(false);

  const onCarouselPauseChange = useCallback((paused) => {
    pausedRef.current = paused;
  }, []);

  const measureAndCenter = useCallback(() => {
    const strip = stripRef.current;
    const s0 = set0Ref.current;
    const s1 = set1Ref.current;
    if (!strip || !s0 || !s1) return;
    const w = s1.offsetLeft - s0.offsetLeft;
    if (w <= 0) return;
    loopWidthRef.current = w;
    const maxScroll = Math.max(0, strip.scrollWidth - strip.clientWidth);
    if (maxScroll <= 2) {
      strip.scrollLeft = 0;
      return;
    }
    strip.scrollLeft = w <= maxScroll ? w : 0;
  }, []);

  useLayoutEffect(() => {
    measureAndCenter();
    const s0 = set0Ref.current;
    const ro = new ResizeObserver(() => measureAndCenter());
    if (s0) ro.observe(s0);
    window.addEventListener('resize', measureAndCenter);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measureAndCenter);
    };
  }, [measureAndCenter]);

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const set = () => {
      reduceMotionRef.current = !!mq?.matches;
    };
    set();
    mq?.addEventListener?.('change', set);
    return () => mq?.removeEventListener?.('change', set);
  }, []);

  const onScroll = useCallback(() => {
    const el = stripRef.current;
    const w = loopWidthRef.current;
    if (!el || w <= 0) return;
    if (el.scrollWidth <= el.clientWidth + 2) return;
    const { scrollLeft } = el;
    if (scrollLeft >= 2 * w - 2) {
      el.scrollLeft = scrollLeft - w;
    } else if (scrollLeft <= 2) {
      el.scrollLeft = scrollLeft + w;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const tick = () => {
      if (cancelled) return;
      const el = stripRef.current;
      const w = loopWidthRef.current;
      if (
        el &&
        w > 0 &&
        el.scrollWidth > el.clientWidth + 2 &&
        !pausedRef.current &&
        !reduceMotionRef.current
      ) {
        el.scrollLeft += AUTO_SCROLL_PER_FRAME;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section id="hashtags" className="border-t border-gray-900 bg-[#050505] py-16">
      <div className="relative">
        <div
          ref={stripRef}
          role="region"
          aria-label="Event hashtags, auto-scrolling; hover a tag to pause and see details"
          className="mx-auto w-full max-w-[1400px] select-none overflow-x-auto overflow-y-hidden px-6 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          onScroll={onScroll}
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {/* One continuous horizontal line — overflow scrolls; never wrap to a second line */}
          <div className="flex w-max min-w-max flex-nowrap flex-row items-center gap-x-10">
            {Array.from({ length: COPY_COUNT }, (_, copyIndex) => (
              <div
                key={copyIndex}
                ref={copyIndex === 0 ? set0Ref : copyIndex === 1 ? set1Ref : undefined}
                className="flex shrink-0 flex-nowrap items-center gap-x-10"
              >
                {tagData.map((tag) => (
                  <TagItem
                    key={`${tag.name}-${copyIndex}`}
                    tag={tag}
                    onCarouselPauseChange={onCarouselPauseChange}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
