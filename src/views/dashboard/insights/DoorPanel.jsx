'use client';

import { useState } from 'react';
import { Area, AreaChart, CartesianGrid, ReferenceDot, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Panel, WordTabs } from '@/components/dashboard/ui/kit';
import VenueHeatMap from '@/components/dashboard/floorplan/VenueHeatMap';
import { DASHBOARD_BRAND_COLOR, DASHBOARD_GRID_STROKE, DASHBOARD_TOOLTIP_PROPS, getDashboardChartShade } from '@/components/dashboard/chartStyles';
import { count } from '@/lib/dashFormat';

const CHANNELS = [
    { key: 'all', label: 'All activity' },
    { key: 'messages', label: 'Chat' },
    { key: 'reactions', label: 'Reactions' },
    { key: 'media', label: 'Captures' },
];

// "Captures", not "Uploads": the series is bucketed on when the shot was taken, so a late upload still lands on the hour it happened.
const SERIES = {
    messages: { label: 'Chat', color: getDashboardChartShade(0) },
    reactions: { label: 'Reactions', color: getDashboardChartShade(1) },
    media: { label: 'Captures', color: getDashboardChartShade(2) },
};

function tickInterval(length, maxTicks = 8) {
    if (length <= maxTicks) return 0;
    return Math.ceil(length / maxTicks) - 1;
}

/** '2026-07-04T22:00:00.000Z' -> '10 PM' for the hype chart axis. */
function hourTick(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleTimeString('en-US', { hour: 'numeric', timeZone: 'UTC' });
}

/** `+14m` / `+2h 10m` for how long after the shot it was uploaded. */
function captureLag(minutes) {
    if (minutes == null) return '-';
    if (minutes < 1) return 'Instant';
    if (minutes < 60) return `+${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const rem = minutes % 60;
    if (hours < 24) return rem ? `+${hours}h ${rem}m` : `+${hours}h`;
    return `+${Math.round(hours / 24)}d`;
}

function SubTitle({ children, aside = null }) {
    return (
        <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-[14px] font-semibold text-white/70">{children}</h3>
            {aside}
        </div>
    );
}

/** Sold, scanned, posted: how many of the people who bought made it through the door and shared the night. */
function TurnoutRows({ funnel }) {
    const sold = Number(funnel?.sold) || 0;
    const rows = [
        { label: 'Sold', value: sold },
        { label: 'Scanned', value: Number(funnel?.scanned) || 0 },
        { label: 'Posted media', value: Number(funnel?.postedMedia) || 0 },
    ];
    return (
        <div className="space-y-3">
            {rows.map((row) => {
                const share = sold > 0 ? Math.min(100, Math.round((row.value / sold) * 100)) : 0;
                return (
                    <div key={row.label} className="grid grid-cols-[92px_minmax(0,1fr)_96px] items-center gap-3 text-[13px] md:grid-cols-[120px_minmax(0,1fr)_120px]">
                        <span className="truncate text-white/60">{row.label}</span>
                        <div className="h-2 overflow-hidden rounded-full bg-white/10">
                            <div className="h-full rounded-full bg-[#A523EF]" style={{ width: `${row.value > 0 ? Math.max(2, share) : 0}%` }} />
                        </div>
                        <span className="text-right font-semibold tabular-nums text-white">
                            {count(row.value)}
                            <span className="ml-2 font-normal text-white/40">{share}%</span>
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

/** Engagement through the night: one chart, a switch for chat / reactions / captures, and the numbers that matter. */
function HypeBlock({ behavior, capture, isMobile }) {
    const [channel, setChannel] = useState('all');
    const series = (behavior.byHour || []).map((d) => ({
        hourIso: d.hourIso,
        messages: d.messages,
        reactions: d.reactions,
        media: d.media,
    }));
    const activeKeys = channel === 'all' ? ['messages', 'reactions', 'media'] : [channel];
    const hasActivity = series.some((d) => activeKeys.some((key) => Number(d[key]) > 0));

    // Spike detection: hours well above the night's own baseline.
    const activeSeries = series.map((point) => ({
        hourIso: point.hourIso,
        value: activeKeys.reduce((sum, key) => sum + (Number(point[key]) || 0), 0),
    }));
    const mean = activeSeries.reduce((sum, p) => sum + p.value, 0) / Math.max(1, activeSeries.length);
    const std = Math.sqrt(activeSeries.reduce((sum, p) => sum + (p.value - mean) ** 2, 0) / Math.max(1, activeSeries.length));
    const spikes = activeSeries
        .filter((p) => p.value >= 5 && p.value > mean + 1.5 * std)
        .sort((a, b) => b.value - a.value)
        .slice(0, 3);
    const peakHour = activeSeries.reduce((peak, p) => (p.value > peak.value ? p : peak), { hourIso: null, value: 0 });

    const stats = [
        { label: 'Hype score', value: `${count(behavior.hypeScore)} ${behavior.hypeTierLabel || 'Quiet'}` },
        { label: 'Peak hour', value: peakHour.hourIso ? hourTick(peakHour.hourIso) : '-' },
        { label: 'Chat', value: count(behavior.totals?.messages) },
        { label: 'Reactions', value: count(behavior.totals?.reactions) },
        { label: 'Captures', value: count(behavior.totals?.media) },
        // Only honest above ~20% coverage; below that the median is one phone's story.
        ...(capture?.medianLagMinutes != null && capture.coverage >= 0.2
            ? [{ label: 'Capture lag', value: captureLag(capture.medianLagMinutes) }]
            : [{ label: 'Comments', value: count(behavior.totals?.comments) }]),
    ];

    return (
        <div>
            <SubTitle>Hype through the night</SubTitle>
            <WordTabs items={CHANNELS} value={channel} onChange={setChannel} />
            {hasActivity ? (
                <>
                    <div className="mt-4 h-[240px] md:h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={series} margin={{ top: 16, right: 14, bottom: 0, left: 0 }}>
                                <CartesianGrid stroke={DASHBOARD_GRID_STROKE} vertical={false} />
                                <XAxis
                                    dataKey="hourIso"
                                    tickFormatter={hourTick}
                                    interval={tickInterval(series.length, isMobile ? 5 : 10)}
                                    tick={{ fill: 'rgba(255,255,255,0.46)', fontSize: 11 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis allowDecimals={false} tick={{ fill: 'rgba(255,255,255,0.46)', fontSize: 11 }} width={isMobile ? 28 : 36} axisLine={false} tickLine={false} />
                                <Tooltip {...DASHBOARD_TOOLTIP_PROPS} labelFormatter={hourTick} />
                                {activeKeys.map((key) => (
                                    <Area
                                        key={key}
                                        type="monotone"
                                        dataKey={key}
                                        name={SERIES[key].label}
                                        stackId={channel === 'all' ? 'hype' : undefined}
                                        stroke={SERIES[key].color}
                                        fill={SERIES[key].color}
                                        fillOpacity={0.12}
                                        strokeWidth={2.2}
                                        dot={false}
                                        activeDot={{ r: 4, fill: '#fff', stroke: '#1c1c1c' }}
                                        isAnimationActive={false}
                                    />
                                ))}
                                {spikes.map((spike) => (
                                    <ReferenceDot key={spike.hourIso} x={spike.hourIso} y={spike.value} r={5} fill={DASHBOARD_BRAND_COLOR} stroke="#1c1c1c" strokeWidth={2} isFront />
                                ))}
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    {spikes.length ? <p className="mt-2 text-[12px] text-white/40">Purple dots mark the busiest hours.</p> : null}
                    <div className="mt-4 grid grid-cols-3 gap-px overflow-hidden rounded-2xl bg-white/[0.08] sm:grid-cols-6">
                        {stats.map((item) => (
                            <div key={item.label} className="min-w-0 bg-pxi-field px-3 py-2.5">
                                <p className="truncate text-[11px] text-white/45">{item.label}</p>
                                <p className="mt-1 truncate text-[14px] font-semibold tabular-nums text-white">{item.value}</p>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <p className="mt-4 text-[14px] text-white/50">Nothing yet.</p>
            )}
        </div>
    );
}

export default function DoorPanel({ detail, eventId, isMobile }) {
    return (
        <Panel title="Door">
            <div className="space-y-8">
                <div>
                    <SubTitle>Turnout</SubTitle>
                    <TurnoutRows funnel={detail.funnel} />
                </div>
                {detail.behavior ? <HypeBlock behavior={detail.behavior} capture={detail.media?.capture} isMobile={isMobile} /> : null}
                <div>
                    <SubTitle>Where it happened</SubTitle>
                    <VenueHeatMap eventId={eventId} />
                </div>
            </div>
        </Panel>
    );
}
