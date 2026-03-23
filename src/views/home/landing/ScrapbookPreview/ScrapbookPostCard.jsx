'use client';

import React from 'react';
import { motion } from 'framer-motion';

export default function ScrapbookPostCard({
  image,
  author,
  avatar,
  rotation,
  reactions,
}) {
  return (
    <div className="relative w-full flex justify-center my-4">
      <motion.div className="relative w-[90%]" style={{ rotate: rotation }}>
        <div className="relative rounded-[20px] overflow-hidden aspect-[4/3] border border-white/10 shadow-lg">
          <img src={image} alt="" className="w-full h-full object-cover" />
          <div className="absolute top-3 right-3 bg-black/70 rounded-full px-2 py-1 flex items-center gap-2 backdrop-blur-md">
            <span className="text-[12px] font-medium text-white/90">@{author}</span>
            <img src={avatar} alt={author} className="w-5 h-5 rounded-full" />
          </div>
        </div>
        <div className="absolute -right-3 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 z-10">
          {reactions.map((r, i) => (
            <div
              key={i}
              className="bg-black/80 border border-white/10 rounded-full px-2 py-1 flex items-center gap-1.5 backdrop-blur-md"
            >
              <span className="text-[14px]">{r.emoji}</span>
              <span className="text-[11px] font-bold text-white">{r.count}</span>
            </div>
          ))}
          <div className="w-7 h-7 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white/70 backdrop-blur-md text-lg font-light">
            +
          </div>
        </div>
      </motion.div>
    </div>
  );
}
