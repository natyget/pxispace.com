'use client';

// VEN-8, "Through the Door": the night that matters now. The ring is scanned tickets out of tickets sold,
// and each door shows its own share of the scans.

import { DASHBOARD_BRAND_COLOR } from '@/components/dashboard/chartStyles';
import { doorCaption, doorPercent, formatInteger } from '@/lib/venueDashboard';
import { CardSkeleton, LiveBadge, ProgressRing, VenueCard } from './VenueCard';

function GateRow({ gate }) {
    const percent = Math.round((gate.share || 0) * 100);
    return (
        <li>
            <div className="flex items-baseline justify-between gap-2">
                <span className="min-w-0 truncate text-[11px] font-medium text-white/85">{gate.gate}</span>
                <span className="shrink-0 text-[9px] text-white/55 tabular-nums">
                    {formatInteger(gate.scans)} Scanned ({percent}%)
                </span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                {/* A door nobody has come through keeps a dot, so the row still reads as a bar. */}
                <div className="h-full rounded-full" style={{ width: `max(6px, ${percent}%)`, background: DASHBOARD_BRAND_COLOR }} />
            </div>
        </li>
    );
}

export default function DoorCard({ door, loading = false, className = '' }) {
    const live = door?.state === 'LIVE';
    return (
        <VenueCard title="Through the Door" badge={live ? <LiveBadge /> : null} className={className} data-venue-card="door">
            {loading ? <CardSkeleton className="h-40" /> : (
                <>
                    {door ? <p className="-mt-2 truncate text-[11px] text-white/45">{doorCaption(door)}</p> : null}
                    <div className="mt-1 flex items-end justify-between gap-3">
                        <div className="min-w-0 pb-1">
                            <p className="text-[13px] font-semibold text-white/75">Tickets Sold</p>
                            <p className="mt-0.5 text-[28px] font-bold leading-none text-white tabular-nums">{formatInteger(door?.ticketsSold)}</p>
                            {door?.capacity ? (
                                <p className="mt-1 text-[10px] text-white/40 tabular-nums">Capacity {formatInteger(door.capacity)}</p>
                            ) : null}
                        </div>
                        <ProgressRing
                            percent={doorPercent(door)}
                            size={104}
                            thickness={15}
                            label={`${doorPercent(door)} percent of ticket holders through the door`}
                        />
                    </div>
                    {door?.gates?.length ? (
                        <ul className="mt-3 space-y-2">
                            {door.gates.slice(0, 4).map((gate) => <GateRow key={gate.gate} gate={gate} />)}
                        </ul>
                    ) : (
                        <p className="mt-3 text-[11px] leading-4 text-white/45">
                            {door
                                ? door.state === 'LAST' ? 'No tickets were scanned on this night.' : 'Nobody scanned in yet. Doors show here as tickets are scanned.'
                                : 'Host an Event to Access'}
                        </p>
                    )}
                </>
            )}
        </VenueCard>
    );
}
