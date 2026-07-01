import Home from '@/views/home/Home';
import { JsonLd } from '@/components/seo/JsonLd';
import { HOMEPAGE_JSONLD } from '@/lib/seo/schemas';

export const metadata = {
  title: 'PXI | Premier Event Operating System & Digital Scrapbook',
  description:
    'Transform nightlife with PXI. A privacy-first event operating system offering white-label ticketing for organizers and digital scrapbooks for attendees.',
  alternates: {
    canonical: 'https://pxispace.com',
  },
  openGraph: {
    title: 'PXI | Premier Event Operating System & Digital Scrapbook',
    description:
      'Transform nightlife with PXI. A privacy-first event operating system offering white-label ticketing for organizers and digital scrapbooks for attendees.',
    url: 'https://pxispace.com',
  },
};

export default function Page() {
  return (
    <>
      {/* Visually hidden H1 for SEO — visible heading is in client Hero component */}
      <h1 className="hidden">
        PXI — Premier Event Operating System & Digital Scrapbook
      </h1>
      <p className="sr-only">
        Not just ticketing — your shared memory app, camera, and event passport.
        Plan the party, share the camera roll, relive the nostalgia.
      </p>
      <Home />
      <JsonLd data={HOMEPAGE_JSONLD} />
    </>
  );
}
