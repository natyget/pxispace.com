import LineupPlaylistView from '@/views/public/LineupPlaylistView';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Lineup Playlist',
  description: 'A playlist from an event lineup on PXI.',
  robots: { index: false },
};

export default async function LineupPlaylistPage({ params }) {
  const { token } = await params;
  return <LineupPlaylistView token={token} />;
}
