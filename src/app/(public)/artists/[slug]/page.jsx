import { notFound } from 'next/navigation';
import { JsonLd } from '@/components/seo/JsonLd';
import HubPage from '@/views/hubs/HubPage';
import { getAllPublicEvents } from '@/lib/publicEvents';
import { buildArtistIndex, getArtist, artistEventLinks, relatedArtists, indexableArtists } from '@/lib/seo/artists';
import { canonicalUrl } from '@/lib/siteUrl';
import { buildArtistJsonLd, buildBreadcrumbJsonLd } from '@/lib/seo/schemas';

export const revalidate = 3600;

/**
 * Artists are derived from event line-ups, so the set changes as events are created.
 * No generateStaticParams — these render on demand and revalidate hourly.
 */

async function loadArtist(slug) {
  let events = [];
  try {
    events = await getAllPublicEvents();
  } catch {
    events = [];
  }
  const index = buildArtistIndex(events);
  return { index, artist: getArtist(index, slug) };
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const { artist } = await loadArtist(slug);
  if (!artist) return {};

  const cities = artist.cities.map((c) => c.name).join(' and ');
  const title = `${artist.name} — Upcoming Events and Tickets`;
  const description = `See ${artist.name}${cities ? ` in ${cities}` : ''}. ${
    artist.events.length === 1 ? '1 upcoming event' : `${artist.events.length} upcoming events`
  } on PXI${artist.genres.length ? `, playing ${artist.genres.map((g) => g.name).join(', ')}` : ''}.`;
  const url = canonicalUrl(`/artists/${slug}`);

  return {
    title,
    description,
    alternates: { canonical: url },
    // Thin-page guard: an artist with nothing coming up is not worth indexing yet.
    robots: artist.events.length === 0 ? { index: false, follow: true } : undefined,
    openGraph: { title, description, url, images: [{ url: '/og-hero.png', width: 1200, height: 630, alt: title }] },
    twitter: { card: 'summary_large_image', title, description, images: ['/og-hero.png'] },
  };
}

export default async function ArtistPage({ params }) {
  const { slug } = await params;
  const { index, artist } = await loadArtist(slug);
  if (!artist) notFound();

  const breadcrumbs = [
    { name: 'Home', path: '/' },
    { name: 'Artists', path: '/artists' },
    { name: artist.name, path: `/artists/${slug}` },
  ];

  const related = relatedArtists(index, artist);
  // Fall back to the busiest other artists so the page is never a dead end.
  const fallbackRelated = related.length
    ? related
    : indexableArtists(index).filter((a) => a.slug !== slug).slice(0, 6);

  const intro = [
    artist.roles.length ? artist.roles.join(' · ') : null,
    artist.genres.length ? artist.genres.map((g) => g.name).join(', ') : null,
    artist.cities.length ? artist.cities.map((c) => c.name).join(', ') : null,
  ]
    .filter(Boolean)
    .join('  ·  ');

  return (
    <>
      <HubPage
        breadcrumbs={breadcrumbs}
        eyebrow="Artist"
        title={artist.name}
        intro={intro || `Upcoming PXI events featuring ${artist.name}.`}
        events={artist.events}
        emptyMessage={`No upcoming events for ${artist.name} right now.`}
        rails={[
          ...(artist.genres.length
            ? [{ title: 'Genres', links: artist.genres.map((g) => ({ href: `/genres/${g.slug}`, label: g.name })) }]
            : []),
          ...(artist.cities.length
            ? [{ title: 'Cities', links: artist.cities.map((c) => ({ href: `/discover/${c.slug}`, label: c.name })) }]
            : []),
          ...(fallbackRelated.length
            ? [
                {
                  title: related.length ? 'Similar artists' : 'Other artists on PXI',
                  links: fallbackRelated.map((a) => ({ href: `/artists/${a.slug}`, label: a.name })),
                },
              ]
            : []),
          ...(artist.username
            ? [{ title: 'Profile', links: [{ href: `/u/${artist.username}`, label: `@${artist.username}` }] }]
            : []),
        ]}
      />

      <JsonLd
        data={buildArtistJsonLd(
          {
            name: artist.name,
            slug: artist.slug,
            genres: artist.genres.map((g) => g.name),
            sameAs: artist.username ? [canonicalUrl(`/u/${artist.username}`)] : undefined,
          },
          artistEventLinks(artist),
        )}
      />
      <JsonLd data={buildBreadcrumbJsonLd(breadcrumbs)} />
    </>
  );
}
