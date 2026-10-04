'use client';

// VEN-8, "Tonight." and "Upcoming Events.": the nights booked in the room. A night's artwork is its own cover,
// which the API only sends for a public night or one the venue hosts. Who else hosts a night is not shown.

import Link from 'next/link';
import { DASHBOARD_LIVE_COLOR } from '@/components/dashboard/chartStyles';
import { resolveDisplayImageUrl } from '@/lib/mediaUrl';
import { formatInteger, formatTimeRange, nightBadge, nightHref } from '@/lib/venueDashboard';
import { CardSkeleton, ClockIcon } from './VenueCard';

function NightTile({ night }) {
    const cover = resolveDisplayImageUrl(night.coverImage);
    const href = nightHref(night);
    const tonight = night.state === 'LIVE' || night.state === 'TONIGHT';
    return (
        <article className="relative flex h-[184px] w-[118px] shrink-0 flex-col justify-end overflow-hidden rounded-2xl bg-white/[0.16]">
            {cover ? <img src={cover} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" /> : null}
            <span
                className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${tonight ? 'text-white' : 'bg-black/35 text-white ring-1 ring-white/60'}`}
                style={tonight ? { background: DASHBOARD_LIVE_COLOR } : undefined}
            >
                {nightBadge(night)}
            </span>
            <div className="relative rounded-t-xl bg-gradient-to-b from-black/35 to-black/70 px-2 pb-2 pt-1.5 backdrop-blur-[2px]">
                <h3 className="truncate text-[13px] font-bold leading-[18px] text-white" title={night.name}>{night.name}</h3>
                <p className="flex items-center gap-1 whitespace-nowrap text-[10px] font-medium text-white/90">
                    <ClockIcon />
                    {formatTimeRange(night.startDate, night.endDate, night.timeZone)}
                </p>
                <p className="truncate text-[10px] text-white/65">
                    {night.hostedByVenue ? 'Host: You' : `${formatInteger(night.ticketsSold)} ${night.ticketsSold === 1 ? 'ticket' : 'tickets'}`}
                </p>
                {href ? (
                    <Link href={href} className="mt-1 ml-auto block w-fit rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-semibold text-white transition hover:bg-white/30">
                        Details
                    </Link>
                ) : null}
            </div>
        </article>
    );
}

function Column({ heading, children, className = '' }) {
    return (
        <div className={`flex min-w-0 flex-col ${className}`.trim()}>
            <h2 className="whitespace-nowrap text-[14px] font-semibold tracking-tight text-white">{heading}</h2>
            <div className="mt-1.5 flex min-h-[184px] flex-1">{children}</div>
        </div>
    );
}

function Nothing({ children }) {
    return <p className="m-auto px-1 text-center text-[11px] font-medium text-white/80">{children}</p>;
}

export default function NightsCard({ tonight = [], upcoming = [], hasHistory = false, loading = false, className = '' }) {
    // One night leads the Tonight column. A second night on the same day joins the row that scrolls.
    const [lead, ...alsoTonight] = tonight;
    const later = [...alsoTonight, ...upcoming];
    return (
        <section className={`glass-panel flex min-w-0 rounded-[1.25rem] p-4 ${className}`.trim()} data-venue-card="nights">
            {loading ? <CardSkeleton className="h-52" /> : (
                <div className="flex min-w-0 flex-1 gap-3">
                    <Column heading="Tonight." className="w-[118px] shrink-0">
                        {lead ? <NightTile night={lead} /> : <Nothing>No Events Tonight</Nothing>}
                    </Column>
                    <Column heading="Upcoming Events." className="flex-1">
                        {later.length ? (
                            <div className="dashboard-scrollbar-none flex w-full gap-3 overflow-x-auto" aria-label="Upcoming nights">
                                {later.map((night) => <NightTile key={night.eventId} night={night} />)}
                            </div>
                        ) : (
                            <Nothing>{hasHistory || lead ? 'No Upcoming Events' : 'No Upcoming Events Happening'}</Nothing>
                        )}
                    </Column>
                </div>
            )}
        </section>
    );
}
