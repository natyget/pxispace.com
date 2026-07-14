'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

/**
 * Progressive media loading — mirrors mobile `ScrapbookThreadImage`
 * (AlbumThreadMediaCard.tsx): skeleton pulse → blurred thumbnail → hi-res fade-in.
 *
 * `src` is the hi-res layer; `blurSrc` (tiny thumbnail) decodes near-instantly and
 * sits underneath, slightly upscaled so the blur never shows a soft gutter at the
 * frame edge (same trick as mobile's `scale: 1.07`).
 */
export default function PublicAlbumBlurUpImage({
  src,
  blurSrc = null,
  width,
  height,
  fill = false,
  sizes,
  className = '',
  imgClassName = 'object-cover',
}) {
  const [hiResLoaded, setHiResLoaded] = useState(false);
  const [blurLoaded, setBlurLoaded] = useState(false);

  useEffect(() => {
    setHiResLoaded(false);
    setBlurLoaded(false);
  }, [src]);

  if (!src) return null;

  const showBlurLayer = Boolean(blurSrc && blurSrc !== src);
  const layerProps = fill
    ? { fill: true, sizes }
    : { width, height };

  return (
    <div className={`relative size-full overflow-hidden bg-[#0d0f15] ${className}`}>
      {/* Skeleton pulse — visible immediately before any image data is available */}
      {!hiResLoaded && !(showBlurLayer && blurLoaded) ? (
        <div className="absolute inset-0 animate-pulse bg-[#1e2130]" aria-hidden />
      ) : null}

      {showBlurLayer ? (
        <Image
          src={blurSrc}
          alt=""
          {...layerProps}
          unoptimized
          aria-hidden
          onLoad={() => setBlurLoaded(true)}
          className={`absolute inset-0 size-full scale-[1.07] blur-md transition-opacity duration-150 ${imgClassName} ${
            blurLoaded && !hiResLoaded ? 'opacity-100' : hiResLoaded ? 'opacity-0' : 'opacity-0'
          }`}
        />
      ) : null}

      <Image
        src={src}
        alt=""
        {...layerProps}
        unoptimized
        onLoad={() => setHiResLoaded(true)}
        className={`absolute inset-0 size-full transition-opacity duration-300 ${imgClassName} ${
          hiResLoaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
}
