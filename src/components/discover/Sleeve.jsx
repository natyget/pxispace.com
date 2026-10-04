'use client';

import './discover.css';
import { hostOf, titleScale } from './discoverEvent';

/**
 * The album sleeve every discovery surface is built from: a portrait cover (heavy title
 * top-left, "BY HOST" in purple) with a black vinyl record tucked behind it. `variant="stage"` slides pop the record out; `variant="card"` shows a
 * sliver of it and slides it out on hover. All geometry is in container-width units (cqw),
 * so the same markup scales from a 120px thumbnail to a 450px hero.
 */

function Disc({ image }) {
  const safe = image ? String(image).replace(/["\\\n]/g, '') : '';
  return (
    <span className="dsc-disc-wrap" aria-hidden="true">
      <span className="dsc-disc">
        <span className="dsc-label" style={safe ? { backgroundImage: `url("${safe}")` } : undefined} />
      </span>
    </span>
  );
}

/**
 * @param {object} props
 * @param {object} props.event normalized event (title, coverImage/image, organizerName, ...)
 * @param {'stage'|'card'} [props.variant]
 * @param {React.ElementType} [props.coverAs] element/component for the cover (Link, 'div', ...)
 * @param {object} [props.coverProps] props for the cover element (href, onClick, ...)
 * @param {React.ReactNode} [props.tab] siblings of the cover: the orange tab, the heart button
 * @param {React.ReactNode} [props.overlay] non-interactive badges drawn inside the cover
 * @param {React.ReactNode} [props.discInfo] what is printed on the record (stage only)
 * @param {boolean} [props.popped] stage only: the record is out (spinning, label showing)
 * @param {boolean} [props.eager] load the cover image immediately
 */
export default function Sleeve({
  event,
  variant = 'card',
  coverAs,
  coverProps = {},
  tab = null,
  overlay = null,
  discInfo = null,
  popped = false,
  eager = false,
}) {
  const Cover = coverAs || 'div';
  const { className: coverClass, ...restCover } = coverProps;
  const host = hostOf(event);
  const image = event.coverImage || event.image;
  // A finished poster already carries the event's name: show the artwork alone.
  const poster = event.hideNameOnCover === true;
  return (
    <div className={`dsc-sleeve dsc-sleeve-${variant}${popped ? ' is-popped' : ''}${poster ? ' is-poster' : ''}`}>
      <Disc image={image} />
      {discInfo}
      <Cover {...restCover} className={coverClass ? `dsc-cover ${coverClass}` : 'dsc-cover'}>
        <img
          className="dsc-img"
          src={image}
          alt=""
          draggable={false}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
        />
        <span className="dsc-scrim" aria-hidden="true" />
        {poster ? null : (
          <span className="dsc-meta">
            <span className="dsc-ttl" style={{ '--fs': titleScale(event.title, variant === 'card' ? 71 : 80) }}>
              {event.title || 'Untitled'}
            </span>
            {host.name ? <span className="dsc-by">by {host.name}</span> : null}
          </span>
        )}
        {overlay}
      </Cover>
      {tab}
    </div>
  );
}
