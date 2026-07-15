import { JsonLd } from '@/components/seo/JsonLd';
import BrandedTicketingView from '@/views/features/BrandedTicketingView';

export const metadata = {
  title: 'Branded Event Ticketing — Your Tickets, Your Brand, Your Revenue',
  description:
    "Deploy PXI's frictionless ticketing infrastructure in your own brand. Web-based sign-ups, Stripe integration, and tickets that carry your covers, your colors, and your stamps. Built for modern nightlife promoters.",
  alternates: {
    canonical: 'https://pxispace.com/features/branded-event-ticketing',
  },
  openGraph: {
    title: 'Branded Event Ticketing — Your Tickets, Your Brand, Your Revenue | PXI',
    description:
      "Deploy PXI's frictionless ticketing infrastructure with Stripe integration and tickets that carry your own covers, colors, and stamps.",
    url: 'https://pxispace.com/features/branded-event-ticketing',
  },
};

const PAGE_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'PXI Branded Event Ticketing',
  operatingSystem: 'iOS',
  applicationCategory: 'BusinessApplication',
  url: 'https://pxispace.com/features/branded-event-ticketing',
  description:
    "Frictionless branded event ticketing infrastructure for modern nightlife promoters. Web-based Partial User sign-ups, Stripe Destination Charges, and tickets that carry the organizer's own covers, colors, and stamps.",
  featureList: [
    'Branded Event Ticketing (Your Covers, Your Colors, Your Stamps)',
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

export default function BrandedTicketingPage() {
  return (
    <>
      <h1 className="sr-only">
        Branded Event Ticketing Software — PXI
      </h1>
      <BrandedTicketingView />
      <JsonLd data={PAGE_JSONLD} />
    </>
  );
}
