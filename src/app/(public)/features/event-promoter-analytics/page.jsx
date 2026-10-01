import { JsonLd } from '@/components/seo/JsonLd';
import AnalyticsView from '@/views/features/AnalyticsView';
import { buildPageMetadata } from '@/lib/seo/pageMetadata';

export const metadata = buildPageMetadata({
  title: "Event Promoter ROI Analytics",
  description:
    "Know your room before the baseline drops. Track attendance funnels, promoter ROI, hype index, and crowd behavior in real time with PXI analytics.",
  path: "/features/event-promoter-analytics",
  eyebrow: "Feature",
  ogTitle: "Know the room before the baseline drops.",
});

const PAGE_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'PXI Event Promoter Analytics',
  operatingSystem: 'iOS',
  applicationCategory: 'BusinessApplication',
  url: 'https://pxispace.com/features/event-promoter-analytics',
  description:
    'Sales pace, turnout and attendance funnels, hype through the night and a venue heat map for event organizers.',
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
