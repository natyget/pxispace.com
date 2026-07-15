'use client';

import React, { useState } from 'react';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import SectionShell from '@/components/marketing/SectionShell';
import CameraDemo, { SHOT } from '@/components/marketing/CameraDemo';

const MOODS = ['Regular', 'Snap', 'Dispo', 'Noir', 'Flash', 'Retro'];

/** Chapter two: doors open, the shared camera comes out. Six film moods. */
export default function ChapterShoot() {
  const [activeFilter, setActiveFilter] = useState(null);

  return (
    <div className="relative overflow-hidden">
      {/* Full-section blurred background that changes with the camera filter */}
      <AnimatePresence mode="sync">
        {activeFilter && (
          <Motion.div
            key={activeFilter.name}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.25 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.65, ease: 'easeInOut' }}
            className="pointer-events-none absolute inset-0 z-0 blur-[90px]"
            style={{
              maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
            }}
          >
            <img src={SHOT} alt="" className="h-full w-full object-cover" style={{ filter: activeFilter.imgFilter }} />
            {activeFilter.overlay && <div className="absolute inset-0" style={{ background: activeFilter.overlay }} />}
          </Motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10">
        <SectionShell eyebrow="Shoot it" pad="default" className="!border-none">
          <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-16">
            <Motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="md:order-2"
            >
              <h2 className="display-2 mt-5">Six film moods. One camera.</h2>
              <p className="body-lead mt-6 max-w-md">
                The event album opens at the doors. Swipe through the looks, shoot, and it's already
                where it belongs.
              </p>
            </Motion.div>

            <Motion.div
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="md:order-1"
            >
              <CameraDemo onFilterChange={setActiveFilter} />
            </Motion.div>
          </div>
        </SectionShell>
      </div>
    </div>
  );
}
