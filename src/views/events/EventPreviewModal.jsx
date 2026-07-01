'use client';

import React, { useEffect } from 'react';
import Image from 'next/image';
import { HugeiconsIcon } from '@hugeicons/react';
import { Cancel01Icon, Calendar01Icon, Location01Icon, Ticket01Icon } from '@hugeicons/core-free-icons';
import Button from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

const EventPreviewModal = ({ open, onClose, event, detailBasePath = '/events' }) => {
  const router = useRouter();

  /* Lock body scroll when open */
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  /* Close on Escape */
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || !event) return null;

  const goFull = () => {
    onClose();
    router.push(`${String(detailBasePath).replace(/\/$/, '')}/${event.id}`);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[8vh] md:pt-[10vh] p-4 md:p-8 overflow-y-auto"
      onClick={onClose}
    >
      {/* Backdrop — click anywhere to close */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" aria-hidden />

      {/* Floating card */}
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-xl bg-zinc-950 border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative h-56 md:h-64">
          <Image
            src={event.image}
            alt=""
            fill
            unoptimized
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 36rem"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent" />
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            aria-label="Close preview"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={20} />
          </button>
        </div>

        <div className="p-8 space-y-4">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-pxi-purple">{event.status}</p>
          <h2 className="text-2xl font-black uppercase tracking-tighter text-white leading-tight">{event.title}</h2>
          <div className="flex flex-col gap-2 text-zinc-400 text-sm">
            <span className="flex items-center gap-2">
              <HugeiconsIcon icon={Calendar01Icon} size={16} className="text-pxi-purple shrink-0" />
              {event.date}
            </span>
            <span className="flex items-center gap-2">
              <HugeiconsIcon icon={Location01Icon} size={16} className="text-pxi-purple shrink-0" />
              {event.location}
            </span>
          </div>
          {event.description ? (
            <p className="text-zinc-500 text-sm leading-relaxed line-clamp-4">{event.description}</p>
          ) : null}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <Button
              variant="neon"
              className="w-full uppercase tracking-widest"
              onClick={goFull}
              icon={<HugeiconsIcon icon={Ticket01Icon} size={16} />}
            >
              {event.ticketType === 'PAID' || (event.price && event.price !== 'Free') ? 'Get Ticket' : 'RSVP'}
            </Button>
            <Link
              href={`/album/${event.albumId || event.id}`}
              onClick={onClose}
              className="w-full flex items-center justify-center gap-2 rounded-full bg-[var(--pxi-orange)]/15 hover:bg-[var(--pxi-orange)]/25 px-6 py-3 text-[11px] font-black uppercase tracking-widest text-[var(--pxi-orange)] transition hover:scale-105 border-0 shadow-md"
            >
              <HugeiconsIcon icon={Calendar01Icon} size={16} className="text-[var(--pxi-orange)]" />
              Open Album
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventPreviewModal;
