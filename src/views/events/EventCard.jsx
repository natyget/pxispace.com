'use client';

import { useRouter } from 'next/navigation';
import { HugeiconsIcon } from '@hugeicons/react';
import { FavouriteIcon } from '@hugeicons/core-free-icons';
import { displayImageSrc } from '@/lib/mediaUrl';

const EventCard = ({ event, favorited, onToggleFavorite, detailBasePath = '/events', sponsored = false, onSponsoredClick }) => {
  const router = useRouter();
  const href = `${String(detailBasePath).replace(/\/$/, '')}/${event.id}`;
  const open = () => {
    if (sponsored) onSponsoredClick?.();
    router.push(href);
  };

  const dateStr =
    event.date ||
    (event.startDate
      ? new Date(event.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : null);

  const organizer = event.organizer || null;
  const organizerAvatarUrl = organizer?.avatarUrl || event.organizerAvatar || null;
  const organizerDisplayName = organizer?.name || organizer?.username || event.organizerName || null;
  const organizerInitial = (organizerDisplayName || event.title || '?').charAt(0).toUpperCase();

  return (
    <div
      onClick={open}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && open()}
      className="group relative cursor-pointer overflow-hidden rounded-lg bloom-purple transition-transform duration-300 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-zinc-900">
        <img
          src={event.coverImage || event.image}
          alt={event.title || ''}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent" />

        {/* Organizer avatar top-left */}
        <div className="absolute left-4 top-4" title={organizerDisplayName || undefined}>
          {displayImageSrc(organizerAvatarUrl) ? (
            <img
              src={displayImageSrc(organizerAvatarUrl)}
              alt={organizerDisplayName || 'Organizer'}
              className="h-10 w-10 rounded-full object-cover shadow-lg shadow-black/40"
            />
          ) : (
            <div className="h-10 w-10 rounded-full shadow-lg shadow-black/40 bg-zinc-800 grid place-items-center text-xs font-black text-white">
              {organizerInitial}
            </div>
          )}
        </div>

        {/* Favorite toggle button top-right */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite?.(event.id);
          }}
          className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-black/40 border-0 text-white hover:bg-black/60 transition-colors backdrop-blur-sm"
          aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
        >
          <HugeiconsIcon
            icon={FavouriteIcon}
            size={14}
            className={favorited ? 'fill-current text-[#d946ef]' : 'text-white/70'}
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

          {(event.musicMatchScore != null && event.musicMatchScore > 0) || event.distanceKm != null ? (
            <div className="flex flex-wrap items-center gap-2">
              {event.musicMatchScore != null && event.musicMatchScore > 0 ? (
                <span className="inline-flex items-center rounded-full border border-pxi-purple/40 bg-pxi-purple/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-pxi-purple">
                  ★ {event.musicMatchScore}% match
                </span>
              ) : null}
              {event.distanceKm != null ? (
                <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-zinc-300">
                  {Math.round(event.distanceKm * 10) / 10} km
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default EventCard;
