import { JsonLd } from '@/components/seo/JsonLd';
import OrganizersView from '@/views/organizers/OrganizersView';

export const metadata = {
  title: 'For Organizers & Promoters — Event Command Center',
  description:
    'Run your events on PXI. White-label ticketing, real-time analytics, promoter link attribution, and full lifecycle control. The operating system built for modern nightlife promoters.',
  alternates: {
    canonical: 'https://pxispace.com/organizers',
  },
  openGraph: {
    title: 'For Organizers & Promoters | PXI',
    description:
      'White-label ticketing, real-time analytics, and full event lifecycle control. Built for modern promoters.',
    url: 'https://pxispace.com/organizers',
  },
};

const PAGE_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'PXI Event Command Center',
  operatingSystem: 'iOS',
  applicationCategory: 'BusinessApplication',
  url: 'https://pxispace.com/organizers',
  description:
    'A comprehensive event operating system for organizers and promoters. White-label ticketing, predictive analytics, promoter ROI attribution, and full event lifecycle management.',
  featureList: [
    'White-Label Event Ticketing',
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

export default function OrganizersPage() {
  return (
    <>
      <h1 className="sr-only">
        PXI for Organizers & Promoters — Event Command Center
      </h1>
      <OrganizersView />
      <JsonLd data={PAGE_JSONLD} />
    </>
  );
}
