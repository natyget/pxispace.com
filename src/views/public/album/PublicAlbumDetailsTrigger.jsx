'use client';

import Image from 'next/image';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowRight01Icon, Calendar01Icon, Location01Icon } from '@hugeicons/core-free-icons';
import { displayImageSrc } from '@/lib/mediaUrl';

/**
 * Desktop-only compact resting state for the right-hand album details column.
 * Replaces the old always-expanded inline pane (which duplicated chrome with
 * its own "Event Details" header bar on top of the panel's own cover/title).
 * Clicking opens `EventDetailsModal` as a proper floating modal.
 */
export default function PublicAlbumDetailsTrigger({ title, coverSrc, schedule, location, onOpen }) {
  const resolvedCover = displayImageSrc(coverSrc, null);
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex w-full flex-col gap-4 rounded-[20px] bg-[rgba(26,26,26,0.6)] p-4 text-left text-white backdrop-blur-xl transition hover:bg-[rgba(26,26,26,0.78)]"
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-zinc-900">
        {resolvedCover ? (
          <Image src={resolvedCover} alt="" fill unoptimized className="object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-black" />
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
      </div>

      <div className="space-y-2">
        <h2 className="truncate text-lg font-black uppercase leading-tight tracking-tight text-white">{title}</h2>
        <div className="flex flex-col gap-1.5 text-[11px] text-white/55">
          {schedule?.primary ? (
            <span className="flex items-center gap-2">
              <HugeiconsIcon icon={Calendar01Icon} size={14} className="shrink-0 text-pxi-purple" />
              <span className="truncate">{schedule.primary}{schedule.secondary ? ` · ${schedule.secondary}` : ''}</span>
            </span>
          ) : null}
          {location?.primary ? (
            <span className="flex items-center gap-2">
              <HugeiconsIcon icon={Location01Icon} size={14} className="shrink-0 text-pxi-purple" />
              <span className="truncate">{location.primary}</span>
            </span>
          ) : null}
        </div>
      </div>

      <span className="mt-1 inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-pxi-purple transition group-hover:text-white">
        View event details
        <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
      </span>
    </button>
  );
}
