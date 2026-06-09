'use client';

import { Message01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { NOTIFICATION_CARD_CLASS, NOTIFICATION_ROW_CLASS } from '../notificationStyles';

export default function ThreadMessageCard({ item, onClick }) {
  const { headline, subline } = item.copy || { headline: item.albumName, subline: '' };

  return (
    <button type="button" onClick={() => onClick?.(item)} className={`${NOTIFICATION_CARD_CLASS} w-full text-left`}>
      <div className={NOTIFICATION_ROW_CLASS}>
        <div className="w-12 h-12 rounded-full bg-[#0a0a0a] flex items-center justify-center shrink-0">
          <HugeiconsIcon icon={Message01Icon} size={28} color="rgba(255,255,255,0.42)" strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm leading-snug line-clamp-2">{headline}</p>
          {subline ? (
            <p className="text-white/40 text-sm mt-0.5 line-clamp-2">{subline}</p>
          ) : null}
          {item.time ? <p className="text-white/35 text-xs font-medium mt-1.5">{item.time}</p> : null}
        </div>
      </div>
    </button>
  );
}
