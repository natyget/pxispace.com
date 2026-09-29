import HomeView from '@/views/site/home/HomeView';
import { JsonLd } from '@/components/seo/JsonLd';
import { HOMEPAGE_JSONLD } from '@/lib/seo/schemas';
import { buildPageMetadata } from '@/lib/seo/pageMetadata';

const TITLE = 'PXI: Event Tickets, a Shared Camera Roll & Scrapbook';

export const metadata = {
  ...buildPageMetadata({
    title: TITLE,
    description:
      'PXI is the iPhone event app for tickets, one shared camera roll for the whole room, and a scrapbook that builds itself by morning. Free to download.',
    ogTitle: 'PXI: Never lose the night.',
    ogDescription:
      'Tickets, one shared camera roll for the whole room, and a scrapbook that builds itself by morning.',
    path: '/',
    image: '/og-hero.png',
    imageAlt: 'PXI: tickets, one shared camera roll and the morning-after scrapbook',
  }),
  // The brand name leads, so the layout's "| PXI" suffix would repeat it.
  title: { absolute: TITLE },
};

export default function Page() {
  return (
    <>
      <HomeView />
      <JsonLd data={HOMEPAGE_JSONLD} />
    </>
  );
}
