'use client';

import { createElement } from 'react';
import { RechartsChart } from './ChartFrame';
import { getDashboardChartShade } from './chartStyles';

/**
 * The Earnings page's own pieces, free of its data: the money tooltip both charts share, the rows of its table cards
 * and the revenue-by-month chart. They draw from props, so the marketing mockups show them on sample figures.
 */

function fmtChartMoney(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
    }).format(value ?? 0);
}

/** The tooltip the Earnings charts share. */
export function MoneyTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-xl bg-black/90 px-3 py-2 text-xs shadow-2xl">
            {label ? <p className="mb-1 font-bold text-white">{label}</p> : null}
            <div className="space-y-1">
                {payload
                    .filter((item) => item.value !== null && item.value !== undefined)
                    .map((item) => (
                        <div key={`${item.name}-${item.dataKey}`} className="flex items-center justify-between gap-4">
                            <span className="text-zinc-400">{item.name}</span>
                            <span className="font-mono font-bold text-white">{fmtChartMoney(item.value)}</span>
                        </div>
                    ))}
            </div>
        </div>
    );
}


/** One line of a table card (Key metrics, What buyers paid): the figure, what it is, and how it came about. */
export function RevenueTableRow({ title, value, unit, subheading, emphasize = false }) {
    return (
        <div className="flex items-center justify-between border-b border-white/[0.05] py-3.5 last:border-b-0">
            <div>
                <p className="text-sm font-semibold text-white">{title}</p>
                <p className="mt-0.5 text-xs text-zinc-500">{subheading}</p>
            </div>
            <p className={`text-sm font-semibold tabular-nums ${emphasize ? 'text-emerald-300' : 'text-white'}`}>
                {value}<span className="ml-1 text-[11px] font-medium text-zinc-500">{unit}</span>
            </p>
        </div>
    );
}

/**
 * Gross (area) and net (line) by month. `series` is [{ month, gross, net }] in dollars.
 * The chart frame is 100% of its parent, so the parent carries the height (a bare h-full frame collapses to nothing).
 */
export function RevenueByMonthChart({ series, className = 'h-[300px]', animate = true }) {
    return (
        <div className={className}>
            <RechartsChart className={className}>
                {(charts) =>
                    createElement(
                        charts.ResponsiveContainer,
                        { width: '100%', height: '100%' },
                        createElement(
                            charts.ComposedChart,
                            { data: series, margin: { top: 12, right: 8, bottom: 0, left: -12 } },
                            createElement(charts.CartesianGrid, { stroke: 'rgba(255,255,255,0.05)', vertical: false }),
                            createElement(charts.XAxis, { dataKey: 'month', axisLine: false, tickLine: false, tick: { fill: 'rgba(255,255,255,0.45)', fontSize: 11 } }),
                            createElement(charts.YAxis, { axisLine: false, tickLine: false, tickFormatter: fmtChartMoney, tick: { fill: 'rgba(255,255,255,0.35)', fontSize: 10 }, width: 60 }),
                            createElement(charts.Tooltip, { cursor: { fill: 'rgba(255,255,255,0.03)' }, content: createElement(MoneyTooltip) }),
                            createElement(charts.Area, { type: 'monotone', dataKey: 'gross', name: 'Gross', stroke: getDashboardChartShade(1), fill: 'rgba(13,148,136,0.14)', strokeWidth: 2, isAnimationActive: animate }),
                            createElement(charts.Line, { type: 'monotone', dataKey: 'net', name: 'Net to you', stroke: getDashboardChartShade(0), strokeWidth: 2, dot: false, isAnimationActive: animate })
                        )
                    )
                }
            </RechartsChart>
        </div>
    );
}
