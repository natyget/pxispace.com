'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import AppStoreCtaPair from '@/components/links/AppStoreCtaPair';
import {
  HERO_SCATTER_ICONS,
  HERO_SCATTER_ICON_EXTRA_PADDING,
  HERO_SCATTER_PHOTOS,
} from '@/lib/landingAssets';

function buildChaosElements(isMobile) {
  return Array.from({ length: 14 }).map((_, i) => {
    const angle = i * 2.39996;
    const radiusX = isMobile ? 40 + (i % 5) * 2 : 30 + (i % 6) * 2.5;
    const radiusY = isMobile ? 38 + (i % 4) * 2.5 : 28 + (i % 5) * 2.8;
    const idx = Math.floor(i / 2);
    return {
      id: i,
      type: i % 2 === 0 ? 'photo' : 'icon',
      photoStyle: i % 4 === 0 ? 'polaroid' : 'standard',
      iconUrl: HERO_SCATTER_ICONS[idx % HERO_SCATTER_ICONS.length],
      photoUrl: HERO_SCATTER_PHOTOS[idx % HERO_SCATTER_PHOTOS.length],
      startX: Math.cos(angle) * radiusX,
      startY: Math.sin(angle) * radiusY,
      rotation: ((i * 7) % 60) - 30,
      popDelay: i * 0.08,
      // Pre-compute scroll thresholds to avoid doing it per-frame
      holeStart: 0.045 + i * (isMobile ? 0.019 : 0.0155),
      holeEnd: 0.49,
    };
  });
}

function easeOutCubic(t) {
  return 1 - (1 - t) ** 3;
}

/**
 * Single component for one chaos item.
 * Uses ONE useTransform to batch x/y/scale/opacity into a single CSS transform string,
 * eliminating 3 extra useTransform hooks per element (was 4 hooks × 14 = 56, now 14).
 */
const HeroChaosItem = React.memo(function HeroChaosItem({ el, heroProgress, isMobile }) {
  const isBerealIcon = el.type === 'icon' && typeof el.iconUrl === 'string' && el.iconUrl.includes('bereal');
  const isGoogleDriveIcon =
    el.type === 'icon' &&
    typeof el.iconUrl === 'string' &&
    el.iconUrl.includes(HERO_SCATTER_ICON_EXTRA_PADDING);

  // Single useTransform computes a CSS transform + opacity string — 1 hook instead of 4
  const transform = useTransform(heroProgress, (p) => {
    const raw = (p - el.holeStart) / (el.holeEnd - el.holeStart);
    const t = easeOutCubic(Math.min(Math.max(raw, 0), 1));
    return {
      x: el.startX * (1 - t),
      y: el.startY * (1 - t),
      s: 1 - t * 0.98,
      o: Math.max(0, 1 - t * 1.08),
    };
  });

  const x = useTransform(transform, (v) => `${v.x}vw`);
  const y = useTransform(transform, (v) => `${v.y}vh`);
  const scale = useTransform(transform, (v) => v.s);
  const opacity = useTransform(transform, (v) => v.o);

  return (
    <motion.div
      className="absolute top-1/2 left-1/2 z-10 will-change-transform"
      style={{ x, y, scale, opacity }}
    >
      <motion.div
        className="will-change-transform"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          type: 'spring',
          stiffness: 150,
          damping: 15,
          mass: 1,
          delay: el.popDelay,
        }}
      >
        {/* CSS-driven drift + tilt — GPU-composited, zero JS per-frame cost */}
        <div className={`hero-drift-${el.id % 3}`}>
          {el.type === 'photo' ? (
            el.photoStyle === 'polaroid' ? (
              <div className="w-[180px] h-[220px] md:w-[240px] md:h-[290px] bg-[#fdfdfd] p-3 pb-12 md:p-4 md:pb-16 shadow-[0_15px_35px_rgba(0,0,0,0.4)] border border-neutral-200">
                <div className="w-full h-full bg-neutral-800 overflow-hidden shadow-inner">
                  <img
                    src={el.photoUrl}
                    alt=""
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                </div>
              </div>
            ) : (
              <div className="w-[180px] h-[220px] md:w-[240px] md:h-[290px] rounded-2xl overflow-hidden bg-black border-2 border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                <img
                  src={el.photoUrl}
                  alt=""
                  className="w-full h-full object-cover"
                  draggable={false}
                />
              </div>
            )
          ) : (
            <div className="w-[70px] h-[70px] md:w-[90px] md:h-[90px] rounded-[1.5rem] overflow-hidden bg-white flex items-center justify-center shadow-[0_15px_35px_rgba(0,0,0,0.2)]">
              <img
                src={el.iconUrl}
                alt=""
                className={`block w-full h-full ${isBerealIcon ? 'object-cover scale-[1.28]' : 'object-contain scale-110'} ${isGoogleDriveIcon ? 'p-2 md:p-2.5' : ''}`}
                draggable={false}
              />
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
});

export default function Hero() {
  const sectionRef = useRef(null);
  const { scrollYProgress: heroProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });

  const [isMobile, setIsMobile] = useState(false);

  // Build immediately — no `mounted` state guard, avoids an extra render cycle
  const chaosElements = useMemo(
    () => buildChaosElements(isMobile),
    [isMobile]
  );

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const textOpacity = useTransform(heroProgress, [0, 0.36], [1, 0]);

  const visibleElements = isMobile ? chaosElements.slice(0, 8) : chaosElements;

  const headline = "Don't let the night die. Immortalize it.";

  return (
    <section
      ref={sectionRef}
      id="home"
      className="relative h-screen w-full overflow-hidden bg-[var(--color-bg-primary)] flex items-center justify-center pt-20"
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[1000px] bg-[var(--color-pxi-purple)]/10 blur-[150px] pointer-events-none -z-10 opacity-60" />

      {visibleElements.map((el) => (
        <HeroChaosItem
          key={el.id}
          el={el}
          heroProgress={heroProgress}
          isMobile={isMobile}
        />
      ))}

      <motion.div
        className="pointer-events-none absolute inset-0 z-[15] bg-[radial-gradient(ellipse_96%_78%_at_50%_46%,rgba(5,5,5,0.76)_0%,rgba(5,5,5,0.38)_50%,rgba(5,5,5,0.1)_66%,transparent_84%)]"
        style={{ opacity: textOpacity }}
        aria-hidden
      />

      <motion.div
        className="absolute top-1/2 left-0 right-0 z-20 mx-auto max-w-[800px] text-center px-6"
        style={{ y: '-50%', opacity: textOpacity }}
      >
        <div
          className="pointer-events-none absolute left-1/2 top-[-2.5rem] bottom-[-3.5rem] w-[min(100vw,920px)] max-w-[calc(100%+2.5rem)] -translate-x-1/2 -z-10 bg-[radial-gradient(ellipse_90%_74%_at_50%_42%,rgba(5,5,5,0.55)_0%,rgba(5,5,5,0.16)_56%,transparent_74%)]"
          aria-hidden
        />

        <motion.h1
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
        </motion.h1>

        <motion.p
          className="text-lg md:text-2xl text-white/80 max-w-[600px] mx-auto mt-8 leading-relaxed font-medium relative z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.1, ease: 'easeOut' }}
        >
          Rescue your best nights from scattered chats and dead camera rolls. Bring every moment into one living, unified scrapbook
        </motion.p>

        <motion.div
          className="mt-16 w-full relative z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.7 }}
        >
          <AppStoreCtaPair dataCursorHover />
        </motion.div>
      </motion.div>
    </section>
  );
}
