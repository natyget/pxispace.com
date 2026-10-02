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
        'album-thread-chatbar shrink-0 border-t border-white/10 bg-black/90',
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
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-pxi-field text-[9px] font-extrabold tracking-wide text-white opacity-60"
        >
          GIF
        </div>
        <div
          className="flex min-h-11 flex-1 items-center rounded-[22px] bg-pxi-field px-4 py-3 text-[15px] text-white/35"
        >
          Type a message...
        </div>
        <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-pxi-purple opacity-40">
          <HugeiconsIcon icon={SentIcon} size={20} className="text-white" />
        </div>
      </div>
    </div>
  );
}
