'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { FaGooglePlay } from 'react-icons/fa';
import { PXI_APP_STORE_URL, PXI_PLAY_STORE_URL } from '@/lib/appStoreLinks';
import {
  APP_STORE_BADGE,
  HERO_SCATTER_ICONS,
  HERO_SCATTER_PHOTOS,
  LANDING_LOGO,
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
      driftX: ((i * 11) % 40) - 20,
      driftY: ((i * 13) % 30) - 15,
      durationX: 5 + (i % 5),
      durationY: 4 + (i % 4),
      popDelay: i * 0.08,
    };
  });
}

export default function Hero() {
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  const chaosElements = useMemo(
    () => (mounted ? buildChaosElements(isMobile) : []),
    [isMobile, mounted]
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const unsub = scrollY.on('change', (v) => {
      setIsScrolled(v > 10);
    });

    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      unsub();
      window.removeEventListener('resize', checkMobile);
    };
  }, [scrollY]);

  const textOpacity = useTransform(scrollY, [0, 100], [1, 0]);
  const elementsScale = useTransform(scrollY, [0, 100], [1, 0]);
  const elementsOpacity = useTransform(scrollY, [0, 100], [1, 0]);

  const visibleElements = isMobile ? chaosElements.slice(0, 8) : chaosElements;

  const headline = 'Every event builds your story';

  return (
    <section
      id="home"
      className="relative h-screen w-full overflow-hidden bg-[var(--color-bg-primary)] flex items-center justify-center pt-20"
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[1000px] bg-[var(--color-pxi-purple)]/10 blur-[150px] pointer-events-none -z-10 opacity-60" />

      {visibleElements.map((el) => (
        <motion.div
          key={el.id}
          className="absolute top-1/2 left-1/2 z-10"
          initial={{
            x: 0,
            y: 0,
            scale: 0,
            opacity: 0,
          }}
          animate={
            isScrolled
              ? { x: 0, y: 0, scale: 0, opacity: 0 }
              : {
                  x: `${el.startX}vw`,
                  y: `${el.startY}vh`,
                  scale: 1,
                  opacity: 1,
                }
          }
          transition={
            isScrolled
              ? { duration: 0.8, ease: [0.4, 0, 0.2, 1] }
              : {
                  type: 'spring',
                  stiffness: 150,
                  damping: 15,
                  mass: 1,
                  delay: el.popDelay,
                }
          }
          style={
            isScrolled
              ? undefined
              : { scale: elementsScale, opacity: elementsOpacity }
          }
        >
          <motion.div
            animate={{
              x: [0, el.driftX, 0],
              y: [0, el.driftY, 0],
              rotate: [el.rotation, el.rotation + 15, el.rotation],
            }}
            transition={{
              duration: el.durationX,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            {el.type === 'photo' ? (
              el.photoStyle === 'polaroid' ? (
                <div className="w-[180px] h-[220px] md:w-[240px] md:h-[290px] bg-[#fdfdfd] p-3 pb-12 md:p-4 md:pb-16 shadow-[0_15px_35px_rgba(0,0,0,0.4)] border border-neutral-200">
                  <div className="w-full h-full bg-neutral-800 overflow-hidden shadow-inner">
                    <img
                      src={el.photoUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              ) : (
                <div className="w-[180px] h-[220px] md:w-[240px] md:h-[290px] rounded-2xl overflow-hidden bg-black border-2 border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                  <img
                    src={el.photoUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
              )
            ) : (
              <div className="w-[70px] h-[70px] md:w-[90px] md:h-[90px] rounded-[1.5rem] bg-white/95 backdrop-blur-md flex items-center justify-center border border-white/40 shadow-[0_15px_35px_rgba(0,0,0,0.2)]">
                <img
                  src={el.iconUrl}
                  alt=""
                  className="w-10 h-10 md:w-12 md:h-12 object-contain"
                />
              </div>
            )}
          </motion.div>
        </motion.div>
      ))}

      <motion.div
        className="absolute top-1/2 left-0 right-0 z-20 mx-auto max-w-[800px] text-center px-6"
        style={{ y: '-50%', opacity: textOpacity }}
      >
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,var(--color-bg-primary)_20%,transparent_80%)] md:bg-[radial-gradient(circle_at_center,var(--color-bg-primary)_0%,transparent_70%)] opacity-90 blur-xl scale-150" />

        <motion.div
          className="flex justify-center mb-8 relative z-10"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <img
            src={LANDING_LOGO}
            alt="PXI"
            className="h-12 w-12 md:h-14 md:w-14 object-contain drop-shadow-[0_0_24px_rgba(216,74,255,0.35)]"
          />
        </motion.div>

        <motion.h1
          className="font-display font-bold text-[clamp(40px,7vw,88px)] leading-[0.95] tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-neutral-600 to-white pb-2 relative z-10"
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
          Your best nights are scattered across 6 apps, 3 group chats, and forgotten camera rolls.
        </motion.p>

        <motion.div
          className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.7 }}
        >
          <a
            href={PXI_APP_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-xl bg-white/10 border border-white/20 backdrop-blur-md hover:bg-white/20 transition-colors cursor-pointer px-4 py-2"
            data-cursor-hover
          >
            <img
              src={APP_STORE_BADGE}
              alt="Download on the App Store"
              className="h-10 md:h-11 w-auto"
            />
          </a>
          <a
            href={PXI_PLAY_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md hover:bg-white/20 transition-colors cursor-pointer"
            data-cursor-hover
          >
            <FaGooglePlay size={26} className="text-white" />
            <div className="flex flex-col items-start">
              <span className="text-[10px] uppercase tracking-widest text-white/70 font-bold leading-none mb-1">
                Get it on
              </span>
              <span className="text-sm font-bold text-white leading-none">Google Play</span>
            </div>
          </a>
        </motion.div>
      </motion.div>
    </section>
  );
}
