'use client';

// VEN-8, "Recent Night Activity" on the home page and "When the Room Fills" on the overview: door scans per
// 15 minutes on one night, against a usual night (or the night before, while history is thin), and who came.

import { RechartsChart } from '@/components/dashboard/ChartFrame';
import {
    DASHBOARD_AXIS_LINE,
    DASHBOARD_AXIS_TICK,
    DASHBOARD_BRAND_COLOR,
    DASHBOARD_MUTED_COLOR,
    DASHBOARD_TOOLTIP_PROPS,
} from '@/components/dashboard/chartStyles';
import { activityLegend, activitySeries, mixSegments } from '@/lib/venueDashboard';
import { CardSkeleton, HistoryTag, VenueCard } from './VenueCard';

function Legend({ legend }) {
    if (!legend.night && !legend.compare) return null;
    return (
        <ul className="rounded-xl bg-white/[0.06] px-3 py-2 text-[11px] font-semibold text-white/75">
            {legend.night ? (
                <li className="flex items-center gap-2">
                    <span className="h-0.5 w-5 rounded-full" style={{ background: DASHBOARD_BRAND_COLOR }} />
                    {legend.night}
                </li>
            ) : null}
            {legend.compare ? (
                <li className="mt-1 flex items-center gap-2 first:mt-0">
                    <span className="h-0.5 w-5 rounded-full" style={{ background: DASHBOARD_MUTED_COLOR }} />
                    {legend.compare}
                </li>
            ) : null}
        </ul>
    );
}

/** Who came, as one bar: first time and returning. Each part is as wide as its share, with room for its label. */
function MixBar({ mix }) {
    const segments = mixSegments(mix);
    const known = segments.some((s) => s.percent > 0);
    const tones = ['bg-white/45 text-white', 'bg-white/20 text-white'];
    return (
        <div className="flex h-7 w-full overflow-hidden rounded-md text-[12px] font-bold" role="img" aria-label={segments.map((s) => `${s.label} ${s.percent} percent`).join(', ')}>
            {segments.map((s, i) => (
                <div
                    key={s.key}
                    className={`flex min-w-[96px] items-center justify-center whitespace-nowrap px-2 ${tones[i]}`}
                    style={{ flexGrow: known ? Math.max(s.percent, 1) : 1, flexBasis: 0 }}
                >
                    {s.label} ({s.percent}%)
                </div>
            ))}
        </div>
    );
}

export default function ActivityCard({
    title,
    activity,
    live = false,
    level = 'NONE',
    loading = false,
    error = null,
    filter = null,
    className = '',
}) {
    const { rows, nightKey, compareKey } = activitySeries(activity);
    const legend = activityLegend(activity, live);
    const hasChart = !loading && rows.length > 0;
    // Under the chart, on the left: what the reader should know about how much this rests on. When there is
    // no line at all the frame itself says why, so the tag is not repeated.
    const tag = level === 'NONE' ? 'Attendance' : hasChart && !activity?.average && level === 'LIMITED' ? 'Limited History' : null;

    // The frame stays mounted while a choice of nights loads, so the filter keeps its place and its state.
    return (
        <VenueCard title={title} action={hasChart ? <Legend legend={legend} /> : null} className={className} data-venue-card="activity">
            <div className="relative flex min-h-[150px] flex-1">
                <span className="absolute left-0 top-1/2 origin-center -translate-x-1/3 -translate-y-1/2 -rotate-90 text-[11px] font-bold text-white/85">
                    Arrivals
                </span>
                <div className="ml-5 flex-1">
                    {loading ? <CardSkeleton className="h-full min-h-[150px]" /> : hasChart ? (
                        <RechartsChart className="!min-h-[150px]">
                            {/* The lint config does not count JSX use of render-prop components. */}
                            {/* eslint-disable-next-line no-unused-vars */}
                            {({ ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip }) => (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={rows} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
                                        <XAxis
                                            dataKey="label"
                                            tick={DASHBOARD_AXIS_TICK}
                                            axisLine={DASHBOARD_AXIS_LINE}
                                            tickLine={false}
                                            interval="preserveStartEnd"
                                            minTickGap={28}
                                            padding={{ left: 22, right: 22 }}
                                        />
                                        <YAxis allowDecimals={false} width={1} tick={false} axisLine={DASHBOARD_AXIS_LINE} tickLine={false} />
                                        <Tooltip
                                            {...DASHBOARD_TOOLTIP_PROPS}
                                            formatter={(value, name) => [`${value} in 15 min`, name === 'night' ? legend.night : legend.compare]}
                                        />
                                        {compareKey ? (
                                            <Line type="linear" dataKey={compareKey} stroke={DASHBOARD_MUTED_COLOR} strokeWidth={1.5} dot={false} isAnimationActive={false} />
                                        ) : null}
                                        {nightKey ? (
                                            <Line type="linear" dataKey={nightKey} stroke={DASHBOARD_BRAND_COLOR} strokeWidth={2} dot={false} isAnimationActive={false} />
                                        ) : null}
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                        </RechartsChart>
                    ) : (
                        // No line to draw: the bare axes, as the design shows them, with the reason inside.
                        <div className="flex h-full min-h-[150px] items-center justify-center border-b border-l border-white/85 px-3 text-center">
                            <p className="text-[12px] font-medium text-white/80">
                                {error || (level === 'NONE' ? 'Host an Event to Access' : 'Limited History')}
                            </p>
                        </div>
                    )}
                </div>
            </div>
            <div className="mt-1 grid grid-cols-[1fr_auto_1fr] items-center gap-2 pl-5">
                <span>{tag ? <HistoryTag>{tag}</HistoryTag> : null}</span>
                <span className="text-[12px] font-bold text-white/85">Time</span>
                <span className="flex justify-end">{filter}</span>
            </div>
            <div className="mt-1.5 pl-5">
                <MixBar mix={loading ? null : activity?.mix || null} />
            </div>
        </VenueCard>
    );
}
