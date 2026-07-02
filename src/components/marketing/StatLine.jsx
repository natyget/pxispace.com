'use client';

import React from 'react';
import { motion } from 'framer-motion';

/**
 * Posh-style typographic stats — one big sentence where the numbers read
 * white/bold and the surrounding words are muted. No cards, no chips.
 *
 * @param {{value:string, label:string}[]} items — value renders bold-white
 * @param {'purple'|'orange'|'none'} [accent] — tint applied to the value
 */
export default function StatLine({ items = [], accent = 'none', className = '' }) {
  if (!items.length) return null;
  const valueColor =
    accent === 'purple'
      ? 'text-pxi-purple'
      : accent === 'orange'
        ? 'text-pxi-orange'
        : 'text-white';

  return (
    <motion.p
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className={[
        'display-3 max-w-[900px] leading-[1.15] tracking-[-0.02em]',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ textWrap: 'balance' }}
    >
      {items.map((item, i) => (
        <span key={i}>
          <span className={valueColor}>{item.value}</span>{' '}
          <span className="text-zinc-500">{item.label}</span>
          {i < items.length - 1 ? <span className="text-zinc-700">{'  ·  '}</span> : null}
        </span>
      ))}
    </motion.p>
  );
}
