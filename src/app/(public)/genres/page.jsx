import { JsonLd } from '@/components/seo/JsonLd';
import HubPage from '@/views/hubs/HubPage';
import { getAllPublicEvents, eventGenres } from '@/lib/publicEvents';
import { allGenres, eventCanonicalGenres } from '@/lib/seo/genres';
import { allCities } from '@/lib/seo/cities';
import { canonicalUrl } from '@/lib/siteUrl';
import { buildCollectionJsonLd, buildBreadcrumbJsonLd } from '@/lib/seo/schemas';

export const revalidate = 3600;

const TITLE = 'Event Genres — Find Your Sound';
const DESCRIPTION =
  'Browse PXI events by genre: afrobeats, amapiano, afro house, dancehall, hip hop and more, in New York and Boston.';

export function generateMetadata() {
  const url = canonicalUrl('/genres');
  return {
    title: TITLE,
    description: DESCRIPTION,
    alternates: { canonical: url },
    openGraph: { title: TITLE, description: DESCRIPTION, url, images: [{ url: '/og-hero.png', width: 1200, height: 630, alt: 'PXI genres' }] },
    twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION, images: ['/og-hero.png'] },
  };
}

export default async function GenresIndexPage() {
  let events = [];
  try {
    events = await getAllPublicEvents();
  } catch {
    events = [];
  }

  // Count events per genre so the index can lead with the scenes we actually run.
  const counts = new Map();
  for (const event of events) {
    for (const genre of eventCanonicalGenres(eventGenres(event))) {
      counts.set(genre.slug, (counts.get(genre.slug) ?? 0) + 1);
    }
  }

  const genres = allGenres()
    .map((g) => ({ ...g, count: counts.get(g.slug) ?? 0 }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  const breadcrumbs = [
    { name: 'Home', path: '/' },
    { name: 'Genres', path: '/genres' },
  ];

  return (
    <>
      <HubPage
        breadcrumbs={breadcrumbs}
        eyebrow="Discover by sound"
        title="Every genre, every night."
        intro={DESCRIPTION}
        events={[]}
        rails={[
          {
            title: 'Browse by city',
            links: allCities().map((c) => ({ href: `/discover/${c.slug}`, label: `Events in ${c.name}` })),
          },
        ]}
      >
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {genres.map((genre) => (
            <li key={genre.slug}>
              <a
                href={`/genres/${genre.slug}`}
                className="block rounded-2xl border border-white/10 bg-white/[0.02] p-6 transition-colors hover:border-white/25"
              >
                <h2 className="text-lg font-semibold text-white">{genre.name}</h2>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500">{genre.blurb}</p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.15em] text-pxi-purple">
                  {genre.count === 1 ? '1 upcoming event' : `${genre.count} upcoming events`}
                </p>
              </a>
            </li>
          ))}
        </ul>
      </HubPage>

      <JsonLd
        data={buildCollectionJsonLd(
          { name: TITLE, path: '/genres', description: DESCRIPTION },
          genres.map((g) => ({ name: g.name, url: `/genres/${g.slug}` })),
        )}
      />
      <JsonLd data={buildBreadcrumbJsonLd(breadcrumbs)} />
    </>
  );
}
