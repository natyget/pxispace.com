'use client';

import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import PhoneFrame from './PhoneFrame';
import HeadlineOverlay from './HeadlineOverlay';
import ThreadScene from './ThreadScene';
import FocusScene from './FocusScene';
import GalleryScene from './GalleryScene';
import TabBar from './TabBar';

/** Keep narrative dwell, but reduce animation-active duration for better performance */
const PREVIEW_SCROLL_VH = 700;

export default function ScrapbookPreview() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  const combinedOpacity = useTransform(scrollYProgress, (p) => {
    if (p < 0.17) return 0;
    if (p < 0.33) return (p - 0.17) / 0.16;
    if (p < 0.93) return 1;
    return (1 - p) / (1 - 0.93);
  });

  const combinedScale = useTransform(scrollYProgress, (p) => {
    if (p < 0.17) return 0.92;
    if (p < 0.33) return 0.92 + ((p - 0.17) / 0.16) * 0.08;
    if (p < 0.93) return 1;
    return 1 - ((p - 0.93) / 0.07) * 0.1;
  });

  const scrollHintOpacity = useTransform(scrollYProgress, [0, 0.035], [1, 0]);

  return (
    <section
      ref={containerRef}
      className="relative w-full bg-black text-white font-sans"
      style={{ height: `${PREVIEW_SCROLL_VH}vh` }}
    >
      <div className="sticky top-0 left-0 w-full h-screen flex items-center justify-center overflow-hidden pt-24 pb-6">
        <HeadlineOverlay progress={scrollYProgress} />

        <motion.div
          className="relative z-10 flex items-center justify-center"
          style={{
            opacity: combinedOpacity,
            scale: combinedScale,
          }}
        >
          <PhoneFrame>
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

            <ThreadScene progress={scrollYProgress} />
            <FocusScene progress={scrollYProgress} />
            <GalleryScene progress={scrollYProgress} />
            <TabBar progress={scrollYProgress} />
          </PhoneFrame>
        </motion.div>

        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/50"
          style={{ opacity: scrollHintOpacity }}
        >
          <span className="text-xs uppercase tracking-widest font-bold">Scroll to explore</span>
          <motion.div
            animate={{ y: [0, 5, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            ↓
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
