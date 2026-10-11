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

// The two headings share a row, the first column is as wide as a night tile, and the dashboard draws headings
// in capitals in the display font. "Upcoming Events." is then wider than what is left for it in a narrow card,
// and used to run past the card's edge. Two things keep it inside, at any width:
//   - the card is a size container, and both headings take the largest size, between 12px and 14px, at which
//     that one fits on a line beside the Tonight column;
//   - where even 12px is too wide (four cards to a row on a small laptop), it wraps onto a second line. The
//     headings are a row of their own, set on its bottom edge, so the tiles under them still line up.
const TONIGHT_COLUMN_PX = 118;
const COLUMN_GAP_PX = 12;
/** How wide "UPCOMING EVENTS." is, in ems, in the dashboard's heading face, with a little room. */
const HEADING_EMS = 10.6;
const HEADING_SIZE = `clamp(12px, calc((100cqw - ${TONIGHT_COLUMN_PX + COLUMN_GAP_PX}px) / ${HEADING_EMS}), 14px)`;

function Heading({ id, children }) {
    return <h2 id={id} className="min-w-0 self-end font-semibold leading-[1.15] tracking-tight text-white" style={{ fontSize: HEADING_SIZE }}>{children}</h2>;
}

function Nothing({ children }) {
    return <p className="m-auto px-1 text-center text-[11px] font-medium text-white/80">{children}</p>;
}

export default function NightsCard({ tonight = [], upcoming = [], hasHistory = false, loading = false, className = '' }) {
    // One night leads the Tonight column. A second night on the same day joins the row that scrolls.
    const [lead, ...alsoTonight] = tonight;
    const later = [...alsoTonight, ...upcoming];
    return (
        <section className={`glass-panel flex min-w-0 rounded-[1.25rem] p-4 [container-type:inline-size] ${className}`.trim()} data-venue-card="nights">
            {loading ? <CardSkeleton className="h-52" /> : (
                <div className="grid min-w-0 flex-1 grid-cols-[118px_minmax(0,1fr)] grid-rows-[auto_1fr] gap-x-3 gap-y-1.5">
                    <Heading id="venue-nights-tonight">Tonight.</Heading>
                    <Heading id="venue-nights-upcoming">Upcoming Events.</Heading>
                    <div className="flex min-h-[184px]" role="group" aria-labelledby="venue-nights-tonight">
                        {lead ? <NightTile night={lead} /> : <Nothing>No Events Tonight</Nothing>}
                    </div>
                    <div className="flex min-h-[184px] min-w-0" role="group" aria-labelledby="venue-nights-upcoming">
                        {later.length ? (
                            <div className="dashboard-scrollbar-none flex w-full gap-3 overflow-x-auto" aria-label="Upcoming nights">
                                {later.map((night) => <NightTile key={night.eventId} night={night} />)}
                            </div>
                        ) : (
                            <Nothing>{hasHistory || lead ? 'No Upcoming Events' : 'No Upcoming Events Happening'}</Nothing>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
}
