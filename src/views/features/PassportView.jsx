'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import AppStoreCtaPair from '@/components/links/AppStoreCtaPair';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowRight02Icon } from '@hugeicons/core-free-icons';

const TIERS = [
  {
    name: 'Bronze',
    range: '1 – 5 events',
    color: 'text-orange-400',
    border: 'border-orange-400/20',
    desc: 'Your event life begins. First stamps, first memories. You\'re building the foundation of a social identity that\'s actually earned.',
  },
  {
    name: 'Silver',
    range: '6 – 15 events',
    color: 'text-zinc-400',
    border: 'border-zinc-400/20',
    desc: 'You\'re a regular. People recognize you at events. Your scrapbook is filling up with proof that you show up when it counts.',
  },
  {
    name: 'Gold',
    range: '16 – 30 events',
    color: 'text-amber-400',
    border: 'border-amber-400/20',
    desc: 'You\'re the one people ask about the next event. Your Odyssey score puts you in a league that\'s impossible to fake — because it\'s built entirely on verified attendance.',
  },
  {
    name: 'Platinum',
    range: '31+ events',
    color: 'text-violet-300',
    border: 'border-violet-400/20',
    desc: 'The inner circle. You\'ve been everywhere that matters. Your passport is a living record of the nightlife — and organizers notice. Platinum holders get early access, priority RSVPs, and recognition.',
  },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Attend an event on PXI',
    body: 'Check in through the event thread, use the camera, react to photos, or simply show up on the attendee list. That\'s it — no manual action required.',
  },
  {
    step: '02',
    title: 'Earn a stamp',
    body: 'Every verified attendance earns you a stamp on your passport. The stamp tier matches the event size and your engagement level during the night.',
  },
  {
    step: '03',
    title: 'Build your Odyssey score',
    body: 'Your Odyssey score is the sum of all your stamps. It\'s a running tally of your entire social calendar — every party, every rooftop, every underground show. It goes up. It never goes down.',
  },
  {
    step: '04',
    title: 'Unlock your tier',
    body: 'As your stamp count grows, you progress through Bronze, Silver, Gold, and Platinum. Each tier is visible on your profile and verifiable by anyone — organizers, other attendees, and venues.',
  },
];

const WHY = [
  {
    title: 'Not a loyalty card',
    body: 'This isn\'t a punch card at a coffee shop. Your passport is a cryptographic record of your social vitality. Every stamp is verified by the event organizer\'s check-in data — it can\'t be faked, bought, or inflated.',
  },
  {
    title: 'Your identity, not your data',
    body: 'Your passport is yours. PXI doesn\'t sell your attendance data, location history, or social graph. Zero tracking, zero surveillance. Your score reflects where you\'ve been — not where we think you should go.',
  },
  {
    title: 'Organizers see your tier',
    body: 'When you RSVP to an event, organizers can see your Odyssey tier. Platinum holders signal reliability, engagement, and community investment. That means priority access and early invites.',
  },
  {
    title: 'Shareable, verifiable, permanent',
    body: 'Share your passport to your story, your bio, or anywhere else. Each stamp links back to a real event with a real scrapbook. It\'s proof of presence — not a screenshot of a ticket.',
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.2, 0.65, 0.3, 0.9], delay: i * 0.1 },
  }),
};

export default function PassportView() {
  return (
    <div className="landing-v2 bg-[var(--color-bg-primary)] text-[var(--color-text-body)]">

      {/* ── Hero ── */}
      <section className="relative pt-32 pb-16 md:pt-44 md:pb-24 overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-500/8 rounded-full blur-[200px] pointer-events-none" />
        <div className="container mx-auto px-6 max-w-5xl relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex items-center justify-center gap-2 mb-8"
          >
            <span className="text-[10px] font-black text-zinc-600 tracking-[0.2em] uppercase">
              For attendees
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.2, 0.65, 0.3, 0.9], delay: 0.1 }}
            className="text-4xl md:text-6xl lg:text-7xl font-black uppercase tracking-tighter leading-[0.9] mb-8"
          >
            Your Event Life,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-pxi-purple">
              Wrapped.
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-zinc-400 text-base md:text-lg font-medium max-w-2xl mx-auto leading-relaxed mb-12"
          >
            Every event you attend earns a stamp. Your Odyssey score is a living record of every show, every party, every rooftop. It's not faked, not bought — earned by showing up.
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

      {/* ── How it works ── */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-6 max-w-4xl">
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-2xl md:text-4xl font-black uppercase tracking-tighter mb-14 text-center"
          >
            How it <span className="text-pxi-purple">works</span>
          </motion.h3>

          <div className="flex flex-col gap-0">
            {HOW_IT_WORKS.map((item, i) => (
              <motion.div
                key={item.step}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-40px' }}
                variants={fadeUp}
                className={`flex gap-6 md:gap-8 py-8 ${i < HOW_IT_WORKS.length - 1 ? 'border-b border-white/[0.06]' : ''}`}
              >
                <span className="text-2xl md:text-3xl font-black text-white/10 shrink-0 w-10 md:w-12">{item.step}</span>
                <div>
                  <h4 className="text-base md:text-lg font-black text-white uppercase tracking-tight mb-2">{item.title}</h4>
                  <p className="text-sm text-zinc-500 font-medium leading-relaxed">{item.body}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stamp Tiers ── */}
      <section className="py-16 md:py-24 bg-zinc-950/50">
        <div className="container mx-auto px-6 max-w-4xl">
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-2xl md:text-4xl font-black uppercase tracking-tighter mb-14 text-center"
          >
            Stamp <span className="text-pxi-purple">tiers</span>
          </motion.h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
            {TIERS.map((tier, i) => (
              <motion.div
                key={tier.name}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-40px' }}
                variants={fadeUp}
                className={`p-6 md:p-8 rounded-2xl border ${tier.border} bg-white/[0.015]`}
              >
                <div className="flex items-baseline justify-between mb-4">
                  <h4 className={`text-lg md:text-xl font-black uppercase tracking-tight ${tier.color}`}>{tier.name}</h4>
                  <span className="text-[10px] font-bold text-zinc-600 tracking-wider uppercase">{tier.range}</span>
                </div>
                <p className="text-xs md:text-sm text-zinc-500 font-medium leading-relaxed">{tier.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why it matters ── */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-6 max-w-4xl">
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-2xl md:text-4xl font-black uppercase tracking-tighter mb-14 text-center"
          >
            Why it <span className="text-pxi-purple">matters</span>
          </motion.h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {WHY.map((item, i) => (
              <motion.div
                key={item.title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-40px' }}
                variants={fadeUp}
                className="p-6 md:p-8 rounded-2xl border border-white/[0.06] bg-white/[0.015]"
              >
                <h4 className="text-sm font-black text-white uppercase tracking-wider mb-3">{item.title}</h4>
                <p className="text-xs md:text-sm text-zinc-500 font-medium leading-relaxed">{item.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-6 max-w-3xl text-center">
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-6"
          >
            Start <span className="text-pxi-purple">earning.</span>
          </motion.h3>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="flex flex-col items-center gap-6"
          >
            <AppStoreCtaPair dataCursorHover />
            <Link
              href="/features/shared-event-photo-gallery"
              className="inline-flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-white transition-colors"
            >
              Explore Shared Gallery <HugeiconsIcon icon={ArrowRight02Icon} size={14} />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
