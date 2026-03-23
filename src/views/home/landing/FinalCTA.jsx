'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { PXI_APP_STORE_URL } from '@/lib/appStoreLinks';

export default function FinalCTA() {
  return (
    <section className="relative min-h-[80vh] w-full bg-[var(--color-bg-primary)] flex flex-col items-center justify-center overflow-hidden py-24">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[var(--color-pxi-purple)]/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-[var(--color-pxi-pink)]/10 blur-[120px] rounded-full pointer-events-none" />
      <motion.div
        className="relative z-10 max-w-[800px] mx-auto px-6 text-center"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.8, ease: [0.2, 0.65, 0.3, 0.9] }}
      >
        <div className="inline-flex items-center justify-center px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm mb-8">
          <span className="text-xs font-black uppercase tracking-widest text-[var(--color-pxi-purple)]">
            Join the Ecosystem
          </span>
        </div>
        <h2 className="font-display font-bold text-[clamp(40px,6vw,80px)] leading-[1.1] tracking-tight text-white mb-6">
          Every event you&apos;ve ever loved deserves to be remembered.
        </h2>
        <p className="text-xl md:text-2xl text-gray-400 max-w-[600px] mx-auto mb-12">
          PXI is where it lives.{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-neutral-600 to-white font-bold">
            Forever.
          </span>
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <a
            href={PXI_APP_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto bg-[var(--color-pxi-purple)] text-white px-8 py-4 rounded-full text-sm font-bold tracking-wide transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(216,74,255,0.4)] flex items-center justify-center gap-2"
            data-cursor-hover
          >
            Download on App Store
          </a>
          <Link
            href="/events"
            className="w-full sm:w-auto bg-white/5 border border-white/10 text-white px-8 py-4 rounded-full text-sm font-bold tracking-wide transition-all duration-300 hover:bg-white/10 hover:border-white/20 flex items-center justify-center gap-2 group"
            data-cursor-hover
          >
            See it live
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
