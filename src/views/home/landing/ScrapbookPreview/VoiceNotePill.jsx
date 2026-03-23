'use client';

import React from 'react';
import { motion } from 'framer-motion';

export default function VoiceNotePill({ isMe, handle, avatar, time, duration }) {
  const heights = [1, 2, 3, 2, 1, 3, 2];
  return (
    <div
      className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} items-end gap-2`}
    >
      {!isMe && avatar && (
        <img
          src={avatar}
          alt={handle}
          className="w-8 h-8 rounded-full border border-white/10 flex-shrink-0"
        />
      )}
      <div
        className={`flex flex-col max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}
      >
        <div
          className={`relative px-4 py-3 rounded-[20px] shadow-sm flex flex-col ${
            isMe
              ? 'bg-[rgba(176,38,255,0.15)] border border-[rgba(176,38,255,0.3)] rounded-br-[4px]'
              : 'bg-[#1c1c1c] border border-white/5 rounded-bl-[4px]'
          }`}
        >
          {!isMe && handle && (
            <span className="block text-[11px] font-medium text-white/50 mb-1">
              @{handle}
            </span>
          )}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 h-5">
              {heights.map((h, i) => (
                <motion.div
                  key={i}
                  className="w-1 bg-white/80 rounded-full"
                  animate={{
                    height: [`${h * 20}%`, `${h * 40}%`, `${h * 20}%`],
                  }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
                />
              ))}
            </div>
            <span className="text-[13px] font-medium text-white/90">{duration}</span>
          </div>
          <span className="block text-[10px] text-white/40 text-right mt-2">{time}</span>
        </div>
      </div>
    </div>
  );
}
