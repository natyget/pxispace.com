'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, useInView } from 'framer-motion';
import { HugeiconsIcon } from '@hugeicons/react';
import CountUpNumber from '@/components/motion/CountUpNumber';
import {
  Calendar01Icon,
  Cancel01Icon,
  Location01Icon,
  QrCodeIcon,
  Tick02Icon,
  Ticket01Icon,
  Comment01Icon,
  Camera01Icon,
  Search01Icon,
} from '@hugeicons/core-free-icons';

const MotionDiv = motion.div;

/**
 * Animated three-beat demo of getting into a night: discover the event,
 * see who's going and join, ticket in hand. Auto-cycles; decorative only.
 *
 * Stage 1 mirrors the real EventCard (src/views/events/EventCard.jsx),
 * stage 2 mirrors EventPreviewModal, stage 3 borrows the ticket-tier row,
 * orange album pill and pxi-orange-pill CTA from EventDetailClient /
 * EventDetailBottomBar. Those components pull in next/navigation, so their
 * class recipes are replicated here verbatim instead of imported.
 */
const COVER = '/landing/assets/media__1782968979326.jpg';
const PROFILES = [
  '/landing/album/thread/profiles/baba.jpg',
  '/landing/album/thread/profiles/gift.jpg',
  '/landing/album/thread/profiles/kevin.jpg',
  '/landing/album/thread/profiles/trina.jpg',
];

const STAGE_MS = [4500, 4800, 6000];
const STAGES = ['Spot it', 'See who’s going', 'You’re in'];
const LINEUP = ['DJ Sanaa', 'Kojo B2B Femi', 'Amapiano room'];

/* Guest list preview row — exact avatar recipe from EventDetailClient
   (size-8, border-2 border-[#0a0a0a], ring-1 ring-white/10, -space-x-2). */
function GuestRow() {
  return (
    <div className="flex flex-row items-center justify-between gap-3">
      <div className="flex min-w-0 flex-row items-center gap-3">
        <div className="flex shrink-0 -space-x-2">
          {PROFILES.map((src, i) => (
            <span
              key={src}
              className="relative inline-flex size-8 items-center justify-center overflow-hidden rounded-full bg-zinc-800"
              style={{ zIndex: PROFILES.length - i }}
            >
              <img src={src} alt="" aria-hidden className="size-full object-cover" />
            </span>
          ))}
          <span className="inline-flex size-8 items-center justify-center rounded-full bg-white/5 text-[11px] font-semibold text-zinc-200">
            +38
          </span>
        </div>
        <p className="text-sm font-medium leading-5 text-zinc-200">
          <span className="text-white">42</span> on the guest list
        </p>
      </div>
      <span className="inline-flex h-7 shrink-0 items-center justify-center gap-2 rounded-full bg-[var(--pxi-orange)]/15 px-3 text-xs font-medium text-[var(--pxi-orange)]">
        Guestlist
      </span>
    </div>
  );
}

/* Stage 1 — the discovery card, mirroring EventCard.jsx class for class. */
function StageSpot() {
  return (
    <div className="h-full w-full relative overflow-hidden bg-zinc-900">
      <img
        src={COVER}
        alt=""
        aria-hidden
        className="h-full w-full object-cover object-[75%_center]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

      {/* Taste match top-right */}
      <div className="absolute right-4 top-4 z-20 flex items-center rounded-full bg-black/40 px-2.5 py-1.5 backdrop-blur-sm">
        <span className="text-[9px] font-black uppercase tracking-[0.14em] text-white">
          <CountUpNumber to={92} duration={0.9} suffix="% Match" />
        </span>
      </div>

      {/* Bottom overlay: time / title / location */}
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-zinc-300">Fri · 10 PM</p>
        <h3 className="mb-1 text-2xl font-black uppercase leading-none tracking-tighter text-white">
          NUIT TROPICALE
        </h3>
        <p className="text-sm font-bold text-zinc-300">Old Port</p>
      </div>
    </div>
  );
}

/* Stage 2 — the event preview, mirroring EventPreviewModal.jsx:
   cover with from-zinc-950 gradient + close chip, then status eyebrow,
   title, purple-icon meta rows, guest list, lineup line, CTA pair. */
function StageJoin() {
  return (
    <div className="h-full w-full flex flex-col bg-zinc-950">
      <div className="relative h-[270px] w-full shrink-0">
        <img src={COVER} alt="" aria-hidden className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent" />
        <span className="absolute right-4 top-4 rounded-full bg-black/50 p-2 text-white">
          <HugeiconsIcon icon={Cancel01Icon} size={20} />
        </span>
      </div>

      <div className="flex flex-1 flex-col justify-end space-y-4 p-8 pt-2 pb-10">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-pxi-purple">Selling fast</p>
          <h2 className="text-2xl font-black uppercase leading-tight tracking-tighter text-white">NUIT TROPICALE</h2>
          <div className="mt-3 flex flex-row flex-wrap items-center gap-4 text-[13px] text-zinc-400">
            <span className="flex items-center gap-2">
              <HugeiconsIcon icon={Calendar01Icon} size={16} className="shrink-0 text-pxi-purple" />
              Fri · 10 PM
            </span>
            <span className="flex items-center gap-2">
              <HugeiconsIcon icon={Location01Icon} size={16} className="shrink-0 text-pxi-purple" />
              Old Port
            </span>
          </div>
        </div>

        <div className="flex flex-row items-center justify-between gap-3">
          <div className="flex shrink-0 -space-x-2">
            {PROFILES.map((src, i) => (
              <span
                key={src}
                className="relative inline-flex size-8 items-center justify-center overflow-hidden rounded-full bg-zinc-800"
                style={{ zIndex: PROFILES.length - i }}
              >
                <img src={src} alt="" aria-hidden className="size-full object-cover" />
              </span>
            ))}
            <span className="inline-flex size-8 items-center justify-center rounded-full bg-white/5 text-[11px] font-semibold text-zinc-200">
              +38
            </span>
          </div>
          <span className="inline-flex h-7 shrink-0 items-center justify-center gap-2 rounded-full bg-[var(--pxi-orange)]/15 px-3 text-xs font-medium text-[var(--pxi-orange)]">
            Guestlist
          </span>
        </div>

        <p className="text-xs leading-relaxed text-zinc-500">{LINEUP.join(' · ')}</p>

        <div className="mt-auto pt-2 flex flex-col gap-2">
          <div className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[var(--pxi-orange)] px-4 py-3 text-sm font-black uppercase tracking-widest text-white shadow-[0_0_15px_var(--pxi-orange)]">
            <HugeiconsIcon icon={Ticket01Icon} size={16} />
            Get Ticket
          </div>
        </div>
      </div>
    </div>
  );
}

function StageTicket() {
  return (
    <div className="h-full w-full flex flex-col bg-zinc-950">
      <div className="relative h-[148px] w-full shrink-0 overflow-hidden">
        <img src={COVER} alt="" aria-hidden className="h-full w-full object-cover object-[75%_center]" />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/35 to-transparent" />
        <div className="absolute left-5 bottom-5 flex items-center gap-2 rounded-full bg-emerald-400/15 px-3 py-1.5 text-emerald-200 ring-1 ring-emerald-300/20">
          <HugeiconsIcon icon={Tick02Icon} size={15} />
          <span className="text-[10px] font-black uppercase tracking-[0.16em]">Ticket secured</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col px-5 pt-3 pb-4">
        <MotionDiv initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}>
          <h2 className="text-3xl font-black uppercase tracking-tighter text-white">You're in.</h2>
          <p className="mt-1 text-sm font-medium text-zinc-400">Your pass, thread, and memory tools are ready.</p>
        </MotionDiv>

        <div className="mt-3 space-y-2">
          {[
            { icon: QrCodeIcon, label: 'Entry pass', value: 'Ready at the door' },
            { icon: Camera01Icon, label: 'Shared camera', value: 'Shoot into one thread' },
            { icon: Search01Icon, label: 'Find yourself', value: 'Face scan after the night' },
          ].map((row, index) => (
            <MotionDiv
              key={row.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 + index * 0.05, duration: 0.18 }}
              className="flex items-center gap-3 rounded-2xl bg-white/[0.045] px-4 py-2 ring-1 ring-white/[0.06]"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-white">
                <HugeiconsIcon icon={row.icon} size={19} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[11px] font-black uppercase tracking-[0.16em] text-white">{row.label}</span>
                <span className="mt-0.5 block truncate text-xs font-medium text-zinc-500">{row.value}</span>
              </span>
              <HugeiconsIcon icon={Tick02Icon} size={16} className="text-emerald-300" />
            </MotionDiv>
          ))}
        </div>

        <MotionDiv initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24, duration: 0.2 }} className="mt-auto pt-3">
          <div className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--pxi-orange)] px-4 py-3 text-[15px] font-black uppercase tracking-widest text-white shadow-[0_0_15px_var(--pxi-orange)]">
            Open Thread
            <HugeiconsIcon icon={Comment01Icon} size={17} />
          </div>
        </MotionDiv>
      </div>
    </div>
  );
}

const STAGE_VIEWS = [StageSpot, StageJoin, StageTicket];
// The cut, not a slide: stage changes happen behind a held black frame — the
// card swaps while hidden, then the black lifts on the new stage. Reads like
// a shutter closing between shots rather than a carousel dragging sideways.
const BLACKOUT_MS = 150;

export default function DiscoveryFlow() {
  const [stage, setStage] = useState(0);
  const [blackout, setBlackout] = useState(false);
  const touchRef = useRef(null);
  const pendingRef = useRef(null);
  const cardRef = useRef(null);
  // The auto-advance clock only starts once this card is actually on screen —
  // otherwise "Spot it" can burn most of its 4.5s while still off-screen
  // during scroll, and swap the instant the user arrives.
  const isInView = useInView(cardRef, { margin: '-10% 0px -10% 0px' });

  const goToStage = useCallback((next) => {
    if (next === stage || pendingRef.current !== null) return;
    pendingRef.current = next;
    setBlackout(true);
    setTimeout(() => {
      setStage(pendingRef.current);
      // Small extra beat so the new stage is fully mounted before the cut lifts.
      setTimeout(() => {
        setBlackout(false);
        pendingRef.current = null;
      }, 40);
    }, BLACKOUT_MS);
  }, [stage]);

  useEffect(() => {
    // Not on screen yet (or scrolled away) — don't burn the clock, and don't
    // let a stale timer fire while it's out of view. Becoming visible always
    // starts a fresh full-length countdown for the current stage.
    if (!isInView) return;
    const id = setTimeout(() => {
      goToStage((stage + 1) % STAGES.length);
    }, STAGE_MS[stage]);
    return () => clearTimeout(id);
  }, [stage, goToStage, isInView]);

  const handleTouchStart = useCallback((e) => {
    touchRef.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback((e) => {
    if (touchRef.current === null) return;
    const diff = touchRef.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0 && stage < STAGES.length - 1) {
        goToStage(stage + 1);
      } else if (diff < 0 && stage > 0) {
        goToStage(stage - 1);
      }
    }
    touchRef.current = null;
  }, [stage, goToStage]);

  const View = STAGE_VIEWS[stage];

  return (
    <div className="mx-auto w-full max-w-[380px]">
      {/* Floating card frame, mirroring EventPreviewModal's dialog shell */}
      <div
        ref={cardRef}
        className="relative h-[540px] overflow-hidden rounded-[2rem] bg-zinc-950 shadow-2xl touch-pan-y"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <View />
        <MotionDiv
          aria-hidden
          className="pointer-events-none absolute inset-0 z-30 bg-black"
          initial={{ opacity: 0 }}
          animate={{ opacity: blackout ? 1 : 0 }}
          transition={{ duration: BLACKOUT_MS / 1000, ease: 'easeInOut' }}
        />
      </div>

      {/* stage indicator */}
      <div className="mt-4 flex items-center justify-center gap-4">
        {STAGES.map((label, i) => (
          <button
            key={label}
            type="button"
            onClick={() => goToStage(i)}
            className={`text-[10px] font-bold uppercase tracking-[0.18em] transition-colors ${
              i === stage ? 'text-white' : 'text-zinc-600 hover:text-zinc-400'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
