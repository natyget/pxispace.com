'use client';

import { HugeiconsIcon } from '@hugeicons/react';
import { SentIcon } from '@hugeicons/core-free-icons';
import { THREAD_CHATBAR_HORIZONTAL_INSET } from './albumLayoutConstants';

/**
 * Read-only composer chrome — mirrors mobile `ChatBar.tsx` layout (no input/send behavior).
 */
export default function PublicAlbumReadOnlyChatBar({ className = '' }) {
  return (
    <div
      className={[
        'album-thread-chatbar shrink-0 border-t border-white/10 bg-black/90 backdrop-blur-md',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-hidden
    >
      <div
        className="flex items-end gap-3 pt-3"
        style={{
          paddingLeft: THREAD_CHATBAR_HORIZONTAL_INSET,
          paddingRight: THREAD_CHATBAR_HORIZONTAL_INSET,
          paddingBottom: 'max(12px, env(safe-area-inset-bottom, 0px))',
        }}
      >
        <div
          className="flex size-11 shrink-0 items-center justify-center rounded-full border border-white/45 bg-white/[0.06] text-[9px] font-extrabold tracking-wide text-white opacity-60"
        >
          GIF
        </div>
        <div
          className="flex min-h-11 flex-1 items-center rounded-[22px] border border-white/[0.18] bg-[rgba(28,28,32,0.42)] px-4 py-3 text-[15px] text-white/35"
        >
          Type a message...
        </div>
        <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#d946ef] opacity-40 shadow-[0_0_8px_rgba(217,70,239,0.6)]">
          <HugeiconsIcon icon={SentIcon} size={20} className="text-white" />
        </div>
      </div>
    </div>
  );
}
