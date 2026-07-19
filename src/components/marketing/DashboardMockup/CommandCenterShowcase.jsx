'use client';

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import MockFrame from './MockFrame';
import LiveScanMock from './LiveScanMock';
import VenueMapMock from './VenueMapMock';
import AudienceMock from './AudienceMock';
import CampaignMock from './CampaignMock';
import EarningsMock from './EarningsMock';

/**
 * The command center on display: one frame, five live tabs. Auto-advances;
 * clicking a tab pins it for a while.
 */
const TABS = [
  { id: 'door', label: 'Live door', view: LiveScanMock },
  { id: 'spatial', label: 'Spatial intel', view: VenueMapMock },
  { id: 'audience', label: 'Audience', view: AudienceMock },
  { id: 'campaigns', label: 'Campaigns', view: CampaignMock },
  { id: 'earnings', label: 'Earnings', view: EarningsMock },
];

const CYCLE_MS = 4200;

export default function CommandCenterShowcase() {
  const [idx, setIdx] = useState(0);
  const [pinnedUntil, setPinnedUntil] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      if (Date.now() < pinnedUntil) return;
      setIdx((i) => (i + 1) % TABS.length);
    }, CYCLE_MS);
    return () => clearInterval(id);
  }, [pinnedUntil]);

  const Active = TABS[idx].view;

  return (
    <MockFrame label="PXI Command Center" bootIn>
      {/* tabs — populate left to right right after the frame powers on */}
      <div className="mb-5 flex flex-wrap gap-1.5">
        {TABS.map((tab, i) => (
          <motion.button
            key={tab.id}
            type="button"
            onClick={() => {
              setIdx(i);
              setPinnedUntil(Date.now() + 12000);
            }}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.35, delay: 0.5 + i * 0.07, ease: 'easeOut' }}
            className={`rounded-full px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] transition-colors ${
              i === idx
                ? 'bg-white text-black'
                : 'bg-white/[0.05] text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {tab.label}
          </motion.button>
        ))}
      </div>

      <div className="h-[400px] md:h-[440px] overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={TABS[idx].id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <Active />
          </motion.div>
        </AnimatePresence>
      </div>
    </MockFrame>
  );
}
