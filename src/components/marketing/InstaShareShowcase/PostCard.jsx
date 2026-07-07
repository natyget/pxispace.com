'use client';

import React from 'react';
import { Navigation } from 'lucide-react';

/**
 * Web rebuild of the app's InstaSharePostCanvas — a framed square post card:
 * a blurred, darkened copy of the same photo as the backdrop, the photo itself
 * inset with a soft shadow, and a bottom-right brand row (title + location).
 * `mini` scales typography down for thumbnail strips.
 *
 * @param {{src:string, title:string, location:string}} photo
 * @param {boolean} [padded] — inset frame with blurred backdrop (default true)
 * @param {number} [total] — progress dashes count (omit to hide)
 * @param {number} [index] — active dash
 * @param {boolean} [mini] — thumbnail typography
 */
export default function PostCard({ photo, padded = true, total = 0, index = 0, mini = false, className = '' }) {
  return (
    <div
      className={['relative aspect-square w-full overflow-hidden bg-zinc-900', className]
        .filter(Boolean)
        .join(' ')}
    >
      {/* blurred backdrop of the same image */}
      {padded ? (
        <img
          src={photo.src}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full scale-110 object-cover opacity-45 blur-2xl brightness-50"
        />
      ) : null}

      {/* the framed photo */}
      <div className={padded ? 'absolute inset-0 z-10 flex items-center justify-center p-[10%]' : 'absolute inset-0'}>
        <div className="relative h-full w-full overflow-hidden shadow-[0_8px_16px_rgba(0,0,0,0.45)]">
          <img src={photo.src} alt={photo.title} className="h-full w-full object-cover" />
        </div>
      </div>

      {/* Social overlays on full card */}
      {!mini && padded && photo.overlays ? (
        <>
          {photo.overlays.map((overlay, idx) => (
            <div
              key={idx}
              className={`absolute z-30 flex max-w-[220px] items-center justify-center rounded-full bg-[#222]/85 px-3 py-1.5 shadow-[0_4px_12px_rgba(0,0,0,0.5)] backdrop-blur-md ${overlay.className}`}
            >
              <span className="truncate text-[12px] font-medium text-white">{overlay.text}</span>
            </div>
          ))}
        </>
      ) : null}

      {/* progress dashes */}
      {total > 1 ? (
        <div className="absolute inset-x-0 top-4 z-40 flex justify-center gap-1.5" aria-hidden>
          {Array.from({ length: total }).map((_, i) => (
            <span
              key={i}
              className={[
                'h-1.5 transition-all duration-500',
                i === index ? 'w-[18px] bg-white' : 'w-2 bg-white/40',
              ].join(' ')}
            />
          ))}
        </div>
      ) : null}

      {/* brand row */}
      {mini ? (
        <div className="absolute bottom-1 right-1.5 z-20 [text-shadow:0_1px_4px_rgba(0,0,0,0.9)]">
          <span className="text-[7px] font-bold uppercase tracking-wide text-white">{photo.title}</span>
        </div>
      ) : (
        <div className="absolute bottom-3 right-3 z-20 flex flex-col items-end gap-0.5 [text-shadow:0_2px_8px_rgba(0,0,0,0.8)]">
          <span className="text-sm font-semibold uppercase tracking-wide text-white md:text-base">
            {photo.title}
          </span>
          <span className="flex items-center gap-1 text-xs font-medium text-white/90">
            <Navigation className="h-3 w-3 fill-white text-white" />
            {photo.location}
          </span>
        </div>
      )}
    </div>
  );
}
