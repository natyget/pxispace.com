'use client';

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Button, DataTable, Panel, Skeleton } from '@/components/dashboard/ui/kit';
import { DASHBOARD_BRAND_COLOR, DASHBOARD_GRID_STROKE, DASHBOARD_TOOLTIP_PROPS, getDashboardChartShade } from '@/components/dashboard/chartStyles';
import { count, money } from '@/lib/dashFormat';

const COMPARISON_COLORS = [DASHBOARD_BRAND_COLOR, getDashboardChartShade(1), getDashboardChartShade(2), getDashboardChartShade(3)];

/** Pick up to four nights. Click a night to add it, click it again to take it out (one always stays). */
export function NightPicker({ nights, selectedIds, onToggle, onClose }) {
    return (
        <Panel title="Compare nights" subtitle="Pick up to 4." action={<Button variant="quiet" size="sm" onClick={onClose}>Done</Button>}>
            {nights.length ? (
                <ul className="max-h-[320px] space-y-1.5 overflow-y-auto">
                    {nights.map((night) => {
                        const index = selectedIds.indexOf(night.id);
                        const selected = index >= 0;
                        return (
                            <li key={night.id}>
                                <button
                                    type="button"
                                    aria-pressed={selected}
                                    onClick={() => onToggle(night.id)}
                                    className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition ${selected ? 'bg-[#3a3a3a]' : 'bg-pxi-field hover:bg-[#363636]'}`}
                                >
                                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold ${selected ? 'bg-pxi-purple text-white' : 'bg-white/[0.07]'}`}>
                                        {selected ? index + 1 : ''}
                                    </span>
                                    <span className="min-w-0 flex-1 truncate text-[14px] font-semibold text-white">{night.name}</span>
                                    <span className="shrink-0 text-[12px] text-white/45">{night.dateLabel}</span>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            ) : (
                <p className="text-[14px] text-white/50">Create an event to compare nights.</p>
            )}
        </Panel>
    );
}

/** One chart of tickets sold, lined up by days since each night was created so different dates overlay, and a table of the numbers. */
export function ComparisonPanel({ details = [], loading }) {
    if (loading) {
        return (
            <Panel title="Tickets sold">
                <Skeleton className="h-[280px]" />
            </Panel>
        );
    }
    if (!details.length) return null;

    const rows = details.map((detail, index) => ({
        id: detail.event?.id,
        name: detail.event?.name || 'Event',
        color: COMPARISON_COLORS[index % COMPARISON_COLORS.length],
        tickets: Number(detail.sales?.total || detail.funnel?.sold || 0),
        gross: Number(detail.sales?.revenue?.grossCents || 0),
        scanRate: Number(detail.attendance?.scanRate || 0),
        byDay: detail.sales?.byDay || [],
    }));

    // Align by day-index-since-start rather than calendar date.
    const maxDays = Math.max(1, ...rows.map((row) => row.byDay.length));
    const series = Array.from({ length: maxDays }, (_, dayIndex) => {
        const point = { dayIndex };
        rows.forEach((row) => {
            point[row.id] = row.byDay[dayIndex]?.cumulative ?? null;
        });
        return point;
    });

    const columns = [
        {
            key: 'name',
            label: 'Night',
            render: (row) => (
                <span className="flex min-w-0 items-center gap-2.5">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: row.color }} aria-hidden="true" />
                    <span className="truncate text-[14px] font-semibold text-white">{row.name}</span>
                </span>
            ),
        },
        { key: 'tickets', label: 'Sold', width: '90px', align: 'right', render: (row) => <span className="text-[14px] tabular-nums text-white">{count(row.tickets)}</span> },
        { key: 'gross', label: 'Ticket sales', width: '120px', align: 'right', render: (row) => <span className="text-[14px] tabular-nums text-white">{money(row.gross)}</span> },
        { key: 'scan', label: 'Turnout', width: '90px', align: 'right', render: (row) => <span className="text-[14px] tabular-nums text-white">{Math.round(row.scanRate * 100)}%</span> },
    ];

    return (
        <Panel title="Tickets sold" subtitle="Day by day since each night was created.">
            <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={series} margin={{ top: 12, right: 12, left: -8, bottom: 0 }}>
                        <CartesianGrid stroke={DASHBOARD_GRID_STROKE} vertical={false} />
                        <XAxis dataKey="dayIndex" tickFormatter={(v) => `Day ${v + 1}`} tick={{ fill: 'rgba(255,255,255,0.46)', fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis allowDecimals={false} tick={{ fill: 'rgba(255,255,255,0.46)', fontSize: 10 }} width={36} axisLine={false} tickLine={false} />
                        <Tooltip {...DASHBOARD_TOOLTIP_PROPS} labelFormatter={(v) => `Day ${v + 1}`} />
                        {rows.map((row) => (
                            <Area key={row.id} type="monotone" dataKey={row.id} name={row.name} stroke={row.color} fill="none" strokeWidth={2.2} dot={false} connectNulls isAnimationActive={false} />
                        ))}
                    </AreaChart>
                </ResponsiveContainer>
            </div>
            <div className="mt-4">
                <DataTable columns={columns} rows={rows} rowKey="id" />
            </div>
        </Panel>
    );
}
