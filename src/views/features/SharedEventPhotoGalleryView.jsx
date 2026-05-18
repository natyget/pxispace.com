'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { HugeiconsIcon } from '@hugeicons/react';
import { Camera01Icon, SparklesIcon, UserGroupIcon, ZapIcon, ArrowRight02Icon } from '@hugeicons/core-free-icons';
import AppStoreCtaPair from '@/components/links/AppStoreCtaPair';

const FEATURES = [
  {
    icon: Camera01Icon,
    title: 'Tactile Native Camera',
    body: 'Engineered for the energy of the night. PXI\u2019s live camera captures the raw, unfiltered atmosphere without ever pulling you out of the experience. No filters, no staging \u2014 just the authentic moment.',
  },
  {
    icon: UserGroupIcon,
    title: 'Real-Time Shared Thread',
    body: 'Every photo bypasses the isolation of your personal camera roll and streams instantly into the event\u2019s collective shared thread. A dynamic, communal visual pulse where every attendee contributes to the narrative.',
  },
  {
    icon: SparklesIcon,
    title: 'Wilson-Scored Ranking',
    body: 'Our proprietary engagement graph applies advanced Wilson scoring algorithms to automatically surface the most iconic moments. The best content earns its place at the top, driven by collective consensus.',
  },
  {
    icon: ZapIcon,
    title: 'DBSCAN Scrapbook Compilation',
    body: 'When the event concludes, the PXI engine automatically compiles the shared thread into a permanent, interactive digital scrapbook using DBSCAN clustering. No manual uploading, no chasing lost links.',
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

export default function SharedEventPhotoGalleryView() {
  return (
    <div className="landing-v2 bg-[var(--color-bg-primary)] text-[var(--color-text-body)]">
      {/* Hero */}
      <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 overflow-hidden">
        <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-pink-500/8 rounded-full blur-[200px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-pxi-purple/10 rounded-full blur-[180px] pointer-events-none" />

        <div className="container mx-auto px-6 max-w-4xl relative z-10 text-center">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-block px-4 py-2 bg-pink-500/10 rounded-full text-pink-400 font-black text-[10px] tracking-[0.2em] uppercase border border-pink-500/20 mb-8"
          >
            FOR ATTENDEES & HOSTS
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.2, 0.65, 0.3, 0.9], delay: 0.1 }}
            className="text-4xl md:text-6xl lg:text-7xl font-black uppercase tracking-tighter leading-[0.9] mb-8"
          >
            The Live{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-pxi-purple">
              Shared Event Photo Gallery
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-zinc-400 text-base md:text-lg font-medium max-w-2xl mx-auto leading-relaxed mb-12"
          >
            Every attendee is a creator. PXI\u2019s tactile native camera streams photos into a communal shared thread in real time \u2014 no uploads, no group texts, no algorithms. Just the night, preserved exactly as it happened.
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

      {/* Live thread concept */}
      <section className="py-12 md:py-16 bg-[#050505]">
        <div className="container mx-auto px-6 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.7 }}
            className="neo-glass-panel p-6 md:p-8 flex flex-col md:flex-row items-center gap-6"
          >
            <div className="flex -space-x-3">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="w-10 h-10 rounded-full border-2 border-[#0a0a0a] bg-gradient-to-br from-pxi-purple/60 to-pink-500/60 flex items-center justify-center text-[10px] font-black text-white"
                >
                  {String.fromCharCode(65 + i)}
                </div>
              ))}
            </div>
            <div className="flex-1 text-center md:text-left">
              <p className="text-sm font-bold text-white mb-1">Shared Thread Active</p>
              <p className="text-xs text-zinc-500">
                Photos stream in real time · Wilson-scored ranking · Auto-compiled into a digital scrapbook
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
              </span>
              <span className="text-xs font-bold text-green-400 uppercase tracking-widest">Live</span>
            </div>
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
            How It{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-pxi-purple">
              Works
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
                <HugeiconsIcon icon={feature.icon} className="w-8 h-8 text-pink-400 mb-5" />
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
              href="/features/digital-event-passport"
              className="inline-flex items-center gap-2 text-sm font-bold text-pink-400 hover:text-white transition-colors"
            >
              Digital Event Passport <HugeiconsIcon icon={ArrowRight02Icon} size={14} />
            </Link>
            <Link
              href="/features/white-label-event-ticketing"
              className="inline-flex items-center gap-2 text-sm font-bold text-pxi-purple hover:text-white transition-colors"
            >
              White-Label Ticketing <HugeiconsIcon icon={ArrowRight02Icon} size={14} />
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
