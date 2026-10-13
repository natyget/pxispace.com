'use client';

import Image from 'next/image';
import Link from 'next/link';
import { HugeiconsIcon } from '@hugeicons/react';
import { Calendar01Icon } from '@hugeicons/core-free-icons';

/**
 * Poster, title, venue and date for a live or upcoming event.
 * Shared by the Diplomat and Citizen Command Centers.
 * event: { href, name, cover, venue, status, dateLabel }
 */
export default function EventCard({ event }) {
    return (
        <Link href={event.href} className="w-[240px] shrink-0 overflow-hidden rounded-[1.25rem] bg-pxi-field transition hover:bg-[#3a3a3a] md:w-auto">
            <div className="relative aspect-[4/3] bg-pxi-surface">
                {event.cover ? (
                    <Image src={event.cover} alt={event.name} fill unoptimized sizes="240px" className="object-cover" />
                ) : (
                    <div className="flex h-full w-full items-center justify-center">
                        <HugeiconsIcon icon={Calendar01Icon} size={28} className="text-zinc-600" />
                    </div>
                )}
            </div>
            <div className="p-4">
                <h3 className="truncate text-sm font-bold text-white">{event.name}</h3>
                <p className="mt-1 truncate text-xs text-zinc-500">{event.venue || 'Venue TBD'}</p>
                <p className="mt-1 text-xs text-zinc-500">{event.status}, {event.dateLabel}</p>
            </div>
        </Link>
    );
}
