'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { QrCode } from 'lucide-react';
import SectionShell from '@/components/marketing/SectionShell';
import FlashDevelopPhoto from '@/components/motion/FlashDevelopPhoto';

/**
 * The whole product in three beats, each with a small visual — and together
 * they play as ONE sequence, not three independent loops: the ticket prints
 * left→right, then the cameras fire in order, and the last three camera
 * flashes are the exact moments the three polaroids below are shot — each
 * one then develops (at its own speed) while its reaction bubbles land.
 */

// ---- shared timeline (seconds from the row entering view) ----------------
const TICKET_PRINT = { delay: 0, duration: 0.85 };
const CAMERA_FLASH_DELAYS = [0.95, 1.2, 1.5, 1.8, 2.1];
const POLAROID_FLASH = [
  { delay: CAMERA_FLASH_DELAYS[2], flashHold: 0.16, toBlack: 0.2, develop: 0.9 }, // background — quickest
  { delay: CAMERA_FLASH_DELAYS[3], flashHold: 0.22, toBlack: 0.28, develop: 1.25 }, // "take me back"
  { delay: CAMERA_FLASH_DELAYS[4], flashHold: 0.3, toBlack: 0.36, develop: 1.6 }, // "we look so good" — slowest, most dramatic
];
const developStartOf = (p) => p.delay + 0.08 + p.flashHold + p.toBlack + 0.03;
const bubbleDelayOf = (p, frac = 0.4) => developStartOf(p) + p.develop * frac;

// Zigzag ticket silhouette (left/right toothed edges, straight top/bottom) —
// same shape language as the platform section's ticket, so this reads as the
// same object at a smaller scale.
function zigzagPolygon(teeth = 9, inset = 2.4) {
  const pts = [`${inset}% 0%`, `${100 - inset}% 0%`];
  for (let i = 0; i < teeth * 2; i += 1) {
    const x = i % 2 === 0 ? 100 : 100 - inset;
    pts.push(`${x}% ${((i + 1) / (teeth * 2)) * 100}%`);
  }
  pts.push(`${100 - inset}% 100%`, `${inset}% 100%`);
  for (let i = teeth * 2 - 1; i >= 0; i -= 1) {
    const x = i % 2 === 0 ? 0 : inset;
    pts.push(`${x}% ${((i + 1) / (teeth * 2)) * 100}%`);
  }
  return `polygon(${pts.join(', ')})`;
}
const TICKET_CLIP = zigzagPolygon();

function TicketVisual() {
  return (
    <div className="flex h-24 items-center justify-center" aria-hidden>
      {/* "Prints" left to right out of a slot — the zigzag edge appears
          tooth by tooth as the wipe crosses it. */}
      <motion.div
        className="relative w-56"
        style={{ filter: 'drop-shadow(0 10px 22px rgba(0,0,0,0.5))' }}
        initial={{ clipPath: 'inset(0 100% 0 0)' }}
        whileInView={{ clipPath: 'inset(0 0% 0 0)' }}
        viewport={{ once: false, margin: '-60px' }}
        transition={{ duration: TICKET_PRINT.duration, delay: TICKET_PRINT.delay, ease: [0.16, 1, 0.3, 1] }}
      >
        <div
          className="p-[2px]"
          style={{ clipPath: TICKET_CLIP, background: 'linear-gradient(90deg, var(--pxi-purple), var(--pxi-orange))' }}
        >
          <div className="relative flex bg-[#0d0d10]" style={{ clipPath: TICKET_CLIP }}>
            <div className="min-w-0 flex-1 p-4 pl-5">
              <p className="text-[7px] font-black uppercase tracking-[0.2em] text-pxi-purple">PXI Ticket</p>
              <p className="mt-1 text-sm font-black text-white">NUIT TROPICALE</p>
              <div className="mt-1.5 flex gap-2 text-[9px] text-zinc-400">
                <span>Fri 10PM</span>
                <span>·</span>
                <span>GA</span>
              </div>
            </div>
            <div className="relative flex w-14 shrink-0 items-center justify-center border-l border-dashed border-white/15">
              <QrCode className="h-7 w-7 text-white/90" />
            </div>
            <div className="pointer-events-none absolute inset-1 rounded-sm border border-dashed border-white/10" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function CameraPill({ colorClass, offsetClass, zIndex, hasFlash, stripeColor, flashDelay = 0 }) {
  return (
    // "Fire in order": each camera pops a brightness flash in sequence.
    // Filter-only (no boxShadow keyframes) — cheaper to animate, still reads
    // as a flash via the brightness spike alone.
    <motion.div
      className={`absolute ${offsetClass} ${zIndex} flex h-14 w-20 items-center justify-center rounded-xl shadow-xl backdrop-blur-md overflow-hidden ${colorClass} transition-transform`}
      initial={{ filter: 'brightness(1)' }}
      whileInView={{ filter: ['brightness(1)', 'brightness(2.6)', 'brightness(1)'] }}
      viewport={{ once: false, margin: '-60px 0px -60px 0px' }}
      transition={{ duration: 0.42, delay: flashDelay, times: [0, 0.3, 1], ease: 'easeOut' }}
    >
      {stripeColor && (
        <div className={`absolute left-0 right-0 top-[26px] h-1.5 ${stripeColor}`} />
      )}
      <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-black/80 shadow-inner z-10">
        <div className="h-4 w-4 rounded-full border border-white/10 bg-zinc-800" />
      </div>
      {hasFlash === 'high' ? (
        <div className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-white shadow-[0_0_20px_8px_rgba(255,255,255,1)] z-10" />
      ) : hasFlash === 'normal' ? (
        <div className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_8px_2px_rgba(255,255,255,0.8)] z-10" />
      ) : (
        <div className="absolute right-2 top-2 h-1 w-1 rounded-full bg-white/30 z-10" />
      )}
    </motion.div>
  );
}

function CameraVisual() {
  return (
    <div className="flex h-24 items-center justify-center relative" aria-hidden>
      {/* Far Left: Noir (B&W) */}
      <CameraPill
        flashDelay={CAMERA_FLASH_DELAYS[0]}
        colorClass="bg-black"
        offsetClass="-translate-x-20 -rotate-12 scale-75"
        zIndex="z-10"
      />
      {/* Mid Left: Retro (Orange/Warm) */}
      <CameraPill
        flashDelay={CAMERA_FLASH_DELAYS[1]}
        colorClass="bg-gradient-to-r from-[#5a2c1a] via-[#8a4a2b] to-[#d9955f]"
        offsetClass="-translate-x-10 -rotate-6 scale-90"
        zIndex="z-20"
      />
      {/* Center: Snap — captures the background polaroid */}
      <CameraPill
        flashDelay={CAMERA_FLASH_DELAYS[2]}
        colorClass="bg-[#1c120a] shadow-[0_0_26px_rgba(255,120,40,0.45)]"
        stripeColor="bg-pxi-orange"
        offsetClass="translate-x-0 rotate-0 scale-100"
        zIndex="z-30"
        hasFlash="normal"
      />
      {/* Mid Right — captures "take me back" */}
      <CameraPill
        flashDelay={CAMERA_FLASH_DELAYS[3]}
        colorClass="bg-[#101408]/90"
        offsetClass="translate-x-10 rotate-6 scale-90"
        zIndex="z-20"
        hasFlash={false}
      />
      {/* Far Right: Dispo — captures "we look so good" */}
      <CameraPill
        flashDelay={CAMERA_FLASH_DELAYS[4]}
        colorClass="bg-[#6f9f7c]"
        stripeColor="bg-red-500"
        offsetClass="translate-x-20 rotate-12 scale-75"
        zIndex="z-10"
      />
    </div>
  );
}

function ReactionBubble({ delay, className, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.6 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: false, margin: '-60px' }}
      transition={{ duration: 0.32, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function MorningVisual() {
  const [bg, img1, img2] = POLAROID_FLASH;
  return (
    <div className="flex h-24 items-center justify-center overflow-visible" aria-hidden>
      <div className="relative h-[240px] w-[240px] origin-center scale-[0.55] -mt-2">
        {/* Image 3 (Background) — shot by the center "Snap" camera */}
        <div className="absolute right-[-45px] top-4 z-0 w-32 rotate-12 rounded-sm bg-white p-1.5 pb-6 opacity-80 shadow-2xl">
          <div className="aspect-[3/4] w-full overflow-hidden bg-black">
            <FlashDevelopPhoto
              src="/landing/assets/720207033_17892583926515853_2215607998685685137_n.jpg"
              className="h-full w-full object-cover"
              {...bg}
            />
          </div>
        </div>

        {/* Image 1 — shot by the mid-right camera */}
        <div className="absolute left-0 top-0 z-10 w-32 -rotate-6 rounded-sm bg-white p-1.5 pb-6 shadow-2xl">
          <div className="aspect-[3/4] w-full overflow-hidden bg-black">
            <FlashDevelopPhoto
              src="/landing/assets/696328673_17888403237515853_6493411745222454105_n.jpg"
              className="h-full w-full object-cover"
              {...img1}
            />
          </div>
          <ReactionBubble
            delay={bubbleDelayOf(img1)}
            className="absolute -right-8 bottom-3 flex items-center rounded-full bg-[#463c32]/90 px-3 py-1.5 text-[11px] font-medium text-white shadow-[0_4px_12px_rgba(0,0,0,0.5)] backdrop-blur-md"
          >
            take me back 🥺
          </ReactionBubble>
          <ReactionBubble
            delay={bubbleDelayOf(img1) + 0.15}
            className="absolute -left-4 bottom-10 flex h-8 w-8 items-center justify-center rounded-full bg-[#222]/90 text-sm shadow-[0_4px_12px_rgba(0,0,0,0.5)] backdrop-blur-md"
          >
            ❤️
          </ReactionBubble>
        </div>

        {/* Image 2 — shot by the far-right "Dispo" camera */}
        <div className="absolute bottom-[-10px] right-[10px] z-20 w-36 rotate-3 rounded-sm bg-white p-1.5 pb-6 shadow-2xl">
          <div className="aspect-[3/4] w-full overflow-hidden bg-black">
            <FlashDevelopPhoto
              src="/landing/assets/671252663_17888402958515853_2887117479615207246_n.jpg"
              className="h-full w-full object-cover"
              {...img2}
            />
          </div>
          <ReactionBubble
            delay={bubbleDelayOf(img2)}
            className="absolute -left-10 top-[40%] flex items-center rounded-full bg-[#663583]/90 px-3 py-1.5 text-[11px] font-medium text-white shadow-[0_4px_12px_rgba(0,0,0,0.5)] backdrop-blur-md"
          >
            we look so good ✨
          </ReactionBubble>
          <ReactionBubble
            delay={bubbleDelayOf(img2) + 0.15}
            className="absolute -right-3 bottom-5 flex h-8 w-8 items-center justify-center rounded-full bg-[#222]/90 text-sm shadow-[0_4px_12px_rgba(0,0,0,0.5)] backdrop-blur-md"
          >
            🔥
          </ReactionBubble>
        </div>
      </div>
    </div>
  );
}

const BEATS = [
  { title: 'Buy the ticket.', line: 'RSVP or pay in two taps.', visual: <TicketVisual /> },
  { title: 'Shoot on one camera.', line: 'The whole room, one shared roll.', visual: <CameraVisual /> },
  { title: 'Wake up to it all.', line: 'Every photo from every phone, in one thread.', visual: <MorningVisual /> },
];

export default function StoryIntro() {
  return (
    <SectionShell eyebrow="The idea" pad="default">
      <h2 className="display-3 mt-5 max-w-xl">Built around the memory.</h2>

      <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
        {BEATS.map((beat) => (
          // One-shot fade+rise, triggered together (same viewport margin) so
          // the shared timeline above starts from roughly the same moment.
          <motion.div
            key={beat.title}
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, margin: '-60px' }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-2xl bg-white/[0.04] p-6 backdrop-blur-md"
          >
            {beat.visual}
            <h3 className="mt-4 text-lg font-semibold text-white">{beat.title}</h3>
            <p className="mt-1 text-sm text-zinc-400">{beat.line}</p>
          </motion.div>
        ))}
      </div>
    </SectionShell>
  );
}
