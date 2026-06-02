'use client';

import Link from 'next/link';
import { displayImageSrc } from '@/lib/mediaUrl';

export default function SenderAvatar({ user, size = 44, className = '' }) {
  const src = displayImageSrc(user?.avatarUrl, null);
  const userId = user?.id;
  const initial = (user?.name || user?.username || '?')[0];

  const img = src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className="w-full h-full object-cover" />
  ) : (
    <span className="text-zinc-500 font-bold text-lg">{initial}</span>
  );

  const shell = (
    <div
      className={`rounded-full overflow-hidden bg-[#0c0c0c] flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      {img}
    </div>
  );

  if (!userId) return shell;

  return (
    <Link href={`/u/${userId}`} className="shrink-0 rounded-full" aria-label="View profile">
      {shell}
    </Link>
  );
}
