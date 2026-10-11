'use client';

import Link from 'next/link';
import { HugeiconsIcon } from '@hugeicons/react';
import { FavouriteIcon, MusicNote01Icon } from '@hugeicons/core-free-icons';
import Sleeve from '@/components/discover/Sleeve';
import { formatWhen, priceLabel, splitLocation } from '@/components/discover/discoverEvent';
import { trackRecommendationClick, trackSelectItem } from '@/lib/analytics';

/**
 * The browse card: an album sleeve (heavy title, "by host", guest facepile) with its record
 * tucked behind the cover. It slides out a little on hover or keyboard focus. Shared by
 * /events, the city and genre hubs and the wishlist, so they all look like the app's Discover.
 *
 * The cover is a real link to the event page (a crawlable href, open in a new tab, focusable),
 * and the analytics calls fire from its click just as they did from the old card.
 *
 * @param {Object} props
 * @param {string} [props.listId]   GA4 item_list_id — omit and the card reports no select_item
 * @param {string} [props.listName] GA4 item_list_name
 * @param {number} [props.index]    zero-based position in that list
 * @param {'taste_match'|'city'|'genre'|'friend'} [props.recSource]
 *        Set ONLY when the surface really is a recommendation. A plain filtered
 *        grid (city hub, wishlist, date filter) is not one.
 * @param {number} [props.recRank]  zero-based rank inside the recommendation set
 */
const EventCard = ({
  event,
  favorited,
  onToggleFavorite,
  detailBasePath = '/events',
  sponsored = false,
  onSponsoredClick,
  listId,
  listName,
  index,
  recSource,
  recRank,
}) => {
  const href = `${String(detailBasePath).replace(/\/$/, '')}/${event.id}`;

  const onOpen = () => {
    if (sponsored) onSponsoredClick?.();
    // Both wrappers are synchronous and fail-silent — nothing here can delay the route.
    if (listId || listName) trackSelectItem({ listId, listName, item: event, index });
    if (recSource) {
      trackRecommendationClick({ ...event, recSource, recRank: recRank ?? index });
    }
  };

  const when = event.startDate ? formatWhen(event.startDate) : event.date || 'Date TBA';
  const place = splitLocation({ ...event, location: event.location || event.venue }).venue;
  const km = event.distanceKm != null ? `${Math.round(event.distanceKm * 10) / 10} km` : '';
  const hasPrice = event.price != null && String(event.price).trim() !== '';

  const score = Number(event.musicMatchScore);
  const match = Number.isFinite(score) && score > 0 ? Math.round(score) : null;

  let badge = null;
  if (sponsored) {
    badge = <span className="dsc-badge">Sponsored</span>;
  } else if (match != null) {
    badge = (
      <span className="dsc-badge">
        <HugeiconsIcon icon={MusicNote01Icon} size={10} strokeWidth={2.6} />
        {match}%
      </span>
    );
  }

  return (
    <article className="dsc-card">
      <Sleeve
        event={event}
        variant="card"
        coverAs={Link}
        coverProps={{ href, prefetch: false, draggable: false, onClick: onOpen }}
        overlay={badge}
        tab={
          onToggleFavorite ? (
            <button
              type="button"
              className="dsc-heart"
              aria-pressed={Boolean(favorited)}
              aria-label={favorited ? 'Remove from wishlist' : 'Add to wishlist'}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleFavorite(event.id);
              }}
            >
              <HugeiconsIcon icon={FavouriteIcon} size={15} strokeWidth={2.2} />
            </button>
          ) : null
        }
      />
      <div className="dsc-card-cap">
        <span className="dsc-card-when">{when}</span>
        <div className="dsc-card-row">
          <span className="dsc-card-where">
            {place}
            {km ? <span className="ml-2 opacity-60">{km}</span> : null}
          </span>
          {hasPrice ? <span className="dsc-card-price">{priceLabel(event)}</span> : null}
        </div>
      </div>
    </article>
  );
};

export default EventCard;
