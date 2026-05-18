import { JsonLd } from '@/components/seo/JsonLd';
import AnalyticsView from '@/views/features/AnalyticsView';

export const metadata = {
  title: 'Event Promoter ROI Analytics',
  description:
    'Know your room before the baseline drops. Track attendance funnels, promoter ROI, hype index, and crowd behavior in real time with PXI analytics.',
  alternates: {
    canonical: 'https://pxispace.com/features/event-promoter-analytics',
  },
  openGraph: {
    title: 'Event Promoter ROI Analytics | PXI',
    description:
      'Real-time predictive analytics and promoter attribution for event organizers.',
    url: 'https://pxispace.com/features/event-promoter-analytics',
  },
};

const PAGE_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'PXI Event Promoter Analytics',
  operatingSystem: 'iOS',
  applicationCategory: 'BusinessApplication',
  url: 'https://pxispace.com/features/event-promoter-analytics',
  description:
    'Real-time predictive analytics, attendance funnel tracking, and promoter ROI attribution for event organizers.',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

export default function EventPromoterAnalyticsPage() {
  return (
    <>
      <h1 className="sr-only">
        Event Promoter ROI Analytics — PXI
      </h1>
      <AnalyticsView />
      <JsonLd data={PAGE_JSONLD} />
    </>
  );
}
