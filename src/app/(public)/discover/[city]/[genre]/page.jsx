import { notFound } from 'next/navigation';
import { JsonLd } from '@/components/seo/JsonLd';
import HubPage from '@/views/hubs/HubPage';
import { getAllPublicEvents, eventGenres, eventUrl } from '@/lib/publicEvents';
import { getCity, allCities, eventMatchesCity } from '@/lib/seo/cities';
import { getGenre, allGenres, allGenreSlugs, eventMatchesGenre } from '@/lib/seo/genres';
import { canonicalUrl } from '@/lib/siteUrl';
import { buildCollectionJsonLd, buildBreadcrumbJsonLd, buildCityPlaceJsonLd } from '@/lib/seo/schemas';

/**
 * /discover/[city]/[genre] — the long-tail intersection ("afrobeats parties in Boston").
 *
 * These are the highest-intent queries PXI can realistically win: low competition, obvious
 * commercial intent, and a page that genuinely answers them. But the combinatorial space is
 * cities × genres, so most combinations will be empty at any moment — every empty one is
 * noindexed and kept out of every link rail. Publishing the full matrix regardless is the
 * classic doorway-page mistake.
 */

export const revalidate = 3600;

export function generateStaticParams() {
  return allCities().flatMap((city) => allGenreSlugs().map((genre) => ({ city: city.slug, genre })));
}

async function load(citySlug, genreSlug) {
  const city = getCity(citySlug);
  const genre = getGenre(genreSlug);
  if (!city || !genre) return { city, genre, events: [] };
  let all = [];
  try {
    all = await getAllPublicEvents();
  } catch {
    all = [];
  }
  const events = all.filter((e) => eventMatchesCity(e, city) && eventMatchesGenre(eventGenres(e), genre));
  return { city, genre, events };
}

export async function generateMetadata({ params }) {
  const { city: citySlug, genre: genreSlug } = await params;
  const { city, genre, events } = await load(citySlug, genreSlug);
  if (!city || !genre) return {};

  const title = `${genre.name} Events in ${city.name} — Tickets`;
  const description = events.length
    ? `${events.length} upcoming ${genre.name} ${events.length === 1 ? 'event' : 'events'} in ${city.name}. ${genre.blurb}`
    : `${genre.name} nights in ${city.name} on PXI. ${genre.blurb}`;
  const url = canonicalUrl(`/discover/${citySlug}/${genreSlug}`);

  return {
    title,
    description,
    alternates: { canonical: url },
    robots: events.length === 0 ? { index: false, follow: true } : undefined,
    openGraph: { title, description, url, images: [{ url: '/og-hero.png', width: 1200, height: 630, alt: title }] },
    twitter: { card: 'summary_large_image', title, description, images: ['/og-hero.png'] },
  };
}

export default async function CityGenrePage({ params }) {
  const { city: citySlug, genre: genreSlug } = await params;
  const { city, genre, events } = await load(citySlug, genreSlug);
  if (!city || !genre) notFound();

  const breadcrumbs = [
    { name: 'Home', path: '/' },
    { name: 'Discover', path: '/events' },
    { name: city.name, path: `/discover/${city.slug}` },
    { name: genre.name, path: `/discover/${city.slug}/${genre.slug}` },
  ];

  // Sibling genres in this city, but only the ones with something on.
  let all = [];
  try {
    all = await getAllPublicEvents();
  } catch {
    all = [];
  }
  const inCity = all.filter((e) => eventMatchesCity(e, city));
  const siblingGenres = allGenres()
    .filter((g) => g.slug !== genre.slug)
    .filter((g) => inCity.some((e) => eventMatchesGenre(eventGenres(e), g)))
    .map((g) => ({ href: `/discover/${city.slug}/${g.slug}`, label: `${g.name} in ${city.name}` }));

  const otherCities = allCities()
    .filter((c) => c.slug !== city.slug)
    .map((c) => ({ href: `/discover/${c.slug}/${genre.slug}`, label: `${genre.name} in ${c.name}` }));

  return (
    <>
      <HubPage
        breadcrumbs={breadcrumbs}
        eyebrow={`${city.name} · ${genre.name}`}
        title={`${genre.name} events in ${city.name}`}
        intro={genre.blurb}
        events={events}
        emptyMessage={`No ${genre.name} events on the calendar in ${city.name} right now. New nights go up every week.`}
        rails={[
          ...(siblingGenres.length ? [{ title: `More in ${city.name}`, links: siblingGenres }] : []),
          ...(otherCities.length ? [{ title: `${genre.name} elsewhere`, links: otherCities }] : []),
          {
            title: 'Hubs',
            links: [
              { href: `/discover/${city.slug}`, label: `All events in ${city.name}` },
              { href: `/genres/${genre.slug}`, label: `All ${genre.name} events` },
            ],
          },
        ]}
      />

      <JsonLd
        data={buildCollectionJsonLd(
          {
            name: `${genre.name} events in ${city.name}`,
            path: `/discover/${city.slug}/${genre.slug}`,
            description: genre.blurb,
          },
          events.map((e) => ({ name: e.name || 'Event', url: eventUrl(e) })),
        )}
      />
      <JsonLd data={buildCityPlaceJsonLd(city)} />
      <JsonLd data={buildBreadcrumbJsonLd(breadcrumbs)} />
    </>
  );
}
