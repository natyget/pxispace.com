'use client';

import React from 'react';
import { motion, useTransform } from 'framer-motion';
import { Send } from 'lucide-react';

const FLOAT_OFFSETS = [
  { x: 12, y: -40, r: 8 },
  { x: -20, y: -55, r: -12 },
  { x: 30, y: -70, r: 15 },
  { x: -8, y: -45, r: -5 },
  { x: 22, y: -60, r: 10 },
  { x: -25, y: -75, r: -18 },
];

export default function FocusScene({ progress }) {
  const opacity = useTransform(progress, [0.45, 0.5, 0.7, 0.75], [0, 1, 1, 0]);
  const scale = useTransform(progress, [0.45, 0.5], [0.9, 1]);
  const plusButtonScale = useTransform(progress, [0.55, 0.56, 0.58], [1, 0.8, 1]);
  const anchoredEmojiOpacity = useTransform(progress, [0.58, 0.6], [0, 1]);
  const anchoredEmojiScale = useTransform(progress, [0.58, 0.6], [0.5, 1]);
  const floatingEmojisOpacity = useTransform(progress, [0.6, 0.62, 0.68, 0.7], [0, 1, 1, 0]);
  const floatingEmojisY = useTransform(progress, [0.6, 0.7], [0, -150]);
  const newCommentOpacity = useTransform(progress, [0.65, 0.7], [0, 1]);
  const newCommentY = useTransform(progress, [0.65, 0.7], [20, 0]);
  const typingOpacity = useTransform(progress, [0.6, 0.65], [1, 0]);
  const textOpacity = useTransform(progress, [0.65, 0.7], [0, 1]);

  return (
    <motion.div
      className="absolute inset-0 bg-black/90 z-40 flex flex-col items-center justify-center pt-36 pb-24 px-4"
      style={{ opacity }}
    >
      <motion.div className="relative w-full max-w-[280px] mb-6" style={{ scale }}>
        <div className="relative rounded-[20px] overflow-hidden aspect-[4/3] border border-white/10 shadow-lg">
          <img
            src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&q=80"
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute top-3 right-3 bg-black/70 rounded-full px-2 py-1 flex items-center gap-2 backdrop-blur-md">
            <span className="text-[12px] font-medium text-white/90">@jess</span>
            <img
              src="https://i.pravatar.cc/150?u=jess"
              alt="jess"
              className="w-5 h-5 rounded-full"
            />
          </div>
        </div>
        <div className="absolute -right-3 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 z-10">
          <div className="bg-black/80 border border-white/10 rounded-full px-2 py-1 flex items-center gap-1.5 backdrop-blur-md">
            <span className="text-[14px]">❤️</span>
            <span className="text-[11px] font-bold text-white">8</span>
          </div>
          <motion.div
            className="bg-black/80 border border-white/10 rounded-full px-2 py-1 flex items-center gap-1.5 backdrop-blur-md origin-left"
            style={{ opacity: anchoredEmojiOpacity, scale: anchoredEmojiScale }}
          >
            <span className="text-[14px]">😂</span>
            <span className="text-[11px] font-bold text-white">1</span>
          </motion.div>
          <motion.div
            className="w-7 h-7 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white/70 backdrop-blur-md text-lg font-light origin-center"
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
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeOut',
                delay: i * 0.15,
              }}
            >
              😂
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
      <div className="flex flex-col gap-3 w-full items-center">
        <motion.div
          className="bg-white/20 border border-white/35 rounded-[10px] p-2 pr-3 flex items-center gap-2 shadow-[0_0_12px_rgba(255,255,255,0.15)] backdrop-blur-md w-full max-w-[224px] rotate-[-1.5deg]"
          style={{ opacity: newCommentOpacity, y: newCommentY }}
        >
          <img
            src="https://i.pravatar.cc/150?u=me"
            alt=""
            className="w-7 h-7 rounded-full border border-white/25"
          />
          <div className="flex flex-col w-full">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-white/60">me</span>
              <span className="text-[9px] text-white/35">Just now</span>
            </div>
            <span className="text-[13px] font-semibold text-white leading-[17px]">
              That&apos;s me on the left! 😂
            </span>
          </div>
        </motion.div>
      </div>
      <div className="absolute bottom-0 left-0 w-full bg-black/70 border-t border-white/10 p-3 flex items-center gap-3 pb-8 backdrop-blur-md">
        <div className="flex-1 bg-white/10 border border-white/10 rounded-[22px] px-4 py-3 relative overflow-hidden h-[42px] flex items-center">
          <motion.span className="absolute text-[15px] text-white/50" style={{ opacity: typingOpacity }}>
            Typing...
          </motion.span>
          <motion.span className="absolute text-[15px] text-white" style={{ opacity: textOpacity }}>
            That&apos;s me on the left! 😂
          </motion.span>
        </div>
        <motion.div
          className="w-[42px] h-[42px] rounded-full bg-[#d946ef] flex items-center justify-center flex-shrink-0 shadow-[0_0_8px_rgba(217,70,239,0.6)]"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Send className="w-5 h-5 text-white" />
        </motion.div>
      </div>
    </motion.div>
  );
}
