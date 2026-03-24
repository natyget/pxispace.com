'use client';

import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import PhoneFrame from './PhoneFrame';
import HeadlineOverlay from './HeadlineOverlay';
import ThreadScene from './ThreadScene';
import FocusScene from './FocusScene';
import GalleryScene from './GalleryScene';
import TabBar from './TabBar';

export default function ScrapbookPreview() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Phone fades in on a longer ramp so it crossfades smoothly with the headline
  const combinedOpacity = useTransform(scrollYProgress, (p) => {
    if (p < 0.5) {
      if (p < 0.03) return 0;
      if (p <= 0.24) return (p - 0.03) / (0.24 - 0.03);
      return 1;
    }
    if (p < 0.95) return 1;
    return (1 - p) / (1 - 0.95);
  });

  const combinedScale = useTransform(scrollYProgress, (p) => {
    if (p < 0.5) {
      if (p < 0.03) return 0.92;
      if (p <= 0.24) return 0.92 + ((p - 0.03) / (0.24 - 0.03)) * 0.08;
      return 1;
    }
    if (p < 0.95) return 1;
    return 1 - ((p - 0.95) / (1 - 0.95)) * 0.1;
  });

  const scrollHintOpacity = useTransform(scrollYProgress, [0, 0.06], [1, 0]);

  return (
    <section
      ref={containerRef}
      className="relative w-full h-[500vh] bg-black text-white font-sans"
    >
      <div className="sticky top-0 left-0 w-full h-screen flex items-center justify-center overflow-hidden">
        <HeadlineOverlay progress={scrollYProgress} />

        <motion.div
          className="relative z-10 flex items-center justify-center"
          style={{
            opacity: combinedOpacity,
            scale: combinedScale,
          }}
        >
          <PhoneFrame>
            {/* App chrome: status + thread header */}
            <div className="absolute top-0 left-0 w-full z-50 flex flex-col pointer-events-none">
              <div className="flex items-center justify-between px-4 pt-1.5 pb-1 text-[11px] font-semibold text-white/50 tracking-tight">
                <span>9:41</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px]">●●●</span>
                  <span className="h-2.5 w-6 rounded-[2px] border border-white/35 bg-white/10" />
                </div>
              </div>
              <div className="flex items-center justify-between px-4 pb-2 pt-1 bg-gradient-to-b from-black/95 via-black/70 to-transparent">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-white/70 text-lg leading-none shrink-0">‹</span>
                  <span className="font-black text-[12px] tracking-widest uppercase truncate text-white">
                    Lito&apos;s Party
                  </span>
                </div>
                <div className="w-7 h-7 rounded-full border border-white/15 bg-white/[0.06] backdrop-blur-md flex items-center justify-center text-[10px] font-serif italic text-white/70 shrink-0">
                  i
                </div>
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
