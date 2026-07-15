import { notFound } from 'next/navigation';
import { JsonLd } from '@/components/seo/JsonLd';
import CityEventsView from '@/views/discover/CityEventsView';
import { getCity, allCitySlugs } from '@/lib/seo/cities';
import { SITE_URL, buildBreadcrumbJsonLd } from '@/lib/seo/schemas';

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

  return (
    <>
      <CityEventsView city={city} />
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Discover', path: '/events' },
          { name: city.name, path: `/discover/${slug}` },
        ])}
      />
    </>
  );
}
