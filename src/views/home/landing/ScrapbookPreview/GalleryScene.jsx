'use client';

import React from 'react';
import { motion, useTransform } from 'framer-motion';

const EMOJIS = ['🔥', '❤️', '😂', '📸', '✨', '🙌'];

const GALLERY_IMAGES = Array.from({ length: 18 }).map((_, i) => ({
  id: i,
  url: `https://picsum.photos/seed/gallery${i + 10}/400/400`,
  emoji: EMOJIS[i % EMOJIS.length],
  count: ((i * 7) % 50) + 10,
}));

export default function GalleryScene({ progress }) {
  const opacity = useTransform(progress, [0.7, 0.75], [0, 1]);

  return (
    <motion.div
      className="absolute inset-0 bg-black z-40 pt-40 pb-20 px-1 flex flex-col overflow-y-auto no-scrollbar"
      style={{ opacity }}
    >
      <div className="grid grid-cols-3 gap-1 px-1">
        {GALLERY_IMAGES.map((img) => (
          <div key={img.id} className="relative aspect-square bg-[#111] overflow-hidden">
            <img src={img.url} alt="" className="w-full h-full object-cover" />
            <div className="absolute bottom-1.5 left-1.5">
              <img
                src={`https://i.pravatar.cc/150?u=${img.id}`}
                alt=""
                className="w-5 h-5 rounded-full border border-white/20"
              />
            </div>
            <div className="absolute bottom-1.5 right-1.5 bg-black/50 rounded-[4px] px-1.5 py-0.5 flex items-center gap-1 backdrop-blur-sm">
              <span className="text-[8px]">{img.emoji}</span>
              <span className="text-[9px] font-bold text-white">{img.count}</span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
