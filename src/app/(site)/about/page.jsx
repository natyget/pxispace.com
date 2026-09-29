import AboutView from '@/views/site/about/AboutView';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildPageMetadata } from '@/lib/seo/pageMetadata';
import { ABOUT_JSONLD } from '@/views/site/about/about.jsonld';

const DESCRIPTION =
  "PXI builds event technology around the memory of the night: tickets in the organizer's own brand, one shared camera roll and a scrapbook by morning.";

export const metadata = buildPageMetadata({
  title: 'About PXI: Our Mission, Vision & Values',
  description: DESCRIPTION,
  ogTitle: 'Memory is the product.',
  eyebrow: 'Company',
  imageAlt: 'About PXI: Memory is the product',
  path: '/about',
});

export default function Page() {
  return (
    <>
      <AboutView />
      <JsonLd data={ABOUT_JSONLD} />
    </>
  );
}
