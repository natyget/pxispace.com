'use client';

import React from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { SentIcon } from '@hugeicons/core-free-icons';
import { glassOther } from './glassStyles';

export default function ChatBar() {
  return (
    <div className="w-full bg-black/85 border-t border-white/10 p-3 flex items-center gap-3 pb-8">
      <div className={`flex-1 rounded-[22px] px-4 py-3 ${glassOther}`}>
        <span className="text-[15px] text-white/45">Message...</span>
      </div>
      <div className="w-[44px] h-[44px] rounded-full pxi-home-purple flex items-center justify-center flex-shrink-0 ring-1 ring-white/15">
        <HugeiconsIcon icon={SentIcon} className="w-5 h-5 text-white" />
      </div>
    </div>
  );
}
