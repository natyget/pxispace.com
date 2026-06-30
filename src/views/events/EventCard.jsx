'use client';

import { useRouter } from 'next/navigation';
import { HugeiconsIcon } from '@hugeicons/react';
import { FavouriteIcon } from '@hugeicons/core-free-icons';

const EventCard = ({ event, favorited, onToggleFavorite, detailBasePath = '/events' }) => {
  const router = useRouter();
  const href = `${String(detailBasePath).replace(/\/$/, '')}/${event.id}`;

  const dateStr =
    event.date ||
    (event.startDate
      ? new Date(event.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : null);

  const organizerInitial = (event.organizerName || event.title || '?').charAt(0).toUpperCase();

  return (
    <div
      onClick={() => router.push(href)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && router.push(href)}
      className="group relative cursor-pointer overflow-hidden rounded-3xl bloom-purple transition-transform duration-300 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-3xl bg-zinc-900">
        <img
          src={event.coverImage || event.image}
          alt={event.title || ''}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent" />

        {/* Organizer avatar top-left */}
        <div className="absolute left-4 top-4">
          {event.organizerAvatar ? (
            <img
              src={event.organizerAvatar}
              alt=""
              className="h-9 w-9 rounded-full object-cover border-0"
            />
          ) : (
            <div className="h-9 w-9 rounded-full border-0 bg-white/10 backdrop-blur-sm grid place-items-center text-xs font-black text-white">
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
          {dateStr ? (
            <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-zinc-300">{dateStr}</p>
          ) : null}
          <h3 className="text-white mb-1 text-2xl font-black uppercase leading-none tracking-tighter">
            {event.title}
          </h3>
          <p className="text-sm font-bold text-zinc-300">{event.location || event.venue}</p>
        </div>
      </div>
    </div>
  );
};

export default EventCard;
