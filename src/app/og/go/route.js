import { ImageResponse } from 'next/og';
import { getSiteUrl } from '@/lib/siteUrl';
import { formatNightLine, isListingId, venueLabel, visitorFromHeaders } from '@/lib/goListing';
import { cardTitleSize, posterColors } from '@/lib/goPoster';
import { loadDisplayFont } from '@/lib/ogFonts';
import { getPublicListing } from '@/lib/publicListing';
import { toOpenGraphImageUrl } from '@/lib/ogImageUrl';

// Node, like /og and /og/event: next/og's wasm renderer is the fragile part, and this card sits behind a share link.
export const runtime = 'nodejs';

/**
 * The link-preview card (1200 by 630) for an outside event that has no flyer of its own: the typographic gig poster.
 * A flat ink colour from the genre, the title huge in the display face, the venue and the night small at the foot.
 * No gradients. It is the same poster the /go page prints (src/views/go/GigPoster.jsx).
 *
 *   /og/go?id=<listingId>
 *
 * A listing that does have a flyer is previewed by the flyer itself (see the page's metadata), so a request for one
 * is sent on to it. The data is read here, from the same public endpoint the page uses, so the card cannot be
 * changed through the URL and always shows the night as it is now.
 */

const WIDTH = 1200;
const HEIGHT = 630;
const PAD = 72;

const redirect = (url) => new Response(null, { status: 302, headers: { Location: url, 'Cache-Control': 'public, max-age=300' } });

export async function GET(request) {
  const site = getSiteUrl();
  const fallback = `${site}/og-hero.png`;
  const id = new URL(request.url).searchParams.get('id') || '';
  if (!isListingId(id)) return redirect(fallback);

  let listing = null;
  try {
    const result = await getPublicListing(id, visitorFromHeaders(request.headers).ip);
    listing = result.status === 'ok' ? result.listing : null;
  } catch (error) {
    console.error('[og/go]', error);
  }
  if (!listing) return redirect(fallback);

  const flyer = toOpenGraphImageUrl(site, listing.coverUrl);
  if (flyer) return redirect(flyer);

  const title = String(listing.title || '').trim().toUpperCase();
  const venue = venueLabel(listing);
  const night = formatNightLine(listing);
  const { ink, on } = posterColors(listing);

  const fontData = await loadDisplayFont(`${title}${title.toLowerCase()}${venue}${venue.toUpperCase()}${night}`);
  const display = fontData ? 'Stack Sans Notch' : undefined;
  const fonts = fontData ? [{ name: 'Stack Sans Notch', data: fontData, weight: 700, style: 'normal' }] : undefined;

  const titleSize = cardTitleSize(title);
  return new ImageResponse(
    (
      <div
        style={{
          width: WIDTH,
          height: HEIGHT,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: ink,
          color: on,
          padding: PAD,
        }}
      >
        <div
          style={{
            display: 'flex',
            fontFamily: display,
            fontWeight: 700,
            fontSize: titleSize,
            lineHeight: 0.92,
            letterSpacing: '-0.03em',
            textTransform: 'uppercase',
            maxHeight: titleSize * 3.1,
            overflow: 'hidden',
          }}
        >
          {title}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {venue ? (
            <div
              style={{
                display: 'flex',
                fontFamily: display,
                fontWeight: 700,
                fontSize: 34,
                letterSpacing: '0.09em',
                textTransform: 'uppercase',
              }}
            >
              {venue}
            </div>
          ) : null}
          {night ? (
            <div style={{ display: 'flex', marginTop: 6, fontFamily: display, fontWeight: 700, fontSize: 32, opacity: 0.8 }}>
              {night}
            </div>
          ) : null}
        </div>
      </div>
    ),
    {
      width: WIDTH,
      height: HEIGHT,
      fonts,
      headers: { 'Cache-Control': 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400' },
    },
  );
}
