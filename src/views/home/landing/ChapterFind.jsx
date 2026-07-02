'use client';

import React from 'react';
import { motion } from 'framer-motion';
import SectionShell from '@/components/marketing/SectionShell';
import DiscoveryFlow from '@/components/marketing/DiscoveryFlow';
import MusicMatchTeaser from '@/components/marketing/MusicMatchTeaser';

/** Chapter one: spot the night, see who's going, lock your ticket. */
export default function ChapterFind() {
  return (
    <SectionShell eyebrow="Find it" pad="default">
      <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 className="display-2 mt-5">Find your kind of night.</h2>
          <p className="body-lead mt-6 max-w-md">
            See what's on, see who's pulling up, and lock your spot in two taps.
          </p>
        </motion.div>

        <DiscoveryFlow />
      </div>

      <MusicMatchTeaser />
    </SectionShell>
  );
}
