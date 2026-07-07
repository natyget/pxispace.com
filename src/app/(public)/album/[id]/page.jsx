'use client';

// Shared-album landing page. Renders the full app-fidelity album experience
// (masonry gallery, thread with focus overlay, reactions, playlist, find-myself)
// via PublicAlbumClient — the previous inline grid/thread was a placeholder.

import { useParams } from 'next/navigation';
import PublicAlbumClient from '@/views/public/album/PublicAlbumClient';

export default function PublicAlbumPage() {
  const { id } = useParams();
  if (!id) return null;
  return <PublicAlbumClient albumId={String(id)} />;
}
