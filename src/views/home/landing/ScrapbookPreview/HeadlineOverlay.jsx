'use client';

import React from 'react';
import { motion, useTransform } from 'framer-motion';

export default function HeadlineOverlay({ progress }) {
  const opacity = useTransform(progress, [0, 0.05, 0.08, 0.12], [0, 1, 1, 0]);
  const y = useTransform(progress, [0, 0.05], [30, 0]);
  const scale = useTransform(progress, [0.08, 0.12], [1, 0.95]);

  return (
    <motion.div
      className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-0 text-center pointer-events-none w-full px-4"
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
