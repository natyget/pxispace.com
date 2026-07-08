'use client';

import { useEffect, useMemo, useState } from 'react';

function roomCenter(room) {
    return {
        x: room.x + room.w / 2,
        y: room.y + room.h / 2,
    };
}

function roomReadingFor(readings, roomId) {
    return readings.find((reading) => reading.id === roomId) || { score: 0, intensity: 0.2, attendees: 0 };
}

function hexToRgb(hex = '#ffffff') {
    const normalized = hex.replace('#', '');
    const value = Number.parseInt(normalized.length === 3 ? normalized.split('').map((char) => char + char).join('') : normalized, 16);
    return {
        r: (value >> 16) & 255,
        g: (value >> 8) & 255,
        b: value & 255,
    };
}

function colorWithAlpha(hex, alpha) {
    const { r, g, b } = hexToRgb(hex);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function HeatToggle({ active, children, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest transition ${
                active ? 'bg-white/[0.12] text-white' : 'bg-white/[0.04] text-zinc-400 hover:text-white'
            }`}
        >
            {children}
        </button>
    );
}

export default function SpatialHeatMap({ rooms = [], timeSlices = [], eventComparisons = [], disabledReason = '' }) {
    const [frameIndex, setFrameIndex] = useState(0);
    const [playing, setPlaying] = useState(false);
    const [styleMode, setStyleMode] = useState('blob');
    const [hoveredRoomId, setHoveredRoomId] = useState(null);

    const safeFrameIndex = Math.min(frameIndex, Math.max(timeSlices.length - 1, 0));
    const activeSlice = timeSlices[safeFrameIndex] || timeSlices[0] || { label: '', rooms: [] };
    const activeComparisons = eventComparisons.map((event) => ({
        ...event,
        activeSlice: event.timeSlices?.[safeFrameIndex] || event.timeSlices?.[0] || { rooms: [] },
    }));
    const hoveredRoom = useMemo(() => rooms.find((room) => room.id === hoveredRoomId) || null, [rooms, hoveredRoomId]);
    const hoveredReading = hoveredRoom ? roomReadingFor(activeSlice.rooms, hoveredRoom.id) : null;
    const hasComparison = activeComparisons.length > 1;

    useEffect(() => {
        if (!playing || timeSlices.length <= 1) return undefined;
        const timer = window.setInterval(() => {
            setFrameIndex((current) => (current + 1) % timeSlices.length);
        }, 950);
        return () => window.clearInterval(timer);
    }, [playing, timeSlices.length]);

    if (disabledReason) {
        return (
            <div className="dashboard-surface rounded-2xl p-6">
                <p className="text-xs font-black uppercase tracking-widest text-zinc-500">Spatial intelligence paused</p>
                <p className="mt-3 text-lg font-black text-white">Select events from one venue to compare heat signatures.</p>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">{disabledReason}</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-2 rounded-full bg-white/[0.04] p-1">
                    <HeatToggle active={styleMode === 'blob'} onClick={() => setStyleMode('blob')}>Gradient</HeatToggle>
                    <HeatToggle active={styleMode === 'dots'} onClick={() => setStyleMode('dots')}>Pins</HeatToggle>
                </div>
                <div className="flex flex-1 items-center gap-3 md:max-w-xl">
                    <button
                        type="button"
                        onClick={() => setPlaying((value) => !value)}
                        className="rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-widest text-black"
                    >
                        {playing ? 'Pause' : 'Play'}
                    </button>
                    <input
                        type="range"
                        min="0"
                        max={Math.max(timeSlices.length - 1, 0)}
                        value={safeFrameIndex}
                        onChange={(event) => {
                            setPlaying(false);
                            setFrameIndex(Number(event.target.value));
                        }}
                        className="h-1 flex-1 accent-white"
                        aria-label="Heat map time"
                    />
                    <span className="min-w-16 text-right text-xs font-bold text-zinc-300">{activeSlice.label}</span>
                </div>
            </div>

            {hasComparison ? (
                <div className="flex flex-wrap gap-2">
                    {activeComparisons.map((event) => (
                        <span key={event.id} className="inline-flex items-center gap-2 rounded-full bg-white/[0.045] px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-zinc-300">
                            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: event.color }} />
                            {event.name}
                        </span>
                    ))}
                </div>
            ) : null}

            <div className="min-h-[720px] space-y-4">
                <div className="dashboard-surface overflow-hidden rounded-2xl p-3">
                    <svg viewBox="0 0 760 470" role="img" aria-label="Club floor plan heat map" className="h-auto w-full">
                        <defs>
                            <filter id="spatial-soft-blur">
                                <feGaussianBlur stdDeviation="18" />
                            </filter>
                            <linearGradient id="floor-fill" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor="rgba(255,255,255,0.08)" />
                                <stop offset="100%" stopColor="rgba(255,255,255,0.025)" />
                            </linearGradient>
                        </defs>
                        <rect x="16" y="16" width="728" height="438" rx="34" fill="url(#floor-fill)" stroke="rgba(255,255,255,0.14)" />
                        <path d="M238 40h284v390H238z" fill="rgba(255,255,255,0.018)" stroke="rgba(255,255,255,0.07)" strokeDasharray="7 8" />

                        {rooms.map((room) => {
                            const reading = roomReadingFor(activeSlice.rooms, room.id);
                            const selected = hoveredRoomId === room.id;
                            return (
                                <g
                                    key={room.id}
                                    onMouseEnter={() => setHoveredRoomId(room.id)}
                                    onMouseLeave={() => setHoveredRoomId(null)}
                                    tabIndex={0}
                                    onFocus={() => setHoveredRoomId(room.id)}
                                    onBlur={() => setHoveredRoomId(null)}
                                    className="outline-none"
                                >
                                    <rect
                                        x={room.x}
                                        y={room.y}
                                        width={room.w}
                                        height={room.h}
                                        rx="22"
                                        fill={selected ? 'rgba(255,255,255,0.1)' : 'rgba(8,8,10,0.54)'}
                                        stroke={selected ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.16)'}
                                        strokeWidth={selected ? 2 : 1}
                                    />
                                    <text x={room.x + 18} y={room.y + 30} fill="#ffffff" fontSize="16" fontWeight="800">{room.label}</text>
                                    <text x={room.x + 18} y={room.y + 53} fill="#a1a1aa" fontSize="12" fontWeight="700">Hype {reading.score}</text>
                                    {room.kind === 'tables' ? (
                                        <>
                                            {[0, 1, 2, 3].map((table) => (
                                                <circle key={table} cx={room.x + 42 + table * 45} cy={room.y + 50} r="13" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.14)" />
                                            ))}
                                        </>
                                    ) : null}
                                </g>
                            );
                        })}

                        {styleMode === 'blob' ? (
                            <g filter="url(#spatial-soft-blur)" opacity="0.88">
                                {(hasComparison ? activeComparisons : [{ id: 'aggregate', color: '#d84aff', activeSlice }]).flatMap((event, eventIndex) => (
                                    rooms.map((room) => {
                                        const reading = roomReadingFor(event.activeSlice.rooms, room.id);
                                        const center = roomCenter(room);
                                        const offset = hasComparison ? (eventIndex - (activeComparisons.length - 1) / 2) * 9 : 0;
                                        return (
                                            <circle
                                                key={`${event.id}-${room.id}`}
                                                cx={center.x + offset}
                                                cy={center.y + offset * 0.35}
                                                r={32 + reading.intensity * 64}
                                                fill={colorWithAlpha(event.color, hasComparison ? 0.18 + reading.intensity * 0.22 : 0.1 + reading.intensity * 0.46)}
                                            />
                                        );
                                    })
                                ))}
                            </g>
                        ) : (
                            <g>
                                {(hasComparison ? activeComparisons : [{ id: 'aggregate', color: '#f4f4f5', activeSlice }]).flatMap((event, eventIndex) => (
                                    rooms.flatMap((room, roomIndex) => {
                                        const reading = roomReadingFor(event.activeSlice.rooms, room.id);
                                        const center = roomCenter(room);
                                        const count = Math.max(5, Math.round(reading.intensity * (hasComparison ? 8 : 12)));
                                        return Array.from({ length: count }).map((_, dotIndex) => {
                                            const angle = ((dotIndex * 137.5 + roomIndex * 29 + eventIndex * 31) * Math.PI) / 180;
                                            const radius = 10 + ((dotIndex * 17 + eventIndex * 11) % Math.max(room.w, room.h)) * 0.32;
                                            return (
                                                <circle
                                                    key={`${event.id}-${room.id}-${dotIndex}`}
                                                    cx={center.x + Math.cos(angle) * radius}
                                                    cy={center.y + Math.sin(angle) * radius * 0.65}
                                                    r={3 + reading.intensity * 3.2}
                                                    fill={colorWithAlpha(event.color, hasComparison ? 0.45 + reading.intensity * 0.36 : 0.35 + reading.intensity * 0.55)}
                                                />
                                            );
                                        });
                                    })
                                ))}
                            </g>
                        )}
                    </svg>
                </div>

                <aside className="grid min-h-[150px] gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {rooms.map((room) => {
                        const reading = roomReadingFor(activeSlice.rooms, room.id);
                        const faded = Boolean(hoveredRoomId && hoveredRoomId !== room.id);
                        return (
                            <div
                                key={room.id}
                                className={`dashboard-surface rounded-2xl p-4 transition duration-200 ${
                                    hoveredRoomId === room.id ? 'bg-white/[0.095] shadow-[0_18px_36px_rgba(0,0,0,0.34)]' : faded ? 'opacity-35' : 'opacity-100'
                                }`}
                            >
                                <p className="text-sm font-black text-white">{room.label}</p>
                                <div className="mt-3 flex items-end justify-between gap-3">
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Hype Score</p>
                                        <p className="mt-1 text-3xl font-black text-white">{reading.score}</p>
                                    </div>
                                    <p className="rounded-full bg-white/[0.08] px-3 py-1 text-xs font-bold text-zinc-200">{reading.attendees} nearby</p>
                                </div>
                            </div>
                        );
                    })}
                </aside>
            </div>

            {hoveredRoom && hoveredReading ? (
                <div className="dashboard-glow-popover rounded-2xl bg-zinc-950 px-4 py-3 text-sm text-zinc-200">
                    <span className="font-bold text-white">{hoveredRoom.label}</span> at {activeSlice.label}: hype {hoveredReading.score}, {hoveredReading.attendees} nearby.
                </div>
            ) : null}
        </div>
    );
}
