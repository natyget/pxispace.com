'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { HugeiconsIcon } from '@hugeicons/react';
import { PinIcon } from '@hugeicons/core-free-icons';
import { glassImageCard } from './glassStyles';

export default function ScrapbookPostCard({
  image,
  authorName,
  avatar,
  rotation,
  reactions,
  pinned,
}) {
  return (
    <div className="relative w-full flex justify-center my-4">
      <motion.div className="relative w-[90%]" style={{ rotate: rotation }}>
        <div className={`relative ${glassImageCard} aspect-[4/3]`}>
          <img
            src={image}
            alt=""
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            className="absolute inset-0 h-full w-full object-cover"
            draggable={false}
          />
          {pinned && (
            <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white/95 backdrop-blur-md border border-white/15 shadow-lg">
              <HugeiconsIcon icon={PinIcon} className="w-3 h-3 text-amber-300" strokeWidth={2.5} />
              Pinned
            </div>
          )}
          <div className="absolute top-3 right-3 flex items-center gap-2 rounded-full bg-white/[0.09] px-2.5 py-1 backdrop-blur-xl border border-white/[0.14] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
            <span className="text-[12px] font-semibold text-white/95">{authorName}</span>
            <img
              src={avatar}
              alt=""
              width={20}
              height={20}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              className="w-5 h-5 rounded-full ring-1 ring-white/20"
              draggable={false}
            />
          </div>
        </div>
        <div className="absolute -right-3 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 z-10">
          {reactions.map((r, i) => (
            <div
              key={i}
              className="bg-white/[0.08] border border-white/[0.14] rounded-full px-2 py-1 flex items-center gap-1.5 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
            >
              <span className="text-[14px]">{r.emoji}</span>
              <span className="text-[11px] font-bold text-white">{r.count}</span>
            </div>
          ))}
          <div className="w-7 h-7 rounded-full bg-white/[0.08] border border-white/[0.18] flex items-center justify-center text-white/75 backdrop-blur-xl text-lg font-light shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
            +
          </div>
        </div>
      </motion.div>
    </div>
  );
}
