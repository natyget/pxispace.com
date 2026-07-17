'use client';

import Image from 'next/image';
import { Reveal } from '@/components/motion/Reveal';
import UserAvatar from '@/components/ui/UserAvatar';
import { displayImageSrc } from '@/lib/mediaUrl';
import { mediaDisplayUrl } from './albumMediaLayout';
import { formatVideoDuration } from './publicAlbumDate';
import { useGalleryVideoDuration } from './useGalleryVideoDuration';

function gridBadge(item) {
  const counts = item.reactionCounts;
  if (Array.isArray(counts) && counts.length > 0) {
    const top = [...counts].sort((a, b) => (b.count || 0) - (a.count || 0))[0];
    if (top && top.count > 0) return { kind: 'reaction', emoji: top.emoji, count: top.count };
  }
  return { kind: 'none' };
}

function GalleryGridTile({ item, index, onPressItem }) {
  const src = displayImageSrc(mediaDisplayUrl(item), null);
  const isVideo = String(item.type || '').toUpperCase() === 'VIDEO';
  const durationSec = useGalleryVideoDuration(item, isVideo);
  const durationLabel = isVideo ? formatVideoDuration(durationSec) : '';
  const badge = gridBadge(item);

  if (!src) return null;

  return (
    <button
      type="button"
      onClick={() => onPressItem(index)}
      className="group relative block aspect-square w-full overflow-hidden border-[0.5px] border-white/5 bg-[#111] focus:outline-none focus-visible:ring-2 focus-visible:ring-pxi-purple"
    >
      <Image
        src={src}
        alt=""
        fill
        unoptimized
        className="object-cover transition group-hover:brightness-110"
        sizes="33vw"
      />
      {durationLabel ? (
        <span className="pointer-events-none absolute left-1.5 top-1.5 z-[10] rounded-full bg-black/65 px-2 py-0.5 text-[10px] font-bold tabular-nums tracking-wide text-white">
          {durationLabel}
        </span>
      ) : null}
      {item.author ? (
        <span className="absolute bottom-1.5 left-1.5 size-6 overflow-hidden rounded-full border-[1.5px] border-white/50 bg-black/40">
          <UserAvatar user={{ avatarUrl: item.author?.avatarUrl }} size={24} className="size-full" />
        </span>
      ) : null}
      {badge.kind !== 'none' ? (
        <span className="absolute bottom-1.5 right-1.5 flex items-center gap-0.5 rounded-lg border border-white/15 bg-black/50 px-1.5 py-0.5 text-[10px] font-bold text-white/90">
          <span>{badge.emoji}</span>
          {badge.kind === 'reaction' && badge.count ? <span>{badge.count}</span> : null}
        </span>
      ) : null}
    </button>
  );
}

export default function PublicAlbumMasonryGrid({ items, onPressItem }) {
  // Per-tile viewport reveals (not a group stagger): long albums would queue
  // seconds of delay on the last tiles; independent reveals cascade naturally
  // as the user scrolls.
  return (
    <div className="grid grid-cols-3">
      {items.map((item, index) => (
        <Reveal key={item.id || index}>
          <GalleryGridTile item={item} index={index} onPressItem={onPressItem} />
        </Reveal>
      ))}
    </div>
  );
}
