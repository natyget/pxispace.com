import Home from '@/views/home/Home';
import { JsonLd } from '@/components/seo/JsonLd';
import { HOMEPAGE_JSONLD } from '@/lib/seo/schemas';

const TITLE = 'PXI — Tickets, One Shared Camera Roll & the Morning-After Scrapbook';
const DESCRIPTION =
  'Never lose the night. PXI is the event app for tickets, a live shared camera roll, and a scrapbook that compiles itself the morning after — for attendees and organizers.';

export const metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: {
    canonical: 'https://pxispace.com',
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: 'https://pxispace.com',
    images: [{ url: '/og-hero.png', width: 1200, height: 630, alt: 'PXI' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: ['/og-hero.png'],
  },
};

export default function Page() {
  return (
    <>
      {/* Descriptive sr-only copy for SEO; the visible H1 lives in HeroEditorial */}
      <p className="sr-only">
        PXI is an event platform for tickets, a live shared camera roll, and the morning-after
        scrapbook. Discover events, RSVP or buy tickets, shoot into one shared gallery, earn
        verified passport stamps, and share your night to Instagram in one tap.
      </p>
      <Home />
      <JsonLd data={HOMEPAGE_JSONLD} />
    </>
  );
}
