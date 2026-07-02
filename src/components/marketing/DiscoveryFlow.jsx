'use client';

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Calendar01Icon,
  Cancel01Icon,
  FavouriteIcon,
  Location01Icon,
  QrCodeIcon,
  Tick02Icon,
  Ticket01Icon,
  Comment01Icon,
  Camera01Icon,
  Gif01Icon,
  Search01Icon,
} from '@hugeicons/core-free-icons';
import Button from '@/components/ui/Button';

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
              className="relative inline-flex size-8 items-center justify-center overflow-hidden rounded-full border-2 border-[#0a0a0a] bg-zinc-800 ring-1 ring-white/10"
              style={{ zIndex: PROFILES.length - i }}
            >
              <img src={src} alt="" aria-hidden className="size-full object-cover" />
            </span>
          ))}
          <span className="inline-flex size-8 items-center justify-center rounded-full border-2 border-[#0a0a0a] bg-white/5 text-[11px] font-semibold text-zinc-200 ring-1 ring-white/10">
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
    <div className="h-[530px] w-full relative overflow-hidden bg-zinc-900">
      <img
        src={COVER}
        alt=""
        aria-hidden
        className="h-full w-full object-cover object-[75%_center]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

      {/* Taste match top-right */}
      <div className="absolute right-4 top-4 z-20 flex items-center rounded-full bg-black/40 px-3 py-1.5 backdrop-blur-sm">
        <span className="text-[10px] font-black uppercase tracking-widest text-white">92% Match</span>
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
    <div className="h-[530px] w-full flex flex-col bg-zinc-950">
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
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05, delayChildren: 0 }
    }
  };

  const item = {
    hidden: { opacity: 0, scale: 0.8, y: 15 },
    show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 350, damping: 25 } }
  };

  return (
    <div className="h-[530px] w-full p-6 flex flex-col bg-zinc-950 relative overflow-hidden">
      
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }} className="pt-8 pb-2 text-center">
        <h2 className="text-3xl font-black uppercase tracking-tighter text-white">You're in.</h2>
        <p className="text-base font-medium text-zinc-400 mt-2">The night is yours. Do it all.</p>
      </motion.div>

      {/* Clean Actions Dock */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="flex-1 flex flex-col items-center justify-center space-y-6 mt-4"
      >
        <div className="flex flex-row justify-center gap-10">
          <motion.div variants={item} className="flex flex-col items-center gap-2">
            <span className="flex size-[56px] items-center justify-center rounded-full bg-[rgba(42,42,42,0.8)] text-white shadow-lg">
              <HugeiconsIcon icon={FavouriteIcon} size={28} />
            </span>
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-1">React</span>
          </motion.div>
          <motion.div variants={item} className="flex flex-col items-center gap-2">
            <span className="flex size-[56px] items-center justify-center rounded-full bg-[rgba(42,42,42,0.8)] text-white shadow-lg">
              <HugeiconsIcon icon={Comment01Icon} size={28} />
            </span>
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-1">Comment</span>
          </motion.div>
        </div>
        
        <div className="flex flex-row justify-center gap-10">
          <motion.div variants={item} className="flex flex-col items-center gap-2">
            <span className="flex size-[56px] items-center justify-center rounded-full bg-[rgba(42,42,42,0.8)] text-white shadow-lg">
              <HugeiconsIcon icon={Camera01Icon} size={28} />
            </span>
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-1">Upload</span>
          </motion.div>
          <motion.div variants={item} className="flex flex-col items-center gap-2">
            <span className="flex size-[56px] items-center justify-center rounded-full bg-[rgba(42,42,42,0.8)] text-white shadow-lg">
              <HugeiconsIcon icon={Gif01Icon} size={28} />
            </span>
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-1">Chat & Gif</span>
          </motion.div>
        </div>

        <motion.div variants={item} className="flex flex-row items-center justify-center gap-2 rounded-full bg-[rgba(42,42,42,0.8)] px-6 py-3 mt-4 shadow-lg">
          <HugeiconsIcon icon={Search01Icon} size={20} className="text-white" />
          <span className="text-[11px] font-black text-white uppercase tracking-widest">Find yourself</span>
        </motion.div>
      </motion.div>

      {/* Button */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.2 }} className="mt-auto pt-6 pb-2">
        <div className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--pxi-orange)] px-4 py-4 text-[15px] font-black uppercase tracking-widest text-white shadow-[0_0_15px_var(--pxi-orange)]">
          Open Thread
        </div>
      </motion.div>
    </div>
  );
}

const STAGE_VIEWS = [StageSpot, StageJoin, StageTicket];

export default function DiscoveryFlow() {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const id = setTimeout(() => setStage((s) => (s + 1) % STAGES.length), STAGE_MS[stage]);
    return () => clearTimeout(id);
  }, [stage]);

  const View = STAGE_VIEWS[stage];

  return (
    <div className="mx-auto w-full max-w-[380px]">
      {/* Floating card frame, mirroring EventPreviewModal's dialog shell */}
      <div className="h-[530px] overflow-hidden rounded-[2rem] bg-zinc-950 shadow-2xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={stage}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="h-full w-full"
          >
            <View />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* stage indicator */}
      <div className="mt-4 flex items-center justify-center gap-4">
        {STAGES.map((label, i) => (
          <button
            key={label}
            type="button"
            onClick={() => setStage(i)}
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
