'use client';

import React from 'react';

export default function PhoneFrame({ children }) {
  return (
    <div className="relative w-[85vw] max-w-[320px] aspect-[9/19.5] rounded-[44px] border-[2px] border-white/15 bg-black overflow-hidden shadow-[0_0_50px_rgba(176,38,255,0.15)]">
      <div className="absolute top-3 left-1/2 -translate-x-1/2 w-[100px] h-[30px] bg-black rounded-full z-50 flex items-center justify-between px-2">
        <div className="w-2 h-2 rounded-full bg-white/10" />
        <div className="w-2 h-2 rounded-full bg-white/10" />
      </div>
      <div className="absolute inset-[4px] rounded-[40px] overflow-hidden bg-black">
        {children}
      </div>
    </div>
  );
}
