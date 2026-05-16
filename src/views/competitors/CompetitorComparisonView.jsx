'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import AppStoreCtaPair from '@/components/links/AppStoreCtaPair';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  CheckmarkCircle02Icon,
  Cancel01Icon,
  ArrowRight02Icon,
} from '@hugeicons/core-free-icons';

/* ────── FEATURE ADVANTAGES ────── */
const ADVANTAGES = [
  {
    title: 'Shared Photo Gallery',
    pxi: 'Every shot from every attendee lands in a single, unified gallery automatically. No uploads, no links, no friction.',
    them: "Partiful and Luma have zero gallery features. You're stuck airdropping photos or creating shared albums manually after the event.",
  },
  {
    title: 'Built-In Event Camera',
    pxi: "A native camera that adapts to the room's lighting in real time. Every capture is automatically tagged to the event thread.",
    them: "No competitor offers a built-in camera. You're using your native camera app and manually adding photos to group chats afterward.",
  },
  {
    title: 'White-Label Ticketing',
    pxi: 'Zero platform branding. Your event, your brand. Web-based sign-ups bypass app store friction entirely.',
    them: "Eventbrite plasters their logo everywhere. Partiful doesn't even offer paid ticketing. Luma's branding is baked into every page.",
  },
  {
    title: 'Event Chat Thread',
    pxi: 'A dedicated, persistent chat thread per event — from pre-event hype to post-event memories. RSVP, coordination, and reactions all in one place.',
    them: 'Partiful has basic comments. Luma and DICE have none. You end up creating WhatsApp groups that die after the event.',
  },
  {
    title: 'Digital Event Passport',
    pxi: 'Every event you attend earns a verified stamp. Your Odyssey score builds over time — a gamified social resume of your entire event life.',
    them: 'No competitor tracks your event history. Once the event ends, there is zero record of your attendance anywhere.',
  },
  {
    title: 'Auto Scrapbook',
    pxi: 'PXI automatically compiles every photo, reaction, and comment into a permanent, shareable scrapbook the moment the event ends.',
    them: 'SWSH offers basic albums. Every other platform — Partiful, Luma, DICE, Eventbrite — has zero post-event content.',
  },
  {
    title: 'Promoter Attribution',
    pxi: "Every promoter gets a unique trackable link. Know exactly who's filling the room, measure per-promoter ROI, and reward performance.",
    them: "Eventbrite offers basic referral tracking. Partiful and Luma have zero attribution. You're guessing who's driving your audience.",
  },
  {
    title: 'Privacy-First Architecture',
    pxi: 'Zero location tracking. Zero behavioral surveillance. Your data stays yours — we monetize the product, not your identity.',
    them: 'Eventbrite, DICE, and Luma all track location and behavioral data. Your attendees are the product.',
  },
];

/* ────── HEAD-TO-HEAD TABLE ────── */
const COMPARISON = [
  //                          Partiful  Luma  DICE  Eventbrite  SWSH  Lapse
  { f: 'Invites / RSVP',     c: [true,  true,  false, true,  false, false] },
  { f: 'Paid Ticketing',     c: [false, true,  true,  true,  false, false] },
  { f: 'White-Label',        c: [false, false, false, false, false, false] },
  { f: 'Event Discovery',    c: [false, true,  true,  true,  false, false] },
  { f: 'Shared Gallery',     c: [false, false, false, false, true,  false] },
  { f: 'Live Camera',        c: [false, false, false, false, false, true ] },
  { f: 'Event Chat',         c: [true,  false, false, false, false, false] },
  { f: 'Auto Scrapbook',     c: [false, false, false, false, true,  false] },
  { f: 'Passport / XP',      c: [false, false, false, false, false, false] },
  { f: 'Promoter Analytics', c: [false, false, false, true,  false, false] },
  { f: 'QR Door Scan',       c: [false, true,  true,  true,  false, false] },
  { f: 'Zero Tracking',      c: [false, false, false, false, false, false] },
];

const COMPETITORS = ['Partiful', 'Luma', 'DICE', 'Eventbrite', 'SWSH', 'Lapse'];

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.2, 0.65, 0.3, 0.9], delay: i * 0.08 },
  }),
};

export default function CompetitorComparisonView() {
  return (
    <div className="landing-v2 bg-[var(--color-bg-primary)] text-[var(--color-text-body)]">

      {/* ── Hero ── */}
      <section className="relative pt-32 pb-16 md:pt-44 md:pb-24 overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pxi-purple/8 rounded-full blur-[200px] pointer-events-none" />
        <div className="container mx-auto px-6 max-w-5xl relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex items-center justify-center gap-2 mb-8"
          >
            <span className="text-[10px] font-black text-zinc-600 tracking-[0.2em] uppercase">
              Why organizers switch to
            </span>
            <span className="text-[10px] font-black text-pxi-purple tracking-[0.2em] uppercase">
              PXI
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.2, 0.65, 0.3, 0.9], delay: 0.1 }}
            className="text-4xl md:text-6xl lg:text-7xl font-black uppercase tracking-tighter leading-[0.9] mb-8"
          >
            Beyond Invite Apps.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pxi-purple to-pink-400">
              The Full Event OS.
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-zinc-400 text-base md:text-lg font-medium max-w-2xl mx-auto leading-relaxed mb-12"
          >
            Partiful handles invites. Luma handles ticketing. SWSH handles photos. Lapse handles cameras. PXI handles all of it — before, during, and after — in one platform with zero compromise.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <AppStoreCtaPair dataCursorHover />
          </motion.div>
        </div>
      </section>

      {/* ── Feature-by-feature advantages ── */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-6 max-w-5xl">
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6 }}
            className="text-2xl md:text-4xl font-black uppercase tracking-tighter mb-4 text-center"
          >
            What you get with PXI
          </motion.h3>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-zinc-500 text-sm md:text-base font-medium text-center mb-14 max-w-xl mx-auto"
          >
            A side-by-side breakdown of how PXI stacks up against the tools you're currently duct-taping together.
          </motion.p>

          <div className="flex flex-col gap-6 md:gap-8">
            {ADVANTAGES.map((adv, i) => (
              <motion.div
                key={adv.title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-40px' }}
                variants={fadeUp}
                className="grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-0 rounded-2xl border border-white/[0.06] overflow-hidden"
              >
                {/* PXI side */}
                <div className="p-6 md:p-8 bg-pxi-purple/[0.04] border-b md:border-b-0 md:border-r border-white/[0.06]">
                  <div className="flex items-center gap-2 mb-3">
                    <HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} className="text-emerald-400" />
                    <span className="text-[10px] font-black text-emerald-400 tracking-[0.15em] uppercase">PXI</span>
                  </div>
                  <h4 className="text-lg md:text-xl font-black text-white uppercase tracking-tight mb-2">{adv.title}</h4>
                  <p className="text-sm text-zinc-400 font-medium leading-relaxed">{adv.pxi}</p>
                </div>
                {/* Competitor side */}
                <div className="p-6 md:p-8 bg-white/[0.01]">
                  <div className="flex items-center gap-2 mb-3">
                    <HugeiconsIcon icon={Cancel01Icon} size={16} className="text-red-400/60" />
                    <span className="text-[10px] font-black text-red-400/60 tracking-[0.15em] uppercase">Everyone else</span>
                  </div>
                  <p className="text-sm text-zinc-500 font-medium leading-relaxed">{adv.them}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Comparison table ── */}
      <section className="py-16 md:py-24 bg-[#0d0518]">
        <div className="container mx-auto px-6 max-w-5xl text-center">
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-2xl md:text-4xl font-black uppercase tracking-tighter mb-12"
          >
            The complete <span className="text-pxi-purple">breakdown</span>
          </motion.h3>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="w-full overflow-x-auto -mx-6 px-6"
          >
            <table className="w-full min-w-[680px] border-collapse rounded-2xl overflow-hidden border border-white/[0.06]" style={{ background: 'rgba(255,255,255,0.015)' }}>
              <thead>
                <tr className="border-b border-white/[0.08]">
                  <th className="text-left py-4 px-4 md:px-5 text-[10px] md:text-xs font-black text-pxi-purple uppercase tracking-widest">Feature</th>
                  {COMPETITORS.map((name) => (
                    <th key={name} className="py-4 px-2 md:px-3 text-[9px] md:text-[11px] font-bold text-zinc-500 text-center whitespace-nowrap">{name}</th>
                  ))}
                  <th className="py-4 px-3 md:px-5 text-[10px] md:text-xs font-black text-pxi-purple text-center bg-pxi-purple/[0.08] border-l border-pxi-purple/20">PXI</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row, i) => (
                  <tr key={row.f} className={`${i < COMPARISON.length - 1 ? 'border-b border-white/[0.04]' : ''} hover:bg-white/[0.02] transition-colors`}>
                    <td className="text-left py-3 px-4 md:px-5 text-[11px] md:text-sm font-medium text-white/80 whitespace-nowrap">{row.f}</td>
                    {row.c.map((has, j) => (
                      <td key={j} className="text-center py-3 px-2 md:px-3">
                        {has
                          ? <HugeiconsIcon icon={CheckmarkCircle02Icon} size={20} className="inline-block text-emerald-400" />
                          : <HugeiconsIcon icon={Cancel01Icon} size={18} className="inline-block text-red-500/40" />
                        }
                      </td>
                    ))}
                    <td className="text-center py-3 px-3 md:px-5 bg-pxi-purple/[0.08] border-l border-pxi-purple/20">
                      <HugeiconsIcon icon={CheckmarkCircle02Icon} size={22} className="inline-block text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.5)]" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 md:py-28 bg-gradient-to-b from-[#0d0518] to-[#050505]">
        <div className="container mx-auto px-6 max-w-3xl text-center">
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-6"
          >
            Ready to <span className="text-pxi-purple">consolidate?</span>
          </motion.h3>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-zinc-500 text-sm md:text-base font-medium max-w-xl mx-auto mb-10"
          >
            Replace your entire event stack with a single platform that handles everything from the first RSVP to the last scrapbook.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col items-center gap-6"
          >
            <AppStoreCtaPair dataCursorHover />
            <Link
              href="/organizers"
              className="inline-flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-white transition-colors"
            >
              See Organizer Features <HugeiconsIcon icon={ArrowRight02Icon} size={14} />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
