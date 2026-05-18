'use client';

import React from 'react';
import { motion } from 'framer-motion';
import DeviceFrame from './ScrapbookPreview/DeviceFrame';
import {
  TEASE_AFTER_NIGHT,
  TEASE_BE_THERE,
  TEASE_IDENTITY,
  TEASE_SHOT,
} from '@/lib/landingAssets';

const CHAPTERS = [
  {
    id: 'before',
    label: 'Before',
    labelNum: '01',
    headline: 'The hype starts here',
    body: "It starts before anyone walks through the door. A live chat thread where the crew links up — who's coming, who's grabbing drinks, who's running late. RSVP, build the hype, and feel the energy building before the night even begins.",
    image: TEASE_BE_THERE,
    imageAlt: 'PXI event chat thread with RSVP and pre-event hype building among attendees',
  },
  {
    id: 'during',
    label: 'During',
    labelNum: '02',
    headline: 'Shot on PXI',
    body: "Our native camera adapts instantly to the room's atmosphere — no filters, no staging, just the real energy. Every shot lands directly in the event's shared thread where the whole crew can react, comment, and vibe in real time. Zero friction between the moment and the memory.",
    image: TEASE_SHOT,
    imageAlt: 'PXI tactile native camera interface capturing live event moments in a shared photo gallery',
  },
  {
    id: 'after',
    label: 'After',
    labelNum: '03',
    headline: 'Immortalized, not forgotten',
    body: "When the night ends, your memories don't scatter across dead group chats and lost camera rolls. PXI automatically compiles everything — photos, reactions, voice notes, comments — into a permanent scrapbook. One thread, one gallery, one place to relive it all. Share it to your feed or anywhere else with a single tap.",
    image: TEASE_AFTER_NIGHT,
    imageAlt: 'PXI digital scrapbook with event photos, reactions, and memories automatically compiled',
  },
  {
    id: 'passport',
    label: 'Your Passport',
    labelNum: '04',
    headline: 'Your event life, wrapped',
    body: "Every event you attend earns a stamp. Your Odyssey score levels up with your social calendar — tracking every show, every party, every rooftop. It's your entire event life wrapped into one identity. Not faked, not bought. Earned by showing up.",
    image: TEASE_IDENTITY,
    imageAlt: 'PXI digital event passport displaying stamp tiers and Odyssey score for verified attendance',
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.2, 0.65, 0.3, 0.9] },
  },
};

export default function EventLifecycle() {
  return (
    <section
      id="lifecycle"
      className="relative w-full bg-[var(--color-bg-primary)] py-20 md:py-32"
    >
      {/* Section intro */}
      <div className="container mx-auto px-6 max-w-5xl mb-16 md:mb-24 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: [0.2, 0.65, 0.3, 0.9] }}
          className="font-display font-bold text-4xl md:text-6xl lg:text-7xl leading-[0.9] tracking-tighter mb-6 text-transparent bg-clip-text bg-gradient-to-r from-neutral-500 to-white pb-2"
        >
          Everything about an event.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-zinc-500 text-base md:text-lg font-medium max-w-xl mx-auto"
        >
          Before, during, and after — PXI covers every chapter of the night so nothing gets lost.
        </motion.p>
      </div>

      {/* Chapters — stacked, alternating layout */}
      <div className="flex flex-col gap-24 md:gap-36">
        {CHAPTERS.map((chapter, i) => {
          const isEven = i % 2 === 0;
          return (
            <motion.div
              key={chapter.id}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              variants={fadeUp}
              className="container mx-auto px-6 max-w-[1100px]"
            >
              <div className={`flex flex-col ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-10 md:gap-16`}>
                {/* Text */}
                <div className="w-full md:w-[50%] text-center md:text-left">
                  {/* Editorial label — number + text, thin line accent */}
                  <div className="flex items-center gap-3 mb-5 justify-center md:justify-start">
                    <span className="text-[11px] font-black text-white/30 tracking-widest">
                      {chapter.labelNum}
                    </span>
                    <span className="w-6 h-[1px] bg-white/20" />
                    <span className="text-[11px] font-black text-white/60 uppercase tracking-[0.15em]">
                      {chapter.label}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-3xl md:text-5xl leading-[0.95] tracking-tighter mb-4 md:mb-6 text-transparent bg-clip-text bg-gradient-to-r from-neutral-600 to-white pb-1">
                    {chapter.headline}
                  </h3>
                  <p className="text-sm md:text-base text-white/75 leading-relaxed font-medium">
                    {chapter.body}
                  </p>
                </div>

                {/* Phone */}
                <div className="w-full md:w-[42%] flex justify-center shrink-0">
                  <DeviceFrame>
                    <div className="absolute inset-0 bg-[#050505]">
                      <img
                        src={chapter.image}
                        alt={chapter.imageAlt}
                        className="absolute inset-0 w-full h-full object-cover grayscale-[15%]"
                        loading={i === 0 ? 'eager' : 'lazy'}
                        decoding="async"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/25 pointer-events-none" />
                    </div>
                  </DeviceFrame>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
