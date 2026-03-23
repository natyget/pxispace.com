'use client';

import React from 'react';
import { motion } from 'framer-motion';

const MILESTONES = [
  {
    large: 'Brooklyn Fashion Week',
    label: 'OFFICIAL EVENT PLATFORM',
  },
  {
    large: 'App Store',
    label: 'LAUNCHED & PROVEN',
  },
  {
    large: 'Cambridge, MA',
    label: 'LAUNCH MARKET',
  },
];

export default function Milestones() {
  return (
    <section className="bg-[var(--color-bg-primary)] py-20 px-6 md:px-10 border-y border-white/5 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-pxi-purple)]/5 via-transparent to-[var(--color-pxi-pink)]/5" />
      <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row justify-center md:justify-between items-center gap-10 md:gap-20 relative z-10">
        {MILESTONES.map((milestone, index) => (
          <React.Fragment key={index}>
            <motion.div
              className="flex flex-col items-center text-center group"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <h3 className="font-display font-bold text-white text-3xl md:text-4xl mb-3 group-hover:text-[var(--color-pxi-purple)] transition-colors duration-300">
                {milestone.large}
              </h3>
              <p className="text-xs font-black uppercase tracking-widest text-gray-500 group-hover:text-gray-400 transition-colors duration-300">
                {milestone.label}
              </p>
            </motion.div>
            {index < MILESTONES.length - 1 && (
              <div className="hidden md:block w-[1px] h-16 bg-white/10" />
            )}
            {index < MILESTONES.length - 1 && (
              <div className="block md:hidden w-16 h-[1px] bg-white/10" />
            )}
          </React.Fragment>
        ))}
      </div>
    </section>
  );
}
