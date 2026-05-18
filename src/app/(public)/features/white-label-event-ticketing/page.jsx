import { JsonLd } from '@/components/seo/JsonLd';
import WhiteLabelTicketingView from '@/views/features/WhiteLabelTicketingView';

export const metadata = {
  title: 'White-Label Event Ticketing Software',
  description:
    "Deploy PXI's frictionless white-label ticketing infrastructure. Web-based sign-ups, Stripe integration, zero third-party branding. Built for modern nightlife promoters.",
  alternates: {
    canonical: 'https://pxispace.com/features/white-label-event-ticketing',
  },
  openGraph: {
    title: 'White-Label Event Ticketing Software | PXI',
    description:
      "Deploy PXI's frictionless white-label ticketing infrastructure with Stripe integration and zero third-party branding.",
    url: 'https://pxispace.com/features/white-label-event-ticketing',
  },
};

const PAGE_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'PXI White-Label Event Ticketing',
  operatingSystem: 'iOS',
  applicationCategory: 'BusinessApplication',
  url: 'https://pxispace.com/features/white-label-event-ticketing',
  description:
    'Frictionless white-label event ticketing infrastructure for modern nightlife promoters. Web-based Partial User sign-ups, Stripe Destination Charges, and zero third-party branding.',
  featureList: [
    'White-Label Ticketing',
    'Stripe Destination Charges',
    'Partial User Web Sign-ups',
    'Event Lifecycle Management',
    'Promoter Link Attribution',
  ],
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
};

export default function WhiteLabelTicketingPage() {
  return (
    <>
      <h1 className="sr-only">
        White-Label Event Ticketing Software — PXI
      </h1>
      <WhiteLabelTicketingView />
      <JsonLd data={PAGE_JSONLD} />
    </>
  );
}
