'use client';

import React, { useRef, useState } from 'react';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import DeviceFrame from './ScrapbookPreview/DeviceFrame';
import {
  TEASE_AFTER_NIGHT,
  TEASE_BE_THERE,
  TEASE_IDENTITY,
  TEASE_SHOT,
} from '@/lib/landingAssets';

const CHAPTERS = [
  {
    id: 1,
    headline: 'Be there',
    body:
      'The moment the doors open, the thread is live. Every photo, every reaction — streaming in real time. Your whole crew, in one place, all night.',
    image: TEASE_BE_THERE,
    imageAlt: 'Be there together',
  },
  {
    id: 2,
    headline: 'After the night ends',
    body:
      'When the event closes, PXI automatically builds your scrapbook. Every photo, every reaction, every stamp — locked in forever. It’s the proof the night happened.',
    image: TEASE_AFTER_NIGHT,
    imageAlt: 'After the night ends',
  },
  {
    id: 3,
    headline: 'Your event identity',
    body:
      'Earned, not faked. Every event you attend earns a stamp. Your Odyssey score levels up with your social calendar, tracking exactly how active your event life is. It’s your entire event life, wrapped in one identity.',
    image: TEASE_IDENTITY,
    imageAlt: 'Your event identity',
  },
  {
    id: 4,
    headline: 'Shot on PXI',
    body:
      "Our camera adapts instantly to the room's atmosphere, preserving the true story of your night exactly as it felt.",
    image: TEASE_SHOT,
    imageAlt: 'Shot on PXI',
  },
];

export default function FeatureStory() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  const [activeChapter, setActiveChapter] = useState(0);

  /* Wider scroll bands so chapters don’t flip like a speed-run */
  useMotionValueEvent(scrollYProgress, 'change', (latest) => {
    if (latest < 0.2) setActiveChapter(0);
    else if (latest < 0.45) setActiveChapter(1);
    else if (latest < 0.7) setActiveChapter(2);
    else setActiveChapter(3);
  });

  return (
    <section
      id="features"
      ref={containerRef}
      className="relative h-[520vh] w-full bg-[var(--color-bg-primary)]"
    >
      <div className="sticky top-0 h-[100svh] w-full overflow-visible md:overflow-hidden flex flex-col md:flex-row items-center justify-center md:justify-between px-6 md:px-10 max-w-[1200px] mx-auto pt-20 pb-4 md:py-0 gap-6 md:gap-8">
        <div className="relative w-full md:w-[45%] h-[44vh] md:h-full flex items-center justify-start md:justify-center z-20">
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
        <div className="relative w-full md:w-[42%] flex justify-center items-center md:items-center mt-6 md:mt-0 z-10 shrink-0">
          <DeviceFrame>
            <div className="absolute inset-0 bg-[#050505]">
              {CHAPTERS.map((chapter, index) => (
                <motion.img
                  key={chapter.id}
                  src={chapter.image}
                  alt={chapter.imageAlt}
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-cover grayscale-[15%]"
                  initial={{ opacity: 0, scale: 1.06 }}
                  animate={{
                    opacity: index === activeChapter ? 1 : 0,
                    scale: index === activeChapter ? 1 : 1.06,
                  }}
                  transition={{ duration: 0.75, ease: [0.2, 0.65, 0.3, 0.9] }}
                />
              ))}
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/25 pointer-events-none" />
            </div>
          </DeviceFrame>
          <div className="absolute right-0 md:right-[-8px] top-1/2 -translate-y-1/2 flex flex-col gap-3 z-20">
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
    </section>
  );
}
