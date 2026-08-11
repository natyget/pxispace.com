// Shared-album landing page. Server component so crawlers get per-album OG
// tags (cover image, photo/people counts) — as a 'use client' page this
// inherited the root layout's static PXI-logo card, which is why shared album
// links unfurled with the logo instead of the album cover. Rendering stays in
// PublicAlbumClient, unchanged.

import { getSiteUrl } from '@/lib/siteUrl';
import { getPublicAlbumMeta } from '@/lib/publicAlbum';
import { buildShareMetadata, resolveShareOgImage } from '@/lib/shareMetadata';
import PublicAlbumClient from '@/views/public/album/PublicAlbumClient';

export const dynamic = 'force-dynamic';

function fallbackAlbumMetadata(site, id, { denied = false } = {}) {
  return buildShareMetadata({
    site,
    canonical: `${site}/album/${id}`,
    title: denied ? 'Private album' : 'Album',
    description: denied
      ? 'This album is private — open your invite link in the PXI app to see the night.'
      : 'Relive the night on PXI.',
    ogImage: resolveShareOgImage(site),
    ogAlt: 'PXI',
    robots: { index: false, follow: false },
  });
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const site = getSiteUrl();

  try {
    const { album, denied } = await getPublicAlbumMeta(String(id));
    if (!album) return fallbackAlbumMetadata(site, id, { denied });

    const eventName = album.event?.name || album.name || 'Album';
    const counts = [
      Number(album.mediaCount) > 0 ? `${album.mediaCount} photos` : null,
      Number(album.memberCount) > 0 ? `${album.memberCount} people` : null,
    ].filter(Boolean);
    const description = counts.length
      ? `${counts.join(' · ')} — see the night from ${eventName} on PXI.`
      : `See the night from ${eventName} on PXI.`;

    return buildShareMetadata({
      site,
      canonical: `${site}/album/${id}`,
      title: eventName,
      description,
      ogImage: resolveShareOgImage(site, album.ogImageUrl, album.coverImage),
      ogAlt: eventName,
    });
  } catch (error) {
    console.error('[album/[id]/metadata]', { id, error });
    return fallbackAlbumMetadata(site, id);
  }
}

export default async function PublicAlbumPage({ params }) {
  const { id } = await params;
  if (!id) return null;
  return <PublicAlbumClient albumId={String(id)} />;
}
