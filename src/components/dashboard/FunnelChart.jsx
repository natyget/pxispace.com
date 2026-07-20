'use client';

import { useMemo, useState } from 'react';
import { getOrdinalStageColor } from './chartStyles';

function formatNumber(value) {
    return Number(value || 0).toLocaleString('en-US');
}

const BAND_H = 76;      // px per stage band
const MIN_HALF = 4;     // % half-width floor so zero stages stay visible

/**
 * Classic connected funnel, straight-line geometry only (provably planar —
 * no beziers, nothing can cross): each band's top edge is its own magnitude,
 * its bottom edge narrows to the next stage's, bands are contiguous. One
 * vertical gradient from the validated purple ramp. Intel lives in the left
 * rail (name, count, % of start, drop); conversion chips sit on the boundary
 * lines. No metric toggles, no side panel, no buttons — hover simply links a
 * band to its rail row.
 */
export default function FunnelChart({ data = [] }) {
    const [hovered, setHovered] = useState(null);

    const stages = useMemo(() => {
        const maxValue = Math.max(...data.map((stage) => Number(stage.value) || 0), 1);
        const firstValue = Number(data[0]?.value) || 0;
        return data.map((stage, index) => {
            const currentValue = Number(stage.value) || 0;
            const previousValue = Number(data[index - 1]?.value) || 0;
            return {
                stage: stage.stage,
                index,
                currentValue,
                retention: firstValue > 0 ? currentValue / firstValue : 0,
                conversion: index === 0 ? 1 : previousValue > 0 ? currentValue / previousValue : 0,
                dropoff: index === 0 ? 0 : Math.max(0, previousValue - currentValue),
                half: Math.max(MIN_HALF, ((currentValue / maxValue) * 100) / 2),
            };
        });
    }, [data]);

    if (!stages.length) {
        return <div className="rounded-2xl bg-white/[0.035] p-6 text-sm text-zinc-400">No lifecycle data.</div>;
    }

    const totalH = stages.length * BAND_H;

    // Straight-edge outline: left edge top→bottom hits each band boundary at
    // that boundary's (narrower) width, then the mirrored right edge back up.
    const points = useMemo(() => {
        const left = [];
        stages.forEach((stage, index) => {
            left.push([50 - stage.half, index * BAND_H]);
        });
        const lastHalf = stages[stages.length - 1].half;
        left.push([50 - lastHalf, totalH]);
        const right = left.map(([x, y]) => [100 - x, y]).reverse();
        return [...left, ...right].map(([x, y]) => `${x},${y}`).join(' ');
    }, [stages, totalH]);

    const rampTop = getOrdinalStageColor(0, stages.length);
    const rampBottom = getOrdinalStageColor(stages.length - 1, stages.length);

    return (
        <div className="grid grid-cols-[150px_minmax(0,1fr)] gap-5 rounded-[1.25rem] bg-white/[0.02] p-4 sm:grid-cols-[190px_minmax(0,1fr)] md:p-6">
            {/* Left rail: the intel, in text ink. */}
            <div>
                {stages.map((stage) => (
                    <div
                        key={stage.stage}
                        onMouseEnter={() => setHovered(stage.index)}
                        onMouseLeave={() => setHovered(null)}
                        className={`flex flex-col justify-center rounded-xl px-3 transition-colors ${hovered === stage.index ? 'bg-white/[0.05]' : ''}`}
                        style={{ height: BAND_H }}
                    >
                        <span className="flex items-center gap-2">
                            <span
                                className="h-2 w-2 shrink-0 rounded-full"
                                style={{ backgroundColor: getOrdinalStageColor(stage.index, stages.length) }}
                                aria-hidden="true"
                            />
                            <span className={`truncate text-[13px] font-semibold ${hovered === stage.index ? 'text-white' : 'text-zinc-400'}`}>
                                {stage.stage}
                            </span>
                        </span>
                        <span className="mt-1 flex items-baseline gap-2">
                            <span className="text-2xl font-semibold tabular-nums leading-none text-white">{formatNumber(stage.currentValue)}</span>
                            <span className="text-[11px] font-medium text-zinc-500">{Math.round(stage.retention * 100)}%</span>
                        </span>
                        {stage.index > 0 && stage.dropoff > 0 ? (
                            <span className="mt-0.5 text-[11px] font-medium text-zinc-600">−{formatNumber(stage.dropoff)} didn&apos;t advance</span>
                        ) : null}
                    </div>
                ))}
            </div>

            {/* The funnel silhouette. */}
            <div className="relative" style={{ height: totalH }}>
                <svg viewBox={`0 0 100 ${totalH}`} preserveAspectRatio="none" className="h-full w-full" aria-hidden="true">
                    <defs>
                        <linearGradient id="funnelRamp" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={rampTop} />
                            <stop offset="100%" stopColor={rampBottom} />
                        </linearGradient>
                    </defs>
                    <polygon points={points} fill="url(#funnelRamp)" />
                    {/* Hairline separators at interior boundaries, spanning the boundary width. */}
                    {stages.slice(1).map((stage) => (
                        <line
                            key={`sep-${stage.stage}`}
                            x1={50 - stage.half}
                            x2={50 + stage.half}
                            y1={stage.index * BAND_H}
                            y2={stage.index * BAND_H}
                            stroke="rgba(14,14,19,0.55)"
                            strokeWidth={2}
                            vectorEffect="non-scaling-stroke"
                        />
                    ))}
                    {hovered != null ? (
                        <polygon
                            points={(() => {
                                const stage = stages[hovered];
                                const next = stages[hovered + 1] ?? stage;
                                const y0 = hovered * BAND_H;
                                const y1 = y0 + BAND_H;
                                return `${50 - stage.half},${y0} ${50 + stage.half},${y0} ${50 + next.half},${y1} ${50 - next.half},${y1}`;
                            })()}
                            fill="rgba(255,255,255,0.10)"
                        />
                    ) : null}
                </svg>
                {/* Hover targets per band. */}
                {stages.map((stage) => (
                    <div
                        key={`hit-${stage.stage}`}
                        onMouseEnter={() => setHovered(stage.index)}
                        onMouseLeave={() => setHovered(null)}
                        className="absolute left-0 w-full"
                        style={{ top: stage.index * BAND_H, height: BAND_H }}
                        aria-label={`${stage.stage}: ${formatNumber(stage.currentValue)} (${Math.round(stage.retention * 100)}% of start)`}
                        role="img"
                    />
                ))}
                {/* Conversion chips on the boundary lines. */}
                {stages.slice(1).map((stage) => (
                    <div
                        key={`conv-${stage.stage}`}
                        className="pointer-events-none absolute left-1/2 -translate-x-1/2 -translate-y-1/2"
                        style={{ top: stage.index * BAND_H }}
                    >
                        <span className="whitespace-nowrap rounded-full bg-[#0e0e13]/90 px-3 py-1 text-[11px] font-semibold text-zinc-300 ring-1 ring-white/[0.08]">
                            {Math.round(stage.conversion * 100)}% advance
                            {stage.dropoff > 0 ? <span className="text-zinc-500"> · {formatNumber(stage.dropoff)} drop</span> : null}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
