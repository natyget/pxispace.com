import SmartOpenAlbumRedirect from '@/components/links/SmartOpenAlbumRedirect';

export const dynamic = 'force-dynamic';

export default async function OpenAlbumPage({ params, searchParams }) {
  const { id } = await params;
  const sp = await searchParams;
  const title = typeof sp?.title === 'string' ? sp.title : '';

  return <SmartOpenAlbumRedirect albumId={id} title={title} />;
}
