'use client';

import React from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Calendar01Icon, Location01Icon, Ticket01Icon, FavouriteIcon, Maximize01Icon } from '@hugeicons/core-free-icons';
import Button from '../../components/ui/Button';
import { useRouter } from 'next/navigation';

const EventCard = ({ event, favorited, onToggleFavorite, onQuickView, detailBasePath = '/events' }) => {
  const router = useRouter();
  const detailHref = `${String(detailBasePath).replace(/\/$/, '')}/${event.id}`;

  return (
    <div className="group relative flex flex-col glass-dark rounded-[3rem] border border-white/5 hover:border-pxi-purple/30 transition-all duration-500 overflow-hidden">
      <div className="relative h-72 overflow-hidden">
        <img
          src={event.image}
          alt=""
          className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-1000"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite?.(event.id);
          }}
          className="absolute top-6 right-6 p-3 rounded-full bg-black/40 border border-white/10 text-white hover:bg-black/60 transition-colors backdrop-blur-md"
          aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
        >
          <HugeiconsIcon icon={FavouriteIcon} size={20} className={favorited ? 'fill-pink-500 text-pink-500' : ''} />
        </button>

        <div className="absolute top-8 left-8 px-4 py-1.5 glass rounded-full border-white/10 backdrop-blur-xl">
          <span className="text-[10px] font-black tracking-widest text-white uppercase">{event.status}</span>
        </div>

        <div className="absolute bottom-8 right-8 px-5 py-2.5 glass rounded-2xl border-white/20 backdrop-blur-md shadow-2xl">
          <span className="text-xl font-black text-white">{event.price}</span>
        </div>
      </div>

      <div className="p-10 flex-1 flex flex-col">
        <div className="flex items-center gap-3 mb-5">
          <HugeiconsIcon icon={Calendar01Icon} size={16} className="text-pxi-purple" />
          <span className="text-[11px] font-black tracking-[0.2em] text-zinc-500 uppercase">{event.date}</span>
        </div>

        <h3 className="text-3xl font-black text-white uppercase tracking-tighter mb-5 leading-none group-hover:text-[#e070ff] group-hover:drop-shadow-[0_0_12px_rgba(224,112,255,0.6)] transition-all">
          {event.title}
        </h3>

        <div className="flex items-center gap-2 mb-6">
          <HugeiconsIcon icon={Location01Icon} size={16} className="text-zinc-500 shrink-0" />
          <span className="text-sm font-bold text-zinc-400">{event.location}</span>
        </div>

        {event.vendorHint ? (
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-6">{event.vendorHint}</p>
        ) : null}

        <div className="mt-auto flex flex-wrap items-center justify-between gap-4">
          <span className="text-[11px] font-black text-zinc-500 uppercase tracking-widest">{event.members} attending</span>

          <div className="flex flex-wrap gap-2 justify-end">
            {/* Preview — desktop only */}
            <Button
              variant="glass"
              className="!px-5 !py-3 !text-[10px] uppercase tracking-widest border-white/10 hidden sm:inline-flex"
              icon={<HugeiconsIcon icon={Maximize01Icon} size={14} />}
              onClick={() => onQuickView?.(event)}
            >
              Preview
            </Button>
            <Button
              variant="primary"
              className="!px-6 !py-3 !text-[11px] uppercase tracking-widest"
              icon={<HugeiconsIcon icon={Ticket01Icon} size={16} />}
              onClick={() => router.push(detailHref)}
            >
              RSVP
            </Button>
          </div>
        </div>
      </div>

      <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-pxi-purple/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
};

export default EventCard;
