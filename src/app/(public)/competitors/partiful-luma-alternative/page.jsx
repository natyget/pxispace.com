import { JsonLd } from '@/components/seo/JsonLd';
import CompetitorComparisonView from '@/views/competitors/CompetitorComparisonView';

export const metadata = {
  title: 'Partiful Alternative for Nightlife Events',
  description:
    'Looking for a Partiful or Luma alternative? PXI is the premium event operating system with white-label ticketing, live shared photo galleries, and a digital event passport — no rigid templates.',
  alternates: {
    canonical: 'https://pxispace.com/competitors/partiful-luma-alternative',
  },
  openGraph: {
    title: 'Partiful Alternative for Nightlife Events | PXI',
    description:
      'The premium alternative to Partiful, Luma, and DICE. White-label ticketing, live galleries, and digital scrapbooks.',
    url: 'https://pxispace.com/competitors/partiful-luma-alternative',
  },
};

const PAGE_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'PXI vs Partiful, Luma & DICE',
  url: 'https://pxispace.com/competitors/partiful-luma-alternative',
  description:
    'A feature-by-feature comparison of PXI against Partiful, Luma, and DICE — highlighting white-label ticketing, live shared galleries, and privacy-first event infrastructure.',
};

export default function PartifulLumaAlternativePage() {
  return (
    <>
      <h1 className="sr-only">
        Partiful Alternative for Nightlife Events — PXI
      </h1>
      <CompetitorComparisonView />
      <JsonLd data={PAGE_JSONLD} />
    </>
  );
}
