'use client';

import { useEffect, useRef, useState } from 'react';
import GigPoster from './GigPoster';

/** How long the room held for a flyer that has not arrived is held before it is let go. */
const HOLD_MS = 4000;

/**
 * The night's picture, printed: the flyer in a white print border, slightly tilted, on the dark page. A listing
 * with no flyer, or one whose image does not load (the source's CDN is down, or a link has rotted), gets the
 * typographic poster in the same print, so the page never shows a broken image.
 *
 * A flyer's size is not known until it arrives, so on a phone the room it most likely takes is held until it does
 * (go.css, .go-slot.is-waiting): the title and the buttons under it do not jump down when it appears. The room is
 * let go as soon as the picture is there, or after a few seconds, so a wide flyer leaves no gap.
 *
 * It is a client component only for that and for the fallback. The server renders the flyer straight away.
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
  const [arrived, setArrived] = useState(!coverUrl);
  const img = useRef(null);

  // An image that finished (or failed) before React attached its handlers, because the server HTML loaded it first,
  // never fires them: look once the page has hydrated.
  useEffect(() => {
    const look = () => {
      const el = img.current;
      if (!el || !el.complete) return;
      setArrived(true);
      if (el.naturalWidth === 0) setBroken(true);
    };
    const frame = requestAnimationFrame(look);
    const timer = setTimeout(() => setArrived(true), HOLD_MS);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
    };
  }, []);

  const showPoster = !coverUrl || broken;
  return (
    <div className={`go-slot${arrived ? '' : ' is-waiting'}`}>
      {showPoster ? (
        <div className="go-print go-print-poster">
          <GigPoster {...poster} />
        </div>
      ) : (
        <>
          <figure className="go-print">
            <img
              ref={img}
              src={coverUrl}
              alt={`Flyer for ${title}`}
              referrerPolicy="no-referrer"
              decoding="async"
              fetchPriority="high"
              onLoad={() => setArrived(true)}
              onError={() => {
                setBroken(true);
                setArrived(true);
              }}
            />
          </figure>
          {credit ? <p className="go-credit">{credit}</p> : null}
        </>
      )}
    </div>
  );
}
