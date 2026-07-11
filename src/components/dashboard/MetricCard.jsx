'use client';

import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowDownRightIcon, ArrowUpRightIcon } from '@hugeicons/core-free-icons';
import { SparkAreaChart, SparkBarChart, SparkDonutChart } from './ChartFrame';
import { DASHBOARD_BRAND_COLOR } from './chartStyles';

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

export function MicroChart({
    points = [],
    type = 'line',
    color = DASHBOARD_BRAND_COLOR,
    className = '',
    labels = [],
    name = 'Value',
    height = 36,
    formatValue,
    formatLabel,
    emptyLabel,
}) {
    if (type === 'bar') {
        return (
            <SparkBarChart
                points={points}
                labels={labels}
                color={color}
                height={height || 40}
                name={name}
                className={className}
                {...(formatValue ? { formatValue } : {})}
                {...(formatLabel ? { formatLabel } : {})}
                {...(emptyLabel ? { emptyLabel } : {})}
            />
        );
    }

    if (type === 'donut') {
        return (
            <SparkDonutChart
                points={points}
                labels={labels}
                color={color}
                size={48}
                className={className}
                {...(formatValue ? { formatValue } : {})}
                {...(emptyLabel ? { emptyLabel } : {})}
            />
        );
    }

    return (
        <SparkAreaChart
            points={points}
            labels={labels}
            color={color}
            height={height}
            name={name}
            className={className}
            {...(formatValue ? { formatValue } : {})}
            {...(formatLabel ? { formatLabel } : {})}
            {...(emptyLabel ? { emptyLabel } : {})}
        />
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
                        <div className="w-full overflow-hidden rounded-md bg-white/[0.035]">
                            {Array.isArray(sparkline?.points) ? (
                                <MicroChart
                                    points={sparkline.points}
                                    labels={sparkline.labels || []}
                                    color={sparkline.color || DASHBOARD_BRAND_COLOR}
                                    name={sparkline.name || title}
                                />
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
