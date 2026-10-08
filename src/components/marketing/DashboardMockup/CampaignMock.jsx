'use client';

import React from 'react';

/** Campaigns demo: reach the right segment, watch it convert. */
const CAMPAIGNS = [
  { name: 'Last call', via: 'SMS', to: 'Warm crowd', size: '234', sent: '11:02 AM', conv: 18, tone: 'bg-pxi-purple' },
  { name: 'Lineup drop', via: 'feed', to: 'Everyone', size: '1,890', sent: 'Tue', conv: 9, tone: 'bg-pxi-orange' },
  { name: 'VIP upgrade', via: 'email', to: 'Big spenders', size: '61', sent: 'Mon', conv: 31, tone: 'bg-emerald-400' },
];

export default function CampaignMock() {
  return (
    <div className="text-white">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400">
        Campaigns for this event
      </p>

      <div className="mt-3 space-y-2.5">
        {CAMPAIGNS.map((c) => (
          <div key={c.name} className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">{c.name}<span className="ml-2 text-[11px] font-medium text-zinc-500">{c.via}</span></p>
              <span className="text-[10px] text-zinc-600">{c.sent}</span>
            </div>
            <p className="mt-0.5 text-[11px] text-zinc-500">{c.to}<span className="ml-2 text-zinc-600">{c.size}</span></p>
            <div className="mt-2 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
                <div className={`h-full rounded-full ${c.tone}`} style={{ width: `${c.conv * 2.8}%` }} />
              </div>
              <span className="text-[11px] font-bold text-white">{c.conv}% converted</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
