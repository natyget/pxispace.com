import { JsonLd } from '@/components/seo/JsonLd';
import { buildEventJsonLd } from '@/lib/seo/schemas';
import { getSiteUrl } from '@/lib/siteUrl';
import { getPublicEvent } from '@/lib/publicEvent';
import { resolveDisplayImageUrl } from '@/lib/mediaUrl';
import { toOpenGraphImageUrl } from '@/lib/ogImageUrl';
import EventDetailClient from '@/views/events/EventDetailClient';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function generateMetadata({ params }) {
  const { id } = await params;
  const site = getSiteUrl();
  const canonical = `${site}/events/${id}`;
  const event = await getPublicEvent(id);

  if (!event) {
    return {
      title: 'Event',
      description: 'View this event on PXI.',
      robots: { index: false, follow: false },
      metadataBase: new URL(site),
    };
  }

  const isPrivate = event.visibility === 'PRIVATE';
  const eventName = event.name || 'Event';
  const rawDesc = event.description
    ? String(event.description).trim().slice(0, 160)
    : `Join ${eventName} on PXI — plan, capture, and relive the night.`;

  const coverResolved = resolveDisplayImageUrl(event.coverImage);
  const ogImage =
    toOpenGraphImageUrl(site, coverResolved) || `${site}/favicon.png`;

  return {
    title: eventName,
    description: rawDesc,
    metadataBase: new URL(site),
    alternates: { canonical },
    ...(isPrivate ? { robots: { index: false, follow: false } } : {}),
    openGraph: {
      type: 'website',
      url: canonical,
      siteName: 'PXI',
      title: `${eventName} — PXI`,
      description: rawDesc,
      images: [{ url: ogImage, alt: eventName }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${eventName} — PXI`,
      description: rawDesc,
      images: [ogImage],
    },
  };
}

export default async function EventDetailPage({ params }) {
  const { id } = await params;
  const event = await getPublicEvent(id);
  const site = getSiteUrl();
  const isPublic = event && event.visibility !== 'PRIVATE';

  return (
    <>
      {isPublic && <JsonLd data={buildEventJsonLd(event, site)} />}
      <EventDetailClient />
    </>
  );
}
