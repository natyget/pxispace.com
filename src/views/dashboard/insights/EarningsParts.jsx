'use client';

import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Panel } from '@/components/dashboard/ui/kit';
import { getDashboardChartShade } from '@/components/dashboard/chartStyles';
import { money } from '@/lib/dashFormat';

const GROSS_COLOR = getDashboardChartShade(1);
const NET_COLOR = getDashboardChartShade(0);

/** Whole dollars for the axis: 1200 reads "$1.2k". */
function axisMoney(value) {
    const dollars = Number(value) || 0;
    if (Math.abs(dollars) >= 1000) return `$${(dollars / 1000).toFixed(dollars % 1000 === 0 ? 0 : 1)}k`;
    return `$${Math.round(dollars)}`;
}

function MonthTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="min-w-[150px] rounded-2xl bg-pxi-field p-3.5">
            <p className="text-[11px] font-semibold text-white/60">{label}</p>
            <div className="mt-1.5 space-y-1">
                {payload
                    .filter((item) => item.value !== null && item.value !== undefined)
                    .map((item) => (
                        <div key={item.dataKey} className="flex items-center justify-between gap-4 text-[13px]">
                            <span className="text-white/60">{item.name}</span>
                            <span className="font-semibold tabular-nums text-white">{money(Math.round(item.value * 100))}</span>
                        </div>
                    ))}
            </div>
        </div>
    );
}

/** Ticket sales and what reached you, month by month. `series` is [{ month, gross, net }] in dollars. */
export function MonthPanel({ series }) {
    return (
        <Panel title="By month">
            {series.length ? (
                <>
                    <div className="h-[220px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={series} margin={{ top: 10, right: 6, bottom: 0, left: 0 }}>
                                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 11 }} />
                                <YAxis axisLine={false} tickLine={false} tickFormatter={axisMoney} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} width={42} />
                                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.03)' }} content={<MonthTooltip />} />
                                <Area type="monotone" dataKey="gross" name="Ticket sales" stroke={GROSS_COLOR} fill={GROSS_COLOR} fillOpacity={0.12} strokeWidth={2} isAnimationActive={false} />
                                <Line type="monotone" dataKey="net" name="Net to you" stroke={NET_COLOR} strokeWidth={2} dot={false} isAnimationActive={false} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-[12px] text-white/50">
                        <span className="inline-flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: GROSS_COLOR }} aria-hidden="true" />
                            Ticket sales
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: NET_COLOR }} aria-hidden="true" />
                            Net to you
                        </span>
                    </div>
                </>
            ) : (
                <p className="text-[14px] text-white/50">No sales yet.</p>
            )}
        </Panel>
    );
}

/** Where the money went, biggest first, each with its share as a thin bar. slices: [{ name, cents }] */
export function CostRows({ slices, creditCents = 0 }) {
    const total = slices.reduce((sum, slice) => sum + slice.cents, 0);
    const max = Math.max(1, ...slices.map((slice) => slice.cents));
    return (
        <div>
            <ul className="grid gap-1.5 md:grid-cols-2">
                {slices.map((slice) => (
                    <li key={slice.name} className="rounded-2xl bg-pxi-field px-4 py-3">
                        <div className="flex items-baseline justify-between gap-3">
                            <p className="min-w-0 truncate text-[14px] font-semibold text-white">{slice.name}</p>
                            <p className="shrink-0 text-[14px] tabular-nums text-white">
                                {money(slice.cents)}
                                <span className="ml-2 text-[12px] text-white/40">{total > 0 ? Math.round((slice.cents / total) * 100) : 0}%</span>
                            </p>
                        </div>
                        <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
                            <div className="h-full rounded-full bg-[#A523EF]" style={{ width: `${Math.max(2, (slice.cents / max) * 100)}%` }} />
                        </div>
                    </li>
                ))}
            </ul>
            {creditCents > 0 ? <p className="mt-3 text-[12px] text-white/40">{money(creditCents)} more was paid with credits.</p> : null}
        </div>
    );
}

/** What the buyers' cards were charged on top of your ticket price. rows: [{ label, cents }] */
export function BuyersPanel({ rows }) {
    return (
        <Panel title="What buyers paid">
            <ul className="divide-y divide-white/[0.08]">
                {rows.map((row) => (
                    <li key={row.label} className="flex items-baseline justify-between gap-3 py-2.5 first:pt-0">
                        <span className="text-[14px] text-white/60">{row.label}</span>
                        <span className="text-[14px] font-semibold tabular-nums text-white">{money(row.cents)}</span>
                    </li>
                ))}
            </ul>
            <p className="mt-3 text-[12px] text-white/40">Added at checkout, never taken from your payout.</p>
        </Panel>
    );
}
