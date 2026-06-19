'use client';

import { useState } from 'react';
import { displayImageSrc } from '@/lib/mediaUrl';
import AnonymousAvatarSilhouette from './AnonymousAvatarSilhouette';

/**
 * Profile avatar with resolved URL + anonymous silhouette fallback (never broken "?" images).
 */
export default function UserAvatar({
  user,
  src,
  size = 40,
  className = '',
  rounded = 'full',
  alt = '',
}) {
  const resolved = displayImageSrc(src ?? user?.avatarUrl, null);
  const [failed, setFailed] = useState(false);

  const radiusClass =
    rounded === 'full' ? 'rounded-full' : rounded === 'lg' ? 'rounded-xl' : 'rounded-md';

  if (!resolved || failed) {
    return <AnonymousAvatarSilhouette size={size} className={className} rounded={rounded} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={resolved}
      alt={alt}
      width={size}
      height={size}
      className={`object-cover shrink-0 bg-[#0c0c0c] ${radiusClass} ${className}`}
      style={{ width: size, height: size }}
      onError={() => setFailed(true)}
    />
  );
}
