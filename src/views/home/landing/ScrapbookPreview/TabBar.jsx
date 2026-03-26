'use client';

import React from 'react';
import { motion, useTransform } from 'framer-motion';

export default function TabBar({ progress }) {
  const threadColor = useTransform(progress, [0.82, 0.87], ['#fff', 'rgba(255,255,255,0.5)']);
  const galleryColor = useTransform(
    progress,
    [0.82, 0.87],
    ['rgba(255,255,255,0.5)', '#fff']
  );
  const activeTabX = useTransform(progress, [0.82, 0.87], ['0%', '100%']);
  const barOpacity = useTransform(
    progress,
    [0.25, 0.29, 0.52, 0.56, 0.79, 0.83],
    [0, 1, 1, 0, 0, 1]
  );

  return (
    <motion.div
      className="absolute top-[52px] left-0 w-full z-[60] px-3 flex justify-center pointer-events-none"
      style={{ opacity: barOpacity }}
    >
      <div className="relative flex w-full max-w-[260px] bg-white/[0.06] rounded-full p-1 border border-white/[0.1] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl">
        <motion.div
          className="absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] pxi-home-purple rounded-full"
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
