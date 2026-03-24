'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { glassMe, glassOther } from './glassStyles';

export default function VoiceNotePill({ isMe, name, avatar, time, duration }) {
  const heights = [1, 2, 3, 2, 1, 3, 2];
  const label = isMe ? 'You' : name;

  return (
    <div
      className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} items-end gap-2`}
    >
      {!isMe && avatar && (
        <img
          src={avatar}
          alt={name || ''}
          className="w-8 h-8 rounded-full border border-white/15 flex-shrink-0 shadow-[0_2px_8px_rgba(0,0,0,0.4)]"
        />
      )}
      <div className={`flex flex-col max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
        <div
          className={`relative px-4 py-3 rounded-[20px] flex flex-col ${
            isMe ? `${glassMe} rounded-br-[4px]` : `${glassOther} rounded-bl-[4px]`
          }`}
        >
          {label && (
            <span className="block text-[11px] font-semibold text-white/55 mb-1">{label}</span>
          )}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 h-5">
              {heights.map((h, i) => (
                <motion.div
                  key={i}
                  className="w-1 bg-white/85 rounded-full"
                  animate={{
                    height: [`${h * 20}%`, `${h * 40}%`, `${h * 20}%`],
                  }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
                />
              ))}
            </div>
            <span className="text-[13px] font-medium text-white/90">{duration}</span>
          </div>
          <span className="block text-[10px] text-white/38 text-right mt-2">{time}</span>
        </div>
      </div>
    </div>
  );
}
