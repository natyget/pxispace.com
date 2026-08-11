'use client';

import { useRouter } from 'next/navigation';
import { HugeiconsIcon } from '@hugeicons/react';
import { FavouriteIcon, MusicNote01Icon } from '@hugeicons/core-free-icons';
import { trackRecommendationClick, trackSelectItem } from '@/lib/analytics';

/**
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
  const router = useRouter();
  const href = `${String(detailBasePath).replace(/\/$/, '')}/${event.id}`;
  const open = () => {
    if (sponsored) onSponsoredClick?.();
    // Both wrappers are synchronous and fail-silent — nothing here can delay the route.
    if (listId || listName) trackSelectItem({ listId, listName, item: event, index });
    if (recSource) {
      trackRecommendationClick({ ...event, recSource, recRank: recRank ?? index });
    }
    router.push(href);
  };

  const dateStr =
    event.date ||
    (event.startDate
      ? new Date(event.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : null);

  const matchScore =
    event.musicMatchScore != null && event.musicMatchScore > 0 ? event.musicMatchScore : null;

  return (
    <div
      onClick={open}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && open()}
      className="group relative cursor-pointer overflow-hidden rounded-lg bloom-purple focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-zinc-900">
        <img
          src={event.coverImage || event.image}
          alt={event.title || ''}
          className="h-full w-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent" />

        {/* Top-left: music match % when scored — otherwise nothing */}
        {matchScore != null ? (
          <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1.5 text-[11px] font-black uppercase tracking-widest text-white backdrop-blur-sm">
            <HugeiconsIcon icon={MusicNote01Icon} size={12} className="text-white" />
            {matchScore}%
          </span>
        ) : null}

        {/* Favorite toggle button top-right */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite?.(event.id);
          }}
          className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-black/40 border-0 text-white hover:bg-black/60 transition-colors backdrop-blur-sm"
          aria-label={favorited ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <HugeiconsIcon
            icon={FavouriteIcon}
            size={14}
            className={favorited ? 'fill-current text-[#d84aff]' : 'text-white/70'}
          />
        </button>

        {/* Bottom overlay: time / title / location */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          {sponsored ? (
            <span className="mb-2 inline-flex rounded-full border border-white/20 bg-black/50 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-white/90 backdrop-blur-sm">
              Sponsored
            </span>
          ) : null}
          {dateStr ? (
            <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-zinc-300">{dateStr}</p>
          ) : null}
          <h3 className="text-white mb-1 text-2xl font-black uppercase leading-none tracking-tighter">
            {event.title}
          </h3>
          <p className="text-sm font-bold text-zinc-300 mb-2">{event.location || event.venue}</p>

          {event.distanceKm != null ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-zinc-300">
                {Math.round(event.distanceKm * 10) / 10} km
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default EventCard;
