'use client';

import React from 'react';
import { motion, useTransform } from 'framer-motion';

/** Longer hold on “Introducing PXI” so it’s readable before phone + thread take over */
export default function HeadlineOverlay({ progress }) {
  const opacity = useTransform(progress, (p) => {
    if (p < 0.02) return p / 0.02;
    if (p < 0.2) return 1;
    if (p < 0.27) return 1 - (p - 0.2) / 0.07;
    return 0;
  });

  const y = useTransform(progress, [0, 0.07], [24, 0]);
  const scale = useTransform(progress, [0.18, 0.27], [1, 0.96]);

  return (
    <motion.div
      className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-[5] text-center pointer-events-none w-full max-w-lg px-4"
      style={{ opacity, y, scale }}
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-pxi-purple/10 blur-[150px] -z-10" />
      <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase mb-4 text-transparent bg-clip-text bg-gradient-to-r from-pxi-purple via-pink-400 to-white">
        Introducing PXI
      </h1>
      <p className="text-xl md:text-2xl text-gray-400 font-medium max-w-sm mx-auto">
        The group chat that builds its own scrapbook.
      </p>
    </motion.div>
  );
}
