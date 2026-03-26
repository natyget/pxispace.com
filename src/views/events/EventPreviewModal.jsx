'use client';

import React from 'react';
import Image from 'next/image';
import { X, Calendar, MapPin, ExternalLink } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

const EventPreviewModal = ({ open, onClose, event, detailBasePath = '/events' }) => {
  const router = useRouter();
  if (!open || !event) return null;

  const goFull = () => {
    onClose();
    router.push(`${String(detailBasePath).replace(/\/$/, '')}/${event.id}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-lg bg-zinc-950 border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl"
      >
        <div className="relative h-52">
          <Image
            src={event.image}
            alt=""
            fill
            unoptimized
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 32rem"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent" />
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-8 space-y-4">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-pxi-purple">{event.status}</p>
          <h2 className="text-2xl font-black uppercase tracking-tighter text-white leading-tight">{event.title}</h2>
          <div className="flex flex-col gap-2 text-zinc-400 text-sm">
            <span className="flex items-center gap-2">
              <Calendar size={16} className="text-pxi-purple shrink-0" />
              {event.date}
            </span>
            <span className="flex items-center gap-2">
              <MapPin size={16} className="text-pxi-purple shrink-0" />
              {event.location}
            </span>
          </div>
          {event.description ? (
            <p className="text-zinc-500 text-sm leading-relaxed line-clamp-4">{event.description}</p>
          ) : null}
          <div className="flex gap-3 pt-2">
            <Button variant="neon" className="flex-1 uppercase tracking-widest" onClick={goFull} icon={<ExternalLink size={16} />}>
              Open album
            </Button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-xl border border-white/10 text-zinc-400 text-sm font-medium hover:bg-white/5"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventPreviewModal;
