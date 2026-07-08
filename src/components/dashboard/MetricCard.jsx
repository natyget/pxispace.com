'use client';

import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowDownRightIcon, ArrowUpRightIcon } from '@hugeicons/core-free-icons';

function trendIconFor(trend) {
    if (trend === 'up') return ArrowUpRightIcon;
    if (trend === 'down') return ArrowDownRightIcon;
    return null;
}

export function StatRow({ items = [], className = '' }) {
    return (
        <div
            className={`glass-field grid gap-3 rounded-[1.25rem] p-4 ${className}`.trim()}
            style={{ gridTemplateColumns: `repeat(${Math.min(Math.max(items.length, 1), 3)}, minmax(0, 1fr))` }}
        >
            {items.map((item) => (
                <div key={item.label} className="min-w-0">
                    <p className="truncate text-[10px] font-bold uppercase tracking-widest text-white/40">{item.label}</p>
                    <p className="mt-1 truncate text-xl font-black tracking-normal text-white">{item.value}</p>
                    {item.detail ? <p className="mt-0.5 truncate text-xs text-zinc-500">{item.detail}</p> : null}
                </div>
            ))}
        </div>
    );
}

export function MicroChart({ points = [], type = 'line', color = '#d84aff', className = '' }) {
    const values = Array.isArray(points) ? points.filter((point) => Number.isFinite(Number(point))).map(Number) : [];
    const max = Math.max(...values, 1);

    if (type === 'bar') {
        return (
            <div className={`flex h-10 items-end gap-1 ${className}`.trim()} aria-hidden="true">
                {values.map((value, index) => (
                    <span
                        key={`${value}-${index}`}
                        className="w-full rounded-t-sm bg-white/45"
                        style={{ height: `${Math.max(12, (value / max) * 100)}%` }}
                    />
                ))}
            </div>
        );
    }

    if (type === 'donut') {
        const total = values.reduce((sum, value) => sum + value, 0) || 1;
        const shades = values.reduce((state, value, index) => {
            const start = state.cursor;
            const end = start + (value / total) * 100;
            const shade = 75 - index * 10;
            return {
                cursor: end,
                segments: [...state.segments, `rgb(${shade} ${shade} ${shade}) ${start}% ${end}%`],
            };
        }, { cursor: 0, segments: [] }).segments;
        return (
            <span
                className={`block h-12 w-12 rounded-full ${className}`.trim()}
                style={{ background: `conic-gradient(${shades.join(', ')})` }}
                aria-hidden="true"
            />
        );
    }

    const polyline = values
        .map((point, index) => `${(index / Math.max(values.length - 1, 1)) * 100},${24 - (point / max) * 20}`)
        .join(' ');

    return (
        <svg viewBox="0 0 100 24" preserveAspectRatio="none" className={`h-8 w-full ${className}`.trim()} aria-hidden="true">
            <polyline fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={polyline} />
        </svg>
    );
}

export default function MetricCard({
    title,
    value,
    description,
    icon,
    trend = 'neutral',
    loading = false,
    dense = true,
    sparkline = null,
    actions = null,
}) {
    const TrendIcon = trendIconFor(trend);

    return (
        <div className={`glass-panel relative flex min-h-[132px] flex-col justify-between rounded-[1.5rem] ${dense ? 'p-4 md:p-5' : 'p-5 md:p-6'}`}>
            <div className="mb-4 flex items-center justify-between gap-3">
                <span className="text-[11px] md:text-[12px] font-bold tracking-widest text-white/40 uppercase">{title}</span>
                {actions ? (
                    actions
                ) : icon ? (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5">
                        <HugeiconsIcon icon={icon} className="h-4 w-4 text-white opacity-75" />
                    </div>
                ) : null}
            </div>
            {loading ? (
                <div className="h-10 w-24 bg-white/5 rounded animate-pulse" />
            ) : (
                <div className="mt-auto flex flex-col items-start gap-3">
                    <div className="max-w-full truncate text-2xl font-[900] leading-none tracking-normal text-white">{value}</div>
                    {sparkline ? (
                        <div className="h-8 w-full overflow-hidden rounded-md bg-white/[0.035]">
                            {Array.isArray(sparkline?.points) ? (
                                <MicroChart points={sparkline.points} color={sparkline.color || '#d84aff'} />
                            ) : (
                                sparkline
                            )}
                        </div>
                    ) : null}
                    <div className="pill-ghost inline-flex max-w-full items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-300 md:text-[11px]">
                        {TrendIcon ? <HugeiconsIcon icon={TrendIcon} className="h-3 w-3 shrink-0 text-white opacity-50" /> : null}
                        <span>{description}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
