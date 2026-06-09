'use client';

import React, { useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ImageIcon } from '@hugeicons/core-free-icons';
import { displayImageSrc } from '@/lib/mediaUrl';

/**
 * Album / media thumbnail for notification rows — spinner while loading, icon fallback on error.
 */
export default function NotificationMediaThumb({
  url,
  width,
  height,
  borderRadius = 10,
  className = '',
}) {
  const src = displayImageSrc(url, null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const showImg = Boolean(src) && !failed;
  const sizeStyle =
    width != null && height != null
      ? { width, height, borderRadius }
      : { borderRadius };

  return (
    <div
      className={`relative overflow-hidden bg-[#0a0a0a] shrink-0 ${className}`}
      style={sizeStyle}
    >
      {showImg ? (
        <>
          {!loaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-800">
              <div
                className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white/50 animate-spin"
                aria-hidden
              />
            </div>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            onLoad={() => setLoaded(true)}
            onError={() => {
              setFailed(true);
              setLoaded(false);
            }}
          />
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-800">
          <HugeiconsIcon icon={ImageIcon} size={20} className="text-zinc-600" />
        </div>
      )}
    </div>
  );
}
