'use client';

import { useMemo } from 'react';

/**
 * Calendar-style event picker: events grouped chronologically by month on a
 * horizontal strip, each with its cover, so it's obvious which event is which
 * when selecting. Click-to-toggle — same contract as the card row.
 */
export default function EventTimelinePicker({ events, selectedIds = [], onToggle }) {
    const months = useMemo(() => {
        const byMonth = new Map();
        const sorted = [...events].sort((a, b) => new Date(b.startDate || 0) - new Date(a.startDate || 0));
        for (const event of sorted) {
            const date = event.startDate ? new Date(event.startDate) : null;
            const key = date && !Number.isNaN(date.getTime())
                ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
                : 'undated';
            if (!byMonth.has(key)) {
                byMonth.set(key, {
                    key,
                    label: date && !Number.isNaN(date.getTime())
                        ? date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                        : 'Date TBD',
                    events: [],
                });
            }
            byMonth.get(key).events.push(event);
        }
        return [...byMonth.values()];
    }, [events]);

    if (!events.length) {
        return <p className="text-sm text-zinc-400">Create an event to see it on the timeline.</p>;
    }

    return (
        <div className="dashboard-scrollbar-none flex gap-5 overflow-x-auto pb-1">
            {months.map((month) => (
                <div key={month.key} className="min-w-[230px] shrink-0">
                    <p className="flex items-center gap-2 px-1 text-[11px] font-medium tracking-[0.02em] text-zinc-500">
                        <span className="h-1.5 w-1.5 rounded-full bg-white/25" />
                        {month.label}
                        <span className="text-zinc-600">·</span>
                        <span className="text-zinc-600">{month.events.length}</span>
                    </p>
                    <div className="mt-2.5 space-y-2 border-l border-white/[0.07] pl-3">
                        {month.events.map((event) => {
                            const selected = selectedIds.includes(event.id);
                            const order = selectedIds.indexOf(event.id) + 1;
                            const day = event.startDate ? new Date(event.startDate).getDate() : null;
                            return (
                                <button
                                    key={event.id}
                                    type="button"
                                    onClick={() => onToggle(event.id)}
                                    aria-pressed={selected}
                                    className={`flex w-full items-center gap-2.5 rounded-2xl p-2 text-left transition ${
                                        selected ? 'bg-white/[0.09] ring-1 ring-[#d84aff]' : 'bg-white/[0.045] text-zinc-300 hover:bg-white/[0.08] hover:text-white'
                                    }`}
                                >
                                    <span className="relative shrink-0">
                                        {event.coverImage ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={event.coverImage} alt="" className="h-10 w-10 rounded-xl object-cover" loading="lazy" />
                                        ) : (
                                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.07] text-sm font-bold text-white/50">
                                                {(event.name || '?').slice(0, 1).toUpperCase()}
                                            </span>
                                        )}
                                        {selected ? (
                                            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#d84aff] text-[9px] font-bold text-white">
                                                {order}
                                            </span>
                                        ) : null}
                                    </span>
                                    <span className="min-w-0">
                                        <span className={`block truncate text-xs font-bold ${selected ? 'text-white' : ''}`}>{event.name}</span>
                                        <span className="mt-0.5 block truncate text-[10px] tracking-[0.02em] text-zinc-500">
                                            {day != null ? `${event.dateLabel}` : 'Date TBD'}
                                            {event.venueName ? ` · ${event.venueName}` : ''}
                                        </span>
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}
