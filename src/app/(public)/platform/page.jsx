import { JsonLd } from '@/components/seo/JsonLd';
import OrganizersView from '@/views/organizers/OrganizersView';

const TITLE = 'Event Ticketing Platform — Your Brand, Your Tickets, Your Revenue';
const DESCRIPTION =
  'Run your events on PXI: ticketing in your own brand with revenue paid straight to you, live door scanning, real-time analytics, and audience tools. Your brand, your room.';

export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: 'https://pxispace.com/platform',
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: 'https://pxispace.com/platform',
    images: [{ url: '/og?title=Your%20event.%20Your%20revenue.&eyebrow=The%20Platform', width: 1200, height: 630, alt: 'PXI Platform' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: ['/og?title=Your%20event.%20Your%20revenue.&eyebrow=The%20Platform'],
  },
};

const PAGE_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'PXI Event Command Center',
  operatingSystem: 'iOS',
  applicationCategory: 'BusinessApplication',
  url: 'https://pxispace.com/platform',
  description:
    'A comprehensive event operating system for organizers and promoters. Tickets in the organizer’s own brand, predictive analytics, promoter ROI attribution, and full event lifecycle management.',
  featureList: [
    'Branded Event Ticketing',
    'Stripe Destination Charges',
    'Real-Time Predictive Analytics',
    'Promoter Link Attribution',
    'Attendance Funnel Tracking',
    'Event Lifecycle Management',
  ],
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
};

export default function PlatformPage() {
  return (
    <>
      {/* Visible H1 lives in OrganizersView */}
      <p className="sr-only">
        PXI is the event platform for organizers and promoters: ticketing in your own brand with
        revenue paid straight to you, live door scanning, real-time analytics, and audience tools.
      </p>
      <OrganizersView />
      <JsonLd data={PAGE_JSONLD} />
    </>
  );
}
