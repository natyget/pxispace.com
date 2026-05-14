'use client';

import React, { useMemo } from 'react';
import { motion, useTransform } from 'framer-motion';
import { GALLERY_IMAGE_URLS } from '@/lib/landingAssets';

const EMOJIS = ['🔥', '❤️', '😂', '📸', '✨', '🙌'];
const NAMES = ['Alex', 'Sarah', 'Mike', 'Jess', 'Jamie', 'Riley', 'Sam', 'Casey'];

export default function GalleryScene({ progress }) {
  const opacity = useTransform(progress, [0.75, 0.77], [0, 1]);
  const y = useTransform(
    progress,
    [0.77, 0.80, 0.81, 0.84, 0.87, 0.90],
    [0, -100, -130, -130, -220, -250]
  );

  const tiles = useMemo(() => {
    const baseTiles = GALLERY_IMAGE_URLS.map((url, i) => ({
      id: i,
      url,
      emoji: EMOJIS[i % EMOJIS.length],
      count: ((i * 7) % 50) + 10,
      name: NAMES[i % NAMES.length],
    }));
    // Repeat the 12 tiles to fill a large grid
    return [...baseTiles, ...baseTiles.map(t => ({ ...t, id: t.id + 100 }))];
  }, []);

  return (
    <motion.div
      className="absolute inset-0 bg-black z-40 pt-24 pb-20 px-1 flex flex-col overflow-hidden"
      style={{ opacity }}
    >
      <motion.div className="grid grid-cols-3 gap-1 px-1 will-change-transform" style={{ y }}>
        {tiles.map((img) => (
          <div
            key={img.id}
            className="relative aspect-square bg-[#111] overflow-hidden rounded-[3px] ring-1 ring-white/[0.06]"
          >
            <img
              src={img.url}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
            />
            <div className="absolute bottom-1.5 right-1.5 bg-black/55 rounded-[4px] px-1.5 py-0.5 flex items-center gap-1 border border-white/10">
              <span className="text-[8px]">{img.emoji}</span>
              <span className="text-[9px] font-bold text-white">{img.count}</span>
            </div>
            <div className="absolute top-1 left-1 max-w-[70%] truncate text-[8px] font-semibold text-white/85 drop-shadow-md">
              {img.name}
            </div>
          </div>
        ))}
      </motion.div>
    </motion.div>
  );
}

