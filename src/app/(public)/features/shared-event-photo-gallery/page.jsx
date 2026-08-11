import { JsonLd } from '@/components/seo/JsonLd';
import SharedEventPhotoGalleryView from '@/views/features/SharedEventPhotoGalleryView';
import { buildPageMetadata } from '@/lib/seo/pageMetadata';

export const metadata = buildPageMetadata({
  title: "Shared Event Photo Gallery App",
  description:
    "Capture and share event photos in real time with PXI. A live, tactile native camera that streams into a communal shared thread. No uploads, no group texts — just the night, preserved.",
  path: "/features/shared-event-photo-gallery",
  eyebrow: "Feature",
  ogTitle: "One shared camera roll for the whole night.",
});

const PAGE_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'PXI Shared Event Photo Gallery',
  operatingSystem: 'iOS',
  applicationCategory: 'EntertainmentApplication',
  url: 'https://pxispace.com/features/shared-event-photo-gallery',
  description:
    'A live shared event photo gallery app with a tactile native camera, real-time streaming, smart ranking that surfaces the best shots, and an automatically compiled digital scrapbook.',
  featureList: [
    'Tactile Native Camera',
    'Real-Time Shared Thread',
    'Best-Shots Ranking',
    'Auto-Compiled Scrapbook',
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
