import { getSiteUrl } from '@/lib/siteUrl';
import { getPublicEvent } from '@/lib/publicEvent';
import { buildShareMetadata, resolveShareOgImage } from '@/lib/shareMetadata';
import EventDetailClient from '@/views/events/EventDetailClient';

export const dynamic = 'force-dynamic';

function fallbackEventMetadata(site, id) {
  return buildShareMetadata({
    site,
    canonical: `${site}/events/${id}`,
    title: 'Event',
    description: 'View this event on PXI.',
    ogImage: resolveShareOgImage(site),
    ogAlt: 'PXI',
    robots: { index: false, follow: false },
  });
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const site = getSiteUrl();
  const canonical = `${site}/events/${id}`;

  try {
    const event = await getPublicEvent(id);

    if (!event) {
      return fallbackEventMetadata(site, id);
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
  } catch (error) {
    console.error('[events/[id]/metadata]', { id, error });
    return fallbackEventMetadata(site, id);
  }
}

/** Client fetches event data — keeps the route shell sync so Turbopack resolves it on first load. */
export default function EventDetailPage() {
  return <EventDetailClient />;
}
