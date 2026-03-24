'use client';

import React from 'react';
import { motion, useTransform } from 'framer-motion';

export default function TabBar({ progress }) {
  const threadColor = useTransform(progress, [0.68, 0.73], ['#fff', 'rgba(255,255,255,0.5)']);
  const galleryColor = useTransform(
    progress,
    [0.68, 0.73],
    ['rgba(255,255,255,0.5)', '#fff']
  );
  const activeTabX = useTransform(progress, [0.68, 0.73], ['0%', '100%']);
  const barOpacity = useTransform(progress, [0.42, 0.46, 0.71, 0.75], [1, 0, 0, 1]);

  return (
    <motion.div
      className="absolute top-[72px] left-0 w-full z-[60] px-3 flex justify-center pointer-events-none"
      style={{ opacity: barOpacity }}
    >
      <div className="relative flex w-full max-w-[260px] bg-white/[0.06] rounded-full p-1 border border-white/[0.1] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl">
        <motion.div
          className="absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] bg-[#d946ef]/95 rounded-full shadow-[0_0_18px_rgba(217,70,239,0.45)]"
          style={{ x: activeTabX }}
        />
        <motion.div
          className="relative flex-1 py-2 text-center text-[10px] font-bold tracking-widest uppercase z-10"
          style={{ color: threadColor }}
        >
          Thread
        </motion.div>
        <motion.div
          className="relative flex-1 py-2 text-center text-[10px] font-bold tracking-widest uppercase z-10"
          style={{ color: galleryColor }}
        >
          Gallery
        </motion.div>
      </div>
    </motion.div>
  );
}
