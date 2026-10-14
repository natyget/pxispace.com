/* eslint-disable react-refresh/only-export-components -- a Next page exports its metadata next to the page, like every page here */
import { notFound, permanentRedirect } from 'next/navigation';
import { JsonLd } from '@/components/seo/JsonLd';
import { getPublicListing } from '@/lib/publicListing';
import { toOpenGraphImageUrl } from '@/lib/ogImageUrl';
import { metaDescription, venueLabel } from '@/lib/goListing';
import { getCityByCode } from '@/lib/seo/cities';
import {
  buildListingEventJsonLd,
  fetchCityListings,
  listingIdFromSlug,
  listingPath,
  moreNightsFor,
} from '@/lib/seo/listings';
import { buildBreadcrumbJsonLd } from '@/lib/seo/schemas';
import { canonicalUrl, getSiteUrl } from '@/lib/siteUrl';
import GoEventQr from '@/views/go/GoEventQr';
import GoGone from '@/views/go/GoGone';
import GoListingView from '@/views/go/GoListingView';
import GoMoreNights from '@/views/go/GoMoreNights';
import '@/views/go/go.css';
import '@/views/go/event.css';

// One outside night at its own address, the page search engines index for it. (The share link, /go/<id>, stays out
// of search.) It reads no visitor, so it is rendered once and kept for 15 minutes like the feed it reads.
export const revalidate = 900;

const INDEX = { index: true, follow: true };
const NOINDEX = { index: false, follow: false };
const APP_STORE_ID = '6751762197';

async function loadNight(slug) {
  const id = listingIdFromSlug(slug);
  return id ? getPublicListing(id) : { status: 'missing' };
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const result = await loadNight(slug);
  if (result.status === 'missing') return { robots: NOINDEX };
  // The API did not answer. Not a page to index or to forget: an error here is retried later, a noindex is not.
  if (result.status === 'unavailable') throw new Error(`[e] listing API unavailable for ${slug}`);
  if (result.status === 'gone') return { title: 'This night has passed', robots: NOINDEX };

  const { listing } = result;
  const title = listing.title.trim();
  const venue = venueLabel(listing);
  const headline = venue ? `${title} at ${venue}` : title;
  const cityName = getCityByCode(listing.cityCode)?.name || '';
  const lead = [metaDescription(listing) || title, cityName ? `in ${cityName}` : ''].filter(Boolean).join(' ');
  const description = `${lead}. Tickets and one shared camera roll for the night, in PXI.`;

  const site = getSiteUrl();
  const url = canonicalUrl(listingPath(listing));
  // The flyer itself when there is one; else the typographic poster the /go page uses.
  const flyer = toOpenGraphImageUrl(site, listing.coverUrl);
  const image = flyer || `${site}/og/go?id=${encodeURIComponent(listing.id)}`;
  const shareTitle = `${headline} | PXI`;
  return {
    // The root layout's "%s | PXI" turns this into "<Title> at <Venue> | PXI".
    title: headline,
    description,
    alternates: { canonical: url },
    robots: INDEX,
    itunes: { appId: APP_STORE_ID, appArgument: url },
    openGraph: {
      type: 'website',
      url,
      siteName: 'PXI',
      title: shareTitle,
      description,
      images: [{ url: image, alt: headline, ...(flyer ? {} : { width: 1200, height: 630 }) }],
    },
    twitter: { card: 'summary_large_image', title: shareTitle, description, images: [image] },
  };
}

export default async function EventNightPage({ params }) {
  const { city, slug } = await params;
  const result = await loadNight(slug);
  if (result.status === 'missing') notFound();
  if (result.status === 'unavailable') throw new Error(`[e] listing API unavailable for ${slug}`);
  if (result.status === 'gone') {
    // The page stays for people who still have the link; search engines are told to drop it (see metadata).
    return <GoGone state="gone" id={listingIdFromSlug(slug)} cityName={result.cityName} platform="desktop" />;
  }

  const { listing } = result;
  // One address per night: a wrong city or a wrong title in the slug goes to the one that is right.
  if (listing.citySlug !== city || listing.slug !== slug) permanentRedirect(listingPath(listing));

  const cityRecord = getCityByCode(listing.cityCode);
  const feed = cityRecord ? await fetchCityListings({ cityCode: listing.cityCode }) : [];
  const more = cityRecord ? moreNightsFor(feed, listing.id, 12) : [];

  const breadcrumbs = [
    { name: 'PXI', path: '/' },
    ...(cityRecord ? [{ name: cityRecord.name, path: `/discover/${cityRecord.slug}` }] : []),
    { name: listing.title.trim(), path: listingPath(listing) },
  ];

  return (
    <>
      {/* Visitor-free on purpose: no user agent, so the Directions link is Google Maps here. */}
      <GoListingView
        listing={listing}
        id={listing.id}
        userAgent=""
        platform="desktop"
        aside={<GoEventQr url={canonicalUrl(listingPath(listing))} />}
      />

      {cityRecord && more.length ? <GoMoreNights city={cityRecord} nights={more} /> : null}

      <JsonLd data={buildListingEventJsonLd(listing)} />
      <JsonLd data={buildBreadcrumbJsonLd(breadcrumbs)} />
    </>
  );
}
