'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import AppStoreCtaPair from '@/components/links/AppStoreCtaPair';
import { HERO_SCATTER_PHOTOS } from '@/lib/landingAssets';
import DeviceFrame from './ScrapbookPreview/DeviceFrame';
import { TEASE_BE_THERE } from '@/lib/landingAssets';

export default function Hero() {
  const sectionRef = useRef(null);
  const { scrollYProgress: heroProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });

  const textOpacity = useTransform(heroProgress, [0, 0.36], [1, 0]);
  const phoneY = useTransform(heroProgress, [0, 0.4], [0, -60]);

  const headline = "Don't let the night die. Immortalize it.";

  return (
    <section
      ref={sectionRef}
      id="home"
      className="relative h-screen w-full overflow-hidden bg-[var(--color-bg-primary)] flex items-center justify-center pt-20"
    >
      {/* Luxury Background: subtle fuchsia/cyan radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[1000px] bg-[var(--color-pxi-purple)]/10 blur-[150px] pointer-events-none -z-10 opacity-60" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] bg-gradient-to-tr from-fuchsia-900/20 to-cyan-900/20 blur-[150px] rounded-full pointer-events-none opacity-30" />

      {/* Large watermark text behind content */}
      <div className="absolute -left-20 top-1/4 -rotate-90 origin-bottom-left text-[20vw] font-black text-white/[0.02] tracking-widest pointer-events-none select-none leading-none z-0 hidden md:block">
        EVENTS
      </div>

      {/* Vignette overlay for readability */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-[5] bg-[radial-gradient(ellipse_96%_78%_at_50%_46%,rgba(5,5,5,0.88)_0%,rgba(5,5,5,0.54)_50%,rgba(5,5,5,0.18)_66%,transparent_84%)]"
        style={{ opacity: textOpacity }}
        aria-hidden
      />

      {/* Main content: split layout */}
      <div className="max-w-7xl w-full h-full mx-auto flex flex-col md:flex-row items-center justify-center lg:gap-16 xl:gap-24 relative z-10 px-6 md:px-12 pt-8 md:pt-0">
        
        {/* Left: Copy */}
        <motion.div
          className="w-full md:w-1/2 text-center md:text-left flex flex-col items-center md:items-start relative z-30 shrink-0"
          style={{ opacity: textOpacity }}
        >
          {/* Radiating gradient behind text for mobile readability */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(5,5,5,1)_0%,rgba(5,5,5,0.8)_45%,transparent_75%)] md:bg-[radial-gradient(ellipse_at_center,rgba(5,5,5,0.6)_0%,transparent_60%)] -z-10 scale-[1.5] pointer-events-none translate-y-6" />

          <h1 className="sr-only">PXI: Your Shared Memory App</h1>

          <motion.h2
            className="font-display font-bold text-[clamp(40px,7vw,88px)] leading-[0.95] tracking-tighter text-white pb-2 relative z-10"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 1 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.08, delayChildren: 0.35 },
              },
            }}
          >
            {headline.split(' ').map((word, i) => (
              <motion.span
                key={i}
                className="inline-block mr-[0.25em]"
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.55, ease: [0.2, 0.65, 0.3, 0.9] },
                  },
                }}
              >
                {word}
              </motion.span>
            ))}
          </motion.h2>

          <motion.p
            className="text-lg md:text-2xl text-white/80 max-w-[600px] mx-auto md:mx-0 mt-4 md:mt-8 leading-relaxed font-medium relative z-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.1, ease: 'easeOut' }}
          >
            Rescue your best nights from scattered chats and dead camera rolls. Bring every moment into one living, unified scrapbook
          </motion.p>

          <motion.div
            className="mt-8 md:mt-16 w-full relative z-10 hidden md:block"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.7 }}
          >
            <AppStoreCtaPair dataCursorHover />
          </motion.div>
        </motion.div>

        {/* Right: Phone Mockup with Floating Polaroids */}
        <motion.div
          className="w-full md:w-1/2 flex-1 flex justify-center lg:justify-end relative z-10 pt-2 md:pt-0 pb-24 md:pb-0 items-start md:items-center overflow-visible"
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          style={{ y: phoneY }}
        >
          <div className="relative w-full max-w-[260px] sm:max-w-[320px] lg:max-w-[340px] flex justify-center">
            {/* Floating polaroid — behind right */}
            <div className="absolute top-[10%] -right-10 sm:-right-20 lg:-right-24 w-32 h-44 xl:w-40 xl:h-56 bg-white p-2 rounded-sm shadow-2xl rotate-12 scale-90 z-0 hero-drift-0 transform-gpu will-change-transform">
              <div className="w-full h-[85%] bg-neutral-800 overflow-hidden">
                <img
                  src={HERO_SCATTER_PHOTOS[0]}
                  alt=""
                  className="w-full h-full object-cover grayscale opacity-50 transform-gpu"
                  loading="lazy"
                  draggable={false}
                />
              </div>
            </div>

            {/* Floating polaroid — behind left */}
            <div className="absolute bottom-[20%] -left-8 sm:-left-20 lg:-left-24 w-20 h-28 sm:w-24 sm:h-36 xl:w-36 xl:h-48 bg-white p-1 sm:p-2 rounded-sm shadow-2xl -rotate-12 scale-90 z-20 hero-drift-1 transform-gpu will-change-transform">
              <div className="w-full h-[85%] bg-neutral-800 overflow-hidden">
                <img
                  src={HERO_SCATTER_PHOTOS[1]}
                  alt=""
                  className="w-full h-full object-cover grayscale opacity-50 transform-gpu"
                  loading="lazy"
                  draggable={false}
                />
              </div>
            </div>

            {/* The Phone */}
            <div className="relative z-10">
              <DeviceFrame>
                <div className="absolute inset-0 bg-[#050505]">
                  <img
                    src={TEASE_BE_THERE}
                    alt="PXI Events Platform"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                </div>
              </DeviceFrame>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Mobile CTAs Anchored to Bottom */}
      <motion.div
        className="absolute bottom-[10%] sm:bottom-12 left-0 right-0 z-[40] md:hidden flex justify-center px-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.7 }}
      >
        <div className="w-full max-w-[400px]">
          <AppStoreCtaPair variant="row" dataCursorHover />
        </div>
      </motion.div>
    </section>
  );
}
