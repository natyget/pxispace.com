/* eslint-disable react-refresh/only-export-components -- a Next page exports its metadata next to the page, like every page here */
import { notFound } from 'next/navigation';
import { JsonLd } from '@/components/seo/JsonLd';
import HubPage from '@/views/hubs/HubPage';
import { getAllPublicEvents, eventGenres, eventUrl } from '@/lib/publicEvents';
import { getCity, allCities, eventMatchesCity } from '@/lib/seo/cities';
import { getGenre, allGenres, allGenreSlugs, eventMatchesGenre } from '@/lib/seo/genres';
import { canonicalUrl } from '@/lib/siteUrl';
import { fetchCityListings, listingPath } from '@/lib/seo/listings';
import GoMoreNights from '@/views/go/GoMoreNights';
import '@/views/go/event.css';
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

// Outside nights listed on a genre hub (the rest are one click away on the /e/ pages).
const OUTSIDE_LIMIT = 60;

export function generateStaticParams() {
  return allCities().flatMap((city) => allGenreSlugs().map((genre) => ({ city: city.slug, genre })));
}

async function load(citySlug, genreSlug) {
  const city = getCity(citySlug);
  const genre = getGenre(genreSlug);
  if (!city || !genre) return { city, genre, events: [], outside: [] };
  let all = [];
  try {
    all = await getAllPublicEvents();
  } catch {
    all = [];
  }
  const events = all.filter((e) => eventMatchesCity(e, city) && eventMatchesGenre(eventGenres(e), genre));
  const outside = await fetchCityListings({ cityCode: city.cityCode, limit: 300 });
  return { city, genre, events, outside: outside.filter((l) => l.genre === genre.slug) };
}

export async function generateMetadata({ params }) {
  const { city: citySlug, genre: genreSlug } = await params;
  const { city, genre, events, outside } = await load(citySlug, genreSlug);
  if (!city || !genre) return {};
  const total = events.length + outside.length;

  const title = `${genre.name} Events in ${city.name} — Tickets`;
  const description = total
    ? `${total} upcoming ${genre.name} ${total === 1 ? 'event' : 'events'} in ${city.name}. ${genre.blurb}`
    : `${genre.name} nights in ${city.name} on PXI. ${genre.blurb}`;
  const url = canonicalUrl(`/discover/${citySlug}/${genreSlug}`);

  return {
    title,
    description,
    alternates: { canonical: url },
    robots: total === 0 ? { index: false, follow: true } : undefined,
    openGraph: { title, description, url, images: [{ url: '/og-hero.png', width: 1200, height: 630, alt: title }] },
    twitter: { card: 'summary_large_image', title, description, images: ['/og-hero.png'] },
  };
}

export default async function CityGenrePage({ params }) {
  const { city: citySlug, genre: genreSlug } = await params;
  const { city, genre, events, outside } = await load(citySlug, genreSlug);
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
  const cityOutside = await fetchCityListings({ cityCode: city.cityCode, limit: 300 });
  const siblingGenres = allGenres()
    .filter((g) => g.slug !== genre.slug)
    .filter((g) => inCity.some((e) => eventMatchesGenre(eventGenres(e), g)) || cityOutside.some((l) => l.genre === g.slug))
    .map((g) => ({ href: `/discover/${city.slug}/${g.slug}`, label: `${g.name} in ${city.name}` }));

  const otherCities = allCities()
    .filter((c) => c.slug !== city.slug)
    .map((c) => ({ href: `/discover/${c.slug}/${genre.slug}`, label: `${genre.name} in ${c.name}` }));

  return (
    <>
      <HubPage
        breadcrumbs={breadcrumbs}
        eyebrow={`${city.name}, ${genre.name}`}
        title={`${genre.name} events in ${city.name}`}
        intro={genre.blurb}
        events={events}
        emptyMessage={outside.length ? '' : `Nothing ${genre.name.toLowerCase()} on the calendar in ${city.name} right now. If you are putting one on, this is where people will look for it.`}
        emptyCta={outside.length ? null : { title: `No ${genre.name} events in ${city.name} yet.` }}
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
      >
        {outside.length ? <GoMoreNights city={city} nights={outside.slice(0, OUTSIDE_LIMIT)} hub={false} /> : null}
      </HubPage>

      <JsonLd
        data={buildCollectionJsonLd(
          {
            name: `${genre.name} events in ${city.name}`,
            path: `/discover/${city.slug}/${genre.slug}`,
            description: genre.blurb,
          },
          [
            ...events.map((e) => ({ name: e.name || 'Event', url: eventUrl(e) })),
            ...outside.slice(0, OUTSIDE_LIMIT).map((l) => ({ name: l.title, url: listingPath(l) })),
          ],
        )}
      />
      <JsonLd data={buildCityPlaceJsonLd(city)} />
      <JsonLd data={buildBreadcrumbJsonLd(breadcrumbs)} />
    </>
  );
}
