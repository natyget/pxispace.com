'use client';

import React from 'react';

/**
 * Spatial intel demo: a venue floor plan with live density. The kind of
 * room-level read other platforms don't give organizers.
 */
const ZONES = [
  { name: 'Dance floor', x: '30%', y: '34%', w: '40%', h: '34%', heat: 0.96, color: '240,31,255' },
  { name: 'Bar', x: '74%', y: '22%', w: '22%', h: '46%', heat: 0.72, color: '255,90,31' },
  { name: 'VIP', x: '4%', y: '10%', w: '22%', h: '30%', heat: 0.41, color: '240,31,255' },
  { name: 'Patio', x: '4%', y: '52%', w: '22%', h: '30%', heat: 0.33, color: '255,90,31' },
  { name: 'Entrance', x: '36%', y: '78%', w: '28%', h: '18%', heat: 0.58, color: '255,90,31' },
];

const READS = [
  { label: 'Dance floor', value: '96% full', tone: 'text-pxi-purple' },
  { label: 'Bar queue', value: '4 min', tone: 'text-pxi-orange' },
  { label: 'VIP dwell', value: '38 min avg', tone: 'text-white' },
];

export default function VenueMapMock() {
  return (
    <div className="text-white">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-pxi-orange shadow-[0_0_8px_var(--pxi-orange)]" />
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400">
            Live density · Warehouse 12
          </span>
        </div>
        <span className="text-[10px] text-zinc-600">11:42 PM</span>
      </div>

      {/* floor plan */}
      <div className="relative aspect-[16/9] overflow-hidden rounded-xl border border-white/10 bg-[#0b0b0e]">
        {/* grid texture */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
          aria-hidden
        />
        {ZONES.map((z) => (
          <div
            key={z.name}
            className="absolute rounded-lg border border-white/10"
            style={{
              left: z.x,
              top: z.y,
              width: z.w,
              height: z.h,
              background: `radial-gradient(ellipse at center, rgba(${z.color},${0.14 + z.heat * 0.38}), rgba(${z.color},0.05))`,
            }}
          >
            <span className="absolute left-1.5 top-1 text-[8px] font-bold uppercase tracking-wider text-white/75">
              {z.name}
            </span>
            <span className="absolute bottom-1 right-1.5 text-[9px] font-black text-white">
              {Math.round(z.heat * 100)}%
            </span>
          </div>
        ))}
      </div>

      {/* reads */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        {READS.map((r) => (
          <div key={r.label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2">
            <p className="text-[9px] uppercase tracking-wider text-zinc-500">{r.label}</p>
            <p className={`text-sm font-black ${r.tone}`}>{r.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
