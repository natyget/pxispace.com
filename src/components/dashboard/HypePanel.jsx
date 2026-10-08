'use client';

import { useState } from 'react';
import {
    Area,
    AreaChart,
    CartesianGrid,
    ReferenceDot,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import SectionCard from './SectionCard';
import {
    DASHBOARD_BRAND_COLOR,
    DASHBOARD_GRID_STROKE,
    DASHBOARD_TOOLTIP_PROPS,
    getDashboardChartShade,
} from './chartStyles';

function formatNumber(value) {
    return Number(value || 0).toLocaleString('en-US');
}

function tickInterval(length, maxTicks = 8) {
    if (length <= maxTicks) return 0;
    return Math.ceil(length / maxTicks) - 1;
}

/** '2026-07-04T22:00:00.000Z' -> '10 PM' for the hype chart axis. */
function formatHourTick(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleTimeString('en-US', { hour: 'numeric', timeZone: 'UTC' });
}

const HYPE_CHANNELS = [
    { id: 'all', label: 'All activity' },
    { id: 'messages', label: 'Chat' },
    { id: 'reactions', label: 'Reactions' },
    { id: 'media', label: 'Captures' },
];

// "Captures", not "Uploads": the series is bucketed on when the shot was taken
// (`capturedAt ?? createdAt`), so a late upload still lands on the hour it happened.
const HYPE_SERIES = {
    messages: { label: 'Messages', color: getDashboardChartShade(0) },
    reactions: { label: 'Reactions', color: getDashboardChartShade(1) },
    media: { label: 'Captures', color: getDashboardChartShade(2) },
};

/** `+14m` / `+2h 10m` / `same minute` — capture→upload lag for the stat strip. */
function formatCaptureLag(minutes) {
    if (minutes == null) return '—';
    if (minutes < 1) return 'Instant';
    if (minutes < 60) return `+${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const rem = minutes % 60;
    if (hours < 24) return rem ? `+${hours}h ${rem}m` : `+${hours}h`;
    return `+${Math.round(hours / 24)}d`;
}

/**
 * Hype: engagement velocity through the night — chart first, one compact stat
 * strip, and spike markers flagging moments worth investigating (a song, a
 * shoutout, a drop — the chart can't know which, but it can point at when).
 */
export default function HypePanel({ behavior, capture, isMobile }) {
    const [channel, setChannel] = useState('all');
    if (!behavior) return null;
    const series = (behavior.byHour || []).map((d) => ({
        hourIso: d.hourIso,
        messages: d.messages,
        reactions: d.reactions,
        media: d.media,
        total: (Number(d.messages) || 0) + (Number(d.reactions) || 0) + (Number(d.media) || 0),
    }));
    const activeKeys = channel === 'all' ? ['messages', 'reactions', 'media'] : [channel];
    const hasActivity = series.some((d) => activeKeys.some((key) => Number(d[key]) > 0));

    // Spike detection: hours well above the night's own baseline, worth a look.
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

    const statStrip = [
        { label: 'Hype score', value: `${formatNumber(behavior.hypeScore)} ${behavior.hypeTierLabel || 'Quiet'}` },
        { label: 'Peak hour', value: peakHour.hourIso ? formatHourTick(peakHour.hourIso) : '—' },
        { label: 'Chat', value: formatNumber(behavior.totals?.messages) },
        { label: 'Reactions', value: formatNumber(behavior.totals?.reactions) },
        { label: 'Captures', value: formatNumber(behavior.totals?.media) },
        // Only honest above ~20% coverage — below that the median is one phone's story.
        ...(capture?.medianLagMinutes != null && capture.coverage >= 0.2
            ? [{ label: 'Capture lag', value: formatCaptureLag(capture.medianLagMinutes) }]
            : [{ label: 'Comments', value: formatNumber(behavior.totals?.comments) }]),
    ];

    return (
        <SectionCard
            title="Hype through the night"
            actions={(
                <div className="dashboard-segmented-toggle max-w-full" aria-label="Hype activity channel">
                    {HYPE_CHANNELS.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            className="dashboard-segmented-toggle__item"
                            data-active={channel === item.id}
                            aria-pressed={channel === item.id}
                            onClick={() => setChannel(item.id)}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            )}
            className="!rounded-[1.25rem]"
        >
            {hasActivity ? (
                <>
                    <div className="relative h-[280px] md:h-[340px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={series} margin={{ top: 16, right: 14, bottom: 0, left: isMobile ? -18 : 0 }}>
                                <defs>
                                    {Object.entries(HYPE_SERIES).map(([key, config]) => (
                                        <linearGradient key={key} id={`hypeGradient-${key}`} x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor={config.color} stopOpacity={0.18} />
                                            <stop offset="100%" stopColor={config.color} stopOpacity={0.02} />
                                        </linearGradient>
                                    ))}
                                </defs>
                                <CartesianGrid stroke={DASHBOARD_GRID_STROKE} vertical={false} />
                                <XAxis
                                    dataKey="hourIso"
                                    tickFormatter={formatHourTick}
                                    interval={tickInterval(series.length, isMobile ? 5 : 10)}
                                    tick={{ fill: 'rgba(255,255,255,0.46)', fontSize: 11 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    allowDecimals={false}
                                    tick={{ fill: 'rgba(255,255,255,0.46)', fontSize: 11 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip {...DASHBOARD_TOOLTIP_PROPS} labelFormatter={formatHourTick} />
                                {activeKeys.map((key) => (
                                    <Area
                                        key={key}
                                        type="monotone"
                                        dataKey={key}
                                        name={HYPE_SERIES[key].label}
                                        stackId={channel === 'all' ? 'hype' : undefined}
                                        stroke={HYPE_SERIES[key].color}
                                        fill={`url(#hypeGradient-${key})`}
                                        strokeWidth={2.2}
                                        dot={false}
                                        activeDot={{ r: 4, fill: '#fff', stroke: '#09090b' }}
                                        isAnimationActive={false}
                                    />
                                ))}
                                {spikes.map((spike) => (
                                    <ReferenceDot
                                        key={spike.hourIso}
                                        x={spike.hourIso}
                                        y={spike.value}
                                        r={5}
                                        fill={DASHBOARD_BRAND_COLOR}
                                        stroke="#0e0e13"
                                        strokeWidth={2}
                                        isFront
                                    />
                                ))}
                            </AreaChart>
                        </ResponsiveContainer>
                        <div className="absolute bottom-2 left-4 flex flex-wrap items-center gap-4 text-[11px] font-bold text-zinc-500">
                            {activeKeys.map((key) => (
                                <span key={key} className="inline-flex items-center gap-1.5">
                                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: HYPE_SERIES[key].color }} />
                                    {HYPE_SERIES[key].label}
                                </span>
                            ))}
                        </div>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-px overflow-hidden rounded-2xl bg-pxi-field sm:grid-cols-6">
                        {statStrip.map((item) => (
                            <div key={item.label} className="bg-pxi-surface px-3 py-2.5">
                                <p className="text-[11px] font-medium text-zinc-500">{item.label}</p>
                                <p className="mt-1 truncate text-sm font-semibold tabular-nums text-white">{item.value}</p>
                            </div>
                        ))}
                    </div>
                    {spikes.length ? (
                        <p className="mt-3 text-xs leading-5 text-zinc-500">
                            <span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: DASHBOARD_BRAND_COLOR }} />
                            Marked spikes at {spikes.map((spike) => formatHourTick(spike.hourIso)).join(', ')} — moments worth investigating:
                            a track, a shoutout, an announcement, or a drop usually sits behind them. Check the gallery around those times.
                        </p>
                    ) : null}
                </>
            ) : (
                <div className="rounded-2xl bg-pxi-field p-6 text-sm text-zinc-500">
                    No {channel === 'all' ? 'chat, reaction, or upload' : HYPE_CHANNELS.find((item) => item.id === channel)?.label.toLowerCase()} activity in the event window yet.
                </div>
            )}
        </SectionCard>
    );
}
