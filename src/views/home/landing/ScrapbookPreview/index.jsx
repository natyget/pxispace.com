'use client';

import React, { useRef, useEffect, useState } from 'react';
import { motion, useMotionValue, animate, useInView, useTransform } from 'framer-motion';
import PhoneFrame from './PhoneFrame';
import ThreadScene from './ThreadScene';
import FocusScene from './FocusScene';
import GalleryScene from './GalleryScene';
import TabBar from './TabBar';

export default function ScrapbookPreview() {
  const containerRef = useRef(null);
  
  // Replace scroll progress with an auto-playing time progress (0 to 1)
  const timeProgress = useMotionValue(0);
  
  // Detect when the section is in the viewport.
  // Using a less strict margin so it plays reliably.
  const isInView = useInView(containerRef, { margin: "-10% 0px -10% 0px" });

  const [isPaused, setIsPaused] = useState(false);
  const [loopKey, setLoopKey] = useState(0);

  useEffect(() => {
    let raf;
    let lastTime = 0;
    let waitTimeout;
    let isWaiting = false;
    
    const tick = (time) => {
      if (!lastTime) lastTime = time;
      const dt = (time - lastTime) / 1000;
      lastTime = time;
      
      const current = timeProgress.get();
      if (current < 0.93) {
        timeProgress.set(Math.min(0.93, current + dt / 19.2));
        raf = requestAnimationFrame(tick);
      } else if (!isWaiting) {
        isWaiting = true;
        waitTimeout = setTimeout(() => {
          timeProgress.set(0);
          setLoopKey((k) => k + 1);
          isWaiting = false;
          lastTime = 0;
          if (!isPaused && isInView) {
            raf = requestAnimationFrame(tick);
          }
        }, 0);
      }
    };

    if (isInView && !isPaused && !isWaiting) {
      raf = requestAnimationFrame(tick);
    }
    
    return () => {
      if (raf) cancelAnimationFrame(raf);
      if (waitTimeout) clearTimeout(waitTimeout);
    };
  }, [isInView, isPaused, timeProgress]);

  return (
    <section
      ref={containerRef}
      className="relative w-full bg-black text-white font-sans h-screen"
    >
      <div className="w-full h-full flex flex-col items-center justify-center overflow-hidden">
        <motion.div
          className="relative z-10 flex items-center justify-center"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
        >
          <PhoneFrame key={loopKey}>
            {/* Solid nav like in-app album header (opaque bar, centered title, aligned actions) */}
            <div className="absolute top-0 left-0 right-0 z-50 pointer-events-none border-b border-white/[0.08] bg-[#0a0a0a]">
              <div className="relative flex h-12 items-center justify-center px-1">
                <span className="absolute left-2 flex h-9 w-9 items-center justify-center text-[22px] font-normal leading-none text-white/90">
                  ‹
                </span>
                <h2 className="max-w-[58%] truncate text-center text-[15px] font-semibold tracking-tight text-white">
                  New Year&apos;s Eve
                </h2>
                <span
                  className="absolute right-3 flex h-[calc(1rem*1.2)] w-[calc(1rem*1.2)] items-center justify-center rounded-full bg-zinc-800 text-[12px] font-semibold leading-none text-white shadow-sm ring-1 ring-white/10"
                  aria-hidden
                >
                  i
                </span>
              </div>
            </div>

            <ThreadScene progress={timeProgress} />
            <FocusScene progress={timeProgress} />
            <GalleryScene progress={timeProgress} />
            <TabBar progress={timeProgress} />
          </PhoneFrame>
        </motion.div>
      </div>
    </section>
  );
}
