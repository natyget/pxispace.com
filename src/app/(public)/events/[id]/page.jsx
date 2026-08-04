import { getSiteUrl, canonicalUrl } from '@/lib/siteUrl';
import { getPublicEvent } from '@/lib/publicEvent';
import { buildShareMetadata, resolveShareOgImage } from '@/lib/shareMetadata';
import { JsonLd } from '@/components/seo/JsonLd';
import { SITE_URL, buildEventJsonLd, buildBreadcrumbJsonLd } from '@/lib/seo/schemas';
import { resolveEventCity } from '@/lib/seo/cities';
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
  // Canonical always names the production origin, never a preview host.
  const canonical = canonicalUrl(`/events/${id}`);

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

/**
 * Server-rendered structured data for the event.
 *
 * This is what makes a PXI event eligible for Google's free event listings, so it must be
 * in the INITIAL HTML — the interactive page below still hydrates its own data client-side.
 * `getPublicEvent` is React-cached, so this shares the fetch generateMetadata already made.
 *
 * PRIVATE events are noindex and get no Event markup: publishing Event structured data for
 * a page we are asking Google not to index is a contradiction, and the offers on a private
 * event are not publicly purchasable.
 */
async function EventStructuredData({ id }) {
  let event = null;
  try {
    event = await getPublicEvent(id);
  } catch (error) {
    console.error('[events/[id]/jsonld]', { id, error });
    return null;
  }
  if (!event || event.visibility === 'PRIVATE') return null;

  const city = resolveEventCity(event);
  const genres = Array.isArray(event.genres)
    ? event.genres
    : Array.isArray(event.playlist?.topGenres)
      ? event.playlist.topGenres
      : [];

  const eventJsonLd = buildEventJsonLd(event, SITE_URL, { city, genres });
  if (!eventJsonLd) return null;

  const crumbs = [
    { name: 'Home', path: '/' },
    { name: 'Events', path: '/events' },
    ...(city ? [{ name: city.name, path: `/discover/${city.slug}` }] : []),
    { name: event.name || 'Event', path: `/events/${id}` },
  ];

  return (
    <>
      <JsonLd data={eventJsonLd} />
      <JsonLd data={buildBreadcrumbJsonLd(crumbs)} />
    </>
  );
}

/** Client fetches event data — the interactive shell stays as it was. */
export default async function EventDetailPage({ params }) {
  const { id } = await params;
  return (
    <>
      <EventStructuredData id={id} />
      <EventDetailClient />
    </>
  );
}
