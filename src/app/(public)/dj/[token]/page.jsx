import DjPlaylistSubmitView from '@/views/public/DjPlaylistSubmitView';

export const dynamic = 'force-dynamic';

export default async function DjPlaylistSubmitPage({ params }) {
  const { token } = await params;
  return <DjPlaylistSubmitView token={token} />;
}
