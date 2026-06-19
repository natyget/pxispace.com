'use client';

import { useRef, useState, useEffect, useMemo } from 'react';
import {
    computePassportStampBundle,
    getStampTypeForEvent,
    getStampColor,
    formatStampName,
    formatStampDate,
    formatStampCity,
    formatStampRole,
    DEFAULT_STAMP_LAYOUT_AREA,
    MAX_VISIBLE_PASSPORT_STAMPS,
} from '@/utils/stampLayout';
import { StampShapeGraphic } from './StampShapeGraphic';

/**
 * Sole passport stamp UI on web — keep logic in sync with mobile `PassportStampsLayer.tsx`.
 * Used by dashboard passport and public profile preview.
 */
export function PassportStampsLayer({
    events,
    availableYears,
    selectedSeason,
    onSelectSeason,
    seasonPillsPointerEvents = true,
}) {
    const containerRef = useRef(null);
    const [stampArea, setStampArea] = useState(() => ({
        width: DEFAULT_STAMP_LAYOUT_AREA.width,
        height: DEFAULT_STAMP_LAYOUT_AREA.height,
    }));

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const update = () => {
            const { width, height } = el.getBoundingClientRect();
            setStampArea({
                width: Math.max(1, Math.round(width)),
                height: Math.max(1, Math.round(height)),
            });
        };

        update();
        const ro = new ResizeObserver(update);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    const stampYearRowHeight = availableYears.length > 1 ? 26 : 0;

    const stampLayoutArea = useMemo(
        () => ({
            width: stampArea.width,
            height: stampArea.height,
            yearRowHeight: stampYearRowHeight,
        }),
        [stampArea.width, stampArea.height, stampYearRowHeight],
    );

    const visibleStamps = useMemo(
        () => events.slice(0, MAX_VISIBLE_PASSPORT_STAMPS),
        [events],
    );

    const stampOverflowCount = Math.max(0, events.length - visibleStamps.length);

    const { layouts: stampLayoutsByEventId, shapes: stampShapesByEventId } = useMemo(
        () => computePassportStampBundle(visibleStamps, stampLayoutArea),
        [visibleStamps, stampLayoutArea],
    );

    return (
        <div ref={containerRef} className="absolute inset-0 overflow-hidden">
            {availableYears.length > 1 && (
                <div
                    className={`absolute left-0 right-0 top-2 z-10 flex justify-center gap-1.5 px-2 ${
                        seasonPillsPointerEvents ? 'pointer-events-auto' : 'pointer-events-none'
                    }`}
                >
                    {availableYears.map((year) => (
                        <button
                            key={year}
                            type="button"
                            onClick={() => onSelectSeason(year)}
                            className={`rounded-full border px-2 py-0.5 text-[9px] font-bold tracking-wider transition-all ${
                                year === selectedSeason
                                    ? 'border-white/60 bg-white/20 text-white'
                                    : 'border-white/20 bg-black/30 text-white/50 hover:bg-white/10'
                            }`}
                        >
                            {year}
                        </button>
                    ))}
                </div>
            )}

            {visibleStamps.map((event, index) => {
                const shape =
                    stampShapesByEventId.get(event.id) ??
                    getStampTypeForEvent(event.ticketPriceUsd ?? 0, event.albumRole);
                const layout = stampLayoutsByEventId.get(event.id);
                if (!layout) return null;
                const color = getStampColor(event.xp);

                return (
                    <div
                        key={event.id}
                        className="absolute opacity-[0.85]"
                        style={{
                            left: layout.left,
                            top: layout.top,
                            width: layout.width,
                            height: layout.height,
                            transform: `rotate(${layout.rotation}deg)`,
                            zIndex: index + 1,
                            pointerEvents: 'none',
                            filter: `drop-shadow(0 0 6px ${color})`,
                        }}
                    >
                        <StampShapeGraphic
                            shape={shape}
                            color={color}
                            name={formatStampName(event.name)}
                            date={formatStampDate(event.startDate)}
                            city={formatStampCity(event.location)}
                            role={formatStampRole(event.albumRole)}
                        />
                    </div>
                );
            })}

            {stampOverflowCount > 0 ? (
                <div
                    className="pointer-events-none absolute bottom-2 right-2.5 z-20 rounded-full border border-white/25 bg-black/65 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-white/85"
                    aria-label={`${stampOverflowCount} more events`}
                >
                    +{stampOverflowCount}
                </div>
            ) : null}
        </div>
    );
}
