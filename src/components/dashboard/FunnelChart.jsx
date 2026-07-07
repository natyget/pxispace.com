'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { getDashboardChartShade } from '@/components/dashboard/chartStyles';

function formatNumber(value) {
    return Number(value || 0).toLocaleString('en-US');
}

export default function FunnelChart({ data = [] }) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [metric, setMetric] = useState('count');

    const segments = useMemo(() => {
        const maxValue = Math.max(...data.map((stage) => Number(stage.value) || 0), 1);
        const firstValue = Number(data[0]?.value) || 0;
        const center = 380;
        const segmentHeight = 58;
        const widths = data.map((stage) => Math.max(220, 640 * ((Number(stage.value) || 0) / maxValue)));
        return data.map((stage, index) => {
            const nextStage = data[index + 1];
            const currentValue = Number(stage.value) || 0;
            const previousValue = Number(data[index - 1]?.value) || 0;
            const retention = firstValue > 0 ? currentValue / firstValue : 0;
            const conversion = index === 0 ? 1 : previousValue > 0 ? currentValue / previousValue : 0;
            const dropoff = index === 0 ? 0 : Math.max(0, previousValue - currentValue);
            const topWidth = widths[index];
            const bottomWidth = nextStage ? widths[index + 1] : Math.max(160, topWidth * 0.72);
            const y = 18 + index * segmentHeight;
            return {
                ...stage,
                index,
                currentValue,
                retention,
                conversion,
                dropoff,
                fill: getDashboardChartShade(index),
                textTone: index < 3 ? 'dark' : 'light',
                points: [
                    [center - topWidth / 2, y],
                    [center + topWidth / 2, y],
                    [center + bottomWidth / 2, y + segmentHeight],
                    [center - bottomWidth / 2, y + segmentHeight],
                ].map((point) => point.join(',')).join(' '),
                labelX: center,
                labelY: y + 29,
                valueY: y + 48,
            };
        });
    }, [data]);

    const activeSegment = segments[selectedIndex] || segments[0];
    const height = Math.max(120, 36 + segments.length * 66);

    if (!segments.length) {
        return <div className="glow-surface-soft rounded-2xl p-6 text-sm text-zinc-400">No lifecycle data.</div>;
    }

    const displayValue = (segment) => {
        if (!segment) return '0';
        if (metric === 'retention') return `${Math.round(segment.retention * 100)}%`;
        if (metric === 'dropoff') return formatNumber(segment.dropoff);
        return formatNumber(segment.currentValue);
    };
    const metricLabel = metric === 'retention'
        ? 'retained from sold'
        : metric === 'dropoff'
            ? 'drop-off from previous stage'
            : 'people at this stage';
    const metricOptions = [
        { id: 'count', label: 'Count' },
        { id: 'retention', label: 'Retention' },
        { id: 'dropoff', label: 'Drop-off' },
    ];

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-zinc-300">Follow guests from purchase to participation.</p>
                    <p className="mt-1 text-xs text-zinc-500">
                        Switch metrics to see absolute volume, retention from tickets sold, or stage drop-off.
                    </p>
                </div>
                <div className="dashboard-segmented-toggle w-full lg:w-auto" role="tablist" aria-label="Funnel metric">
                    {metricOptions.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            className="dashboard-segmented-toggle__item flex-1 lg:flex-none"
                            data-active={metric === item.id}
                            aria-pressed={metric === item.id}
                            onClick={() => setMetric(item.id)}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            </div>
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[300px_minmax(0,1fr)]">
                <aside className="dashboard-glow-popover rounded-2xl bg-zinc-950 p-5 text-sm text-zinc-200">
                    <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Selected stage</p>
                    <p className="mt-3 text-2xl font-black text-white">{activeSegment.stage}</p>
                    <p className="mt-1 text-3xl font-black text-white">{displayValue(activeSegment)}</p>
                    <p className="mt-2 text-xs font-black uppercase tracking-widest text-white/45">{metricLabel}</p>
                    {metric === 'retention' && activeSegment.index > 0 ? (
                        <p className="mt-2 text-xs font-semibold text-zinc-500">
                            {Math.round(activeSegment.conversion * 100)}% converted from the previous stage.
                        </p>
                    ) : null}
                    <div className="mt-5 space-y-3">
                        {(activeSegment.suggestions || []).slice(0, 2).map((suggestion) => (
                            <div key={suggestion} className="rounded-2xl bg-white/[0.055] p-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Insight</p>
                                <p className="mt-1 leading-5 text-zinc-200">{suggestion}</p>
                            </div>
                        ))}
                    </div>
                    <Link href={activeSegment.href || '/dashboard/audience?view=campaigns'} className="mt-5 inline-flex rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-widest text-black">
                        {activeSegment.cta}
                    </Link>
                </aside>

                <div className="glow-surface-soft overflow-hidden rounded-2xl p-4">
                    <svg viewBox={`0 0 760 ${height}`} role="img" aria-label="Attendee lifecycle funnel" className="h-auto w-full">
                        {segments.map((segment) => {
                            const active = selectedIndex === segment.index;
                            const textFill = segment.textTone === 'dark' ? '#09090b' : '#ffffff';
                            const subTextFill = segment.textTone === 'dark' ? 'rgba(9,9,11,0.7)' : 'rgba(255,255,255,0.72)';
                            return (
                                <g
                                    key={segment.stage}
                                    tabIndex={0}
                                    role="button"
                                    aria-pressed={active}
                                    onFocus={() => setSelectedIndex(segment.index)}
                                    onClick={() => setSelectedIndex(segment.index)}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter' || event.key === ' ') {
                                            event.preventDefault();
                                            setSelectedIndex(segment.index);
                                        }
                                    }}
                                    className="cursor-pointer outline-none"
                                >
                                    <polygon
                                        points={segment.points}
                                        fill={segment.fill}
                                        opacity={active ? 1 : 0.9}
                                        stroke={active ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.16)'}
                                        strokeWidth={active ? 3 : 1}
                                    />
                                    <text x={segment.labelX} y={segment.labelY} textAnchor="middle" fill={textFill} fontSize="18" fontWeight="900">
                                        {segment.stage}
                                    </text>
                                    <text x={segment.labelX} y={segment.valueY} textAnchor="middle" fill={subTextFill} fontSize="13" fontWeight="800">
                                        {displayValue(segment)}
                                    </text>
                                </g>
                            );
                        })}
                    </svg>
                </div>
            </div>
        </div>
    );
}
