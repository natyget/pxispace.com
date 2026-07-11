'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
    Cell,
    Funnel,
    FunnelChart as RechartsFunnelChart,
    LabelList,
    ResponsiveContainer,
    Tooltip,
} from 'recharts';
import { DASHBOARD_BRAND_COLOR, getDashboardChartShade } from './chartStyles';

function formatNumber(value) {
    return Number(value || 0).toLocaleString('en-US');
}

/** Hover tooltip for a funnel segment — stage name, raw count, and conversion from the previous stage. */
function FunnelTooltip({ active, payload }) {
    if (!active || !payload?.length) return null;
    const stage = payload[0]?.payload;
    if (!stage) return null;
    return (
        <div className="dashboard-glow-popover min-w-[180px] rounded-2xl bg-zinc-950 p-3.5 shadow-2xl">
            <p className="text-[11px] font-semibold tracking-wide text-zinc-300">{stage.stage}</p>
            <p className="mt-1 text-base font-black text-white">{formatNumber(stage.currentValue)} people</p>
            <p className="mt-1 text-xs font-semibold text-zinc-400">
                {stage.index === 0 ? 'Starting point' : `${Math.round(stage.conversion * 100)}% from previous stage`}
            </p>
            <p className="mt-0.5 text-xs font-semibold text-zinc-500">{Math.round(stage.retention * 100)}% retained from the first stage</p>
        </div>
    );
}

/**
 * Tapered lifecycle funnel (recharts FunnelChart/Funnel) with a metric-aware detail
 * panel alongside it.
 *
 * `singleSelection` (default true) matches the only mode this component has ever had:
 * clicking a segment replaces the active stage, and exactly one stage is always active
 * (defaults to the first). Passing `singleSelection={false}` allows clicking the active
 * segment again to clear the selection, which drops the detail panel back to an
 * aggregate summary — for future call sites that want a dismissable/optional detail view
 * instead of an always-on one.
 */
export default function FunnelChart({ data = [], singleSelection = true }) {
    const [selectedIndex, setSelectedIndex] = useState(singleSelection ? 0 : null);
    const [metric, setMetric] = useState('count');

    const stages = useMemo(() => {
        const maxValue = Math.max(...data.map((stage) => Number(stage.value) || 0), 1);
        const firstValue = Number(data[0]?.value) || 0;
        return data.map((stage, index) => {
            const currentValue = Number(stage.value) || 0;
            const previousValue = Number(data[index - 1]?.value) || 0;
            const retention = firstValue > 0 ? currentValue / firstValue : 0;
            const conversion = index === 0 ? 1 : previousValue > 0 ? currentValue / previousValue : 0;
            const dropoff = index === 0 ? 0 : Math.max(0, previousValue - currentValue);
            return {
                ...stage,
                index,
                currentValue,
                retention,
                conversion,
                dropoff,
                width: Math.max(8, (currentValue / maxValue) * 100),
            };
        });
    }, [data]);

    const handleSelect = (index) => {
        setSelectedIndex((current) => (!singleSelection && current === index ? null : index));
    };

    const activeStage = selectedIndex != null ? stages[selectedIndex] : null;

    if (!stages.length) {
        return <div className="rounded-2xl bg-white/[0.035] p-6 text-sm text-zinc-400">No lifecycle data.</div>;
    }

    const displayValue = (stage) => {
        if (!stage) return '0';
        if (metric === 'retention') return `${Math.round(stage.retention * 100)}%`;
        if (metric === 'dropoff') return formatNumber(stage.dropoff);
        return formatNumber(stage.currentValue);
    };
    const metricLabel = metric === 'retention'
        ? 'retained from the first stage'
        : metric === 'dropoff'
            ? 'drop-off from previous stage'
            : 'people at this stage';
    const metricOptions = [
        { id: 'count', label: 'Count' },
        { id: 'retention', label: 'Retention' },
        { id: 'dropoff', label: 'Drop-off' },
    ];
    const totalStart = stages[0]?.currentValue || 0;
    const totalEnd = stages[stages.length - 1]?.currentValue || 0;
    const overallRetention = totalStart > 0 ? Math.round((totalEnd / totalStart) * 100) : 0;

    return (
        <div className="space-y-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-zinc-300">Follow the audience from the first stage to the last.</p>
                    <p className="mt-1 text-xs text-zinc-500">
                        Switch metrics to see absolute volume, retention from the first stage, or stage drop-off. Click a segment for detail.
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
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
                <div className="h-[320px] rounded-[1.25rem] bg-white/[0.02] p-2 md:h-[380px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <RechartsFunnelChart>
                            <Tooltip content={<FunnelTooltip />} />
                            <Funnel
                                data={stages}
                                dataKey="currentValue"
                                nameKey="stage"
                                isAnimationActive={false}
                            >
                                <LabelList
                                    dataKey="stage"
                                    position="right"
                                    fill="rgba(255,255,255,0.85)"
                                    stroke="none"
                                    fontSize={12}
                                    fontWeight={800}
                                />
                                <LabelList
                                    dataKey="currentValue"
                                    position="center"
                                    fill="#09090b"
                                    stroke="none"
                                    fontSize={13}
                                    fontWeight={900}
                                    formatter={formatNumber}
                                />
                                {stages.map((stage) => (
                                    <Cell
                                        key={stage.stage}
                                        cursor="pointer"
                                        fill={selectedIndex === stage.index ? DASHBOARD_BRAND_COLOR : getDashboardChartShade(stage.index)}
                                        stroke="rgba(9,9,11,0.65)"
                                        strokeWidth={2}
                                        onClick={() => handleSelect(stage.index)}
                                    />
                                ))}
                            </Funnel>
                        </RechartsFunnelChart>
                    </ResponsiveContainer>
                </div>

                <aside className="dashboard-glow-popover rounded-[1.25rem] p-5 text-sm text-zinc-200">
                    {activeStage ? (
                        <>
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Selected stage</p>
                            <p className="mt-3 text-2xl font-black text-white">{activeStage.stage}</p>
                            <p className="mt-2 text-4xl font-black text-white">{displayValue(activeStage)}</p>
                            <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-white/45">{metricLabel}</p>
                            {metric === 'retention' && activeStage.index > 0 ? (
                                <p className="mt-3 text-xs font-semibold leading-5 text-zinc-500">
                                    {Math.round(activeStage.conversion * 100)}% converted from the previous stage.
                                </p>
                            ) : null}
                            <div className="mt-5 space-y-2">
                                {(activeStage.suggestions || []).slice(0, 2).map((suggestion) => (
                                    <p key={suggestion} className="rounded-2xl bg-white/[0.045] p-3 text-xs leading-5 text-zinc-300">
                                        {suggestion}
                                    </p>
                                ))}
                            </div>
                            <Link href={activeStage.href || '/dashboard/campaigns'} className="mt-5 inline-flex rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-widest text-black">
                                {activeStage.cta || 'View detail'}
                            </Link>
                        </>
                    ) : (
                        <>
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Overview</p>
                            <p className="mt-3 text-2xl font-black text-white">{stages.length} stages</p>
                            <p className="mt-2 text-4xl font-black text-white">{overallRetention}%</p>
                            <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-white/45">end-to-end retention</p>
                            <p className="mt-5 text-xs font-semibold leading-5 text-zinc-500">Click a segment in the funnel for stage-level detail.</p>
                        </>
                    )}
                </aside>
            </div>
        </div>
    );
}
