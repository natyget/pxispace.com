import Home from '@/views/home/Home';
import { JsonLd } from '@/components/seo/JsonLd';
import { HOMEPAGE_JSONLD } from '@/lib/seo/schemas';

export const metadata = {
  title: 'PXI — Your Social Life, Unfiltered',
  description:
    'Plan events, capture every moment with shared cameras, and build a living scrapbook. Download PXI free on iOS.',
  alternates: {
    canonical: 'https://pxispace.com',
  },
  openGraph: {
    title: 'PXI — Your Social Life, Unfiltered',
    description:
      'Plan events, capture every moment, and build a living scrapbook. Free on iOS.',
    url: 'https://pxispace.com',
  },
};

export default function Page() {
  return (
    <>
      {/* Visually hidden H1 for SEO — visible heading is in client Hero component */}
      <h1 className="sr-only">
        PXI — The Event and Social Scrapbook App
      </h1>
      <Home />
      <JsonLd data={HOMEPAGE_JSONLD} />
    </>
  );
}
