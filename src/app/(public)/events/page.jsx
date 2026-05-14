import PublicEventsPage from '@/views/publicEvents/PublicEventsPage';

export const metadata = {
  title: 'Discover Events',
  description:
    'Browse trending events near you — concerts, parties, and social gatherings on PXI. Find your next night out.',
  alternates: { canonical: 'https://pxispace.com/events' },
  openGraph: {
    title: 'Discover Events on PXI',
    description: 'Browse trending events near you on PXI.',
    url: 'https://pxispace.com/events',
  },
};

export default function Page() {
  return (
    <>
      <h1 className="sr-only">Discover Events on PXI</h1>
      <PublicEventsPage />
    </>
  );
}
