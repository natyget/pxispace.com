'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

function formatNumber(value) {
    return Number(value || 0).toLocaleString('en-US');
}

export default function FunnelChart({ data = [] }) {
    const [selectedIndex, setSelectedIndex] = useState(0);
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

    const activeStage = stages[selectedIndex] || stages[0];

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
        <div className="space-y-5">
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
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
                <div className="space-y-3">
                    {stages.map((stage) => {
                        const active = selectedIndex === stage.index;
                        return (
                            <button
                                key={stage.stage}
                                type="button"
                                aria-pressed={active}
                                onClick={() => setSelectedIndex(stage.index)}
                                className={`w-full rounded-[1.25rem] p-4 text-left transition ${
                                    active ? 'bg-white text-black' : 'bg-white/[0.035] text-white hover:bg-white/[0.06]'
                                }`}
                            >
                                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-3">
                                            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black ${
                                                active ? 'bg-black text-white' : 'bg-white/[0.08] text-white/70'
                                            }`}>
                                                {stage.index + 1}
                                            </span>
                                            <div className="min-w-0">
                                                <p className={`truncate text-base font-black ${active ? 'text-black' : 'text-white'}`}>{stage.stage}</p>
                                                <p className={`mt-0.5 text-xs font-semibold ${active ? 'text-black/55' : 'text-zinc-500'}`}>
                                                    {stage.index === 0
                                                        ? 'Starting point'
                                                        : `${Math.round(stage.conversion * 100)}% from previous stage`}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 md:min-w-[300px]">
                                        <StageStat label="Count" value={formatNumber(stage.currentValue)} active={active} />
                                        <StageStat label="Retention" value={`${Math.round(stage.retention * 100)}%`} active={active} />
                                        <StageStat label="Drop-off" value={formatNumber(stage.dropoff)} active={active} />
                                    </div>
                                </div>
                                <div className={`mt-4 h-2 overflow-hidden rounded-full ${active ? 'bg-zinc-200' : 'bg-white/[0.055]'}`} aria-hidden="true">
                                    <div
                                        className={`h-full rounded-full ${active ? 'bg-zinc-950' : 'bg-white/65'}`}
                                        style={{ width: `${stage.width}%` }}
                                    />
                                </div>
                            </button>
                        );
                    })}
                </div>

                <aside className="dashboard-glow-popover rounded-[1.25rem] p-5 text-sm text-zinc-200">
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
                    <Link href={activeStage.href || '/dashboard/audience?view=campaigns'} className="mt-5 inline-flex rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-widest text-black">
                        {activeStage.cta}
                    </Link>
                </aside>
            </div>
        </div>
    );
}

function StageStat({ label, value, active }) {
    return (
        <div className={`rounded-2xl px-3 py-2 ${active ? 'bg-black/[0.055]' : 'bg-white/[0.04]'}`}>
            <p className={`text-[9px] font-black uppercase tracking-widest ${active ? 'text-black/45' : 'text-white/35'}`}>{label}</p>
            <p className={`mt-1 truncate text-sm font-black ${active ? 'text-black' : 'text-white'}`}>{value}</p>
        </div>
    );
}
