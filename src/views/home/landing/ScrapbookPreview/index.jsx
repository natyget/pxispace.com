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

  const combinedOpacity = useTransform(scrollYProgress, (p) => {
    if (p < 0.5) {
      if (p < 0.12) return 0;
      if (p <= 0.15) return (p - 0.12) / (0.15 - 0.12);
      return 1;
    }
    if (p < 0.95) return 1;
    return (1 - p) / (1 - 0.95);
  });

  const combinedScale = useTransform(scrollYProgress, (p) => {
    if (p < 0.5) {
      if (p < 0.12) return 0.9;
      if (p <= 0.15) return 0.9 + ((p - 0.12) / (0.15 - 0.12)) * 0.1;
      return 1;
    }
    if (p < 0.95) return 1;
    return 1 - ((p - 0.95) / (1 - 0.95)) * 0.1;
  });

  const scrollHintOpacity = useTransform(scrollYProgress, [0, 0.05], [1, 0]);

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
            <div className="absolute top-0 left-0 w-full h-24 z-50 flex flex-col justify-end px-4 pb-3 bg-gradient-to-b from-black via-black/80 to-transparent pointer-events-none">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-white/70 text-lg">‹</span>
                  <span className="font-black text-[13px] tracking-widest uppercase">
                    Lito&apos;s Party
                  </span>
                </div>
                <div className="w-5 h-5 rounded-full border border-white/50 flex items-center justify-center text-[10px] font-serif italic text-white/70">
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
