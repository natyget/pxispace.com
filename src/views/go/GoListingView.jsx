import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowUpRight01Icon, Navigation03Icon } from '@hugeicons/core-free-icons';
import {
  addressLine,
  alsoOnEntries,
  appStoreHref,
  directionsUrl,
  formatNightLine,
  formatTimeLine,
  isEnded,
  openInPxiHref,
  outPath,
  outTarget,
  priceLabel,
  ticketLabel,
  venueLabel,
} from '@/lib/goListing';
import { posterColors } from '@/lib/goPoster';
import { toOpenGraphImageUrl } from '@/lib/ogImageUrl';
import { getSiteUrl } from '@/lib/siteUrl';
import GoAlbumBlock from './GoAlbumBlock';
import GoArt from './GoArt';
import GoSong from './GoSong';

const text = (value) => (typeof value === 'string' ? value.trim() : '');
const httpsOnly = (value) => (/^https:\/\//i.test(text(value)) ? text(value) : null);

/**
 * One outside event, on a PXI page. The flyer is printed large, then the night, the place, the price and the one
 * button that leaves (it goes through /go/[id]/out, which counts the click). Under it, the reason the page exists:
 * an invitation to make an album with your friends for the night.
 *
 * Server-rendered: everything here is read from the listing, and the Directions link is chosen from the visitor's
 * own agent (Apple Maps or Google Maps), so there is no flash and no script for it.
 *
 * @param {{ listing: object, id: string, userAgent: string, platform: 'ios' | 'android' | 'desktop' }} props
 */
export default function GoListingView({ listing, id, userAgent, platform }) {
  const title = text(listing.title);
  const night = formatNightLine(listing);
  const time = formatTimeLine(listing.startsAt, listing.endsAt, listing.timeZone);
  const venue = venueLabel(listing);
  const address = addressLine(venue, listing.address);
  const directions = directionsUrl(listing, userAgent);
  const price = priceLabel(listing);
  const host = text(listing.organizerName);
  const ended = isEnded(listing);
  const also = alsoOnEntries(listing);
  // The button only goes where the redirect will follow it: a listing whose ticket link is missing or unsafe has none.
  const canBuy = !ended && Boolean(outTarget(listing));

  const rawSong = listing.topSong && typeof listing.topSong === 'object' ? listing.topSong : null;
  const song = rawSong && text(rawSong.title)
    ? { title: text(rawSong.title), artist: text(rawSong.artist), artworkUrl: httpsOnly(rawSong.artworkUrl), previewUrl: httpsOnly(rawSong.previewUrl) }
    : null;

  // The flyer as an absolute https address (an http one is upgraded). Anything that is not an address is no flyer:
  // the poster prints instead.
  const flyer = toOpenGraphImageUrl(getSiteUrl(), listing.coverUrl);

  return (
    <div className="go">
      <header className="go-bar">
        <a className="go-mark" href="/" aria-label="PXI home">
          <img src="/site/img/pxi-mark.svg?v=grit5" alt="" width="36" height="36" />
        </a>
      </header>

      <article className="go-night">
        <div className="go-art">
          <GoArt
            title={title}
            coverUrl={flyer}
            credit={text(listing.coverAttribution)}
            poster={{ title, venue, night, colors: posterColors(listing) }}
          />
        </div>

        <div className="go-info">
          <h1 className="go-title" data-long={title.length > 44 ? 'true' : undefined}>{title}</h1>

          {night || time ? (
            <p className="go-when">
              {night ? <span className="go-day">{night}</span> : null}
              {time ? <span className="go-time">{time}</span> : null}
            </p>
          ) : null}

          {venue ? (
            <div className="go-where">
              <div className="go-venue">
                <p className="go-venue-name">{venue}</p>
                {address ? <p className="go-venue-address">{address}</p> : null}
              </div>
              {directions ? (
                <a className="go-dir" href={directions} target="_blank" rel="noopener noreferrer">
                  <HugeiconsIcon icon={Navigation03Icon} size={16} strokeWidth={2.2} aria-hidden="true" />
                  Directions
                </a>
              ) : null}
            </div>
          ) : null}

          {price || host ? (
            <div className="go-facts">
              {price ? <p className="go-price">{price}</p> : null}
              {host ? <p className="go-host">By {host}</p> : null}
            </div>
          ) : null}

          {song ? <GoSong {...song} /> : null}

          {ended || canBuy || also.length ? (
            <div className="go-cta">
              {ended ? (
                <p className="go-ended">This night has passed.</p>
              ) : canBuy ? (
                <a className="go-tickets" href={outPath(id)} rel="nofollow noopener">
                  {ticketLabel(listing)}
                  <HugeiconsIcon icon={ArrowUpRight01Icon} size={20} strokeWidth={2.4} aria-hidden="true" />
                </a>
              ) : null}
              {also.length ? (
                <ul className="go-also">
                  {also.map((entry) => (
                    <li key={entry.key}>
                      {entry.url && !ended ? (
                        <a href={outPath(id, entry.key)} rel="nofollow noopener">{entry.label}</a>
                      ) : (
                        entry.label
                      )}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </div>
      </article>

      <GoAlbumBlock storeHref={appStoreHref(id)} openHref={openInPxiHref(id)} platform={platform} caption={title} />
    </div>
  );
}
