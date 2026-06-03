'use client';

import Link from 'next/link';
import UserAvatar from '@/components/ui/UserAvatar';

export default function SenderAvatar({ user, size = 44, className = '' }) {
  const userId = user?.id;

  const shell = (
    <UserAvatar
      user={user}
      src={user?.avatarUrl}
      size={size}
      className={className}
      alt=""
    />
  );

  if (!userId) return shell;

  return (
    <Link href={`/u/${userId}`} className="shrink-0 rounded-full" aria-label="View profile">
      {shell}
    </Link>
  );
}
