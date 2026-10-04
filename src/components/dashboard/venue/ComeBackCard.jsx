'use client';

// VEN-8, "Come Back Pct": of everyone scanned in here, the share who came to more than one night.

import { formatInteger, toPercent } from '@/lib/venueDashboard';
import { CardSkeleton, HistoryTag, ProgressRing, VenueCard } from './VenueCard';

export default function ComeBackCard({ analytics, level = 'NONE', loading = false, className = '' }) {
    const repeat = analytics?.firstTimeVsRepeat || null;
    const measured = Boolean(analytics && analytics.totalAttendance > 0 && repeat?.repeatRate !== null);
    const percent = measured ? toPercent(repeat.repeatRate) : 0;
    return (
        <VenueCard title="Come Back Pct" className={className} data-venue-card="come-back">
            {loading ? <CardSkeleton className="h-28" /> : (
                <>
                    {measured && level === 'LIMITED' ? <HistoryTag className="-mt-2 block" /> : null}
                    <div className="mt-1 flex justify-end">
                        <ProgressRing percent={percent} size={92} thickness={13} label={`${percent} percent came back`} />
                    </div>
                    {measured ? (
                        <p className="mt-3 text-[11px] leading-4 text-white/45 tabular-nums">
                            {formatInteger(repeat.repeat)} of {formatInteger(analytics.totalAttendance)} {analytics.totalAttendance === 1 ? 'guest' : 'guests'} came to more than one night.
                        </p>
                    ) : (
                        <p className="mt-3 text-center text-[11px] font-medium leading-6 text-white/80">
                            Host an Event to Access your Come Back Percentage
                        </p>
                    )}
                </>
            )}
        </VenueCard>
    );
}
