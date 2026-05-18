'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { HugeiconsIcon } from '@hugeicons/react';
import { HelpCircleIcon } from '@hugeicons/core-free-icons';
import AppStoreCtaPair from '@/components/links/AppStoreCtaPair';

export default function TheEthos() {
  return (
    <section
      id="ethos"
      className="py-24 md:py-36 bg-[#050505] relative overflow-hidden"
    >
      {/* Thin neon accent line */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-[1px] bg-gradient-to-r from-transparent via-pxi-purple to-transparent" />

      <div className="container mx-auto px-6 max-w-3xl relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: [0.2, 0.65, 0.3, 0.9] }}
          className="mb-8"
        >
          <HugeiconsIcon icon={HelpCircleIcon} className="w-12 h-12 text-pxi-purple mx-auto mb-6" strokeWidth={1.5} />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: [0.2, 0.65, 0.3, 0.9] }}
          className="text-4xl md:text-6xl lg:text-7xl font-black uppercase tracking-tighter leading-[0.9] mb-8"
        >
          Absolute Privacy.{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-pxi-purple to-pink-400">
            Zero Surveillance.
          </span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="text-zinc-400 text-base md:text-lg font-medium leading-relaxed mb-12 md:mb-16"
        >
          PXI champions the absolute sanctity of the underground. We believe in building social capital through earned, authentic interaction, not through the exploitation of your personal data. The PXI platform absolutely does not track user location data. All geographic intelligence is derived solely from the timestamped scans at the door, ensuring that your movements remain entirely your own. Immortalize the night, while keeping the specific details strictly confidential.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="flex justify-center"
        >
          <AppStoreCtaPair dataCursorHover />
        </motion.div>
      </div>
    </section>
  );
}
