'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

import { FaApple } from 'react-icons/fa';
import { PXI_IOS_DOWNLOAD_HREF } from '@/lib/appStoreLinks';

/**
 * Hero: one statement, a drifting cluster of real night photos around the
 * edges, and a scroll cue that tees up the chapters below. No marquee.
 */
const DRIFT_CARDS = [
  {
    src: '/landing/assets/720207033_17892583926515853_2215607998685685137_n.jpg',
    className: 'left-[2%] top-[8%] w-24 sm:w-32 -rotate-6 lg:left-[4%] lg:top-[16%] lg:w-40 xl:w-48',
    drift: 'hero-drift-0',
  },
  {
    src: '/landing/assets/media__1782968823505.jpg',
    className: 'right-[2%] top-[6%] w-24 sm:w-28 rotate-6 lg:right-[5%] lg:top-[14%] lg:w-36 xl:w-44',
    drift: 'hero-drift-1',
  },
  {
    src: '/landing/assets/media__1782967724838.jpg',
    className: 'left-[5%] bottom-[12%] w-28 rotate-3 sm:left-[10%] sm:w-32 lg:w-40',
    imgClassName: 'scale-[1.3] translate-x-1 object-bottom',
    drift: 'hero-drift-2',
  },
  {
    src: '/landing/assets/media__1782967677964.jpg',
    className: 'right-[5%] bottom-[8%] w-28 -rotate-6 sm:bottom-[16%] sm:right-[9%] sm:w-32 lg:w-40',
    drift: 'hero-drift-1',
  },
  {
    src: '/landing/assets/media__1782968805011.jpg',
    className: 'right-[25%] top-[12%] w-20 rotate-12 sm:right-[30%] sm:w-24 lg:top-[6%]',
    drift: 'hero-drift-0',
  },
];

export default function HeroEditorial() {
  return (
    <section className="relative flex min-h-[92dvh] w-full flex-col items-center justify-center overflow-hidden px-6 pt-24">
      {/* faint purple bloom */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/4 -z-10 h-[70vh] w-[85vw] max-w-[950px] -translate-x-1/2 rounded-full bg-pxi-purple/[0.07] blur-[160px]"
        aria-hidden
      />

      {/* drifting night photos */}
      {DRIFT_CARDS.map((card, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.35 + i * 0.12, ease: [0.16, 1, 0.3, 1] }}
          className={`pointer-events-none absolute z-0 ${card.className}`}
          aria-hidden
        >
          <div className={`${card.drift} rounded-sm bg-white p-2 pb-8 shadow-[0_20px_60px_rgba(0,0,0,0.6)]`}>
            <div className="overflow-hidden aspect-[3/4] w-full relative">
              <img src={card.src} alt="" className={`absolute inset-0 h-full w-full object-cover ${card.imgClassName || ''}`} />
            </div>
          </div>
        </motion.div>
      ))}

      <div className="relative z-10 flex max-w-3xl flex-col items-center text-center">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="text-[11px] font-bold uppercase tracking-[0.3em] text-zinc-500"
        >
          The ticket <span className="text-white">·</span> the camera{' '}
          <span className="text-pxi-orange">·</span> the morning after
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          className="display-1 mt-6"
        >
          Never lose<br className="hidden sm:block" /> the night.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
          className="body-lead mt-7 max-w-md"
        >
          The ticket gets you in. <strong>The camera keeps the moment.</strong>
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.24, ease: [0.16, 1, 0.3, 1] }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <a href={PXI_IOS_DOWNLOAD_HREF} target="_blank" rel="noopener noreferrer" className="glow-cta px-8 py-4 text-sm">
            <FaApple className="h-5 w-5" />
            Get the app
          </a>
          <Link href="/events" className="pill-ghost px-8 py-4 text-sm font-semibold backdrop-blur-xl bg-black/40 sm:bg-transparent sm:backdrop-blur-none">
            Explore events
          </Link>
        </motion.div>
      </div>

      {/* scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1 }}
        className="absolute bottom-8 flex flex-col items-center gap-2 text-zinc-600"
        aria-hidden
      >
        <span className="text-[10px] font-semibold uppercase tracking-[0.25em]">How a night works</span>
        <ChevronDown className="h-4 w-4 animate-bounce" />
      </motion.div>
    </section>
  );
}
