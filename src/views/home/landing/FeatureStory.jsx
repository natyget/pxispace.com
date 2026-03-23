'use client';

import React, { useRef, useState } from 'react';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';

const CHAPTERS = [
  {
    id: 1,
    headline: 'Be there. Together.',
    body:
      'The moment the doors open, the thread is live. Every photo, every reaction — streaming in real time. Your whole crew, in one place, all night.',
    image: 'https://picsum.photos/seed/live/480/1040',
    imageAlt: 'Live event thread',
  },
  {
    id: 2,
    headline: 'After the night ends, it begins.',
    body:
      'When the event closes, PXI automatically builds your scrapbook. Every photo, every reaction, every stamp — locked in forever. It’s the proof the night happened.',
    image: 'https://picsum.photos/seed/scrapbook/480/1040',
    imageAlt: 'Scrapbook memories',
  },
  {
    id: 3,
    headline: 'Your event identity. Earned, not faked.',
    body:
      'Every event earns a stamp. Bronze for showing up. Gold for creating. Platinum for making the night. Your Odyssey tracks your journey from Wanderer to Icon.',
    image: 'https://picsum.photos/seed/passport/480/1040',
    imageAlt: 'PXI passport',
  },
  {
    id: 4,
    headline: 'Shot on PXI.',
    body:
      'A full film emulation engine built into the app. Real 35mm grain. Halation around every light source. Color grading that makes every photo look like it’s worth keeping.',
    image: 'https://picsum.photos/seed/camera/480/1040',
    imageAlt: 'Shot on PXI camera',
  },
];

export default function FeatureStory() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  const [activeChapter, setActiveChapter] = useState(0);

  useMotionValueEvent(scrollYProgress, 'change', (latest) => {
    if (latest < 0.25) setActiveChapter(0);
    else if (latest < 0.5) setActiveChapter(1);
    else if (latest < 0.75) setActiveChapter(2);
    else setActiveChapter(3);
  });

  return (
    <section
      id="features"
      ref={containerRef}
      className="relative h-[400vh] w-full bg-[var(--color-bg-primary)]"
    >
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden flex flex-col md:flex-row items-center justify-center md:justify-between px-6 md:px-10 max-w-[1200px] mx-auto pt-24 pb-0 md:py-0">
        <div className="relative w-full md:w-[45%] h-[35vh] md:h-full flex items-center justify-start md:justify-center z-20">
          {CHAPTERS.map((chapter, index) => {
            const isActive = index === activeChapter;
            return (
              <div
                key={chapter.id}
                className="absolute top-1/2 left-0 w-full -translate-y-1/2"
                style={{ pointerEvents: isActive ? 'auto' : 'none' }}
              >
                <motion.div
                  className="w-full"
                  initial={{ opacity: 0, y: 20 }}
                  animate={
                    isActive
                      ? { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut', delay: 0.2 } }
                      : { opacity: 0, y: -20, transition: { duration: 0.4, ease: 'easeIn' } }
                  }
                >
                  <h3 className="font-display font-bold text-4xl md:text-6xl leading-[0.9] tracking-tighter mb-4 md:mb-6 text-transparent bg-clip-text bg-gradient-to-r from-neutral-600 to-white pb-2">
                    {chapter.headline}
                  </h3>
                  <p className="text-base md:text-lg text-white/80 leading-relaxed font-medium">
                    {chapter.body}
                  </p>
                </motion.div>
              </div>
            );
          })}
        </div>
        <div className="relative w-full md:w-[40%] h-[65vh] md:h-full flex justify-center items-start md:items-center mt-4 md:mt-0 z-10">
          <div className="relative w-[280px] sm:w-[320px] md:w-auto md:h-[70vh] max-h-[800px] aspect-[9/19.5] border-[4px] border-neutral-800 rounded-[2.5rem] md:rounded-[3rem] overflow-hidden bg-black shadow-[0_0_50px_rgba(216,74,255,0.15)] transform hover:scale-105 transition-transform duration-700 translate-y-8 md:translate-y-0">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-neutral-800 rounded-b-2xl z-30" />
            <div className="absolute inset-0 rounded-[2.2rem] md:rounded-[2.7rem] overflow-hidden m-[2px] bg-[#050505]">
              {CHAPTERS.map((chapter, index) => (
                <motion.img
                  key={chapter.id}
                  src={chapter.image}
                  alt={chapter.imageAlt}
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-cover grayscale-[20%]"
                  initial={{ opacity: 0, scale: 1.1 }}
                  animate={{
                    opacity: index === activeChapter ? 1 : 0,
                    scale: index === activeChapter ? 1 : 1.1,
                  }}
                  transition={{ duration: 0.8, ease: [0.2, 0.65, 0.3, 0.9] }}
                />
              ))}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />
            </div>
            <div className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-20">
              {CHAPTERS.map((_, index) => {
                const isActive = index === activeChapter;
                return (
                  <motion.div
                    key={index}
                    className="rounded-full"
                    animate={{
                      width: isActive ? 8 : 6,
                      height: isActive ? 8 : 6,
                      backgroundColor: isActive ? 'var(--color-pxi-purple)' : 'transparent',
                      borderColor: isActive ? 'transparent' : 'rgba(255,255,255,0.3)',
                      borderWidth: isActive ? 0 : 1.5,
                    }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
