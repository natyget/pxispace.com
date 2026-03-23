'use client';

import React from 'react';

export default function ChatBubble({ isMe, handle, avatar, time, children }) {
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
          className={`relative px-4 py-3 rounded-[20px] shadow-sm ${
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
          <p className="text-[15px] leading-[20px] text-white/90 break-words">{children}</p>
          <span className="block text-[10px] text-white/40 text-right mt-2">{time}</span>
        </div>
      </div>
    </div>
  );
}
