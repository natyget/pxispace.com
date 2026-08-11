import { notFound } from 'next/navigation';
import Link from 'next/link';
import { JsonLd } from '@/components/seo/JsonLd';
import CityEventsView from '@/views/discover/CityEventsView';
import { getCity, allCitySlugs } from '@/lib/seo/cities';
import { getAllPublicEvents, eventsInCity, eventGenres, eventUrl } from '@/lib/publicEvents';
import { allGenres, eventMatchesGenre } from '@/lib/seo/genres';
import {
  SITE_URL,
  buildBreadcrumbJsonLd,
  buildCollectionJsonLd,
  buildCityPlaceJsonLd,
} from '@/lib/seo/schemas';

// Events change constantly; regenerate hourly rather than baking the list at build time.
export const revalidate = 3600;

export function generateStaticParams() {
  return allCitySlugs().map((city) => ({ city }));
}

export async function generateMetadata({ params }) {
  const { city: slug } = await params;
  const city = getCity(slug);
  if (!city) return {};
  const title = `Events in ${city.name} — Parties, Shows & Nights Out`;
  const description = `Discover events in ${city.name} on PXI. ${city.blurb} Buy tickets, see who's going, and share the night.`;
  const url = `${SITE_URL}/discover/${slug}`;
  const og = '/og-hero.png';
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, images: [{ url: og, width: 1200, height: 630, alt: `Events in ${city.name}` }] },
    twitter: { card: 'summary_large_image', title, description, images: [og] },
  };
}

export default async function CityPage({ params }) {
  const { city: slug } = await params;
  const city = getCity(slug);
  if (!city) notFound();

  // Resolve the events on the SERVER so the list is in the first HTML response.
  // Previously this hub client-fetched, so a crawler saw a hero and six skeletons.
  let cityEvents = [];
  try {
    cityEvents = eventsInCity(await getAllPublicEvents(), city);
  } catch {
    cityEvents = [];
  }

  // Only link genre sub-hubs that actually have events in this city — an empty
  // /discover/<city>/<genre> is a thin page and a crawl trap.
  const genreLinks = allGenres()
    .filter((genre) => cityEvents.some((e) => eventMatchesGenre(eventGenres(e), genre)))
    .map((genre) => ({ href: `/discover/${slug}/${genre.slug}`, label: `${genre.name} in ${city.name}` }));

  const breadcrumbs = [
    { name: 'Home', path: '/' },
    { name: 'Discover', path: '/events' },
    { name: city.name, path: `/discover/${slug}` },
  ];

  return (
    <>
      <CityEventsView city={city} initialEvents={cityEvents} />

      {genreLinks.length ? (
        <nav aria-label={`${city.name} genres`} className="bg-black">
          <div className="mx-auto max-w-[1200px] px-6 pb-20">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500">
              Browse {city.name} by sound
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {genreLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300 transition-colors hover:border-white/30 hover:text-white"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        </nav>
      ) : null}

      <JsonLd
        data={buildCollectionJsonLd(
          { name: `Events in ${city.name}`, path: `/discover/${slug}`, description: city.blurb },
          cityEvents.map((e) => ({ name: e.name || 'Event', url: eventUrl(e) })),
        )}
      />
      <JsonLd data={buildCityPlaceJsonLd(city)} />
      <JsonLd data={buildBreadcrumbJsonLd(breadcrumbs)} />
    </>
  );
}
