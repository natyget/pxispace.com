'use client';

import { useRef, useState, useEffect, useMemo } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
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

/** One pager dot — grows toward the active width as the drag commits toward it. */
function SeasonDot({ year, isActive, isNeighborNext, isNeighborPrev, dragProgress, onSelect }) {
    const width = useTransform(dragProgress, (p) => {
        const towardNeighbor = (isNeighborNext && p > 0) || (isNeighborPrev && p < 0);
        const t = Math.min(1, Math.abs(p));
        if (isActive) return 18 - t * 12;
        if (towardNeighbor) return 6 + t * 12;
        return 6;
    });
    const opacity = useTransform(dragProgress, (p) => {
        const towardNeighbor = (isNeighborNext && p > 0) || (isNeighborPrev && p < 0);
        const t = Math.min(1, Math.abs(p));
        if (isActive) return 1 - t * 0.65;
        if (towardNeighbor) return 0.35 + t * 0.65;
        return 0.35;
    });

    return (
        <button
            type="button"
            onClick={onSelect}
            className="flex items-center gap-1 px-0.5 py-1"
            aria-label={`Season ${year}`}
            aria-pressed={isActive}
        >
            <motion.span
                className="block rounded-full"
                style={{ height: 6, width, opacity, backgroundColor: '#d84aff' }}
            />
            {isActive ? <span className="text-[10px] font-extrabold tracking-wide text-[#d84aff]">{year}</span> : null}
        </button>
    );
}

const SWIPE_TRIGGER_DX = 64;
const SWIPE_TRIGGER_VELOCITY = 700;

/**
 * Sole passport stamp UI on web — keep logic in sync with mobile `PassportStampsLayer.tsx`.
 * Used by dashboard passport and public profile preview.
 *
 * Live, finger/pointer-tracked season pager: pass `dragX` (a framer-motion
 * MotionValue) down from the parent so the map background can translate in
 * lockstep (design law: only the passport top half moves with the gesture).
 * If the parent doesn't own the drag, this component drives its own via the
 * `drag` prop on its root.
 */
export function PassportStampsLayer({
    events,
    availableYears,
    selectedSeason,
    onSelectSeason,
    seasonPillsPointerEvents = true,
    dragX: dragXProp,
    onDragStateChange,
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

    const internalDragX = useMotionValue(0);
    const dragX = dragXProp ?? internalDragX;
    // Live 0..1 progress toward next(-)/prev(+) season, derived straight from
    // the shared drag position — single source of truth for the pager dots.
    const dragProgress = useTransform(dragX, (v) => {
        const pageWidth = Math.max(1, stampArea.width);
        return Math.max(-1, Math.min(1, -v / pageWidth));
    });

    const seasonIndex = availableYears.indexOf(selectedSeason);
    const canGoNext = seasonIndex >= 0 && seasonIndex < availableYears.length - 1;
    const canGoPrev = seasonIndex > 0;

    const handleDragEnd = (_e, info) => {
        const wantsNext = (info.offset.x < -SWIPE_TRIGGER_DX || info.velocity.x < -SWIPE_TRIGGER_VELOCITY) && canGoNext;
        const wantsPrev = (info.offset.x > SWIPE_TRIGGER_DX || info.velocity.x > SWIPE_TRIGGER_VELOCITY) && canGoPrev;
        if (wantsNext) {
            onSelectSeason(availableYears[seasonIndex + 1]);
        } else if (wantsPrev) {
            onSelectSeason(availableYears[seasonIndex - 1]);
        }
        onDragStateChange?.(false);
    };

    const dragProps = {
        drag: 'x',
        dragElastic: 0.6,
        dragConstraints: { left: 0, right: 0 },
        dragMomentum: false,
        onDragStart: () => onDragStateChange?.(true),
        onDragEnd: handleDragEnd,
        style: { x: dragX },
    };

    return (
        <div ref={containerRef} className="absolute inset-0 overflow-hidden">
            {availableYears.length > 1 && (
                <div
                    className={`absolute left-0 right-0 top-1 z-10 flex justify-center items-center gap-1.5 px-2 ${
                        seasonPillsPointerEvents ? 'pointer-events-auto' : 'pointer-events-none'
                    }`}
                >
                    {availableYears.map((year, i) => (
                        <SeasonDot
                            key={year}
                            year={year}
                            isActive={selectedSeason === year}
                            isNeighborNext={i === seasonIndex + 1}
                            isNeighborPrev={i === seasonIndex - 1}
                            dragProgress={dragProgress}
                            onSelect={() => onSelectSeason(year)}
                        />
                    ))}
                </div>
            )}

            <motion.div className="absolute inset-0" {...dragProps}>
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
                            className="absolute opacity-[0.98]"
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
                                seed={event.id}
                            />
                        </div>
                    );
                })}
            </motion.div>

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
