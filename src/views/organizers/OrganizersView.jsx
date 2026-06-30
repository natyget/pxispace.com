'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { HugeiconsIcon } from '@hugeicons/react';
import { ZapIcon, CreditCardIcon, UserGroupIcon, HelpCircleIcon, ArrowRight02Icon, Message01Icon, ClockIcon, ViewIcon, ChartBarIncreasingIcon } from '@hugeicons/core-free-icons';

import { CheckmarkCircle02Icon, Cancel01Icon } from '@hugeicons/core-free-icons';

const DiscoverJPG = '/images/screenshots/Event.PNG';
const CreateJPG = '/images/screenshots/Gallery.png';
const SLIDES = [DiscoverJPG, CreateJPG];
const SLIDE_INTERVAL = 3500;

const FEATURES = [
  {
    icon: CreditCardIcon,
    title: 'White-Label Ticketing',
    body: 'Your event, your brand. PXI provides invisible ticketing infrastructure — no competing logos, no platform watermarks. Web-based sign-ups bypass app store friction and onboard attendees directly into your event thread.',
  },
  {
    icon: ChartBarIncreasingIcon,
    title: 'Predictive Analytics',
    body: 'Monitor your hype index, track ticket-to-door conversion in real time, and visualize crowd behavior. Replace guesswork with data. Know exactly what your room needs before the first baseline drops.',
  },
  {
    icon: UserGroupIcon,
    title: 'Promoter Attribution',
    body: 'Every promoter gets a unique link. Track exactly who is driving your audience, measure ROI per promoter, and reward the ones actually filling the room.',
  },
  {
    icon: ClockIcon,
    title: 'Full Lifecycle Control',
    body: 'From the first announcement to the afterparty grace period, you control every phase. Ticketing, capacity, chat threads, and content — all from a single command center.',
  },
  {
    icon: Message01Icon,
    title: 'Built-In Event Chat',
    body: 'The hype starts the moment tickets go live. Attendees join a dedicated chat thread with RSVP, pre-event coordination, and real-time updates — all inside PXI. No external group chats needed.',
  },
  {
    icon: ViewIcon,
    title: 'Authentic Content on Autopilot',
    body: 'Every attendee with PXI becomes a content creator. High-quality event photos and reactions stream into a shared gallery you can use for your next promotion. No photographers required.',
  },
];

const STATS = [
  { value: '0%', label: 'Platform Branding', accent: true },
  { value: '<2m', label: 'Setup Time', accent: false },
  { value: '100%', label: 'Revenue Control', accent: true },
  { value: '+34%', label: 'Avg. Lift in Conversion', accent: false },
];

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.2, 0.65, 0.3, 0.9], delay: i * 0.1 },
  }),
};

export default function OrganizersView() {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % SLIDES.length);
    }, SLIDE_INTERVAL);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="landing-v2 bg-[var(--color-bg-primary)] text-[var(--color-text-body)]">
      {/* ── Hero ── */}
      <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-pxi-purple/10 rounded-full blur-[200px] pointer-events-none" />

        <div className="container mx-auto px-6 max-w-[1100px] relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            {/* Text */}
            <div className="lg:w-1/2 text-center lg:text-left">
              <motion.span
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="inline-block px-4 py-2 bg-pxi-purple/10 rounded-full text-pxi-purple font-black text-[10px] tracking-[0.2em] uppercase border border-pxi-purple/20 mb-8"
              >
                FOR ORGANIZERS & PROMOTERS
              </motion.span>

              <motion.h2
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.2, 0.65, 0.3, 0.9], delay: 0.1 }}
                className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-[0.9] mb-8"
              >
                Command the Night.{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-pxi-purple to-pink-400">
                  Own the Room.
                </span>
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-zinc-400 text-base md:text-lg font-medium leading-relaxed mb-10"
              >
                The infrastructure that powers your empire. White-label ticketing, real-time analytics, promoter attribution, and a built-in content engine — all from a single command center. Total visibility. Total control.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
              >
                <Link
                  href="/events"
                  className="inline-flex items-center justify-center gap-2 px-10 py-4 rounded-full font-bold text-xs uppercase tracking-widest pxi-home-purple hover:scale-105 active:scale-95 transition-transform"
                  data-cursor-hover
                >
                  <HugeiconsIcon icon={ZapIcon} className="w-4 h-4" />
                  Start Creating Events
                </Link>
              </motion.div>
            </div>

            {/* Phone mockup — reuse the discover/create crossfade */}
            <motion.div
              className="lg:w-1/2 relative flex justify-center"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-pxi-purple/15 rounded-full blur-[100px] opacity-40 pointer-events-none" />
              <div className="relative">
                <div className="relative z-10 transform lg:rotate-3 lg:hover:rotate-0 transition-transform duration-700 will-change-transform">
                  <div className="bg-black p-3 shadow-2xl border-4 border-neutral-900 w-[280px] md:w-[340px] overflow-hidden rounded-[2rem]">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 h-6 w-28 bg-neutral-900 rounded-b-xl z-20" />
                    <div className="relative rounded-[1.5rem] overflow-hidden bg-black aspect-[9/19]">
                      {SLIDES.map((src, i) => (
                        <img
                          key={src}
                          src={src}
                          alt={i === 0 ? 'PXI organizer command center with event discovery interface' : 'PXI event creation dashboard for promoters'}
                          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
                            i === activeSlide ? 'opacity-100' : 'opacity-0'
                          }`}
                          loading={i === 0 ? 'eager' : 'lazy'}
                          decoding="async"
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Floating stat card */}
                <div className="absolute -bottom-8 -left-4 md:-left-12 z-20 neo-glass-panel p-4 w-40 md:w-48">
                  <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">
                    Ticket Sales
                  </p>
                  <div className="flex items-end gap-2">
                    <span className="text-xl md:text-2xl font-black text-white">1,204</span>
                    <span className="text-xs text-green-400 font-bold mb-1">+12%</span>
                  </div>
                  <div className="w-full bg-white/5 h-1.5 mt-3 rounded-full overflow-hidden">
                    <div className="bg-pxi-purple h-full w-[85%] shadow-[0_0_10px_rgba(216,74,255,1)]" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-12 md:py-16 bg-[#050505]">
        <div className="container mx-auto px-6 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {STATS.map((stat) => (
              <div key={stat.label} className="neo-glass-panel p-5 md:p-6 text-center">
                <div className={`text-2xl md:text-3xl font-black mb-1 ${stat.accent ? 'text-pxi-purple' : 'text-white'}`}>
                  {stat.value}
                </div>
                <div className="text-[10px] md:text-xs font-bold text-zinc-500 uppercase tracking-widest">
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Features grid ── */}
      <section className="py-20 md:py-28 bg-gradient-to-b from-[#050505] to-[#0d0518]">
        <div className="container mx-auto px-6 max-w-5xl">
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6 }}
            className="text-2xl md:text-4xl font-black uppercase tracking-tighter text-center mb-14 md:mb-20"
          >
            Everything you need to{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pxi-purple to-pink-400">
              run the show.
            </span>
          </motion.h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={feature.title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-40px' }}
                variants={fadeUp}
                className="neo-glass-panel p-8"
              >
                <HugeiconsIcon icon={feature.icon} className="w-7 h-7 text-pxi-purple mb-5" />
                <h4 className="text-base md:text-lg font-black uppercase tracking-tight mb-3">
                  {feature.title}
                </h4>
                <p className="text-zinc-400 text-sm font-medium leading-relaxed">
                  {feature.body}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── The Ecosystem comparison ── */}
      <section className="py-20 md:py-28 bg-[#0d0518]">
        <div className="container mx-auto px-6 max-w-6xl text-center">
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6 }}
            className="text-2xl md:text-4xl font-black uppercase tracking-tighter mb-6"
          >
            One platform.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pxi-purple to-pink-400">
              Everything they do, combined.
            </span>
          </motion.h3>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-zinc-500 text-sm md:text-base font-medium max-w-2xl mx-auto mb-12"
          >
            Stop juggling seven different tools. PXI replaces your entire event stack — from the first invite to the last scrapbook.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="w-full overflow-x-auto -mx-6 px-6"
          >
            <table className="w-full min-w-[780px] border-collapse overflow-hidden rounded-2xl border border-white/[0.06]" style={{ background: 'rgba(255,255,255,0.015)' }}>
              <thead>
                <tr className="border-b border-white/[0.08]">
                  <th className="text-left py-4 px-4 md:px-5 text-[10px] md:text-xs font-black text-pxi-purple uppercase tracking-widest">Feature</th>
                  {['SWSH', 'Partiful', 'Luma', 'Posh VIP', 'DICE', 'Eventbrite', 'Lapse'].map((name) => (
                    <th key={name} className="py-4 px-2 md:px-3 text-[9px] md:text-[11px] font-bold text-zinc-500 text-center whitespace-nowrap">{name}</th>
                  ))}
                  <th className="py-4 px-3 md:px-5 text-[10px] md:text-xs font-black text-pxi-purple text-center bg-pxi-purple/[0.08] border-l border-pxi-purple/20">PXI</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {[
                  //                            SWSH   Partiful Luma   Posh   DICE   EB     Lapse
                  { feature: 'Invites / RSVP',  checks: [false, true,  true,  false, false, true,  false] },
                  { feature: 'Paid Ticketing',   checks: [false, false, true,  true,  true,  true,  false] },
                  { feature: 'White-Label Branding', checks: [false, false, false, false, false, false, false] },
                  { feature: 'Event Discovery',  checks: [false, false, true,  true,  true,  true,  false] },
                  { feature: 'Shared Photo Gallery', checks: [true, false, false, false, false, false, false] },
                  { feature: 'Live Event Camera', checks: [false, false, false, false, false, false, true ] },
                  { feature: 'Event Chat Thread', checks: [false, true,  false, false, false, false, false] },
                  { feature: 'Reactions & Comments', checks: [false, true, false, false, false, false, true ] },
                  { feature: 'Auto Scrapbook',    checks: [true,  false, false, false, false, false, false] },
                  { feature: 'Social Feed',       checks: [false, false, false, false, false, false, true ] },
                  { feature: 'Passport / XP',     checks: [false, false, false, false, false, false, false] },
                  { feature: 'Promoter Attribution', checks: [false, false, false, true, false, true,  false] },
                  { feature: 'Real-Time Analytics', checks: [false, false, true, true,  false, true,  false] },
                  { feature: 'QR Door Scan',      checks: [false, false, true,  true,  true,  true,  false] },
                  { feature: 'Stripe Direct Payouts', checks: [false, false, false, false, false, false, false] },
                  { feature: 'Zero Location Tracking', checks: [false, false, false, false, false, false, false] },
                ].map((row, i, arr) => (
                  <tr key={row.feature} className={`${i < arr.length - 1 ? 'border-b border-white/[0.04]' : ''} hover:bg-white/[0.02] transition-colors`}>
                    <td className="text-left py-3 px-4 md:px-5 text-[11px] md:text-sm font-medium text-white/80 whitespace-nowrap">{row.feature}</td>
                    {row.checks.map((has, j) => (
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
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6 }}
            className="text-2xl md:text-4xl font-black uppercase tracking-tighter mb-6"
          >
            Ready to own the room?
          </motion.h3>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-col items-center gap-6"
          >
            <Link
              href="/events"
              className="inline-flex items-center justify-center gap-2 px-10 py-4 rounded-full font-bold text-xs uppercase tracking-widest pxi-home-purple hover:scale-105 active:scale-95 transition-transform"
              data-cursor-hover
            >
              <HugeiconsIcon icon={ZapIcon} className="w-4 h-4" />
              Start Creating Events
            </Link>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/features/white-label-event-ticketing"
                className="inline-flex items-center gap-2 text-sm font-bold text-pxi-purple hover:text-white transition-colors"
              >
                White-Label Ticketing <HugeiconsIcon icon={ArrowRight02Icon} size={14} />
              </Link>
              <Link
                href="/features/event-promoter-analytics"
                className="inline-flex items-center gap-2 text-sm font-bold text-pxi-purple hover:text-white transition-colors"
              >
                Promoter Analytics <HugeiconsIcon icon={ArrowRight02Icon} size={14} />
              </Link>
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-white transition-colors"
              >
                Attendee Experience <HugeiconsIcon icon={ArrowRight02Icon} size={14} />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
