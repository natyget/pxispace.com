'use client';

import React from 'react';
import { motion } from 'framer-motion';
import SectionShell from '@/components/marketing/SectionShell';
import PhoneMockup from '@/components/ui/PhoneMockup';

const EASE = [0.16, 1, 0.3, 1];

/**
 * Chapter three: every shot lands in the shared thread, live. Back to the
 * real screenshot frames — a live recreation with mock data didn't read as
 * the actual product. The two phones still enter as ONE composed unit (no
 * jitter), no blur/glow bloom on the frames.
 */
export default function ChapterLive() {
  return (
    <SectionShell eyebrow="Watch it land" pad="default">
      <div className="flex flex-col items-center text-center">
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: '-80px' }}
          transition={{ duration: 0.6, ease: EASE }}
          className="display-2 mt-5 max-w-2xl"
        >
          Every shot lands in one thread.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: '-80px' }}
          transition={{ duration: 0.6, delay: 0.08, ease: EASE }}
          className="body-lead mt-6 max-w-lg"
        >
          The whole room shoots into the same album. Watch it fill up live and react while it
          happens.
        </motion.p>
      </div>

      {/* DOM order matters: the first phone's negative right-margin is what
          pulls the second into the overlapping stack (do not reorder). Both
          phones enter as ONE unit so they never move relative to each other. */}
      <motion.div
        className="relative mt-14 flex items-center justify-center"
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: false, margin: '-80px' }}
        transition={{ duration: 0.7, ease: EASE }}
      >
        <PhoneMockup
          title="Live event thread with photos streaming in"
          imgUrl="/landing/assets/thread_frame2.png"
          className="z-20 -mr-10 -rotate-3 sm:-mr-14"
        />
        <PhoneMockup
          title="Shared event gallery"
          imgUrl="/landing/assets/morning_frame2.png"
          className="z-10 mt-10 rotate-3 scale-[0.92]"
        />
      </motion.div>
    </SectionShell>
  );
}
