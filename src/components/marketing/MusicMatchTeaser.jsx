'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { SiSpotify } from 'react-icons/si';
import ScanLockNumber from '@/components/motion/ScanLockNumber';
import ReelPicker from '@/components/motion/ReelPicker';

const EASE = [0.16, 1, 0.3, 1];

/**
 * Music-based event matching teaser: dial in your mood and genre — two
 * slot-reels click-stop on a pick each, building a small profile — then that
 * profile tunes in to the match on the right (the DJ/night whose frequency
 * you land on). Right side: the match ring + card, no gimmick badges.
 */
const MOOD_OPTIONS = ['CHILL', 'HYPE', 'SENSUAL', 'LATE NIGHT', 'UNDERGROUND', 'HIGH ENERGY'];
const GENRE_OPTIONS = ['HOUSE', 'TECHNO', 'R&B', 'DANCEHALL', 'AMAPIANO', 'AFROBEATS'];
const FINAL_MOOD = 'LATE NIGHT';
const FINAL_GENRE = 'AFROBEATS'; // lands on the same genre as the matched night below

// Shared timeline: mood reel spins → locks, then genre reel spins → locks,
// then (and only then) the match on the right starts tuning in.
const MOOD_DELAY = 0.2;
const MOOD_SPIN = 0.95;
const GENRE_DELAY = MOOD_DELAY + MOOD_SPIN + 0.2;
const GENRE_SPIN = 0.95;
const MATCH_SCAN_DELAY = GENRE_DELAY + GENRE_SPIN + 0.35;
const MATCH_SCAN_DURATION = 0.95;

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

/* A profile pick, popping in the instant its reel locks. */
function ProfileChip({ label }) {
  return (
    <MotionDiv
      initial={{ opacity: 0, scale: 0.5, y: -6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.35, ease: EASE }}
      className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-[0_0_10px_rgba(255,255,255,0.15)]"
    >
      {label}
    </MotionDiv>
  );
}

/* The tuning instrument — stays sharp while it searches. Its ring breathes
 * gently (searching) until `locked`, then settles to the match arc; the
 * readout scrambles then locks to MATCH via ScanLockNumber, which flips
 * `locked` on the exact beat the arc settles. */
function MatchRing({ locked, onLock }) {
  const r = 24;
  const circ = 2 * Math.PI * r;
  const lockedOffset = circ * (1 - MATCH / 100);
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
          animate={
            locked
              ? { strokeDashoffset: lockedOffset }
              : { strokeDashoffset: [circ * 0.72, circ * 0.42] }
          }
          transition={
            locked
              ? { duration: 0.45, ease: EASE }
              : { duration: 1.6, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }
          }
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[10px] font-black leading-none text-white">
          <ScanLockNumber to={MATCH} delay={MATCH_SCAN_DELAY} scanDuration={MATCH_SCAN_DURATION} suffix="%" onLock={onLock} />
        </span>
        <span className="mt-0.5 text-[6px] font-bold uppercase tracking-[0.08em] text-zinc-300">match</span>
      </div>
    </div>
  );
}

const WAVE_BAR_COUNT = 7;
// A calm symmetric silhouette for the "resolved" state — the clean match waveform.
const CLEAN_WAVE_HEIGHTS = [6, 12, 18, 22, 18, 12, 6];

/* Replaces a static arrow: while searching, a noisy scrambling waveform
 * (random bar heights, fast); the instant the match locks, it resolves into
 * one clean, symmetric waveform — the "signal found" moment, in sync with
 * the match card and ring locking on the same beat. */
function SoundwaveConnector({ locked }) {
  const [scrambled, setScrambled] = useState(CLEAN_WAVE_HEIGHTS);

  useEffect(() => {
    if (locked) return;
    const interval = setInterval(() => {
      setScrambled(Array.from({ length: WAVE_BAR_COUNT }, () => 4 + Math.random() * 20));
    }, 110);
    return () => clearInterval(interval);
  }, [locked]);

  const heights = locked ? CLEAN_WAVE_HEIGHTS : scrambled;

  return (
    <div className="flex shrink-0 flex-col items-center gap-1.5" aria-hidden>
      <div
        className={`flex h-10 items-center justify-center gap-[3px] rounded-full px-3 shadow-[0_0_15px_rgba(255,255,255,0.15)] sm:h-12 ${
          locked ? 'bg-pxi-orange/20' : 'bg-white/10'
        }`}
      >
        {heights.map((h, i) => (
          <motion.span
            key={i}
            className={`w-[3px] rounded-full ${locked ? 'bg-pxi-orange' : 'bg-white/70'}`}
            animate={{ height: h }}
            transition={{ duration: locked ? 0.4 : 0.09, ease: locked ? EASE : 'linear' }}
          />
        ))}
      </div>
      <span className={`text-[8px] font-bold uppercase tracking-[0.14em] ${locked ? 'text-pxi-orange' : 'text-zinc-500'}`}>
        {locked ? 'matched' : 'tuning…'}
      </span>
    </div>
  );
}

/* The matched night: the readout instrument (ring + %) is always crisp and
 * actively scanning; the RESULT — the event photo + title — resolves from a
 * blurred/dim "searching" state into focus the instant the frequency locks,
 * with a quick glow bloom. `locked` is owned by the parent so the soundwave
 * connector resolves on the exact same beat. */
function MatchCard({ locked, onLock }) {
  const focus = locked
    ? { filter: 'blur(0px) brightness(1)' }
    : { filter: 'blur(7px) brightness(0.72)' };

  return (
    <MotionDiv
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.35, ease: EASE }}
      viewport={{ once: false }}
      className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-zinc-950 shadow-[0_0_30px_rgba(255,255,255,0.15)] text-left"
    >
      <div className="relative aspect-[16/9] sm:aspect-[4/3] w-full">
        <MotionDiv
          className="absolute inset-0"
          initial={{ filter: 'blur(7px) brightness(0.72)' }}
          animate={focus}
          transition={{ duration: 0.5, ease: EASE }}
        >
          <img
            src="/landing/assets/dj_afrobeats.jpg"
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover object-[center_20%]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
        </MotionDiv>
      </div>
      <div className="flex flex-col gap-1 p-3 sm:p-4 sm:pb-5">
        <MotionDiv initial={{ filter: 'blur(7px)' }} animate={locked ? { filter: 'blur(0px)' } : { filter: 'blur(7px)' }} transition={{ duration: 0.5, ease: EASE }}>
          <h4 className="text-[15px] sm:text-base font-black text-white leading-tight uppercase tracking-tight">Afrobeats &amp; Amapiano</h4>
          <p className="text-[10px] sm:text-[11px] text-zinc-400 mb-2 sm:mb-3">Old Port · Friday</p>
        </MotionDiv>

        <div className="flex items-center justify-center gap-3 bg-white/5 rounded-xl p-2">
          <MatchRing locked={locked} onLock={onLock} />
          <p className="text-[9px] sm:text-[10px] leading-snug text-zinc-300">
            Matches your<br />
            <span className="font-semibold text-white">Top Genres</span>
          </p>
        </div>
      </div>

      {/* lock glow bloom — one flash the moment the match locks */}
      <MotionDiv
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-2xl sm:rounded-3xl"
        initial={{ opacity: 0 }}
        animate={locked ? { opacity: [0, 0.7, 0] } : { opacity: 0 }}
        transition={{ duration: 0.6, times: [0, 0.3, 1], ease: 'easeOut' }}
        style={{ boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.9), 0 0 40px 6px rgba(240,31,255,0.45)' }}
      />
    </MotionDiv>
  );
}

export default function MusicMatchTeaser() {
  const sectionRef = useRef(null);
  const sectionInView = useInView(sectionRef, { margin: '-80px' });
  const [moodLocked, setMoodLocked] = useState(false);
  const [genreLocked, setGenreLocked] = useState(false);
  const [matchLocked, setMatchLocked] = useState(false);

  // The reels/ring/number each reset and replay on their own (see
  // ReelPicker/ScanLockNumber), but the chips + match-card "resolved" look
  // are owned here — reset them the moment the section leaves view so they
  // go back to "searching" and replay in sync with the reels on return.
  useEffect(() => {
    if (sectionInView) return;
    setMoodLocked(false);
    setGenreLocked(false);
    setMatchLocked(false);
  }, [sectionInView]);

  return (
    <MotionDiv
      ref={sectionRef}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, margin: '-80px' }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="mt-12 sm:mt-20 flex flex-col items-center text-center w-full"
    >
      {/* copy */}
      <div className="max-w-xl mb-6 sm:mb-12 flex flex-col items-center px-4">

        <h3 className="display-3 mt-4">
          <span className="text-neon-orange">Events</span> that <span className="text-neon-orange">sound</span> <span className="text-white">like you.</span>
        </h3>
        <p className="mt-4 text-sm leading-relaxed text-zinc-400">
          PXI reads what you play and matches you to the nights that play it back. Connect your Spotify to get started.
        </p>
      </div>

      {/* visual */}
      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-10 pb-6 sm:pb-12 w-full max-w-3xl justify-center">
        {/* dial in your mood + genre */}
        <div className="w-full max-w-[280px] sm:w-[270px]">
          <div className="mb-1.5 flex items-center justify-center gap-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">Your <span className="text-neon-orange">Music</span></p>
          </div>
          {/* This is the actual point of the section — connects to the real
              Spotify linking in account settings that powers the match score
              — so the brand mark leads, not a footnote caption. */}
          <div className="mb-3 flex items-center justify-center gap-2.5 sm:mb-4">
            <span className="flex items-center gap-2 rounded-full bg-[#1DB954]/15 px-3.5 py-2 ring-1 ring-[#1DB954]/40">
              <SiSpotify className="h-6 w-6 sm:h-7 sm:w-7" style={{ color: '#1ED760' }} />
              <span className="text-xs font-black uppercase tracking-wide text-white">Spotify</span>
            </span>
          </div>
          <p className="mb-2 text-center text-[9px] font-semibold uppercase tracking-[0.12em] text-zinc-500 sm:mb-3">
            Connect to build your profile
          </p>
          <div className="flex flex-col gap-3 rounded-2xl bg-white/[0.03] p-3 shadow-lg">
            <div>
              <p className="mb-1 pl-1 text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500">Mood</p>
              <ReelPicker
                options={MOOD_OPTIONS}
                finalValue={FINAL_MOOD}
                delay={MOOD_DELAY}
                spinDuration={MOOD_SPIN}
                onLock={() => setMoodLocked(true)}
              />
            </div>
            <div>
              <p className="mb-1 pl-1 text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500">Genre</p>
              <ReelPicker
                options={GENRE_OPTIONS}
                finalValue={FINAL_GENRE}
                delay={GENRE_DELAY}
                spinDuration={GENRE_SPIN}
                onLock={() => setGenreLocked(true)}
              />
            </div>

            {/* your profile — builds as each reel lands */}
            <div className="flex min-h-[26px] flex-wrap items-center justify-center gap-2 pt-1">
              {moodLocked ? <ProfileChip label={FINAL_MOOD} /> : null}
              {genreLocked ? <ProfileChip label={FINAL_GENRE} /> : null}
              {moodLocked && genreLocked ? <Equalizer color="var(--pxi-orange)" /> : null}
            </div>
          </div>
        </div>

        {/* connector: a scrambling waveform that resolves clean on lock */}
        <div className="my-2 sm:my-0">
          <SoundwaveConnector locked={matchLocked} />
        </div>

        {/* matched night */}
        <div className="w-full max-w-[260px] sm:w-[240px] shrink-0">
          <div className="mb-2 sm:mb-3 flex items-center justify-center gap-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">The Match</p>
          </div>
          <MatchCard locked={matchLocked} onLock={() => setMatchLocked(true)} />
        </div>
      </div>
    </MotionDiv>
  );
}
