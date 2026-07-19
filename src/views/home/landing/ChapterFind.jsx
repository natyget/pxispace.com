'use client';

import React from 'react';
import { motion } from 'framer-motion';
import SectionShell from '@/components/marketing/SectionShell';
import DiscoveryFlow from '@/components/marketing/DiscoveryFlow';
import MusicMatchTeaser from '@/components/marketing/MusicMatchTeaser';

const EASE = [0.16, 1, 0.3, 1];

/** Chapter one: spot the night, see who's going, lock your ticket. */
export default function ChapterFind() {
  return (
    <SectionShell eyebrow="Find it" pad="default">
      <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-16">
        <motion.div
          initial={{ opacity: 0, x: -28, filter: 'blur(6px)' }}
          whileInView={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
          viewport={{ once: false, margin: '-80px' }}
          transition={{ duration: 0.7, ease: EASE }}
        >
          <h2 className="display-2 mt-5">Find your kind of night.</h2>
          <p className="body-lead mt-6 max-w-md">
            See what's on, see who's pulling up, and lock your spot in two taps.
          </p>
        </motion.div>

        {/* "Deal the feed": the discovery card deals in from the right, like
            it's being dealt off a stack, and settles flat. */}
        <motion.div
          initial={{ opacity: 0, x: 64, rotate: 6, scale: 0.94 }}
          whileInView={{ opacity: 1, x: 0, rotate: 0, scale: 1 }}
          viewport={{ once: false, margin: '-80px' }}
          transition={{ duration: 0.75, ease: EASE }}
        >
          <DiscoveryFlow />
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, margin: '-80px' }}
        transition={{ duration: 0.6, ease: EASE }}
      >
        <MusicMatchTeaser />
      </motion.div>
    </SectionShell>
  );
}
