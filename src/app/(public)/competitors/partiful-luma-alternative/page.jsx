import { JsonLd } from '@/components/seo/JsonLd';
import CompetitorComparisonView from '@/views/competitors/CompetitorComparisonView';
import { buildPageMetadata } from '@/lib/seo/pageMetadata';

export const metadata = buildPageMetadata({
  title: "Partiful Alternative for Nightlife Events",
  description:
    "Looking for a Partiful or Luma alternative? PXI is the premium event operating system with branded ticketing, live shared photo galleries, and a digital event passport — no rigid templates.",
  path: "/competitors/partiful-luma-alternative",
  eyebrow: "Comparison",
  ogTitle: "The premium alternative to Partiful and Luma.",
});

const PAGE_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'PXI vs Partiful, Luma & DICE',
  url: 'https://pxispace.com/competitors/partiful-luma-alternative',
  description:
    'A feature-by-feature comparison of PXI against Partiful, Luma, and DICE — highlighting branded ticketing, live shared galleries, and privacy-first event infrastructure.',
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
