'use client';

import React from 'react';

export default function GifCard({ isMe, handle, avatar, time }) {
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
          className={`relative p-1.5 rounded-[20px] shadow-sm flex flex-col ${
            isMe
              ? 'bg-[rgba(176,38,255,0.15)] border border-[rgba(176,38,255,0.3)] rounded-br-[4px]'
              : 'bg-[#1c1c1c] border border-white/5 rounded-bl-[4px]'
          }`}
        >
          {!isMe && handle && (
            <span className="block text-[11px] font-medium text-white/50 mb-1 px-2.5 pt-1">
              @{handle}
            </span>
          )}
          <div className="relative rounded-[16px] overflow-hidden">
            <img
              src="https://media.giphy.com/media/3o7TKDk86TFSbK/giphy.gif"
              alt="GIF"
              className="w-full h-auto object-cover"
            />
            <div className="absolute bottom-2 left-2 bg-black/60 text-[9px] font-bold text-white px-1.5 py-0.5 rounded-[4px] backdrop-blur-sm">
              GIF
            </div>
          </div>
          <span className="block text-[10px] text-white/40 text-right mt-2 px-2.5 pb-1">
            {time}
          </span>
        </div>
      </div>
    </div>
  );
}
