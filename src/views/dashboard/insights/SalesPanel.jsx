'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Button, Panel, WordTabs } from '@/components/dashboard/ui/kit';
import { DASHBOARD_BRAND_COLOR, DASHBOARD_GRID_STROKE, DASHBOARD_MUTED_COLOR } from '@/components/dashboard/chartStyles';
import { count } from '@/lib/dashFormat';
import { projectSales } from './nights';

const VIEWS = [
    { key: 'day', label: 'Per day' },
    { key: 'total', label: 'Total' },
];

/** 'YYYY-MM-DD' -> 'Jun 7' (parsed as UTC so day boundaries match the backend's UTC buckets). */
function dayTick(value) {
    if (!value) return '';
    const [y, m, d] = String(value).split('-').map(Number);
    if (!y || !m || !d) return '';
    return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

function tickInterval(length, maxTicks = 8) {
    if (length <= maxTicks) return 0;
    return Math.ceil(length / maxTicks) - 1;
}

function round1(value) {
    return Math.round((Number(value) || 0) * 10) / 10;
}

function SalesTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    const point = payload[0]?.payload || {};
    return (
        <div className="min-w-[160px] rounded-2xl bg-pxi-field p-3.5">
            <p className="text-[11px] font-semibold text-white/60">{dayTick(label)}</p>
            <p className="mt-1 text-[15px] font-semibold text-white">{count(point.count)} tickets</p>
            {point.cumulative != null ? <p className="mt-1 text-[12px] text-white/50">{count(point.cumulative)} in total</p> : null}
        </div>
    );
}

/** One short line: what the pace adds up to by doors. */
function paceLine(detail, nowMs = Date.now()) {
    const sales = detail?.sales;
    const plan = projectSales({ velocityPerDay7d: sales?.velocityPerDay7d, totalSold: sales?.total, startDate: detail?.event?.startDate }, nowMs);
    if (!plan) return null;
    if (plan.daysToDoors <= 0) return `Doors opened with ${count(sales?.total)} tickets sold.`;
    if (plan.pace <= 0) return 'No sales this week.';
    return `Selling ${count(round1(plan.pace))} a day, about ${count(plan.projected)} by doors.`;
}

export default function SalesPanel({ detail, isMobile }) {
    const router = useRouter();
    const [view, setView] = useState('day');
    const byDay = useMemo(() => detail?.sales?.byDay || [], [detail]);
    const [mountedAt] = useState(() => Date.now());
    const line = paceLine(detail, mountedAt);
    const stalled = line === 'No sales this week.';
    const interval = tickInterval(byDay.length, isMobile ? 5 : 9);
    const daily = view === 'day';
    const color = daily ? DASHBOARD_BRAND_COLOR : DASHBOARD_MUTED_COLOR;

    return (
        <Panel
            title="Sales"
            subtitle={line}
            action={stalled ? <Button variant="quiet" size="sm" onClick={() => router.push('/dashboard/campaigns')}>Send a campaign</Button> : null}
        >
            <WordTabs items={VIEWS} value={view} onChange={setView} />
            {byDay.length ? (
                <div className="mt-4 h-[260px] md:h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={byDay} margin={{ top: 14, right: 12, left: 0, bottom: 0 }}>
                            <CartesianGrid stroke={DASHBOARD_GRID_STROKE} vertical={false} />
                            <XAxis
                                dataKey="date"
                                tick={{ fill: 'rgba(255,255,255,0.46)', fontSize: isMobile ? 9 : 10 }}
                                tickFormatter={dayTick}
                                interval={interval}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis tick={{ fill: 'rgba(255,255,255,0.46)', fontSize: 10 }} width={isMobile ? 28 : 36} allowDecimals={false} axisLine={false} tickLine={false} />
                            <Tooltip content={<SalesTooltip />} />
                            <Area
                                type="monotone"
                                dataKey={daily ? 'count' : 'cumulative'}
                                name={daily ? 'Tickets per day' : 'Tickets in total'}
                                stroke={color}
                                fill={color}
                                fillOpacity={0.12}
                                strokeWidth={2.2}
                                dot={false}
                                activeDot={{ r: 4, fill: '#ffffff', stroke: '#1c1c1c' }}
                                isAnimationActive={false}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <p className="mt-4 text-[14px] text-white/50">No sales yet.</p>
            )}
        </Panel>
    );
}
