'use client';

import React from 'react';
import { Send } from 'lucide-react';
import { glassOther } from './glassStyles';

export default function ChatBar() {
  return (
    <div className="w-full bg-black/80 border-t border-white/10 p-3 flex items-center gap-3 pb-8 backdrop-blur-xl">
      <div className={`flex-1 rounded-[22px] px-4 py-3 ${glassOther}`}>
        <span className="text-[15px] text-white/45">Message...</span>
      </div>
      <div className="w-[44px] h-[44px] rounded-full bg-[#d946ef] shadow-[0_0_12px_rgba(217,70,239,0.55)] flex items-center justify-center flex-shrink-0 ring-1 ring-white/15">
        <Send className="w-5 h-5 text-white" />
      </div>
    </div>
  );
}
