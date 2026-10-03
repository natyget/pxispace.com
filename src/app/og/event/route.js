import { Buffer } from 'node:buffer';
import { ImageResponse } from 'next/og';
import { getSiteUrl } from '@/lib/siteUrl';
import { getPublicEvent } from '@/lib/publicEvent';
import { getPublicAlbumMeta } from '@/lib/publicAlbum';
import { resolveEventCity } from '@/lib/seo/cities';
import { toOpenGraphImageUrl } from '@/lib/ogImageUrl';
import { formatInviteVenue, formatInviteWhen } from '@/lib/eventInviteCard';

// Node, like /og: next/og's wasm renderer is the fragile part, and this card sits behind every event link.
export const runtime = 'nodejs';

/**
 * The event link-preview card (1200×630) — the app's invite card (EventInviteStoryCanvas):
 * the poster fills the card, one flat band along the bottom carries the event name in orange
 * heavy caps, then "SAT, OCT 4 · 9 PM – 2 AM", then the venue or street (never the full address).
 * No gradients. "Don't cover my poster with the name" (`hideNameOnCover`) sends the poster alone.
 *
 *   /og/event?event=<eventId>     /og/event?album=<albumId>
 *
 * Data is read here, from the same public endpoints the pages use, so the card cannot be
 * tampered with through the URL and always shows the event as it is now.
 */

const ORANGE = '#FF5A1F';
const SHEET = '#1C1C1C';
const BAND = 'rgba(0,0,0,0.88)';
const WIDTH = 1200;
const HEIGHT = 630;
const IMAGE_TYPES = /^image\/(png|jpe?g|gif)/i;

const redirect = (url) => new Response(null, { status: 302, headers: { Location: url, 'Cache-Control': 'public, max-age=300' } });

/** Stack Sans Notch (the site's display face) as TTF from Google Fonts, subset to the card's own text. */
async function loadDisplayFont(text) {
  try {
    const css = await (
      await fetch(`https://fonts.googleapis.com/css2?family=Stack+Sans+Notch:wght@700&text=${encodeURIComponent(text)}`)
    ).text();
    const url = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1];
    if (!url) return null;
    return await (await fetch(url)).arrayBuffer();
  } catch {
    return null;
  }
}

/** The cover fetched here and handed over as a data URI, so a slow or broken image can never fail the card half-way. */
async function loadCover(url) {
  if (!url) return { src: null, passthrough: null };
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return { src: null, passthrough: null };
    const type = res.headers.get('content-type') || '';
    // Not an image the renderer reads (webp, svg...): the poster alone goes out as it is.
    if (!IMAGE_TYPES.test(type)) return { src: null, passthrough: url };
    const bytes = Buffer.from(await res.arrayBuffer());
    return { src: `data:${type.split(';')[0]};base64,${bytes.toString('base64')}`, passthrough: url };
  } catch {
    return { src: null, passthrough: null };
  }
}

/** Name, dates, place and poster of the event or album the link points at. */
async function loadCard(searchParams) {
  const eventId = searchParams.get('event');
  const albumId = searchParams.get('album');
  const site = getSiteUrl();

  if (albumId) {
    const { album } = await getPublicAlbumMeta(String(albumId));
    if (!album) return null;
    const ev = album.event || {};
    return {
      name: ev.name || album.name,
      cover: toOpenGraphImageUrl(site, ev.coverImage || album.coverImage),
      hideName: ev.hideNameOnCover === true,
      event: ev,
    };
  }
  if (eventId) {
    const ev = await getPublicEvent(String(eventId));
    if (!ev || ev.visibility === 'PRIVATE') return null;
    const thumb = Array.isArray(ev.scrapbookThumbnails) ? ev.scrapbookThumbnails[0] : null;
    return {
      name: ev.name,
      cover: toOpenGraphImageUrl(site, ev.coverImage || thumb),
      hideName: ev.hideNameOnCover === true,
      event: ev,
    };
  }
  return null;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const site = getSiteUrl();
  const fallback = `${site}/og-hero.png`;

  let card = null;
  try {
    card = await loadCard(searchParams);
  } catch (error) {
    console.error('[og/event]', error);
  }
  if (!card) return redirect(fallback);

  const { event } = card;
  const { src: coverSrc, passthrough } = await loadCover(card.cover);
  // The poster alone: no band, no lettering (and a poster the renderer cannot read goes out untouched).
  if (card.cover && (card.hideName || (!coverSrc && passthrough))) return redirect(card.cover);

  const name = String(card.name || '').trim() || 'PXI Event';
  const timeZone = event.timezone || resolveEventCity(event)?.timezone || undefined;
  const when = formatInviteWhen(event.startDate, event.endDate, timeZone);
  const whenLine = when ? `${when.day}  ·  ${when.hours}` : '';
  const venue = formatInviteVenue(event.location, event.venueName);

  const hasCover = !!coverSrc;
  const title = name.toUpperCase();
  // The name steps down so it holds two lines, never more.
  const nameSize = hasCover ? (title.length > 44 ? 40 : title.length > 26 ? 48 : 58) : title.length > 44 ? 70 : title.length > 26 ? 88 : 110;

  const fontData = await loadDisplayFont(`${title}${whenLine}${venue}`.toUpperCase());
  const display = fontData ? 'Stack Sans Notch' : undefined;
  const fonts = fontData ? [{ name: 'Stack Sans Notch', data: fontData, weight: 700, style: 'normal' }] : undefined;

  const text = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: hasCover ? 'flex-start' : 'center',
        width: '100%',
        padding: hasCover ? '26px 56px 30px' : '0 80px',
        textAlign: hasCover ? 'left' : 'center',
      }}
    >
      <div
        style={{
          display: 'flex',
          color: ORANGE,
          fontFamily: display,
          fontWeight: 700,
          fontSize: nameSize,
          lineHeight: 1.04,
          letterSpacing: '-0.01em',
          textTransform: 'uppercase',
          maxHeight: nameSize * 2.1,
          overflow: 'hidden',
          justifyContent: hasCover ? 'flex-start' : 'center',
        }}
      >
        {title}
      </div>
      {whenLine ? (
        <div
          style={{
            display: 'flex',
            marginTop: hasCover ? 12 : 18,
            color: '#FFFFFF',
            fontFamily: display,
            fontWeight: 700,
            fontSize: hasCover ? 30 : 44,
            letterSpacing: '0.02em',
          }}
        >
          {whenLine}
        </div>
      ) : null}
      {venue ? (
        <div
          style={{
            display: 'flex',
            marginTop: 6,
            color: 'rgba(255,255,255,0.7)',
            fontFamily: display,
            fontWeight: 700,
            fontSize: hasCover ? 26 : 38,
            letterSpacing: '0.02em',
            textTransform: 'uppercase',
          }}
        >
          {venue}
        </div>
      ) : null}
    </div>
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: WIDTH,
          height: HEIGHT,
          display: 'flex',
          position: 'relative',
          background: SHEET,
          alignItems: hasCover ? 'flex-end' : 'center',
          justifyContent: 'center',
        }}
      >
        {hasCover ? (
          <img
            src={coverSrc}
            alt=""
            width={WIDTH}
            height={HEIGHT}
            style={{ position: 'absolute', top: 0, left: 0, width: WIDTH, height: HEIGHT, objectFit: 'cover' }}
          />
        ) : null}
        <div style={{ display: 'flex', width: '100%', background: hasCover ? BAND : 'transparent' }}>{text}</div>
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
