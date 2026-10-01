'use client';

import './discover.css';
import { attendeeCount, hostOf, initialsOf, titleScale } from './discoverEvent';

/**
 * The album sleeve every discovery surface is built from: a portrait cover (heavy title
 * top-left, "BY HOST" in purple, a guest facepile bottom-left) with a black vinyl record
 * tucked behind it. `variant="stage"` slides pop the record out; `variant="card"` shows a
 * sliver of it and slides it out on hover. All geometry is in container-width units (cqw),
 * so the same markup scales from a 120px thumbnail to a 450px hero.
 */

// Faces are real people or nothing: up to three guests when the API sends `attendeePreview`,
// otherwise the host alone. No placeholder circles.
export function Facepile({ event }) {
  const host = hostOf(event);
  const count = attendeeCount(event);
  const guests = (Array.isArray(event.attendeePreview) ? event.attendeePreview : [])
    .filter((g) => g && g.avatarUrl)
    .slice(0, 3);
  if (!guests.length && !host.name && !host.avatar && !count) return null;
  return (
    <span className="dsc-faces" role="img" aria-label={count ? `${count} going` : `Hosted by ${host.name}`}>
      {guests.length ? (
        guests.map((g, i) => (
          <span key={g.id || i} className="dsc-face">
            <img src={g.avatarUrl} alt="" draggable={false} loading="lazy" decoding="async" />
          </span>
        ))
      ) : host.name || host.avatar ? (
        <span className="dsc-face">
          {host.avatar ? (
            <img src={host.avatar} alt="" draggable={false} loading="lazy" decoding="async" />
          ) : (
            initialsOf(host.name)
          )}
        </span>
      ) : null}
      {count > 0 ? <span className="dsc-faces-n">{count > 999 ? '999+' : count} going</span> : null}
    </span>
  );
}

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
  const poster = event.coverHasTitle === true;
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
        <Facepile event={event} />
        {overlay}
      </Cover>
      {tab}
    </div>
  );
}
