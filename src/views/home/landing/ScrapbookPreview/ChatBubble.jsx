'use client';

import React from 'react';
import { glassMe, glassOther } from './glassStyles';

export default function ChatBubble({ isMe, name, avatar, time, children }) {
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
          className={`relative px-4 py-3 rounded-[20px] ${
            isMe
              ? `${glassMe} rounded-br-[4px]`
              : `${glassOther} rounded-bl-[4px]`
          }`}
        >
          {label && (
            <span className="block text-[11px] font-semibold text-white/55 mb-1">{label}</span>
          )}
          <p className="text-[15px] leading-[20px] text-white/92 break-words">{children}</p>
          <span className="block text-[10px] text-white/38 text-right mt-2">{time}</span>
        </div>
      </div>
    </div>
  );
}
