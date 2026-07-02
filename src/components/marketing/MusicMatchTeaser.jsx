'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Eyebrow from './Eyebrow';

/**
 * Coming-soon teaser for music-based event matching. Left: what you play.
 * Right: the night that matches, with a match ring. Clean, aligned, no
 * gimmick badges.
 */
const ROTATION = [
  { artist: 'Afrobeats & Dancehall', genre: 'Global Grooves' },
  { artist: 'R&B / Soul Classics', genre: 'Smooth Vibes' },
  { artist: 'Underground Techno', genre: 'Late Night' },
  { artist: 'Pop & Throwbacks', genre: 'High Energy' },
  { artist: 'Deep House', genre: 'Synths & Bass' },
];

const MATCH = 92;

function Equalizer({ tone = 'bg-pxi-purple' }) {
  return (
    <span className="flex h-4 items-end gap-[2.5px]" aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className={`eq-bar w-[3px] rounded-full ${tone}`}
          style={{ height: `${8 + (i % 3) * 4}px`, animationDelay: `${i * 130}ms` }}
        />
      ))}
    </span>
  );
}

function MatchRing() {
  const r = 24;
  const circ = 2 * Math.PI * r;
  return (
    <div className="relative h-14 w-14 shrink-0">
      <svg viewBox="0 0 60 60" className="h-full w-full -rotate-90">
        <circle cx="30" cy="30" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
        <motion.circle
          cx="30"
          cy="30"
          r={r}
          fill="none"
          stroke="var(--pxi-purple)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          whileInView={{ strokeDashoffset: circ * (1 - MATCH / 100) }}
          viewport={{ once: true }}
          transition={{ duration: 1.4, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xs font-black text-white leading-none">{MATCH}%</span>
        <span className="text-[7px] font-bold uppercase tracking-[0.1em] text-zinc-500 mt-0.5">match</span>
      </div>
    </div>
  );
}

export default function MusicMatchTeaser() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="mt-12 sm:mt-20 flex flex-col items-center text-center w-full"
    >
      {/* copy */}
      <div className="max-w-xl mb-6 sm:mb-12 flex flex-col items-center px-4">
        <Eyebrow>Coming soon</Eyebrow>
        <h3 className="display-3 mt-4">
          Events that <span className="text-white">sound like you.</span>
        </h3>
        <p className="mt-4 text-sm leading-relaxed text-zinc-400">
          PXI reads what you play and matches you to the nights that play it back. Connect your Spotify or Apple Music to get started.
        </p>
      </div>

      {/* visual */}
      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-10 pb-6 sm:pb-12 w-full max-w-3xl justify-center">
        {/* your rotation */}
        <div className="w-full max-w-[260px] sm:w-[240px]">
          <div className="mb-2 sm:mb-3 flex items-center justify-center gap-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">Your Rotation</p>
          </div>
          <div className="flex flex-col gap-1.5 sm:gap-2 relative">
             <div className="absolute -inset-4 bg-white/[0.01] rounded-3xl blur-xl" />
            {ROTATION.map((row, idx) => (
              <motion.div
                key={row.artist}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + idx * 0.1 }}
                viewport={{ once: true }}
                className="relative flex items-center justify-between gap-2 sm:gap-3 rounded-xl bg-white/[0.04] px-3 py-2 sm:px-4 sm:py-3 shadow-lg backdrop-blur-md"
              >
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 text-left">
                  <div className="min-w-0">
                    <p className="truncate text-[13px] sm:text-sm font-semibold text-white leading-tight">{row.artist}</p>
                    <p className="text-[9px] sm:text-[10px] uppercase tracking-wider text-zinc-500 mt-0.5">{row.genre}</p>
                  </div>
                </div>
                <Equalizer tone="bg-white" />
              </motion.div>
            ))}
          </div>
        </div>

        {/* connector with animation */}
        <div className="flex shrink-0 items-center justify-center rotate-90 sm:rotate-0 my-2 sm:my-0" aria-hidden>
           <motion.div
              animate={{ x: [0, 8, 0], scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-white/20 shadow-[0_0_15px_rgba(255,255,255,0.3)]"
           >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="sm:w-6 sm:h-6">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
           </motion.div>
        </div>

        {/* matched night */}
        <div className="w-full max-w-[260px] sm:w-[240px] shrink-0">
          <div className="mb-2 sm:mb-3 flex items-center justify-center gap-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">The Match</p>
          </div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, type: 'spring' }}
            viewport={{ once: true }}
            className="overflow-hidden rounded-2xl sm:rounded-3xl bg-zinc-950 shadow-[0_0_30px_rgba(255,255,255,0.15)] relative text-left"
          >
            <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 rounded-full bg-black/60 px-2 py-1 backdrop-blur-md">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-500"></span>
                </span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-white">Perfect</span>
            </div>
            
            <div className="relative aspect-[16/9] sm:aspect-[4/3] w-full">
              <img
                src="/landing/assets/dj_afrobeats.jpg"
                alt=""
                aria-hidden
                className="absolute inset-0 h-full w-full object-cover object-[center_20%]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
            </div>
            <div className="flex flex-col gap-1 p-3 sm:p-4 sm:pb-5">
              <h4 className="text-[15px] sm:text-base font-black text-white leading-tight uppercase tracking-tight">Afrobeats & Amapiano</h4>
              <p className="text-[10px] sm:text-[11px] text-zinc-400 mb-2 sm:mb-3">Old Port · Friday</p>
              
              <div className="flex items-center justify-center gap-3 bg-white/5 rounded-xl p-2">
                <MatchRing />
                <p className="text-[9px] sm:text-[10px] leading-snug text-zinc-300">
                  Matches your<br />
                  <span className="font-semibold text-white">Top Genres</span>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
