import { JsonLd } from '@/components/seo/JsonLd';
import { buildEventJsonLd } from '@/lib/seo/schemas';
import { getSiteUrl } from '@/lib/siteUrl';
import { getServerApiBaseUrl } from '@/lib/apiBase';
import { resolveDisplayImageUrl } from '@/lib/mediaUrl';
import EventDetailClient from '@/views/events/EventDetailClient';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Server-side fetch for event data (used only for metadata + JSON-LD).
 * The client component re-fetches via the events service for interactivity.
 */
async function fetchEvent(id) {
  try {
    const base = getServerApiBaseUrl();
    const res = await fetch(`${base}/api/events/${id}`, {
      next: { revalidate: 0 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.event || data || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const site = getSiteUrl();
  const canonical = `${site}/events/${id}`;
  const event = await fetchEvent(id);

  if (!event) {
    return {
      title: 'Event',
      description: 'View this event on PXI.',
      robots: { index: false, follow: false },
    };
  }

  const isPrivate = event.visibility === 'PRIVATE';
  const eventName = event.name || 'Event';
  const rawDesc = event.description
    ? String(event.description).trim().slice(0, 160)
    : `Join ${eventName} on PXI — plan, capture, and relive the night.`;

  const ogImage = resolveDisplayImageUrl(event.coverImage) || `${site}/favicon.svg`;

  return {
    title: eventName,
    description: rawDesc,
    alternates: { canonical },
    ...(isPrivate ? { robots: { index: false, follow: false } } : {}),
    openGraph: {
      type: 'website',
      url: canonical,
      siteName: 'PXI',
      title: `${eventName} — PXI`,
      description: rawDesc,
      images: ogImage
        ? [{ url: ogImage, width: 1200, height: 630, alt: eventName }]
        : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${eventName} — PXI`,
      description: rawDesc,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export default async function EventDetailPage({ params }) {
  const { id } = await params;
  const event = await fetchEvent(id);
  const site = getSiteUrl();
  const isPublic = event && event.visibility !== 'PRIVATE';

  return (
    <>
      {isPublic && <JsonLd data={buildEventJsonLd(event, site)} />}
      <EventDetailClient />
    </>
  );
}
