'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { HugeiconsIcon } from '@hugeicons/react';
import { ZapIcon, CreditCardIcon, UserGroupIcon, HelpCircleIcon, Shield01Icon, ArrowRight02Icon } from '@hugeicons/core-free-icons';
import AppStoreCtaPair from '@/components/links/AppStoreCtaPair';

const FEATURES = [
  {
    icon: CreditCardIcon,
    title: 'Stripe Destination Charges',
    body: 'Revenue flows directly to your Stripe account with complete transparency. No hidden fees, no delayed payouts. PXI handles the infrastructure while you retain full financial control over every transaction.',
  },
  {
    icon: UserGroupIcon,
    title: 'Partial User Web Sign-ups',
    body: 'Eliminate app-store friction entirely. Attendees purchase tickets via seamless web-based sign-ups that capture essential data and immediately onboard them into dedicated pre-event chat threads, building hype from the moment of purchase.',
  },
  {
    icon: ChartBar01Icon,
    title: 'Full Lifecycle Control',
    body: 'Manage every phase of your event from a single command center. From dormant announcements through live operations to the post-event grace period, you maintain absolute control over ticketing, capacity, and attendee communication.',
  },
  {
    icon: Shield01Icon,
    title: 'Zero Third-Party Branding',
    body: 'Your event, your brand, your rules. PXI provides the invisible infrastructure — no competing logos, no platform watermarks. Attendees see your aesthetic, your identity, and your vision from ticket purchase to scrapbook compilation.',
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.2, 0.65, 0.3, 0.9], delay: i * 0.1 },
  }),
};

export default function WhiteLabelTicketingView() {
  return (
    <div className="landing-v2 bg-[var(--color-bg-primary)] text-[var(--color-text-body)]">
      {/* Hero */}
      <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-pxi-purple/10 rounded-full blur-[200px] pointer-events-none" />

        <div className="container mx-auto px-6 max-w-4xl relative z-10 text-center">
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
            className="text-4xl md:text-6xl lg:text-7xl font-black uppercase tracking-tighter leading-[0.9] mb-8"
          >
            White-Label{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pxi-purple to-pink-400">
              Event Ticketing
            </span>{' '}
            Infrastructure
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-zinc-400 text-base md:text-lg font-medium max-w-2xl mx-auto leading-relaxed mb-12"
          >
            Abandon the friction and bloated interfaces of legacy ticketing monopolies. PXI provides a frictionless, white-label event ticketing infrastructure designed specifically for the modern promoter. Your brand remains uncompromised, and your revenue is optimized with complete transparency.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              href="/events"
              className="inline-flex items-center justify-center gap-2 px-10 py-4 rounded-full font-bold text-xs uppercase tracking-widest pxi-home-purple hover:scale-105 active:scale-95 transition-transform"
              data-cursor-hover
            >
              <HugeiconsIcon icon={ZapIcon} className="w-4 h-4" />
              Deploy Your Command Center
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features grid */}
      <section className="py-20 md:py-28 bg-gradient-to-b from-[#050505] to-[#0d0518]">
        <div className="container mx-auto px-6 max-w-5xl">
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6 }}
            className="text-2xl md:text-4xl font-black uppercase tracking-tighter text-center mb-14 md:mb-20"
          >
            Built for{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pxi-purple to-pink-400">
              Premium Promoters
            </span>
          </motion.h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={feature.title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-40px' }}
                variants={fadeUp}
                className="neo-glass-panel p-8 md:p-10"
              >
                <HugeiconsIcon icon={feature.icon} className="w-8 h-8 text-pxi-purple mb-5" />
                <h4 className="text-lg md:text-xl font-black uppercase tracking-tight mb-3">
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

      {/* Stats */}
      <section className="py-16 md:py-20 bg-[#0d0518]">
        <div className="container mx-auto px-6 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {[
              { value: '0%', label: 'Platform Branding', accent: true },
              { value: '<2m', label: 'Setup Time', accent: false },
              { value: '100%', label: 'Revenue Control', accent: true },
              { value: '34%', label: 'Avg. Lift in Conversion', accent: false },
            ].map((stat) => (
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

      {/* Cross-links + CTA */}
      <section className="py-20 md:py-28 bg-gradient-to-b from-[#0d0518] to-[#050505]">
        <div className="container mx-auto px-6 max-w-3xl text-center">
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6 }}
            className="text-2xl md:text-3xl font-black uppercase tracking-tighter mb-6"
          >
            Explore the Full PXI Ecosystem
          </motion.h3>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
          >
            <Link
              href="/features/event-promoter-analytics"
              className="inline-flex items-center gap-2 text-sm font-bold text-pxi-purple hover:text-white transition-colors"
            >
              Promoter Analytics <HugeiconsIcon icon={ArrowRight02Icon} size={14} />
            </Link>
            <Link
              href="/features/shared-event-photo-gallery"
              className="inline-flex items-center gap-2 text-sm font-bold text-pxi-purple hover:text-white transition-colors"
            >
              Shared Photo Gallery <HugeiconsIcon icon={ArrowRight02Icon} size={14} />
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-white transition-colors"
            >
              Back to Home <HugeiconsIcon icon={ArrowRight02Icon} size={14} />
            </Link>
          </motion.div>

          <AppStoreCtaPair dataCursorHover />
        </div>
      </section>
    </div>
  );
}
