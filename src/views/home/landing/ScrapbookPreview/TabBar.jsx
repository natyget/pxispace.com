'use client';

import React from 'react';
import { motion, useTransform } from 'framer-motion';

export default function TabBar({ progress }) {
  const threadColor = useTransform(progress, [0.7, 0.75], ['#fff', 'rgba(255,255,255,0.5)']);
  const galleryColor = useTransform(
    progress,
    [0.7, 0.75],
    ['rgba(255,255,255,0.5)', '#fff']
  );
  const activeTabX = useTransform(progress, [0.7, 0.75], ['0%', '100%']);

  return (
    <div className="absolute top-24 left-0 w-full z-50 px-4 flex justify-center">
      <div className="relative flex w-full max-w-[280px] bg-[#1a1a1a] rounded-full p-1 border border-white/5 shadow-lg">
        <motion.div
          className="absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] bg-[#d946ef] rounded-full shadow-[0_0_15px_rgba(217,70,239,0.5)]"
          style={{ x: activeTabX }}
        />
        <motion.div
          className="relative flex-1 py-2.5 text-center text-[11px] font-bold tracking-widest uppercase z-10"
          style={{ color: threadColor }}
        >
          Thread
        </motion.div>
        <motion.div
          className="relative flex-1 py-2.5 text-center text-[11px] font-bold tracking-widest uppercase z-10"
          style={{ color: galleryColor }}
        >
          Gallery
        </motion.div>
      </div>
    </div>
  );
}
