'use client';

import React from 'react';
import { motion, useTransform } from 'framer-motion';
import { Send } from 'lucide-react';
import { THREAD_POST_SECOND, AVATAR_BABA, AVATAR_KEVIN } from '@/lib/landingAssets';
import { glassImageCard, glassOther } from './glassStyles';

const FLOAT_OFFSETS = [
  { x: 12, y: -40, r: 8 },
  { x: -20, y: -55, r: -12 },
  { x: 30, y: -70, r: 15 },
  { x: -8, y: -45, r: -5 },
  { x: 22, y: -60, r: 10 },
  { x: -25, y: -75, r: -18 },
];

export default function FocusScene({ progress }) {
  const opacity = useTransform(progress, [0.58, 0.64, 0.82, 0.87], [0, 1, 1, 0]);
  const scale = useTransform(progress, [0.58, 0.64], [0.9, 1]);
  const plusButtonScale = useTransform(progress, [0.68, 0.69, 0.71], [1, 0.8, 1]);
  const anchoredEmojiOpacity = useTransform(progress, [0.71, 0.73], [0, 1]);
  const anchoredEmojiScale = useTransform(progress, [0.71, 0.73], [0.5, 1]);
  const floatingEmojisOpacity = useTransform(progress, [0.73, 0.75, 0.81, 0.83], [0, 1, 1, 0]);
  const floatingEmojisY = useTransform(progress, [0.73, 0.83], [0, -150]);
  const newCommentOpacity = useTransform(progress, [0.78, 0.83], [0, 1]);
  const newCommentY = useTransform(progress, [0.78, 0.83], [20, 0]);
  const typingOpacity = useTransform(progress, [0.73, 0.78], [1, 0]);
  const textOpacity = useTransform(progress, [0.78, 0.83], [0, 1]);

  return (
    <motion.div
      className="absolute inset-0 bg-black/92 z-40 flex flex-col items-center justify-center pt-28 pb-24 px-3"
      style={{ opacity }}
    >
      <motion.div className="relative w-full max-w-[280px] mb-6" style={{ scale }}>
        <div className={`relative ${glassImageCard} aspect-[4/3]`}>
          <img
            src={THREAD_POST_SECOND}
            alt=""
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            className="absolute inset-0 h-full w-full object-cover"
            draggable={false}
          />
          <div className="absolute top-3 right-3 flex items-center gap-2 rounded-full bg-white/[0.09] px-2.5 py-1 border border-white/[0.14] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
            <span className="text-[12px] font-semibold text-white/95">Jess</span>
            <img
              src={AVATAR_BABA}
              alt="Jess"
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
          <div className="bg-white/[0.08] border border-white/[0.14] rounded-full px-2 py-1 flex items-center gap-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
            <span className="text-[14px]">❤️</span>
            <span className="text-[11px] font-bold text-white">8</span>
          </div>
          <motion.div
            className="bg-white/[0.08] border border-white/[0.14] rounded-full px-2 py-1 flex items-center gap-1.5 origin-left shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
            style={{ opacity: anchoredEmojiOpacity, scale: anchoredEmojiScale }}
          >
            <span className="text-[14px]">😂</span>
            <span className="text-[11px] font-bold text-white">1</span>
          </motion.div>
          <motion.div
            className="w-7 h-7 rounded-full bg-white/[0.08] border border-white/[0.18] flex items-center justify-center text-white/75 text-lg font-light origin-center shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
            style={{ scale: plusButtonScale }}
          >
            +
          </motion.div>
        </div>
        <motion.div
          className="absolute -right-4 top-1/2 pointer-events-none z-20"
          style={{ opacity: floatingEmojisOpacity, y: floatingEmojisY }}
        >
          {FLOAT_OFFSETS.map((o, i) => (
            <motion.div
              key={i}
              className="absolute text-2xl"
              initial={{ x: 0, y: 0 }}
              animate={{
                x: o.x,
                y: o.y,
                rotate: o.r,
              }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: i * 0.05 }}
            >
              😂
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
      <div className="flex flex-col gap-3 w-full items-center">
        <motion.div
          className={`rounded-[12px] p-2 pr-3 flex items-center gap-2 w-full max-w-[224px] rotate-[-1.5deg] ${glassOther}`}
          style={{ opacity: newCommentOpacity, y: newCommentY }}
        >
          <img
            src={AVATAR_KEVIN}
            alt=""
            width={28}
            height={28}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            className="w-7 h-7 rounded-full border border-white/20 ring-1 ring-white/10"
            draggable={false}
          />
          <div className="flex flex-col w-full min-w-0">
            <div className="flex justify-between items-center gap-2">
              <span className="text-[10px] font-semibold text-white/65 truncate">Jamie</span>
              <span className="text-[9px] text-white/35 shrink-0">Just now</span>
            </div>
            <span className="text-[13px] font-semibold text-white/95 leading-[17px]">
              That&apos;s me on the left! 😂
            </span>
          </div>
        </motion.div>
      </div>
      <div className="absolute bottom-0 left-0 w-full bg-black/75 border-t border-white/10 p-3 flex items-center gap-3 pb-8 z-50">
        <div className={`flex-1 rounded-[22px] px-4 py-3 relative overflow-hidden h-[42px] flex items-center ${glassOther}`}>
          <motion.span className="absolute text-[15px] text-white/45" style={{ opacity: typingOpacity }}>
            Typing...
          </motion.span>
          <motion.span className="absolute text-[15px] text-white/95" style={{ opacity: textOpacity }}>
            That&apos;s me on the left! 😂
          </motion.span>
        </div>
        <motion.div className="w-[42px] h-[42px] rounded-full pxi-home-purple flex items-center justify-center flex-shrink-0 ring-1 ring-white/15">
          <Send className="w-5 h-5 text-white" />
        </motion.div>
      </div>
    </motion.div>
  );
}
