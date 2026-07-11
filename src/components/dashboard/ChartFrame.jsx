'use client';

import { useId, useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
    DASHBOARD_BRAND_COLOR,
    DASHBOARD_TIMEFRAMES,
    DASHBOARD_TOOLTIP_PROPS,
    TIME_SERIES_KEYS,
    TIME_SERIES_STYLES,
    getDashboardChartShade,
    getTimeSeriesProps,
} from './chartStyles';

export function ChartSkeleton({ className = '' }) {
    return (
        <div className={`flex h-full min-h-[220px] w-full items-center justify-center rounded-2xl bg-white/[0.035] ${className}`.trim()}>
            <div className="w-2/3 max-w-sm space-y-3">
                <div className="h-3 w-1/3 animate-pulse rounded-full bg-white/10" />
                <div className="h-24 animate-pulse rounded-2xl bg-white/[0.04]" />
                <div className="grid grid-cols-4 gap-2">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <div key={index} className="h-2 animate-pulse rounded-full bg-white/[0.05]" />
                    ))}
                </div>
            </div>
        </div>
    );
}

export function ChartFrame({ children, className = '' }) {
    return (
        <div className={`relative h-full min-h-[220px] w-full ${className}`.trim()}>
            {children}
        </div>
    );
}

function changeToneClass(tone) {
    if (tone === 'positive') return 'bg-emerald-400/10 text-emerald-300';
    if (tone === 'negative') return 'bg-red-400/10 text-red-300';
    return 'bg-white/[0.07] text-zinc-300';
}

export function TimeSeriesChartHeader({
    title,
    subheading,
    liveValue,
    unit,
    change,
    timeframe = '1D',
    timeframes = DASHBOARD_TIMEFRAMES,
    onTimeframeChange,
}) {
    const changeLabel = typeof change === 'string' ? change : change?.label;
    const changeTone = typeof change === 'object' ? change?.tone : 'neutral';

    return (
        <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
                {title ? <h2 className="text-lg font-black tracking-normal text-white">{title}</h2> : null}
                {subheading ? <p className="mt-1 text-sm leading-5 text-zinc-400">{subheading}</p> : null}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="text-2xl font-black tracking-normal text-white">
                        {liveValue ?? '—'}{unit ? <span className="ml-1 text-sm font-bold text-zinc-400">{unit}</span> : null}
                    </span>
                    {changeLabel ? (
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${changeToneClass(changeTone)}`}>
                            {changeLabel}
                        </span>
                    ) : null}
                </div>
            </div>
            <div className="dashboard-segmented-toggle shrink-0" aria-label={`${title || 'Chart'} timeframe`}>
                {timeframes.map((option) => {
                    const active = option === timeframe;
                    return (
                        <button
                            key={option}
                            type="button"
                            className="dashboard-segmented-toggle__item"
                            data-active={active}
                            onClick={() => onTimeframeChange?.(option)}
                            aria-pressed={active}
                        >
                            {option}
                        </button>
                    );
                })}
            </div>
        </header>
    );
}

export function TimeSeriesChartArea({ children, className = '' }) {
    return (
        <div
            className={`mt-5 h-[280px] min-h-[220px] w-full md:h-[340px] ${className}`.trim()}
            data-chart-area="time-series"
        >
            {children}
        </div>
    );
}

export function TimeSeriesChartShell({
    title,
    subheading,
    liveValue,
    unit,
    change,
    timeframe = '1D',
    timeframes = DASHBOARD_TIMEFRAMES,
    onTimeframeChange,
    children,
    className = '',
    chartClassName = '',
}) {
    const chartContract = {
        seriesKeys: TIME_SERIES_KEYS,
        seriesStyles: TIME_SERIES_STYLES,
        getSeriesProps: getTimeSeriesProps,
    };

    return (
        <section className={`dashboard-surface rounded-2xl p-5 md:p-6 ${className}`.trim()}>
            <TimeSeriesChartHeader
                title={title}
                subheading={subheading}
                liveValue={liveValue}
                unit={unit}
                change={change}
                timeframe={timeframe}
                timeframes={timeframes}
                onTimeframeChange={onTimeframeChange}
            />
            <TimeSeriesChartArea className={chartClassName}>
                {typeof children === 'function' ? children(chartContract) : children}
            </TimeSeriesChartArea>
        </section>
    );
}

const LazyRecharts = dynamic(
    () => import('recharts').then((module) => {
        const recharts = module;
        return function RechartsModule({ children }) {
            return children(recharts);
        };
    }),
    {
        ssr: false,
        loading: () => <ChartSkeleton />,
    }
);

export function RechartsChart({ children, className = '' }) {
    return (
        <ChartFrame className={className}>
            <LazyRecharts>{children}</LazyRecharts>
        </ChartFrame>
    );
}

/* Same lazy-recharts pattern as RechartsChart, but with a sparkline-sized loader
   (ChartSkeleton's 220px minimum would blow out metric cards). */
const LazySparkRecharts = dynamic(
    () => import('recharts').then((module) => {
        const recharts = module;
        return function SparkRechartsModule({ children }) {
            return children(recharts);
        };
    }),
    {
        ssr: false,
        loading: () => <div className="h-full w-full animate-pulse rounded-lg bg-white/[0.05]" />,
    }
);

function SparkEmpty({ height, label }) {
    return (
        <div
            className="flex w-full items-center justify-center rounded-lg bg-white/[0.03]"
            style={{ height }}
        >
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">{label}</span>
        </div>
    );
}

/**
 * Framed mini recharts area: the dashboard-wide sparkline. Lazy-loads recharts
 * (same pattern as RechartsChart) so metric grids stay light, uses the brand
 * gradient + shared tooltip, and renders a "No data yet" placeholder instead of
 * a flat zero line when the series is empty.
 *
 * `points` is a plain number array; `labels` (optional, same length) feeds the
 * tooltip header — pass ISO dates plus `formatLabel` for day series.
 */
export function SparkAreaChart({
    points = [],
    labels = [],
    color = DASHBOARD_BRAND_COLOR,
    height = 48,
    name = 'Value',
    formatValue = (value) => Number(value).toLocaleString('en-US'),
    formatLabel = (label) => label,
    emptyLabel = 'No data yet',
    className = '',
}) {
    const gradientId = useId().replace(/[^a-zA-Z0-9_-]/g, '');
    const data = useMemo(
        () => (Array.isArray(points) ? points : [])
            .map((point, index) => ({
                index,
                label: labels?.[index] ?? null,
                value: Number.isFinite(Number(point)) ? Number(point) : 0,
            })),
        [points, labels]
    );
    const hasData = data.length > 0 && data.some((point) => point.value > 0);

    if (!hasData) {
        return (
            <div className={className}>
                <SparkEmpty height={height} label={emptyLabel} />
            </div>
        );
    }

    return (
        <div className={`w-full overflow-hidden rounded-lg ${className}`.trim()} style={{ height }}>
            <LazySparkRecharts>
                {({ ResponsiveContainer, AreaChart, Area, Tooltip }) => (
                    <ResponsiveContainer width="100%" height={height}>
                        <AreaChart data={data} margin={{ top: 4, right: 2, bottom: 2, left: 2 }}>
                            <defs>
                                <linearGradient id={`spark-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={color} stopOpacity={0.4} />
                                    <stop offset="100%" stopColor={color} stopOpacity={0.02} />
                                </linearGradient>
                            </defs>
                            <Tooltip
                                {...DASHBOARD_TOOLTIP_PROPS}
                                labelFormatter={(index) => {
                                    const point = data[index];
                                    return point?.label != null ? formatLabel(point.label) : '';
                                }}
                                formatter={(value) => [formatValue(value), name]}
                            />
                            <Area
                                type="monotone"
                                dataKey="value"
                                name={name}
                                stroke={color}
                                strokeWidth={1.8}
                                fill={`url(#spark-${gradientId})`}
                                dot={false}
                                activeDot={{ r: 3, fill: '#ffffff', stroke: '#09090b' }}
                                isAnimationActive={false}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </LazySparkRecharts>
        </div>
    );
}

/**
 * Framed mini recharts bar chart: the sparkline-sized bar variant (replaces the old
 * hand-rolled flex/div bars). Same lazy-recharts + tooltip + empty-state contract as
 * `SparkAreaChart`.
 */
export function SparkBarChart({
    points = [],
    labels = [],
    color = DASHBOARD_BRAND_COLOR,
    height = 40,
    name = 'Value',
    formatValue = (value) => Number(value).toLocaleString('en-US'),
    formatLabel = (label) => label,
    emptyLabel = 'No data yet',
    className = '',
}) {
    const data = useMemo(
        () => (Array.isArray(points) ? points : [])
            .map((point, index) => ({
                index,
                label: labels?.[index] ?? null,
                value: Number.isFinite(Number(point)) ? Number(point) : 0,
            })),
        [points, labels]
    );
    const hasData = data.length > 0 && data.some((point) => point.value > 0);

    if (!hasData) {
        return (
            <div className={className}>
                <SparkEmpty height={height} label={emptyLabel} />
            </div>
        );
    }

    return (
        <div className={`w-full overflow-hidden rounded-lg ${className}`.trim()} style={{ height }}>
            <LazySparkRecharts>
                {({ ResponsiveContainer, BarChart, Bar, Tooltip }) => (
                    <ResponsiveContainer width="100%" height={height}>
                        <BarChart data={data} margin={{ top: 4, right: 2, bottom: 2, left: 2 }} barCategoryGap="22%">
                            <Tooltip
                                {...DASHBOARD_TOOLTIP_PROPS}
                                cursor={{ fill: 'rgba(255,255,255,0.06)' }}
                                labelFormatter={(index) => {
                                    const point = data[index];
                                    return point?.label != null ? formatLabel(point.label) : '';
                                }}
                                formatter={(value) => [formatValue(value), name]}
                            />
                            <Bar
                                dataKey="value"
                                name={name}
                                fill={color}
                                radius={[3, 3, 0, 0]}
                                isAnimationActive={false}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </LazySparkRecharts>
        </div>
    );
}

/**
 * Framed mini recharts donut: the sparkline-sized segment-share variant (replaces the
 * old conic-gradient span). `points` is a plain number array of segment values; `labels`
 * (optional, same length) names each segment for the tooltip + legend dots.
 */
export function SparkDonutChart({
    points = [],
    labels = [],
    color = DASHBOARD_BRAND_COLOR,
    size = 48,
    formatValue = (value) => Number(value).toLocaleString('en-US'),
    emptyLabel = 'No data yet',
    className = '',
}) {
    const data = useMemo(
        () => (Array.isArray(points) ? points : [])
            .map((point, index) => ({
                label: labels?.[index] ?? `Segment ${index + 1}`,
                value: Number.isFinite(Number(point)) ? Number(point) : 0,
            }))
            .filter((point) => point.value > 0),
        [points, labels]
    );
    const hasData = data.length > 0;

    if (!hasData) {
        return (
            <div className={className}>
                <SparkEmpty height={size} label={emptyLabel} />
            </div>
        );
    }

    return (
        <div className={`overflow-hidden rounded-full ${className}`.trim()} style={{ width: size, height: size }}>
            <LazySparkRecharts>
                {({ ResponsiveContainer, PieChart, Pie, Cell, Tooltip }) => (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Tooltip
                                {...DASHBOARD_TOOLTIP_PROPS}
                                formatter={(value, entryName) => [formatValue(value), entryName]}
                            />
                            <Pie
                                data={data}
                                dataKey="value"
                                nameKey="label"
                                cx="50%"
                                cy="50%"
                                innerRadius="62%"
                                outerRadius="100%"
                                stroke="none"
                                isAnimationActive={false}
                            >
                                {data.map((entry, index) => (
                                    <Cell key={entry.label} fill={index === 0 ? color : getDashboardChartShade(index)} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                )}
            </LazySparkRecharts>
        </div>
    );
}
