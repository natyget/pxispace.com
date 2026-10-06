'use client';

import { useEffect, useRef, useState } from 'react';
import GigPoster from './GigPoster';

/**
 * The night's picture, printed: the flyer in a white print border, slightly tilted, on the dark page. A listing
 * with no flyer, or one whose image does not load (the source's CDN is down, or a link has rotted), gets the
 * typographic poster in the same print, so the page never shows a broken image.
 *
 * It is a client component only for that fallback. The server renders the flyer straight away.
 *
 * @param {{
 *   title: string,
 *   coverUrl?: string | null,
 *   credit?: string,
 *   poster: { title: string, venue?: string, night?: string, colors: { ink: string, on: string } },
 * }} props
 */
export default function GoArt({ title, coverUrl, credit = '', poster }) {
  const [broken, setBroken] = useState(false);
  const img = useRef(null);

  // An image that failed before React attached its onError (the server HTML loaded it first) never fires the event.
  useEffect(() => {
    const el = img.current;
    if (el && el.complete && el.naturalWidth === 0) setBroken(true);
  }, []);

  if (!coverUrl || broken) {
    return (
      <div className="go-print go-print-poster">
        <GigPoster {...poster} />
      </div>
    );
  }
  return (
    <>
      <figure className="go-print">
        <img
          ref={img}
          src={coverUrl}
          alt={`Flyer for ${title}`}
          referrerPolicy="no-referrer"
          decoding="async"
          fetchPriority="high"
          onError={() => setBroken(true)}
        />
      </figure>
      {credit ? <p className="go-credit">{credit}</p> : null}
    </>
  );
}
