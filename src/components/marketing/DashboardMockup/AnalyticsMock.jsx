'use client';

import React from 'react';

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
      {/* hype dial */}
      <div className="relative mx-auto h-28 w-28 shrink-0">
        <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
          <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="7" />
          <circle
            cx="40" cy="40" r={r} fill="none" stroke="var(--pxi-purple)" strokeWidth="7"
            strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - hype / 100)}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black">{hype}</span>
          <span className="text-[9px] uppercase tracking-wider text-zinc-500">Hype</span>
        </div>
      </div>

      {/* funnel */}
      <div className="flex-1 space-y-2.5">
        {FUNNEL.map((f) => (
          <div key={f.label}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-white/80">{f.label}</span>
              <span className="text-zinc-500">{f.value}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
              <div className="h-full rounded-full bg-gradient-to-r from-pxi-purple to-pxi-orange" style={{ width: `${f.pct}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
