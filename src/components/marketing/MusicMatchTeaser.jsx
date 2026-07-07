'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Eyebrow from './Eyebrow';

/**
 * Music-based event matching teaser. Left: what you play.
 * Right: the night that matches, with a match ring. Clean, aligned, no
 * gimmick badges.
 */
const ROTATION = [
  { artist: 'Afrobeats & Dancehall', genre: 'Global Grooves', color: 'var(--pxi-orange)' },
  { artist: 'R&B / Soul Classics', genre: 'Smooth Vibes', color: 'var(--pxi-purple)' },
  { artist: 'Underground Techno', genre: 'Late Night', color: '#8b5cf6' },
  { artist: 'Pop & Throwbacks', genre: 'High Energy', color: 'var(--color-pxi-pink)' },
  { artist: 'Deep House', genre: 'Synths & Bass', color: 'var(--color-pxi-orange-soft)' },
];

const MATCH = 92;
const MotionCircle = motion.circle;
const MotionDiv = motion.div;

function Equalizer({ color = '#ffffff' }) {
  return (
    <span className="flex h-4 items-end gap-[2.5px]" aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className="eq-bar w-[3px] rounded-full"
          style={{ height: `${8 + (i % 3) * 4}px`, animationDelay: `${i * 130}ms`, backgroundColor: color }}
        />
      ))}
    </span>
  );
}

/* Album cover sleeve with a vinyl record spinning out of it */
function GenreDisc({ color }) {
  return (
    <span className="relative flex h-9 w-12 sm:h-10 sm:w-14 shrink-0 items-center">
      {/* Vinyl record (spinning, protruding from the right) */}
      <MotionDiv
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        className="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-zinc-900 shadow-sm flex items-center justify-center overflow-hidden"
      >
        {/* Vinyl grooves */}
        <div className="absolute inset-0 rounded-full border border-zinc-700/50 scale-75" />
        <div className="absolute inset-0 rounded-full border border-zinc-700/50 scale-50" />
        {/* Inner label */}
        <div className="h-3.5 w-3.5 rounded-full flex items-center justify-center z-10" style={{ backgroundColor: color }}>
           <div className="h-1 w-1 bg-zinc-900 rounded-full" />
        </div>
      </MotionDiv>
      
      {/* Album cover sleeve (square, overlapping the record) */}
      <div 
        className="relative z-10 h-full aspect-square rounded-md shadow-[2px_0_8px_rgba(0,0,0,0.5)] flex items-center justify-center border border-white/20"
        style={{ background: `linear-gradient(135deg, ${color} 0%, rgba(0,0,0,0.4) 150%)` }}
      >
         <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-white drop-shadow-md">
           <path d="M9 18V5l12-2v13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
           <circle cx="6" cy="18" r="3" />
           <circle cx="18" cy="16" r="3" />
         </svg>
      </div>
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
        <MotionCircle
          cx="30"
          cy="30"
          r={r}
          fill="none"
          stroke="#ffffff"
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
        <span className="text-[10px] font-black leading-none text-white">{MATCH}%</span>
        <span className="mt-0.5 text-[6px] font-bold uppercase tracking-[0.08em] text-zinc-300">match</span>
      </div>
    </div>
  );
}

export default function MusicMatchTeaser() {
  return (
    <MotionDiv
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="mt-12 sm:mt-20 flex flex-col items-center text-center w-full"
    >
      {/* copy */}
      <div className="max-w-xl mb-6 sm:mb-12 flex flex-col items-center px-4">
        <Eyebrow>Live now</Eyebrow>
        <h3 className="display-3 mt-4">
          <span className="text-neon-orange">Events</span> that <span className="text-neon-orange">sound</span> <span className="text-white">like you.</span>
        </h3>
        <p className="mt-4 text-sm leading-relaxed text-zinc-400">
          PXI reads what you play and matches you to the nights that play it back. Connect your Spotify or Apple Music to get started.
        </p>
      </div>

      {/* visual */}
      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-10 pb-6 sm:pb-12 w-full max-w-3xl justify-center">
        {/* your rotation */}
        <div className="w-full max-w-[280px] sm:w-[270px]">
          <div className="mb-2 sm:mb-3 flex items-center justify-center gap-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">Your <span className="text-neon-orange">Music</span></p>
          </div>
          <div className="flex flex-col gap-1.5 sm:gap-2 relative">
             <div className="absolute -inset-4 bg-white/[0.01] rounded-3xl blur-xl" />
            {ROTATION.map((row, idx) => (
              <MotionDiv
                key={row.artist}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + idx * 0.1 }}
                viewport={{ once: true }}
                className="relative flex items-center gap-2.5 sm:gap-3 rounded-xl bg-white/[0.04] px-2.5 py-2 sm:px-3 sm:py-2.5 shadow-lg backdrop-blur-md"
              >
                <GenreDisc color={row.color} />
                <div className="min-w-0 flex-1 text-left">
                  <p className="truncate text-[13px] sm:text-sm font-semibold text-white leading-tight">{row.artist}</p>
                  <p className="text-[9px] sm:text-[10px] uppercase tracking-wider text-zinc-500 mt-0.5">{row.genre}</p>
                </div>
                <Equalizer color={row.color} />
              </MotionDiv>
            ))}
          </div>
        </div>

        {/* connector with animation */}
        <div className="flex shrink-0 items-center justify-center rotate-90 sm:rotate-0 my-2 sm:my-0" aria-hidden>
           <MotionDiv
              animate={{ x: [0, 8, 0], scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-white/20 shadow-[0_0_15px_rgba(255,255,255,0.3)]"
           >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="sm:w-6 sm:h-6">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
           </MotionDiv>
        </div>

        {/* matched night */}
        <div className="w-full max-w-[260px] sm:w-[240px] shrink-0">
          <div className="mb-2 sm:mb-3 flex items-center justify-center gap-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">The Match</p>
          </div>
          <MotionDiv 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, type: 'spring' }}
            viewport={{ once: true }}
            className="overflow-hidden rounded-2xl sm:rounded-3xl bg-zinc-950 shadow-[0_0_30px_rgba(255,255,255,0.15)] relative text-left"
          >

            
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
          </MotionDiv>
        </div>
      </div>
    </MotionDiv>
  );
}
