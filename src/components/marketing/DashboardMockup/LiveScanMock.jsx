'use client';

import React from 'react';

/** Stylized live door-scan scene: gates, orange velocity sparkline, admitted
 *  counter, one incident row. Orange = the "live" signal color. */
const GATES = [
  { name: 'Main Entrance', scanned: 812, pct: 92 },
  { name: 'VIP / Guest List', scanned: 214, pct: 64 },
  { name: 'Side Door', scanned: 96, pct: 38 },
];

const SPARK = [8, 14, 10, 22, 18, 30, 26, 38, 34, 44, 40, 52];

export default function LiveScanMock() {
  const max = Math.max(...SPARK);
  const pts = SPARK.map((v, i) => `${(i / (SPARK.length - 1)) * 100},${40 - (v / max) * 36}`).join(' ');

  return (
    <div className="text-white">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-pxi-orange shadow-[0_0_8px_var(--pxi-orange)]" />
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-pxi-orange">Live</span>
          </div>
          <p className="mt-1 text-3xl font-black md:text-4xl">1,122</p>
          <p className="text-xs text-zinc-500">admitted · 78% of capacity</p>
        </div>
        {/* velocity sparkline */}
        <svg viewBox="0 0 100 40" className="h-12 w-32" preserveAspectRatio="none">
          <polyline points={pts} fill="none" stroke="var(--pxi-orange)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        </svg>
      </div>

      <div className="space-y-2.5">
        {GATES.map((g) => (
          <div key={g.name} className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="font-medium text-white/80">{g.name}</span>
              <span className="text-zinc-500">{g.scanned} scanned</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
              <div className="h-full rounded-full bg-pxi-orange/80" style={{ width: `${g.pct}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs text-zinc-400">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
        Duplicate ticket flagged at Main Entrance · resolved
      </div>
    </div>
  );
}
