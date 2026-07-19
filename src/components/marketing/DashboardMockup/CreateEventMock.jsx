'use client';

import React from 'react';
import { motion } from 'framer-motion';
import MockFrame from './MockFrame';
import { HugeiconsIcon } from '@hugeicons/react';
import { ImageIcon } from '@hugeicons/core-free-icons';

/** Each form block fades/settles in top to bottom, like the event page
 *  filling itself out section by section. */
function FormBlock({ delay, children }) {
  return (
    <motion.div
      className="p-4 space-y-3"
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.45, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

export default function CreateEventMock() {
  return (
    <div className="w-full">
      <div className="space-y-4 text-left">
        {/* Mock Cover Upload */}
        <FormBlock delay={0.05}>
          <h2 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/60">
            <HugeiconsIcon icon={ImageIcon} size={14} />
            Cover image *
          </h2>
          <div className="flex h-24 w-full items-center justify-center rounded-xl bg-black/20">
            <div className="flex flex-col items-center gap-2">
              <HugeiconsIcon icon={ImageIcon} size={20} className="text-white opacity-30" />
              <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.15em]">Add cover</span>
            </div>
          </div>
        </FormBlock>

        {/* Mock Basics */}
        <FormBlock delay={0.16}>
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-white/60">Basics</h2>
          <div>
            <label className="mb-1 block text-[9px] font-bold uppercase tracking-widest text-white/45">Event name *</label>
            <div className="min-h-[36px] w-full rounded-xl px-3 py-2 text-xs text-white flex items-center bg-black/20">
              <span className="opacity-50">Enter event name</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[9px] font-bold uppercase tracking-widest text-white/45">Start *</label>
              <div className="min-h-[36px] w-full rounded-xl px-3 py-2 text-xs text-white flex items-center bg-black/20">
                <span className="opacity-50">Date & Time</span>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-[9px] font-bold uppercase tracking-widest text-white/45">End *</label>
              <div className="min-h-[36px] w-full rounded-xl px-3 py-2 text-xs text-white flex items-center bg-black/20">
                <span className="opacity-50">Date & Time</span>
              </div>
            </div>
          </div>
        </FormBlock>

        {/* Mock Configuration */}
        <FormBlock delay={0.27}>
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-white/60">Configuration</h2>
          
          <div className="flex items-center justify-between gap-4 rounded-xl px-3 py-2.5 bg-black/20">
            <div>
              <p className="text-[11px] font-bold text-white">Public event</p>
              <p className="text-[9px] text-zinc-500">Anyone can discover this event.</p>
            </div>
            <div className="relative h-5 w-9 rounded-full bg-white/10">
              <span className="absolute top-[2px] right-[2px] h-4 w-4 rounded-full bg-white/40" />
            </div>
          </div>
          
          <div className="flex items-center justify-between gap-4 rounded-xl px-3 py-2.5 bg-black/20">
            <div>
              <p className="text-[11px] font-bold text-white">Paid ticket</p>
              <p className="text-[9px] text-zinc-500">Requires verified vendor / Stripe.</p>
            </div>
            <div className="relative h-5 w-9 rounded-full bg-white/10">
              <span className="absolute top-[2px] right-[2px] h-4 w-4 rounded-full bg-white/40" />
            </div>
          </div>
          
          <div>
            <label className="mb-1 block text-[9px] font-bold uppercase tracking-widest text-white/45">Price in USD</label>
            <div className="flex items-center gap-2 rounded-xl px-3 py-2 bg-black/20">
              <span className="text-xs text-white/50">$</span>
              <span className="text-xs text-white opacity-50">0.00</span>
            </div>
          </div>
        </FormBlock>

        {/* Mock Tiers */}
        <FormBlock delay={0.38}>
          <div className="flex items-center justify-between">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-white/60">Ticket Tiers</h2>
            <span className="text-[9px] font-bold uppercase text-white bg-white/10 px-2 py-1 rounded-md">Add tier</span>
          </div>
          <div className="rounded-xl bg-black/20 p-3 flex justify-between items-center">
            <div>
              <p className="text-[11px] font-bold text-white">General Admission</p>
              <p className="text-[9px] text-zinc-400">Available • 150 capacity</p>
            </div>
            <p className="text-[11px] font-bold text-white">$25.00</p>
          </div>
          <div className="rounded-xl bg-black/20 p-3 flex justify-between items-center">
            <div>
              <p className="text-[11px] font-bold text-white">VIP Table (Group of 6)</p>
              <p className="text-[9px] text-zinc-400">Available • 10 capacity</p>
            </div>
            <p className="text-[11px] font-bold text-white">$300.00</p>
          </div>
          <div className="rounded-xl bg-black/20 p-3 flex justify-between items-center opacity-60">
            <div>
              <p className="text-[11px] font-bold text-white">Early Bird</p>
              <p className="text-[9px] text-zinc-400">Sold out • 50 capacity</p>
            </div>
            <p className="text-[11px] font-bold text-white">$15.00</p>
          </div>
        </FormBlock>

      </div>
    </div>
  );
}
