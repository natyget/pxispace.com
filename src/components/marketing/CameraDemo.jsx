'use client';

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { RefreshCw, Zap, Home, Camera, LayoutGrid, Wallet } from 'lucide-react';

/**
 * DOM rebuild of the PXI camera, cycling its five film moods. A real event
 * photo sits behind the viewfinder; each mood swaps the image treatment and
 * re-themes the shutter pill, exactly like swiping filters in the app.
 */
export const SHOT = 'https://images.unsplash.com/photo-1545128485-c400e7702796?auto=format&fit=crop&q=80&w=800';

const FILTERS = [
  {
    name: 'REGULAR',
    imgFilter: 'none',
    overlay: null,
    pill: 'bg-[#101408]/90',
    pillGlow: '',
    stripe: null,
    shutterOuter: 'border-white/85',
    shutterInner: 'bg-white',
    icons: 'text-white',
    label: 'text-white',
    flashAuto: false,
  },
  {
    name: 'RETRO',
    imgFilter: 'sepia(0.45) saturate(1.25) contrast(1.05) brightness(1.02)',
    overlay: 'linear-gradient(180deg, rgba(120,60,20,0.12), rgba(60,25,5,0.22))',
    pill: 'bg-gradient-to-r from-[#5a2c1a] via-[#8a4a2b] to-[#d9955f]',
    pillGlow: '',
    stripe: null,
    shutterOuter: 'border-[#f6e7d3]/90',
    shutterInner: 'bg-[#f6e7d3]',
    icons: 'text-[#f6e7d3]',
    label: 'text-amber-200',
    flashAuto: true,
  },
  {
    name: 'DISPO',
    imgFilter: 'saturate(1.2) contrast(1.12) brightness(1.03)',
    overlay: 'linear-gradient(180deg, rgba(110,160,110,0.10), rgba(30,60,30,0.16))',
    pill: 'bg-[#6f9f7c]',
    pillGlow: '',
    stripe: 'bg-red-500',
    shutterOuter: 'border-black/70',
    shutterInner: 'bg-black',
    icons: 'text-[#10241a]',
    label: 'text-emerald-200',
    flashAuto: true,
    dateStamp: true,
  },
  {
    name: 'NOIR',
    imgFilter: 'grayscale(1) contrast(1.25) brightness(0.95)',
    overlay: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55) 100%)',
    pill: 'bg-black',
    pillGlow: 'shadow-[0_0_28px_rgba(255,255,255,0.5)]',
    stripe: null,
    shutterOuter: 'border-white/90',
    shutterInner: 'bg-white',
    icons: 'text-white',
    label: 'text-white',
    flashAuto: true,
  },
  {
    name: 'SNAP',
    imgFilter: 'brightness(1.1) contrast(1.08) saturate(1.15)',
    overlay: 'radial-gradient(ellipse at center, transparent 50%, rgba(200,90,20,0.25) 100%)',
    pill: 'bg-[#1c120a]',
    pillGlow: 'shadow-[0_0_26px_rgba(255,120,40,0.45)]',
    stripe: 'bg-pxi-orange',
    shutterOuter: 'border-[#f4e3c8]/90',
    shutterInner: 'bg-[#f4e3c8]',
    icons: 'text-[#f4e3c8]',
    label: 'text-orange-300',
    flashAuto: true,
  },
];

const CYCLE_MS = 2800;

export default function CameraDemo({ onFilterChange }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % FILTERS.length), CYCLE_MS);
    return () => clearInterval(id);
  }, []);

  const f = FILTERS[idx];

  useEffect(() => {
    if (onFilterChange) onFilterChange(f);
  }, [f, onFilterChange]);

  return (
    <div className="relative mx-auto w-full max-w-[330px]">
      <div
        className="relative aspect-[9/19.5] w-full overflow-hidden rounded-[2.4rem] border border-white/12 bg-black shadow-[0_30px_80px_-20px_rgba(0,0,0,0.85)]"
        aria-hidden
      >
        {/* viewfinder */}
      <AnimatePresence mode="sync">
        <motion.img
          key={f.name}
          src={SHOT}
          alt=""
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.55, ease: 'easeInOut' }}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ filter: f.imgFilter }}
        />
      </AnimatePresence>
      {f.overlay ? (
        <motion.div
          key={`ov-${f.name}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.55 }}
          className="absolute inset-0"
          style={{ background: f.overlay }}
        />
      ) : null}

      {/* dispo date stamp */}
      {f.dateStamp ? (
        <span className="absolute bottom-[31%] left-5 font-mono text-[11px] font-bold tracking-widest text-orange-400/90 [text-shadow:0_0_6px_rgba(255,140,40,0.8)]">
          07 01 ’26
        </span>
      ) : null}

      {/* album chip */}
      <div className="absolute left-1/2 top-4 -translate-x-1/2">
        <span className="flex items-center gap-1.5 rounded-full bg-black/45 px-4 py-1.5 text-[12px] font-bold text-white backdrop-blur-md">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
          Summer 2026
        </span>
      </div>

      {/* shot counter */}
      <div className="absolute bottom-[160px] right-4 flex h-11 w-9 items-center justify-center rounded-lg bg-pxi-purple/80 text-base font-black text-white shadow-[0_0_18px_rgba(240,31,255,0.5)] backdrop-blur">
        12
      </div>

      {/* zoom pills */}
      <div className="absolute bottom-[164px] left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-black/35 px-2 py-1 backdrop-blur-md">
        {['.5', '1', '3'].map((z, i) => (
          <span
            key={z}
            className={`flex h-7 items-center justify-center rounded-full px-2.5 text-[11px] font-bold ${
              i === 2 ? 'bg-black/70 text-pxi-purple' : 'text-white/75'
            }`}
          >
            {z}
          </span>
        ))}
      </div>

      {/* shutter pill */}
      <div className="absolute inset-x-4 bottom-8">
        <motion.div
          className={`relative flex h-[76px] items-center justify-between overflow-hidden rounded-full px-7 transition-colors duration-300 ${f.pill} ${f.pillGlow}`}
        >
          {f.stripe ? <span className={`absolute bottom-2 left-[24%] top-2 w-[3px] rounded-full ${f.stripe}`} /> : null}
          <RefreshCw className={`h-5 w-5 ${f.icons}`} />
          <span className={`flex h-14 w-14 items-center justify-center rounded-full border-[3px] ${f.shutterOuter}`}>
            <span className={`h-11 w-11 rounded-full ${f.shutterInner}`} />
          </span>
          <span className="relative flex items-end">
            <Zap className={`h-5 w-5 ${f.flashAuto ? 'text-yellow-300' : f.icons}`} />
            {f.flashAuto ? <span className="ml-0.5 text-[9px] font-black text-yellow-300">A</span> : null}
          </span>
        </motion.div>

        {/* filter name + swipe dots */}
        <div className="mt-2.5 flex flex-col items-center gap-1.5">
          <AnimatePresence mode="wait">
            <motion.span
              key={f.name}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3 }}
              className={`text-[12px] font-black uppercase tracking-[0.35em] ${f.label} [text-shadow:0_1px_8px_rgba(0,0,0,0.8)]`}
            >
              {f.name}
            </motion.span>
          </AnimatePresence>
          <div className="flex gap-1.5">
            {FILTERS.map((x, i) => (
              <span
                key={x.name}
                className={`h-1 rounded-full transition-all duration-300 ${
                  i === idx ? 'w-4 bg-white' : 'w-1 bg-white/35'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
