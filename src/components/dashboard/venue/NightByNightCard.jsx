'use client';

// VEN-8, "Night by Night": one night set against a usual night here. The average and the signal need three
// measured nights; until then those two columns say "Limited History" rather than compare a night with itself.

import { comparisonNightHeading, comparisonRows, formatNightDate } from '@/lib/venueDashboard';
import { CardSkeleton, VenueCard } from './VenueCard';

export default function NightByNightCard({ comparison, level = 'NONE', loading = false, className = '' }) {
    const rows = comparisonRows(comparison);
    const night = comparison?.night || null;
    const limited = Boolean(night) && !comparison?.average;
    return (
        <VenueCard title="Night by Night" className={className} data-venue-card="night-by-night">
            {loading ? <CardSkeleton className="h-44" /> : (
                <div className="flex-1 overflow-x-auto rounded-xl ring-1 ring-white/[0.08]">
                    <table className="h-full w-full min-w-[520px] text-left">
                        <thead>
                            <tr className="text-[14px] font-semibold text-white">
                                <th className="px-4 pb-2 pt-3 font-semibold">Metric</th>
                                <th className="px-3 pb-2 pt-3 font-semibold">Venue Average</th>
                                <th className="px-3 pb-2 pt-3 font-semibold">
                                    {comparisonNightHeading(comparison)}
                                    {night && night.state !== 'LIVE' ? (
                                        <span className="block text-[10px] font-medium text-white/45">{formatNightDate(night.startDate, night.timeZone)}</span>
                                    ) : null}
                                </th>
                                <th className="px-3 pb-2 pt-3 font-semibold">Signal</th>
                            </tr>
                        </thead>
                        <tbody className="text-[12px] text-white/85">
                            {rows.map((row, i) => (
                                <tr key={row.key}>
                                    <td className="px-4 py-2.5 font-medium">{row.metric}</td>
                                    {limited ? (
                                        // One label down the whole column, as the design has it.
                                        i === 0 ? <td rowSpan={rows.length} className="px-3 py-2.5 text-center align-middle text-white/70">Limited History</td> : null
                                    ) : (
                                        <td className="px-3 py-2.5 tabular-nums">{row.average ?? ''}</td>
                                    )}
                                    <td className="px-3 py-2.5 tabular-nums">{row.night ?? ''}</td>
                                    {limited ? (
                                        i === 0 ? <td rowSpan={rows.length} className="px-3 py-2.5 text-center align-middle text-white/70">Limited History</td> : null
                                    ) : (
                                        <td className="px-3 py-2.5">{row.signal ?? ''}</td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {!night && level === 'NONE' ? <p className="sr-only">No night has been measured here yet.</p> : null}
                </div>
            )}
        </VenueCard>
    );
}
