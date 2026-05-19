import Link from 'next/link';
import { getPublicAlbumMeta } from '@/lib/publicAlbum';
import { getSiteUrl } from '@/lib/siteUrl';
import { resolveDisplayImageUrl } from '@/lib/mediaUrl';
import { toOpenGraphImageUrl } from '@/lib/ogImageUrl';
import PublicAlbumBottomBar from '@/views/public/PublicAlbumBottomBar';
import PublicAlbumClient from '@/views/public/album/PublicAlbumClient';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function generateMetadata({ params }) {
  const { id } = await params;
  const site = getSiteUrl();
  const canonical = `${site}/album/${id}`;
  const { album, denied } = await getPublicAlbumMeta(id);

  if (!album || denied) {
    return {
      title: 'Album | PXI',
      description: denied ? 'This album is private.' : 'This album could not be found.',
      robots: { index: false, follow: false },
    };
  }

  const title =
    album.event?.name?.trim() ||
    album.name?.replace(/\s+Album$/i, '').trim() ||
    album.name ||
    'Album';

  const coverRaw = album.event?.coverImage || album.coverImage;
  const ogImageResolved = toOpenGraphImageUrl(site, coverRaw ? resolveDisplayImageUrl(coverRaw) : null);
  const ogImage = ogImageResolved || `${site}/favicon.svg`;

  return {
    title: `${title} — PXI`,
    description: `Shared album on PXI — view photos from ${title}.`,
    metadataBase: new URL(site),
    alternates: { canonical },
    openGraph: {
      type: 'website',
      url: canonical,
      siteName: 'PXI',
      title: `${title} — PXI`,
      description: `Shared album on PXI — view photos from ${title}.`,
      images: [{ url: ogImage, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} — PXI`,
      description: `Shared album on PXI — view photos from ${title}.`,
      images: [ogImage],
    },
  };
}

export default async function PublicAlbumPage({ params }) {
  const { id } = await params;
  const { album, denied } = await getPublicAlbumMeta(id);

  if (!album && !denied) {
    return (
      <div className="relative flex min-h-[60vh] flex-col items-center justify-center bg-black px-4 pb-40 pt-28 text-center text-white md:pt-32">
        <p className="text-lg font-semibold">Album not found</p>
        <p className="mt-2 max-w-sm text-sm text-zinc-500">This link may be invalid or the album was removed.</p>
        <Link href="/" className="mt-6 text-sm font-medium text-pxi-purple hover:text-white">
          Back to PXI
        </Link>
        <PublicAlbumBottomBar albumId={id} />
      </div>
    );
  }

  return <PublicAlbumClient albumId={id} initialAlbum={album} initialDenied={denied} />;
}
