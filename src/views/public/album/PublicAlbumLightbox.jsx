'use client';

import { useCallback, useEffect } from 'react';
import Image from 'next/image';
import { displayImageSrc } from '@/lib/mediaUrl';
import { mediaFullUrl } from './albumMediaLayout';

export default function PublicAlbumLightbox({ items, index, onClose, onIndexChange }) {
  const item = items[index];
  const src = item ? displayImageSrc(mediaFullUrl(item), null) : null;

  const goPrev = useCallback(() => {
    if (index > 0) onIndexChange(index - 1);
  }, [index, onIndexChange]);

  const goNext = useCallback(() => {
    if (index < items.length - 1) onIndexChange(index + 1);
  }, [index, items.length, onIndexChange]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose, goPrev, goNext]);

  if (!item || !src) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-black/95 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex items-center justify-between px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={onClose}
          className="rounded-full px-3 py-1.5 text-sm font-semibold text-white/80 hover:bg-white/10 hover:text-white"
        >
          Close
        </button>
        <p className="text-xs font-medium text-zinc-400">
          {index + 1} / {items.length}
        </p>
        <span className="w-14" aria-hidden />
      </div>

      <div className="relative flex flex-1 items-center justify-center px-4 pb-8">
        {index > 0 ? (
          <button
            type="button"
            onClick={goPrev}
            className="absolute left-2 z-10 rounded-full bg-white/10 px-3 py-2 text-white hover:bg-white/20 md:left-6"
            aria-label="Previous"
          >
            ‹
          </button>
        ) : null}

        <div className="relative flex max-h-[78vh] max-w-3xl flex-col items-center">
          <Image
            src={src}
            alt={item.caption || ''}
            width={1200}
            height={900}
            unoptimized
            className="max-h-[72vh] w-auto max-w-full rounded-lg object-contain"
          />
          {item.caption ? (
            <p className="mt-4 max-w-lg text-center text-sm text-zinc-300">{item.caption}</p>
          ) : null}
          {item.author?.username ? (
            <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              @{item.author.username}
            </p>
          ) : null}
        </div>

        {index < items.length - 1 ? (
          <button
            type="button"
            onClick={goNext}
            className="absolute right-2 z-10 rounded-full bg-white/10 px-3 py-2 text-white hover:bg-white/20 md:right-6"
            aria-label="Next"
          >
            ›
          </button>
        ) : null}
      </div>
    </div>
  );
}
