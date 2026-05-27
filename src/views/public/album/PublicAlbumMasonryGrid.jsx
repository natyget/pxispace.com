'use client';

import Image from 'next/image';
import { displayImageSrc } from '@/lib/mediaUrl';
import { mediaDisplayUrl } from './albumMediaLayout';

function gridBadge(item) {
  const isVideo = String(item.type || '').toUpperCase() === 'VIDEO';
  if (isVideo) return { kind: 'video', emoji: '🎥' };
  const counts = item.reactionCounts;
  if (Array.isArray(counts) && counts.length > 0) {
    const top = [...counts].sort((a, b) => (b.count || 0) - (a.count || 0))[0];
    if (top && top.count > 0) return { kind: 'reaction', emoji: top.emoji, count: top.count };
  }
  return { kind: 'none' };
}

export default function PublicAlbumMasonryGrid({ items, onPressItem }) {
  return (
    <div className="grid grid-cols-3">
      {items.map((item, index) => {
        const src = displayImageSrc(mediaDisplayUrl(item), null);
        if (!src) return null;
        const authorSrc = displayImageSrc(item.author?.avatarUrl, null);
        const badge = gridBadge(item);

        return (
          <button
            key={item.id || index}
            type="button"
            onClick={() => onPressItem(index)}
            className="group relative aspect-square overflow-hidden border-[0.5px] border-white/5 bg-[#111] focus:outline-none focus-visible:ring-2 focus-visible:ring-pxi-purple"
          >
            <Image
              src={src}
              alt=""
              fill
              unoptimized
              className="object-cover transition group-hover:brightness-110"
              sizes="33vw"
            />
            {item.author && authorSrc ? (
              <span className="absolute bottom-1.5 left-1.5 size-6 overflow-hidden rounded-full border-[1.5px] border-white/50 bg-black/40">
                <Image src={authorSrc} alt="" width={24} height={24} unoptimized className="size-full object-cover" />
              </span>
            ) : null}
            {badge.kind !== 'none' ? (
              <span className="absolute bottom-1.5 right-1.5 flex items-center gap-0.5 rounded-lg border border-white/15 bg-black/50 px-1.5 py-0.5 text-[10px] font-bold text-white/90">
                <span>{badge.emoji}</span>
                {badge.kind === 'reaction' && badge.count ? <span>×{badge.count}</span> : null}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
