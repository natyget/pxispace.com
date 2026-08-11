import { JsonLd } from '@/components/seo/JsonLd';
import PassportView from '@/views/features/PassportView';
import { buildPageMetadata } from '@/lib/seo/pageMetadata';

export const metadata = buildPageMetadata({
  title: "Digital Event Passport & Odyssey Score",
  description:
    "Your event life, wrapped. Earn verified stamps at every event you attend, build your Odyssey score, and carry proof of your social calendar — from Bronze to Platinum.",
  path: "/features/digital-event-passport",
  eyebrow: "Feature",
  ogTitle: "Your event life, wrapped.",
});

const PAGE_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'PXI Digital Event Passport',
  operatingSystem: 'iOS',
  applicationCategory: 'EntertainmentApplication',
  url: 'https://pxispace.com/features/digital-event-passport',
  description:
    'A digital event passport with verified stamp tiers and Odyssey scoring for tracking your entire social calendar.',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

export default function DigitalEventPassportPage() {
  return (
    <>
      <h1 className="sr-only">
        Digital Event Passport & Odyssey Score — PXI
      </h1>
      <PassportView />
      <JsonLd data={PAGE_JSONLD} />
    </>
  );
}
