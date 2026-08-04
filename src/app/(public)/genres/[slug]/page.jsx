import { notFound } from 'next/navigation';
import { JsonLd } from '@/components/seo/JsonLd';
import HubPage from '@/views/hubs/HubPage';
import { getAllPublicEvents, eventGenres, eventUrl } from '@/lib/publicEvents';
import { getGenre, allGenreSlugs, allGenres, eventMatchesGenre } from '@/lib/seo/genres';
import { allCities, resolveEventCity } from '@/lib/seo/cities';
import { canonicalUrl } from '@/lib/siteUrl';
import { buildCollectionJsonLd, buildBreadcrumbJsonLd } from '@/lib/seo/schemas';

export const revalidate = 3600;

export function generateStaticParams() {
  return allGenreSlugs().map((slug) => ({ slug }));
}

async function loadGenreEvents(slug) {
  const genre = getGenre(slug);
  if (!genre) return { genre: null, events: [] };
  let all = [];
  try {
    all = await getAllPublicEvents();
  } catch {
    all = [];
  }
  return { genre, events: all.filter((e) => eventMatchesGenre(eventGenres(e), genre)) };
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const { genre, events } = await loadGenreEvents(slug);
  if (!genre) return {};

  const title = `${genre.name} Events — Tickets in New York and Boston`;
  const description = `${genre.blurb} ${
    events.length ? `${events.length} upcoming ${genre.name} ${events.length === 1 ? 'event' : 'events'} on PXI.` : ''
  }`.trim();
  const url = canonicalUrl(`/genres/${slug}`);

  return {
    title,
    description,
    alternates: { canonical: url },
    // A genre with nothing on it is a thin page. Keep the URL alive for when events land,
    // but do not ask Google to index an empty shelf.
    robots: events.length === 0 ? { index: false, follow: true } : undefined,
    openGraph: { title, description, url, images: [{ url: '/og-hero.png', width: 1200, height: 630, alt: title }] },
    twitter: { card: 'summary_large_image', title, description, images: ['/og-hero.png'] },
  };
}

export default async function GenrePage({ params }) {
  const { slug } = await params;
  const { genre, events } = await loadGenreEvents(slug);
  if (!genre) notFound();

  const breadcrumbs = [
    { name: 'Home', path: '/' },
    { name: 'Genres', path: '/genres' },
    { name: genre.name, path: `/genres/${slug}` },
  ];

  // Only link city×genre combinations that actually have something in them — a rail full of
  // empty pages is a crawl trap.
  const cityLinks = allCities()
    .map((city) => ({
      city,
      count: events.filter((e) => resolveEventCity(e)?.slug === city.slug).length,
    }))
    .filter((x) => x.count > 0)
    .map((x) => ({
      href: `/discover/${x.city.slug}/${slug}`,
      label: `${genre.name} in ${x.city.name}`,
    }));

  const otherGenres = allGenres()
    .filter((g) => g.slug !== slug)
    .slice(0, 8)
    .map((g) => ({ href: `/genres/${g.slug}`, label: g.name }));

  return (
    <>
      <HubPage
        breadcrumbs={breadcrumbs}
        eyebrow="Genre"
        title={`${genre.name} events`}
        intro={genre.blurb}
        events={events}
        emptyMessage={`No upcoming ${genre.name} events right now. New nights go up every week — check the city hubs below.`}
        rails={[
          ...(cityLinks.length ? [{ title: `${genre.name} by city`, links: cityLinks }] : []),
          {
            title: 'Browse by city',
            links: allCities().map((c) => ({ href: `/discover/${c.slug}`, label: `Events in ${c.name}` })),
          },
          { title: 'Other genres', links: otherGenres },
        ]}
      />

      <JsonLd
        data={buildCollectionJsonLd(
          { name: `${genre.name} events`, path: `/genres/${slug}`, description: genre.blurb },
          events.map((e) => ({ name: e.name || 'Event', url: eventUrl(e) })),
        )}
      />
      <JsonLd data={buildBreadcrumbJsonLd(breadcrumbs)} />
    </>
  );
}
