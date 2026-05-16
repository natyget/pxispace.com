import { JsonLd } from '@/components/seo/JsonLd';
import SharedEventPhotoGalleryView from '@/views/features/SharedEventPhotoGalleryView';

export const metadata = {
  title: 'Shared Event Photo Gallery App',
  description:
    'Capture and share event photos in real time with PXI. A live, tactile native camera that streams into a communal shared thread. No uploads, no group texts — just the night, preserved.',
  alternates: {
    canonical: 'https://pxispace.com/features/shared-event-photo-gallery',
  },
  openGraph: {
    title: 'Shared Event Photo Gallery App | PXI',
    description:
      'Live, tactile native camera streaming into a communal shared event photo gallery. Zero friction photo sharing.',
    url: 'https://pxispace.com/features/shared-event-photo-gallery',
  },
};

const PAGE_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'PXI Shared Event Photo Gallery',
  operatingSystem: 'iOS',
  applicationCategory: 'EntertainmentApplication',
  url: 'https://pxispace.com/features/shared-event-photo-gallery',
  description:
    'A live shared event photo gallery app with tactile native camera, real-time streaming, Wilson-scored engagement ranking, and automated DBSCAN-clustered digital scrapbook compilation.',
  featureList: [
    'Tactile Native Camera',
    'Real-Time Shared Thread',
    'Wilson-Scored Engagement Graph',
    'DBSCAN Scrapbook Compilation',
    'Zero Location Tracking',
  ],
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
};

export default function SharedEventPhotoGalleryPage() {
  return (
    <>
      <h1 className="sr-only">
        Shared Event Photo Gallery App — PXI
      </h1>
      <SharedEventPhotoGalleryView />
      <JsonLd data={PAGE_JSONLD} />
    </>
  );
}
