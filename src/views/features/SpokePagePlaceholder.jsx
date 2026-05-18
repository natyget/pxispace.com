'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowRight02Icon } from '@hugeicons/core-free-icons';
import AppStoreCtaPair from '@/components/links/AppStoreCtaPair';

/**
 * Reusable placeholder hero for scaffolded spoke pages.
 * Pass badge, heading, gradient accent text, subtext, and CTA props.
 */
export default function SpokePagePlaceholder({
  badge = 'COMING SOON',
  badgeColor = 'pxi-purple',
  heading,
  accentText,
  subtext,
  ctaLabel = 'Back to Home',
  ctaHref = '/',
  gradientFrom = 'from-pxi-purple',
  gradientTo = 'to-pink-400',
}) {
  const badgeBg = badgeColor === 'pxi-purple' ? 'bg-pxi-purple/10 text-pxi-purple border-pxi-purple/20' : 'bg-pink-500/10 text-pink-400 border-pink-500/20';

  return (
    <div className="landing-v2 bg-[var(--color-bg-primary)] text-[var(--color-text-body)]">
      <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 overflow-hidden min-h-[80vh] flex items-center">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pxi-purple/8 rounded-full blur-[200px] pointer-events-none" />

        <div className="container mx-auto px-6 max-w-4xl relative z-10 text-center">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className={`inline-block px-4 py-2 rounded-full font-black text-[10px] tracking-[0.2em] uppercase border mb-8 ${badgeBg}`}
          >
            {badge}
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.2, 0.65, 0.3, 0.9], delay: 0.1 }}
            className="text-4xl md:text-6xl lg:text-7xl font-black uppercase tracking-tighter leading-[0.9] mb-8"
          >
            {heading}{' '}
            <span className={`text-transparent bg-clip-text bg-gradient-to-r ${gradientFrom} ${gradientTo}`}>
              {accentText}
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-zinc-400 text-base md:text-lg font-medium max-w-2xl mx-auto leading-relaxed mb-12"
          >
            {subtext}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col items-center gap-8"
          >
            <AppStoreCtaPair dataCursorHover />
            <Link
              href={ctaHref}
              className="inline-flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-white transition-colors"
            >
              {ctaLabel} <HugeiconsIcon icon={ArrowRight02Icon} size={14} />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
