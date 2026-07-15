import { JsonLd } from '@/components/seo/JsonLd';
import InstagramSharingView from '@/views/features/InstagramSharingView';
import { INSTA_FAQS } from '@/content/faqs';
import { buildFaqJsonLd, buildBreadcrumbJsonLd } from '@/lib/seo/schemas';

const TITLE = 'Share Event Photos to Instagram in One Tap';
const DESCRIPTION =
  'Turn any shot from your event scrapbook into a framed, captioned post card and share it to Instagram in one tap — for trips and organizer promo. No screenshots, no cropping.';
const URL = 'https://pxispace.com/features/instagram-event-sharing';
const OG = '/og-hero.png';

export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: URL },
  openGraph: { title: TITLE, description: DESCRIPTION, url: URL, images: [{ url: OG, width: 1200, height: 630, alt: 'Share to Instagram' }] },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION, images: [OG] },
};

const PAGE_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'PXI Instagram Event Sharing',
  operatingSystem: 'iOS',
  applicationCategory: 'EntertainmentApplication',
  url: URL,
  description:
    'One-tap sharing of event and trip photos to Instagram as beautifully framed, captioned post cards, sourced from the live shared gallery and morning-after scrapbook.',
  featureList: ['One-Tap Instagram Sharing', 'Auto-Framed Post Cards', 'Event & Trip Captions', 'Shared Gallery Source'],
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

export default function InstagramSharingPage() {
  return (
    <>
      <h1 className="sr-only">Share event and trip photos to Instagram in one tap — PXI</h1>
      <InstagramSharingView />
      <JsonLd data={PAGE_JSONLD} />
      <JsonLd data={buildFaqJsonLd(INSTA_FAQS)} />
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Features', path: '/platform' },
          { name: 'Instagram Sharing', path: '/features/instagram-event-sharing' },
        ])}
      />
    </>
  );
}
