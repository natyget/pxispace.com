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

function TagItem({ tag, onNavigate }) {
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
    updateTipPosition();
  }, [clearHide, updateTipPosition]);

  const scheduleHide = useCallback(() => {
    clearHide();
    hideTimerRef.current = window.setTimeout(() => {
      setTipPos(null);
      hideTimerRef.current = null;
    }, 120);
  }, [clearHide]);

  useEffect(() => {
    if (!tipPos) return;
    const onWinScroll = () => setTipPos(null);
    const onStripScroll = () => setTipPos(null);
    window.addEventListener('scroll', onWinScroll, true);
    window.addEventListener('pxi-hashtag-strip-scroll', onStripScroll);
    window.addEventListener('resize', updateTipPosition);
    return () => {
      window.removeEventListener('scroll', onWinScroll, true);
      window.removeEventListener('pxi-hashtag-strip-scroll', onStripScroll);
      window.removeEventListener('resize', updateTipPosition);
    };
  }, [tipPos, updateTipPosition]);

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
        className="relative inline-flex shrink-0 cursor-grab touch-pan-x select-none active:cursor-grabbing"
        draggable={false}
        onClick={onNavigate}
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
  const drag = useRef({ active: false, startX: 0, scrollLeft: 0, moved: false });
  const suppressClickRef = useRef(false);

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

  const onScroll = useCallback(() => {
    const el = stripRef.current;
    const w = loopWidthRef.current;
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('pxi-hashtag-strip-scroll'));
    }
    if (!el || w <= 0) return;
    if (el.scrollWidth <= el.clientWidth + 2) return;
    const { scrollLeft } = el;
    if (scrollLeft >= 2 * w - 2) {
      el.scrollLeft = scrollLeft - w;
    } else if (scrollLeft <= 2) {
      el.scrollLeft = scrollLeft + w;
    }
  }, []);

  const onPointerDownCapture = useCallback((e) => {
    const el = stripRef.current;
    if (!el) return;
    drag.current = {
      active: true,
      startX: e.clientX,
      scrollLeft: el.scrollLeft,
      moved: false,
    };
    try {
      el.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  }, []);

  const onPointerMove = useCallback((e) => {
    const el = stripRef.current;
    if (!drag.current.active || !el) return;
    const dx = e.clientX - drag.current.startX;
    if (Math.abs(dx) > 6) drag.current.moved = true;
    el.scrollLeft = drag.current.scrollLeft - dx;
  }, []);

  const endDrag = useCallback((e) => {
    const el = stripRef.current;
    const didMove = drag.current.moved;
    if (didMove) {
      suppressClickRef.current = true;
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 80);
    }
    drag.current.active = false;
    drag.current.moved = false;
    try {
      if (e?.pointerId != null) el?.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  }, []);

  const onLinkClick = useCallback((e) => {
    if (suppressClickRef.current) {
      e.preventDefault();
    }
  }, []);

  return (
    <section id="hashtags" className="border-t border-gray-900 bg-[#050505] py-16">
      <div className="relative">
        <div
          ref={stripRef}
          role="region"
          aria-label="Event hashtags, scroll horizontally"
          className="mx-auto max-w-[1400px] cursor-grab touch-pan-x select-none overflow-x-auto overflow-y-hidden px-6 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] active:cursor-grabbing [&::-webkit-scrollbar]:hidden"
          onScroll={onScroll}
          onPointerDownCapture={onPointerDownCapture}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <div className="flex w-max flex-row gap-x-10">
            {Array.from({ length: COPY_COUNT }, (_, copyIndex) => (
              <div
                key={copyIndex}
                ref={copyIndex === 0 ? set0Ref : copyIndex === 1 ? set1Ref : undefined}
                className="flex shrink-0 gap-x-10"
              >
                {tagData.map((tag) => (
                  <TagItem key={`${tag.name}-${copyIndex}`} tag={tag} onNavigate={onLinkClick} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
