'use client';

import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowDownRightIcon, ArrowUpRightIcon } from '@hugeicons/core-free-icons';
import DataSourceBadge from './DataSourceBadge';

export default function MetricCard({
    title,
    value,
    description,
    icon,
    trend = 'neutral',
    source = 'Derived',
    loading = false,
}) {
    const trendClass =
        trend === 'up'
            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
            : trend === 'down'
                ? 'bg-red-500/10 text-red-300 border-red-500/30'
                : 'bg-white/5 text-zinc-400 border-white/10';

    return (
        <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-6 md:p-8 flex flex-col justify-between relative">
            <div className="flex items-center justify-between mb-6">
                <span className="text-[11px] md:text-[12px] font-bold tracking-widest text-white/40 uppercase">{title}</span>
                {icon ? (
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                        <HugeiconsIcon icon={icon} className="h-4 w-4 text-white" />
                    </div>
                ) : null}
            </div>
            {loading ? (
                <div className="h-10 w-24 bg-white/5 rounded animate-pulse" />
            ) : (
                <div className="mt-auto flex flex-col items-start gap-3">
                    <div className="text-3xl lg:text-[40px] font-[900] text-white tracking-tighter leading-none">{value}</div>
                    <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] md:text-[11px] font-bold tracking-wider uppercase border ${trendClass}`}>
                        {trend === 'up' ? <HugeiconsIcon icon={ArrowUpRightIcon} className="w-3 h-3" /> : null}
                        {trend === 'down' ? <HugeiconsIcon icon={ArrowDownRightIcon} className="w-3 h-3" /> : null}
                        <span>{description}</span>
                    </div>
                    <DataSourceBadge source={source} />
                </div>
            )}
        </div>
    );
}
