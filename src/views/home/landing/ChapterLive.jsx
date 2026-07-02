'use client';

import React from 'react';
import { motion } from 'framer-motion';
import SectionShell from '@/components/marketing/SectionShell';
import PhoneMockup from '@/components/ui/PhoneMockup';

/** Chapter three: every shot lands in the shared thread, live. */
export default function ChapterLive() {
  return (
    <SectionShell eyebrow="Watch it land" pad="default">
      <div className="flex flex-col items-center text-center">
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="display-2 mt-5 max-w-2xl"
        >
          Every shot lands in one thread.
        </motion.h2>
        <p className="body-lead mt-6 max-w-lg">
          The whole room shoots into the same album. Watch it fill up live and react while it
          happens.
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="mt-14 flex items-center justify-center"
      >
        <PhoneMockup
          title="Live event thread with photos streaming in"
          imgUrl="/landing/assets/thread_frame2.png"
          className="z-20 -mr-10 -rotate-3 sm:-mr-14"
          glow
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
