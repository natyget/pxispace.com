'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import AppStoreCtaPair from '@/components/links/AppStoreCtaPair';

/**
 * Data-light social proof — one oversized quote + attribution + star row +
 * store badges. Accepts an array so more reviews can be added later without a
 * redesign; renders a single quote gracefully. Deliberately no fabricated
 * organizer counts.
 *
 * @param {{quote:string, attribution:string, rating?:number}[]} quotes
 * @param {boolean} [showStore]
 */
export default function QuoteWall({ quotes = [], showStore = true }) {
  const active = quotes[0];
  if (!active) return null;

  return (
    <div className="mx-auto max-w-4xl text-center">
      <motion.blockquote
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="display-3 mx-auto max-w-3xl font-semibold leading-[1.15] text-white"
        style={{ textWrap: 'balance' }}
      >
        “{active.quote}”
      </motion.blockquote>

      <div className="mt-8 flex flex-col items-center gap-3">
        <div className="flex items-center gap-1" aria-hidden>
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className="h-4 w-4 fill-pxi-orange text-pxi-orange" />
          ))}
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
          {active.attribution}
        </p>
      </div>

      {showStore ? (
        <div className="mt-10 flex justify-center">
          <AppStoreCtaPair className="justify-center" />
        </div>
      ) : null}
    </div>
  );
}
