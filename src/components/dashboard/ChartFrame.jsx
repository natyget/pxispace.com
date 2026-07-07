'use client';

import dynamic from 'next/dynamic';
import {
    DASHBOARD_TIMEFRAMES,
    TIME_SERIES_KEYS,
    TIME_SERIES_STYLES,
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
