'use client';

// VEN-8, "Photo Albums": the nights that have photos, newest first. The picture on a stack is the night's own
// cover (public nights and the venue's own only). A guest's photo is never shown here, only how many there are.

import Link from 'next/link';
import { resolveDisplayImageUrl } from '@/lib/mediaUrl';
import { formatInteger, formatTimeRange, nightHref } from '@/lib/venueDashboard';
import { CardSkeleton, ClockIcon, VenueCard } from './VenueCard';

function Stack({ name, time, count = null, cover = null, href = null, muted = false }) {
    const body = (
        <div className={`relative h-[156px] w-[132px] shrink-0 ${muted ? 'opacity-60' : ''}`}>
            {/* Two sheets behind the top one, fanned the way the design draws an album. */}
            <span className="absolute inset-x-1 top-0 bottom-3 rotate-[5deg] rounded-xl bg-white/[0.10]" aria-hidden="true" />
            <span className="absolute inset-x-1 top-0 bottom-3 -rotate-[3deg] rounded-xl bg-white/[0.13]" aria-hidden="true" />
            <div className="absolute inset-x-0 bottom-0 top-2 flex flex-col justify-end overflow-hidden rounded-xl bg-white/[0.18]">
                {cover ? <img src={cover} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" /> : null}
                <div className="relative flex items-end justify-between gap-1 rounded-t-lg bg-gradient-to-b from-black/30 to-black/70 px-2 pb-1.5 pt-1 backdrop-blur-[2px]">
                    <div className="min-w-0">
                        <p className="truncate text-[11px] font-bold leading-4 text-white" title={name}>{name}</p>
                        <p className="flex items-center gap-1 whitespace-nowrap text-[9px] font-medium text-white/85">
                            <ClockIcon className="h-2.5 w-2.5 shrink-0" />
                            {time}
                        </p>
                    </div>
                    {count !== null ? (
                        <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-white/85 px-1 text-[9px] font-bold text-black tabular-nums" title={`${formatInteger(count)} photos and videos`}>
                            {count > 999 ? '999+' : count}
                        </span>
                    ) : (
                        <span className="h-4 w-4 shrink-0 rounded-full bg-white/70" aria-hidden="true" />
                    )}
                </div>
            </div>
        </div>
    );
    return href ? <Link href={href} className="shrink-0 transition hover:opacity-90" aria-label={`${name}, ${count} photos and videos`}>{body}</Link> : body;
}

export default function AlbumsCard({ albums = [], loading = false, className = '' }) {
    return (
        <VenueCard title="Photo Albums" className={className} data-venue-card="albums">
            {loading ? <CardSkeleton className="h-36" /> : albums.length ? (
                <div className="dashboard-scrollbar-none flex gap-4 overflow-x-auto pb-1" aria-label="Albums, newest first">
                    {albums.map((album) => (
                        <Stack
                            key={album.eventId}
                            name={album.name}
                            time={formatTimeRange(album.startDate, album.endDate, album.timeZone)}
                            count={album.captures}
                            cover={resolveDisplayImageUrl(album.coverImage)}
                            href={nightHref(album)}
                        />
                    ))}
                </div>
            ) : (
                <div className="flex flex-1 items-center gap-4">
                    <Stack name="Album" time="" muted />
                    <p className="flex-1 text-center text-[11px] font-medium text-white/80">No Active Photo Albums</p>
                </div>
            )}
        </VenueCard>
    );
}
