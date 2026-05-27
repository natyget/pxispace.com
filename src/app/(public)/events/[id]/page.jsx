import { JsonLd } from '@/components/seo/JsonLd';
import { buildEventJsonLd } from '@/lib/seo/schemas';
import { getSiteUrl } from '@/lib/siteUrl';
import { getPublicEvent } from '@/lib/publicEvent';
import { buildShareMetadata, resolveShareOgImage } from '@/lib/shareMetadata';
import EventDetailClient from '@/views/events/EventDetailClient';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function generateMetadata({ params }) {
  const { id } = await params;
  const site = getSiteUrl();
  const canonical = `${site}/events/${id}`;
  const event = await getPublicEvent(id);

  if (!event) {
    return buildShareMetadata({
      site,
      canonical,
      title: 'Event',
      description: 'View this event on PXI.',
      ogImage: resolveShareOgImage(site),
      ogAlt: 'PXI',
      robots: { index: false, follow: false },
    });
  }

  const isPrivate = event.visibility === 'PRIVATE';
  const eventName = event.name || 'Event';
  const rawDesc = event.description
    ? String(event.description).trim().slice(0, 160)
    : `Join ${eventName} on PXI — plan, capture, and relive the night.`;

  const scrapbookThumb = Array.isArray(event.scrapbookThumbnails)
    ? event.scrapbookThumbnails[0]
    : null;

  const ogImage = resolveShareOgImage(
    site,
    event.ogImageUrl,
    event.coverImage,
    scrapbookThumb,
  );

  return buildShareMetadata({
    site,
    canonical,
    title: eventName,
    description: rawDesc,
    ogImage,
    ogAlt: eventName,
    robots: isPrivate ? { index: false, follow: false } : undefined,
    privatePreview: isPrivate,
  });
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
