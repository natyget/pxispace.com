'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import AppStoreCtaPair from '@/components/links/AppStoreCtaPair';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowRight02Icon } from '@hugeicons/core-free-icons';

const METRICS = [
  {
    title: 'Hype Index',
    value: '94',
    unit: '/100',
    desc: "A real-time pulse of your event\u2019s momentum. Calculated from RSVP velocity, chat activity, ticket sales rate, and social sharing. Know whether hype is building or stalling before the first person walks in.",
  },
  {
    title: 'Ticket-to-Door Conversion',
    value: '78',
    unit: '%',
    desc: 'Track exactly how many ticket holders actually show up. Compare across events to identify patterns — weather impact, day-of-week trends, pricing sensitivity — and optimize accordingly.',
  },
  {
    title: 'Promoter ROI',
    value: '$12.40',
    unit: '/link',
    desc: "Every promoter gets a unique link. See exactly how many tickets each link drove, what the conversion rate was, and what the cost-per-attendee looks like. Reward the promoters filling your room, cut the ones who aren\u2019t.",
  },
  {
    title: 'Content Engagement',
    value: '3.2x',
    unit: 'avg',
    desc: 'Measure how many photos, reactions, and comments your event generated compared to your average. High engagement events become case studies for your next pitch to a venue or sponsor.',
  },
];

const CAPABILITIES = [
  {
    title: 'Attendance Funnel',
    body: 'Visualize every stage: Awareness → RSVP → Ticket Purchase → Check-in → Active Participation. Identify exactly where people drop off and fix it for the next event.',
  },
  {
    title: 'Promoter Leaderboard',
    body: 'Rank your promoters by tickets sold, revenue generated, and attendee quality. One dashboard replaces the spreadsheets, screenshots, and DMs you\'re currently using.',
  },
  {
    title: 'Revenue Breakdown',
    body: 'See your gross revenue, platform fees (zero with PXI), refund rates, and net payout — all in one place. Stripe Direct Payouts mean no middleman holding your money.',
  },
  {
    title: 'Post-Event Report',
    body: 'An auto-generated summary of your event performance: peak attendance time, top content creators, gallery engagement, and an exportable PDF you can send to sponsors and venues.',
  },
  {
    title: 'Crowd Behavior Signals',
    body: 'See when engagement peaks — when the most photos are taken, when chat activity spikes, when check-ins plateau. Use this to optimize set times, DJ schedules, and bar service windows.',
  },
  {
    title: 'Multi-Event Trends',
    body: 'Compare performance across all your events over time. Track growth in attendance, revenue per head, promoter effectiveness, and content generation across your entire portfolio.',
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

export default function AnalyticsView() {
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
              For organizers & promoters
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.2, 0.65, 0.3, 0.9], delay: 0.1 }}
            className="text-4xl md:text-6xl lg:text-7xl font-black uppercase tracking-tighter leading-[0.9] mb-8"
          >
            Know Your Room{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pxi-purple to-pink-400">
              Before the Baseline Drops.
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-zinc-400 text-base md:text-lg font-medium max-w-2xl mx-auto leading-relaxed mb-12"
          >
            Replace guesswork with data. PXI&apos;s analytics dashboard gives you real-time visibility into every metric that matters — from ticket sales velocity to crowd engagement patterns.
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

      {/* ── Key Metrics ── */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-6 max-w-5xl">
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-2xl md:text-4xl font-black uppercase tracking-tighter mb-4 text-center"
          >
            Metrics that <span className="text-pxi-purple">matter</span>
          </motion.h3>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-zinc-500 text-sm md:text-base font-medium text-center mb-14 max-w-xl mx-auto"
          >
            Not vanity metrics — actionable intelligence you can use to fill rooms, optimize revenue, and prove ROI to sponsors.
          </motion.p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
            {METRICS.map((metric, i) => (
              <motion.div
                key={metric.title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-40px' }}
                variants={fadeUp}
                className="p-6 md:p-8 rounded-2xl border border-white/[0.06] bg-white/[0.02]"
              >
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-3xl md:text-4xl font-black text-white">{metric.value}</span>
                  <span className="text-sm font-bold text-zinc-600">{metric.unit}</span>
                </div>
                <h4 className="text-sm font-black text-white uppercase tracking-wider mb-2">{metric.title}</h4>
                <p className="text-xs md:text-sm text-zinc-500 font-medium leading-relaxed">{metric.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Capabilities ── */}
      <section className="py-16 md:py-24 bg-zinc-950/50">
        <div className="container mx-auto px-6 max-w-5xl">
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-2xl md:text-4xl font-black uppercase tracking-tighter mb-4 text-center"
          >
            The full <span className="text-pxi-purple">dashboard</span>
          </motion.h3>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-zinc-500 text-sm md:text-base font-medium text-center mb-14 max-w-xl mx-auto"
          >
            Everything an organizer needs to operate with precision — no third-party tools required.
          </motion.p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {CAPABILITIES.map((cap, i) => (
              <motion.div
                key={cap.title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-40px' }}
                variants={fadeUp}
                className="p-6 md:p-8 rounded-2xl border border-white/[0.06] bg-white/[0.015]"
              >
                <h4 className="text-sm font-black text-white uppercase tracking-wider mb-3">{cap.title}</h4>
                <p className="text-xs md:text-sm text-zinc-500 font-medium leading-relaxed">{cap.body}</p>
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
            Stop <span className="text-pxi-purple">guessing.</span>
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
              href="/organizers"
              className="inline-flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-white transition-colors"
            >
              Back to Organizer Hub <HugeiconsIcon icon={ArrowRight02Icon} size={14} />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
