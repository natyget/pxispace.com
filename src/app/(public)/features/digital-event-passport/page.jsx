import { JsonLd } from '@/components/seo/JsonLd';
import PassportView from '@/views/features/PassportView';

export const metadata = {
  title: 'Digital Event Passport & Odyssey Score',
  description:
    'Your event life, wrapped. Earn verified stamps at every event you attend, build your Odyssey score, and carry proof of your social calendar — from Bronze to Platinum.',
  alternates: {
    canonical: 'https://pxispace.com/features/digital-event-passport',
  },
  openGraph: {
    title: 'Digital Event Passport & Odyssey Score | PXI',
    description:
      'Earn stamps, build your Odyssey score, and carry your entire event life in one verifiable passport.',
    url: 'https://pxispace.com/features/digital-event-passport',
  },
};

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
