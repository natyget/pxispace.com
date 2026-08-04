import { JsonLd } from '@/components/seo/JsonLd';
import HubPage from '@/views/hubs/HubPage';
import { getAllPublicEvents } from '@/lib/publicEvents';
import { buildArtistIndex, indexableArtists } from '@/lib/seo/artists';
import { allCities } from '@/lib/seo/cities';
import { allGenres } from '@/lib/seo/genres';
import { canonicalUrl } from '@/lib/siteUrl';
import { buildCollectionJsonLd, buildBreadcrumbJsonLd } from '@/lib/seo/schemas';

export const revalidate = 3600;

const TITLE = 'Artists and DJs on PXI';
const DESCRIPTION =
  'The DJs, performers and collectives playing PXI events in New York and Boston. Find who is on the lineup and get tickets.';

export function generateMetadata() {
  const url = canonicalUrl('/artists');
  return {
    title: TITLE,
    description: DESCRIPTION,
    alternates: { canonical: url },
    openGraph: { title: TITLE, description: DESCRIPTION, url, images: [{ url: '/og-hero.png', width: 1200, height: 630, alt: TITLE }] },
    twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION, images: ['/og-hero.png'] },
  };
}

export default async function ArtistsIndexPage() {
  let events = [];
  try {
    events = await getAllPublicEvents();
  } catch {
    events = [];
  }

  const artists = indexableArtists(buildArtistIndex(events));

  const breadcrumbs = [
    { name: 'Home', path: '/' },
    { name: 'Artists', path: '/artists' },
  ];

  return (
    <>
      <HubPage
        breadcrumbs={breadcrumbs}
        eyebrow="Line-ups"
        title="Who's playing."
        intro={DESCRIPTION}
        events={[]}
        rails={[
          {
            title: 'Browse by city',
            links: allCities().map((c) => ({ href: `/discover/${c.slug}`, label: `Events in ${c.name}` })),
          },
          {
            title: 'Browse by genre',
            links: allGenres().slice(0, 10).map((g) => ({ href: `/genres/${g.slug}`, label: g.name })),
          },
        ]}
      >
        {artists.length ? (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {artists.map((artist) => (
              <li key={artist.slug}>
                <a
                  href={`/artists/${artist.slug}`}
                  className="block rounded-2xl border border-white/10 bg-white/[0.02] p-6 transition-colors hover:border-white/25"
                >
                  <h2 className="text-lg font-semibold text-white">{artist.name}</h2>
                  {artist.roles.length ? (
                    <p className="mt-1 text-sm text-zinc-500">{artist.roles.join(' · ')}</p>
                  ) : null}
                  <p className="mt-3 text-xs font-semibold uppercase tracking-[0.15em] text-pxi-purple">
                    {artist.events.length === 1 ? '1 upcoming event' : `${artist.events.length} upcoming events`}
                  </p>
                  {artist.cities.length ? (
                    <p className="mt-2 text-sm text-zinc-500">{artist.cities.map((c) => c.name).join(', ')}</p>
                  ) : null}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-zinc-500">
            No line-ups announced yet. Artists appear here once a host adds them to an event
            line-up.
          </p>
        )}
      </HubPage>

      <JsonLd
        data={buildCollectionJsonLd(
          { name: TITLE, path: '/artists', description: DESCRIPTION },
          artists.map((a) => ({ name: a.name, url: `/artists/${a.slug}` })),
        )}
      />
      <JsonLd data={buildBreadcrumbJsonLd(breadcrumbs)} />
    </>
  );
}
