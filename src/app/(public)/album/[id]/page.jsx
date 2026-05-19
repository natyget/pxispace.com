import Link from 'next/link';
import { getPublicAlbumMeta } from '@/lib/publicAlbum';
import { getSiteUrl } from '@/lib/siteUrl';
import { buildShareMetadata, resolveShareOgImage } from '@/lib/shareMetadata';
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
    return buildShareMetadata({
      site,
      canonical,
      title: 'Album',
      description: denied ? 'This album is private.' : 'This album could not be found.',
      ogImage: resolveShareOgImage(site),
      ogAlt: 'PXI',
      robots: { index: false, follow: false },
    });
  }

  const title =
    album.event?.name?.trim() ||
    album.name?.replace(/\s+Album$/i, '').trim() ||
    album.name ||
    'Album';

  const ogImage = resolveShareOgImage(
    site,
    album.ogImageUrl,
    album.event?.coverImage,
    album.coverImage,
  );

  return buildShareMetadata({
    site,
    canonical,
    title,
    description: `Shared album on PXI — view photos from ${title}.`,
    ogImage,
    ogAlt: title,
  });
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
