'use client';

import React from 'react';
import { motion } from 'framer-motion';

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

const SETS = [
  { time: '8–10 PM', dj: 'Deejay AJ', pct: 64, shots: 118, from: 'from-pxi-purple/40', to: 'to-pxi-purple', peak: false },
  { time: '10–12 AM', dj: 'Aytchpee', pct: 88, shots: 236, from: 'from-pxi-orange/40', to: 'to-pxi-orange', peak: true },
  { time: '12–2 AM', dj: 'Afrodesiac', pct: 76, shots: 171, from: 'from-pxi-purple/40', to: 'to-pxi-purple', peak: false },
];

export default function VenueMapMock() {
  return (
    <div className="text-white">
      <div className="mb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-pxi-orange shadow-[0_0_8px_var(--pxi-orange)]" />
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400">
            Live density · Warehouse 12
          </span>
        </div>
        <span className="text-[10px] text-zinc-600">11:42 PM</span>
      </div>

      {/* floor plan + reads */}
      <div className="flex flex-col gap-2.5 sm:flex-row">
        <div className="relative aspect-[16/10] flex-1 overflow-hidden rounded-xl border border-white/10 bg-[#0b0b0e]">
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
          {ZONES.map((z, i) => (
            // Density blooms in zone by zone, like the read is coming online.
            <motion.div
              key={z.name}
              className="absolute rounded-lg border border-white/10"
              style={{
                left: z.x,
                top: z.y,
                width: z.w,
                height: z.h,
                background: `radial-gradient(ellipse at center, rgba(${z.color},${0.14 + z.heat * 0.38}), rgba(${z.color},0.05))`,
              }}
              initial={{ opacity: 0, scale: 0.7 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.45, delay: 0.1 + i * 0.09, ease: 'easeOut' }}
            >
              <span className="absolute left-1.5 top-1 text-[8px] font-bold uppercase tracking-wider text-white/75">
                {z.name}
              </span>
              <span className="absolute bottom-1 right-1.5 text-[9px] font-black text-white">
                {Math.round(z.heat * 100)}%
              </span>
            </motion.div>
          ))}
        </div>

        {/* reads */}
        <div className="flex shrink-0 flex-row gap-2 sm:w-28 sm:flex-col">
          {READS.map((r) => (
            <div key={r.label} className="flex-1 rounded-xl border border-white/[0.06] bg-white/[0.02] px-2.5 py-2">
              <p className="text-[9px] uppercase tracking-wider text-zinc-500">{r.label}</p>
              <p className={`text-sm font-black ${r.tone}`}>{r.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* set engagement */}
      <p className="mb-1.5 mt-2.5 text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-500">
        Set engagement · time-stamped
      </p>
      <div className="space-y-1.5">
        {SETS.map((s, i) => (
          <div key={s.dj} className="flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-2.5 py-2">
            <span className="w-14 shrink-0 text-[9px] text-zinc-500">{s.time}</span>
            <span className="w-20 shrink-0 truncate text-[11px] font-semibold text-white">{s.dj}</span>
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
              <motion.span
                className={`block h-full rounded-full bg-gradient-to-r ${s.from} ${s.to}`}
                initial={{ width: '0%' }}
                whileInView={{ width: `${s.pct}%` }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.6, delay: 0.5 + i * 0.12, ease: 'easeOut' }}
              />
            </span>
            {s.peak ? (
              <span className="shrink-0 text-[9px] font-black uppercase tracking-wider text-pxi-purple">Peak</span>
            ) : null}
            <span className="w-9 shrink-0 text-right text-[10px] font-black text-white">{s.pct}%</span>
            <span className="w-16 shrink-0 text-right text-[9px] text-zinc-500">{s.shots} shots</span>
          </div>
        ))}
      </div>

      {/* artifact intel */}
      <div className="mt-1.5 flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2">
        <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Top artifact</span>
        <span className="text-[10px] font-semibold text-white">Neon LOVE wall · 212 shots · +9 min dwell</span>
      </div>
    </div>
  );
}
