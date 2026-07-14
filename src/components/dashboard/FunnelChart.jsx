'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { getOrdinalStageColor } from './chartStyles';

function formatNumber(value) {
    return Number(value || 0).toLocaleString('en-US');
}

/**
 * Lifecycle funnel with a metric-aware detail panel alongside it.
 *
 * Hand-rolled centered bars (one purple ramp, light→dark with the stage order)
 * instead of recharts' tapered polygons, so stage magnitudes read as clean
 * proportional widths and the selected stage keeps its color — selection is a
 * ring, never a repaint.
 *
 * `singleSelection` (default true): clicking a segment replaces the active stage,
 * and exactly one stage is always active (defaults to the first). Passing
 * `singleSelection={false}` allows clicking the active segment again to clear the
 * selection, which drops the detail panel back to an aggregate summary.
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
                width: Math.max(6, (currentValue / maxValue) * 100),
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
                        Switch metrics to see absolute volume, retention from the first stage, or stage drop-off. Click a stage for detail.
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
                <div className="rounded-[1.25rem] bg-white/[0.02] p-4 md:p-6" role="list" aria-label="Funnel stages">
                    {stages.map((stage) => {
                        const selected = selectedIndex === stage.index;
                        const stageColor = getOrdinalStageColor(stage.index, stages.length);
                        return (
                            <div key={stage.stage} role="listitem">
                                {stage.index > 0 ? (
                                    <div className="flex items-center justify-center gap-2 py-2 text-[11px] font-semibold text-zinc-500" aria-hidden="true">
                                        <svg width="10" height="10" viewBox="0 0 10 10" className="shrink-0 opacity-60">
                                            <path d="M5 8L1 3h8L5 8z" fill="currentColor" />
                                        </svg>
                                        {Math.round(stage.conversion * 100)}% converted
                                        {stage.dropoff > 0 ? <span className="text-zinc-600">· {formatNumber(stage.dropoff)} dropped off</span> : null}
                                    </div>
                                ) : null}
                                <button
                                    type="button"
                                    onClick={() => handleSelect(stage.index)}
                                    aria-pressed={selected}
                                    className="group block w-full rounded-2xl px-1 py-1.5 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-white/40"
                                >
                                    <div className="flex items-baseline justify-between gap-3 px-1 pb-1.5">
                                        <span className={`truncate text-sm font-bold transition ${selected ? 'text-white' : 'text-zinc-300 group-hover:text-white'}`}>
                                            {stage.stage}
                                        </span>
                                        <span className="shrink-0 text-sm font-bold tabular-nums text-white">
                                            {formatNumber(stage.currentValue)}
                                            <span className="ml-2 text-xs font-semibold text-zinc-500">{Math.round(stage.retention * 100)}%</span>
                                        </span>
                                    </div>
                                    <div className="relative h-11 w-full md:h-12">
                                        <div
                                            className={`absolute inset-y-0 left-1/2 -translate-x-1/2 rounded-xl transition-all duration-300 ${
                                                selected
                                                    ? 'ring-2 ring-white/85 ring-offset-2 ring-offset-[#0e0e13]'
                                                    : 'opacity-90 group-hover:opacity-100'
                                            }`}
                                            style={{ width: `${stage.width}%`, backgroundColor: stageColor }}
                                        />
                                    </div>
                                </button>
                            </div>
                        );
                    })}
                </div>

                <aside className="dashboard-glow-popover rounded-[1.25rem] p-5 text-sm text-zinc-200">
                    {activeStage ? (
                        <>
                            <p className="text-[11px] font-medium tracking-[0.02em] text-zinc-500">Selected stage</p>
                            <p className="mt-3 flex items-center gap-2.5 text-2xl font-bold text-white">
                                <span
                                    className="h-3 w-3 shrink-0 rounded-full"
                                    style={{ backgroundColor: getOrdinalStageColor(activeStage.index, stages.length) }}
                                    aria-hidden="true"
                                />
                                {activeStage.stage}
                            </p>
                            <p className="mt-2 text-4xl font-bold text-white">{displayValue(activeStage)}</p>
                            <p className="mt-2 text-[11px] font-medium tracking-[0.02em] text-white/45">{metricLabel}</p>
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
                            <Link href={activeStage.href || '/dashboard/campaigns'} className="mt-5 inline-flex rounded-full bg-white px-4 py-2 text-xs font-bold tracking-[0.02em] text-black transition hover:bg-zinc-200">
                                {activeStage.cta || 'View detail'}
                            </Link>
                        </>
                    ) : (
                        <>
                            <p className="text-[11px] font-medium tracking-[0.02em] text-zinc-500">Overview</p>
                            <p className="mt-3 text-2xl font-bold text-white">{stages.length} stages</p>
                            <p className="mt-2 text-4xl font-bold text-white">{overallRetention}%</p>
                            <p className="mt-2 text-[11px] font-medium tracking-[0.02em] text-white/45">end-to-end retention</p>
                            <p className="mt-5 text-xs font-semibold leading-5 text-zinc-500">Click a stage in the funnel for stage-level detail.</p>
                        </>
                    )}
                </aside>
            </div>
        </div>
    );
}
