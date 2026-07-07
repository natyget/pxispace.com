import PublicEventsPage from '@/views/publicEvents/PublicEventsPage';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildItemListJsonLd } from '@/lib/seo/schemas';
import { CITIES } from '@/lib/seo/cities';

const TITLE = 'Discover Events Near You';
const DESCRIPTION =
  'Browse parties, concerts, and social gatherings on PXI. See who’s going, buy tickets, and find your next night out — then keep the night in a shared scrapbook.';

export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: 'https://pxispace.com/events' },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: 'https://pxispace.com/events',
    images: [{ url: '/og?title=Discover%20events&eyebrow=PXI', width: 1200, height: 630, alt: 'Discover events on PXI' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: ['/og?title=Discover%20events&eyebrow=PXI'],
  },
};

export default function Page() {
  const cityList = Object.values(CITIES).map((c) => ({
    name: `Events in ${c.name}`,
    url: `/discover/${c.slug}`,
  }));
  return (
    <>
      <h1 className="sr-only">Discover Events on PXI</h1>
      <PublicEventsPage />
      <JsonLd data={buildItemListJsonLd(cityList, 'Discover events by city')} />
    </>
  );
}
