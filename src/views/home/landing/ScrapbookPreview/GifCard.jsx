'use client';

import React from 'react';
import { THREAD_REACTION_GIF } from '@/lib/landingAssets';
import { glassMe, glassOther } from './glassStyles';

export default function GifCard({ isMe, name, avatar, time, gifSrc = THREAD_REACTION_GIF }) {
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
          className={`relative p-1.5 rounded-[20px] flex flex-col ${
            isMe ? `${glassMe} rounded-br-[4px]` : `${glassOther} rounded-bl-[4px]`
          }`}
        >
          {label && (
            <span className="block text-[11px] font-semibold text-white/55 mb-1 px-2.5 pt-1">
              {label}
            </span>
          )}
          <div className="relative rounded-[16px] overflow-hidden">
            <img src={gifSrc} alt="GIF" className="w-full h-auto object-cover max-h-[200px] object-center" />
            <div className="absolute bottom-2 left-2 bg-black/55 text-[9px] font-bold text-white px-1.5 py-0.5 rounded-[4px] backdrop-blur-md border border-white/10">
              GIF
            </div>
          </div>
          <span className="block text-[10px] text-white/38 text-right mt-2 px-2.5 pb-1">
            {time}
          </span>
        </div>
      </div>
    </div>
  );
}
