'use client';

import Image from 'next/image';
import { displayImageSrc } from '@/lib/mediaUrl';

export default function PublicAlbumParticipants({ participants = [], pinned = false }) {
  if (!participants.length) return null;

  return (
    <section
      className={`shrink-0 px-2 py-5 ${pinned ? 'mt-auto border-t border-white/[0.08] bg-black' : ''}`}
    >
      <p className="mb-3 px-2 text-[10px] font-black uppercase tracking-[0.24em] text-white/40">
        Participants
      </p>
      <div className={`flex gap-3 overflow-x-auto px-2 ${pinned ? '' : 'pb-2'}`}>
        {participants.map((p, i) => {
          const avatar = displayImageSrc(p.avatarUrl, null);
          return (
            <div key={`${p.userId}-${i}`} className="flex shrink-0 flex-col items-center gap-1.5">
              <div
                className={`size-16 overflow-hidden rounded-[20px] border-2 ${
                  p.role === 'OWNER'
                    ? 'border-[#d946ef] shadow-[0_0_10px_rgba(217,70,239,0.5)]'
                    : 'border-white/10'
                }`}
              >
                {avatar ? (
                  <Image src={avatar} alt="" width={64} height={64} unoptimized className="size-full object-cover" />
                ) : (
                  <div className="flex size-full items-center justify-center bg-zinc-800 text-zinc-500">?</div>
                )}
              </div>
              <span
                className={`text-[8px] font-bold uppercase tracking-[0.12em] ${
                  p.role === 'OWNER' ? 'text-fuchsia-400' : 'text-white/40'
                }`}
              >
                {p.role}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
