'use client';

import React from 'react';

/** Stylized earnings scene: payout total, "paid directly to you via Stripe"
 *  row, a small bar chart. Purple accent. */
const BARS = [40, 62, 48, 78, 90, 72, 100];

export default function EarningsMock() {
  return (
    <div className="text-white">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500">Net payout</p>
      <p className="mt-1 text-3xl font-black md:text-4xl">$18,430</p>

      <div className="mt-3 flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        <span className="text-zinc-400">Paid directly to you via Stripe · 0% held</span>
      </div>

      {/* bar chart */}
      <div className="mt-5 flex h-24 items-end gap-2">
        {BARS.map((h, i) => (
          <div key={i} className="flex-1 overflow-hidden rounded-t-md bg-gradient-to-t from-pxi-purple/30 to-pxi-purple" style={{ height: `${h}%` }} />
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[10px] uppercase tracking-wider text-zinc-600">
        <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
      </div>
    </div>
  );
}
