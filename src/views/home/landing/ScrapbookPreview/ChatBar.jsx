'use client';

import React from 'react';
import { Send } from 'lucide-react';

export default function ChatBar() {
  return (
    <div className="w-full bg-black border-t border-white/10 p-3 flex items-center gap-3 pb-8">
      <div className="flex-1 bg-[#1c1c1c] border border-white/10 rounded-[22px] px-4 py-3">
        <span className="text-[15px] text-white/50">Message...</span>
      </div>
      <div className="w-[44px] h-[44px] rounded-full bg-[#d946ef] shadow-[0_0_8px_rgba(217,70,239,0.6)] flex items-center justify-center flex-shrink-0">
        <Send className="w-5 h-5 text-white" />
      </div>
    </div>
  );
}
