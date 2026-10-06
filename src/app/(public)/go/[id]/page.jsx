/* eslint-disable react-refresh/only-export-components -- a Next page exports its metadata next to the page, like every page here */
import { headers } from 'next/headers';
import { after } from 'next/server';
import { detectAppPlatform } from '@/lib/appStoreLinks';
import { isPreviewBot, isSpeculativeRequest, metaDescription, visitorFromHeaders } from '@/lib/goListing';
import { getPublicListing, logListingTraffic } from '@/lib/publicListing';
import { toOpenGraphImageUrl } from '@/lib/ogImageUrl';
import { canonicalUrl, getSiteUrl } from '@/lib/siteUrl';
import GoGone from '@/views/go/GoGone';
import GoListingView from '@/views/go/GoListingView';
import '@/views/go/go.css';

// One outside event on a PXI page (the link the app shares for a listing, never the ticket site's own).
// Rendered per request: the listing changes, the Directions link depends on the visitor's phone, and every real
// visit is counted.
export const dynamic = 'force-dynamic';

// Share links stay out of search results, whatever their state. (The same is sent as a header, see next.config.js,
// so the redirect route is covered too.)
const NOINDEX = { index: false, follow: false };

const STATE_TITLES = {
  missing: 'Night not found',
  gone: 'This night has passed',
  unavailable: 'Night unavailable',
};

export async function generateMetadata({ params }) {
  const { id } = await params;
  const result = await getPublicListing(id);
  if (result.status !== 'ok') return { title: STATE_TITLES[result.status] || STATE_TITLES.missing, robots: NOINDEX };

  const { listing } = result;
  const site = getSiteUrl();
  const title = listing.title.trim();
  const description = metaDescription(listing) || 'Every event in your city, in PXI.';
  // The flyer itself when there is one; else the typographic poster, drawn at /og/go (1200 by 630).
  const flyer = toOpenGraphImageUrl(site, listing.coverUrl);
  const image = flyer || `${site}/og/go?id=${encodeURIComponent(id)}`;
  const shareTitle = `${title} | PXI`;
  return {
    // The root layout's "%s | PXI" turns this into "<Title> | PXI".
    title,
    description,
    robots: NOINDEX,
    openGraph: {
      type: 'website',
      url: canonicalUrl(`/go/${encodeURIComponent(id)}`),
      siteName: 'PXI',
      title: shareTitle,
      description,
      images: [{ url: image, alt: title, ...(flyer ? {} : { width: 1200, height: 630 }) }],
    },
    twitter: { card: 'summary_large_image', title: shareTitle, description, images: [image] },
  };
}

export default async function GoPage({ params }) {
  const { id } = await params;
  const result = await getPublicListing(id);
  const requestHeaders = await headers();
  const visitor = visitorFromHeaders(requestHeaders);
  // Desktop gets the App Store, like every other store button on the site.
  const platform = detectAppPlatform(visitor.userAgent);

  if (result.status !== 'ok') {
    return <GoGone state={result.status} id={id} cityName={result.cityName} platform={platform} />;
  }

  // A real visit is one VIEW. Link-preview bots and a browser warming the page up are not looking. `after` runs
  // once the page has been sent, so counting never makes it slower, and what it needs is read here, not there.
  if (!isPreviewBot(visitor.userAgent) && !isSpeculativeRequest(requestHeaders)) {
    after(() => logListingTraffic(id, { kind: 'VIEW', surface: 'go_page', ...visitor }, 3000));
  }

  return <GoListingView listing={result.listing} id={id} userAgent={visitor.userAgent} platform={platform} />;
}
