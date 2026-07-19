'use client';

import React from 'react';
import { motion } from 'framer-motion';
import CountUpNumber from '@/components/motion/CountUpNumber';

/** Stylized analytics scene: hype dial + funnel rows. Purple accent. */
const FUNNEL = [
  { label: 'Page views', pct: 100, value: '12,480' },
  { label: 'RSVPs', pct: 64, value: '7,990' },
  { label: 'Tickets', pct: 41, value: '5,120' },
  { label: 'Checked in', pct: 33, value: '4,110' },
];

export default function AnalyticsMock() {
  const hype = 87;
  const r = 34;
  const circ = 2 * Math.PI * r;

  return (
    <div className="flex flex-col gap-5 text-white sm:flex-row sm:items-center">
      {/* hype dial — the ring draws itself in like the score computing live */}
      <div className="relative mx-auto h-28 w-28 shrink-0">
        <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
          <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="7" />
          <motion.circle
            cx="40" cy="40" r={r} fill="none" stroke="var(--pxi-purple)" strokeWidth="7"
            strokeLinecap="round" strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            whileInView={{ strokeDashoffset: circ * (1 - hype / 100) }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 1, delay: 0.1, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black"><CountUpNumber to={hype} duration={1} /></span>
          <span className="text-[9px] uppercase tracking-wider text-zinc-500">Hype</span>
        </div>
      </div>

      {/* funnel — narrows in top to bottom, matching the drop-off it shows */}
      <div className="flex-1 space-y-2.5">
        {FUNNEL.map((f, i) => (
          <div key={f.label}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-white/80">{f.label}</span>
              <span className="text-zinc-500">{f.value}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-pxi-purple to-pxi-orange"
                initial={{ width: '0%' }}
                whileInView={{ width: `${f.pct}%` }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.6, delay: 0.1 + i * 0.15, ease: 'easeOut' }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
