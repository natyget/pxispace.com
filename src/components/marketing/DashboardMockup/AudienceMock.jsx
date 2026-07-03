'use client';

import React from 'react';

/**
 * Behavioral audience demo: what an organizer actually knows about the
 * people who show up, and the segments built from it.
 */
const GUESTS = [
  {
    avatar: '/landing/album/thread/profiles/trina.jpg',
    name: 'Trina M.',
    line: '9 nights · $412 lifetime · Afrobeats, Amapiano',
    chips: ['Early buyer', 'Brings friends'],
  },
  {
    avatar: '/landing/album/thread/profiles/kevin.jpg',
    name: 'Kevin O.',
    line: '5 nights · $180 lifetime · House, Disco',
    chips: ['Bar spender'],
  },
  {
    avatar: '/landing/album/thread/profiles/baba.jpg',
    name: 'Baba K.',
    line: '11 nights · $560 lifetime · Amapiano, Gqom',
    chips: ['VIP regular', 'High engagement'],
  },
  {
    avatar: '/landing/album/thread/profiles/gift.jpg',
    name: 'Gift A.',
    line: '4 nights · $145 lifetime · Afrobeats, R&B',
    chips: ['Early buyer'],
  },
];

const INTEL = [
  { label: 'Repeat rate', value: '62%' },
  { label: 'Top genre', value: 'Amapiano' },
  { label: 'Avg spend', value: '$41/night' },
];

export default function AudienceMock() {
  return (
    <div className="text-white">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400">
        Audience · behavioral profiles
      </p>

      <div className="mt-2.5 space-y-1.5">
        {GUESTS.map((g) => (
          <div key={g.name} className="flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5">
            <img src={g.avatar} alt="" aria-hidden className="h-9 w-9 rounded-full object-cover" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{g.name}</p>
              <p className="truncate text-[11px] text-zinc-500">{g.line}</p>
            </div>
            <div className="hidden shrink-0 flex-col items-end gap-1 sm:flex">
              {g.chips.map((c) => (
                <span key={c} className="rounded-full bg-pxi-purple/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-pxi-purple">
                  {c}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-2.5 grid grid-cols-3 gap-2">
        {INTEL.map((r) => (
          <div key={r.label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-2.5 py-2">
            <p className="text-[9px] uppercase tracking-wider text-zinc-500">{r.label}</p>
            <p className="text-sm font-black text-white">{r.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-2.5 flex items-center justify-between rounded-xl border border-pxi-purple/20 bg-pxi-purple/[0.06] px-3 py-2.5">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-pxi-purple">Segment · Warm crowd</p>
          <p className="text-[11px] text-zinc-400">234 people · showed up 2+ times this season</p>
        </div>
        <span className="text-[10px] font-semibold text-zinc-400">SMS · email · feed</span>
      </div>
    </div>
  );
}
