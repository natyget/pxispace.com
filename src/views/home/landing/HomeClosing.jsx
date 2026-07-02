'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { FaApple } from 'react-icons/fa';
import { PXI_IOS_DOWNLOAD_HREF } from '@/lib/appStoreLinks';
import SectionShell from '@/components/marketing/SectionShell';

/** Closing: one full-width photo panel, one move to make. */
export default function HomeClosing() {
  return (
    <SectionShell pad="default">
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-3xl border border-white/10"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#2b1b3d] to-black" />
        <img
          src="/images/header-logo.png"
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-contain p-20 opacity-25 blur-xl mix-blend-screen"
        />
        <div className="absolute inset-0 bg-black/60" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-pxi-purple/60 to-transparent" />

        <div className="relative z-10 flex flex-col items-center px-6 py-20 text-center md:py-28">
          <h2 className="display-2 max-w-2xl">The night is waiting.</h2>
          <p className="body-lead mt-5 max-w-md text-zinc-300">
            Pull up, shoot it, keep it. All of it.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <a
              href={PXI_IOS_DOWNLOAD_HREF}
              target="_blank"
              rel="noopener noreferrer"
              className="glow-cta px-8 py-4 text-sm"
            >
              <FaApple className="h-5 w-5" />
              Get the app
            </a>
            <Link href="/events" className="pill-ghost px-8 py-4 text-sm font-semibold">
              Explore events
            </Link>
          </div>

          <Link
            href="/platform"
            className="mt-10 inline-flex items-center gap-2 text-sm font-semibold text-zinc-400 underline-offset-4 transition-colors hover:text-white hover:underline"
          >
            Throwing one? See the platform <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </motion.div>
    </SectionShell>
  );
}
