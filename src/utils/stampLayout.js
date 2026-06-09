export const STAMP_SHAPES = [
    'HEXAGON',
    'RECTANGLE',
    'CIRCLE',
    'OVAL',
    'TRIANGLE',
    'DIAMOND',
    'STAR',
    'SHIELD',
    'ARCH',
    'POSTMARK',
];

export const STAMP_VIEWBOX = {
    HEXAGON:   { w: 100, h: 100 },
    CIRCLE:    { w: 100, h: 100 },
    TRIANGLE:  { w: 100, h: 100 },
    DIAMOND:   { w: 100, h: 100 },
    STAR:      { w: 100, h: 100 },
    ARCH:      { w: 100, h: 100 },
    POSTMARK:  { w: 100, h: 100 },
    SHIELD:    { w: 100, h: 120 },
    RECTANGLE: { w: 100, h: 60 },
    OVAL:      { w: 100, h: 60 },
};

/** Inner stamp fill (0 = transparent; strokes/text use full tier color). */
export const STAMP_SHAPE_FILL_OPACITY = 0;

/** SVG text sizes in stamp viewBox units (100×100 or 100×60). */
export const STAMP_FONT = {
    name: 11,
    nameCompact: 10,
    nameStar: 9,
    nameWide: 12,
    date: 8,
    dateCompact: 7,
    city: 7,
    cityCompact: 6,
};

export const STAMP_TIER_COLORS = {
    WANDERER:   '#F59E0B',
    SEEKER:     '#3B82F6',
    VOYAGER:    '#10B981',
    PATHFINDER: '#F97316',
    LUMINARY:   '#F59E0B',
    ODYSSEY:    '#E5E7EB',
};

export const STAMP_DIMENSIONS = {
    HEXAGON:   { w: 90, h: 90 },
    RECTANGLE: { w: 108, h: 65 },
    CIRCLE:    { w: 88, h: 88 },
    OVAL:      { w: 106, h: 64 },
    TRIANGLE:  { w: 90, h: 90 },
    DIAMOND:   { w: 90, h: 90 },
    STAR:      { w: 92, h: 92 },
    SHIELD:    { w: 86, h: 104 },
    ARCH:      { w: 90, h: 90 },
    POSTMARK:  { w: 88, h: 88 },
};

export function getStampViewBox(shape) {
    return STAMP_VIEWBOX[shape];
}

/** Max full SVG stamps rendered per season (rest shown as +N pill, bottom-right). */
export const MAX_VISIBLE_PASSPORT_STAMPS = 20;

/** Floor scale for very dense seasons (30+). */
export const MIN_STAMP_SCALE = 0.28;

/** @deprecated Use getStampScaleForCount — kept for tests. */
export const STAMP_VISUAL_SCALE = 0.42;

/** Best-candidate samples per stamp (studio uses 300). */
export const STAMP_BEST_CANDIDATE_ATTEMPTS = 300;

export const STAMP_MAX_LAYOUT_SCALE = 1.06;

/** Subtle bump applied to all stamp layout scales (keep in sync with mobile stampLayout.ts). */
export const STAMP_LAYOUT_SIZE_FACTOR = 0.94;

export const DEFAULT_STAMP_LAYOUT_AREA = {
    width: 330,
    height: 245,
    yearRowHeight: 26,
};

function seededHash(id, salt) {
    let h = (salt * 2654435761) >>> 0;
    for (let i = 0; i < id.length; i++) {
        h = ((h ^ id.charCodeAt(i)) >>> 0);
        h = (Math.imul(h, 2654435761)) >>> 0;
    }
    return h / 0x100000000;
}

function xpToTierId(xp) {
    if (xp <= 500)   return 'WANDERER';
    if (xp <= 2500)  return 'SEEKER';
    if (xp <= 7000)  return 'VOYAGER';
    if (xp <= 15000) return 'PATHFINDER';
    if (xp <= 30000) return 'LUMINARY';
    return 'ODYSSEY';
}

export function getStampColor(xp, fallbackTierId) {
    const tierId = xp != null ? xpToTierId(Math.max(0, Math.floor(xp))) : fallbackTierId;
    return STAMP_TIER_COLORS[tierId] ?? '#B026FF';
}

/** Stable shape from event id alone (single-stamp / legacy callers). */
export function getStampShape(eventId) {
    return STAMP_SHAPES[Math.floor(seededHash(eventId, 7) * STAMP_SHAPES.length)];
}

/**
 * Assign shapes for all stamps on one passport spread.
 * When count ≤ 10, each stamp gets a unique shape; otherwise shapes cycle by slot
 * so neighbors differ even when ids hash to the same bucket.
 */
export function assignDiverseStampShapes(eventIds) {
    const map = new Map();
    const used = new Set();
    const preferUnique = eventIds.length <= STAMP_SHAPES.length;

    for (let i = 0; i < eventIds.length; i++) {
        const id = eventIds[i];
        const preferred = Math.floor(seededHash(id, 7) * STAMP_SHAPES.length);
        let idx = (preferred + i * 3) % STAMP_SHAPES.length;
        let shape = STAMP_SHAPES[idx];

        if (preferUnique) {
            if (used.has(shape)) {
                for (let off = 0; off < STAMP_SHAPES.length; off++) {
                    const candidate = STAMP_SHAPES[(idx + off) % STAMP_SHAPES.length];
                    if (!used.has(candidate)) {
                        shape = candidate;
                        break;
                    }
                }
            }
            used.add(shape);
        }

        map.set(id, shape);
    }

    return map;
}

function clamp(v, min, max) {
    return Math.min(max, Math.max(min, v));
}

function maxScaleForPassport(base, area) {
    const yearRow = area.yearRowHeight ?? 0;
    const inset = 4;
    const byW = (area.width - inset * 2) / base.w;
    const byH = (area.height - yearRow - inset * 2) / base.h;
    return Math.min(byW, byH, STAMP_MAX_LAYOUT_SCALE);
}

/**
 * Scale stamp to fill the passport map area based on count (fewer → larger, more → smaller).
 * Uses canvas area × fill factor / count, with overlap-friendly boost.
 */
export function getStampScaleForCount(count, base, area) {
    const c = Math.max(1, Math.floor(count));
    const yearRow = area.yearRowHeight ?? 0;
    const pad = c <= 8 ? 14 : c <= 16 ? 11 : c <= 24 ? 9 : 7;
    const availW = Math.max(1, area.width - pad * 2);
    const availH = Math.max(1, area.height - yearRow - pad * 2);

    // Power curve: ~6 stamps = “comfortable fill”, 30+ = dense pack
    const fillFactor = clamp(0.34 + 0.54 * Math.pow(6 / c, 0.42), 0.4, 0.9);

    const targetPerStampArea = (availW * availH * fillFactor) / c;
    const baseArea = base.w * base.h;
    let scale = Math.sqrt(targetPerStampArea / baseArea) * 1.04 * STAMP_LAYOUT_SIZE_FACTOR;

    const minScale =
        c <= 4 ? 0.54 : c <= 8 ? 0.46 : c <= 14 ? 0.38 : c <= 22 ? 0.33 : MIN_STAMP_SCALE;

    return clamp(scale, minScale, maxScaleForPassport(base, area));
}

export function getStampSize(
    eventId,
    totalCount,
    area,
    shapeOverride,
) {
    const count = Math.max(1, totalCount);
    const shape = shapeOverride ?? getStampShape(eventId);
    const base = STAMP_DIMENSIONS[shape];
    const scale = getStampScaleForCount(count, base, area);
    return {
        w: Math.round(base.w * scale),
        h: Math.round(base.h * scale),
        shape,
    };
}

const LOW_ROTATION_SHAPES = ['RECTANGLE', 'OVAL', 'ARCH'];

/** Rotation bands — passport-stamp-studio shape categories. */
export function getStampRotationDeg(eventId, shape) {
    const t = seededHash(eventId, 3);
    if (LOW_ROTATION_SHAPES.includes(shape)) {
        return Math.round((t - 0.5) * 20);
    }
    return Math.round((t - 0.5) * 60);
}

/** Keep axis-aligned stamp box inside passport; extra inset for rotation. */
export function clampStampPosition(params) {
    const { centerX, centerY, w, h, rotationDeg, area } = params;
    const yearRow = area.yearRowHeight ?? 0;
    const inset = Math.ceil(Math.max(w, h) * (0.06 + Math.abs(rotationDeg) / 200));

    const minLeft = inset;
    const maxLeft = area.width - w - inset;
    const minTop = yearRow + inset;
    const maxTop = area.height - h - inset;

    let left = Math.round(centerX - w / 2);
    let top = Math.round(centerY - h / 2);

    if (maxLeft >= minLeft) {
        left = clamp(left, minLeft, maxLeft);
    } else {
        left = Math.round((area.width - w) / 2);
    }

    if (maxTop >= minTop) {
        top = clamp(top, minTop, maxTop);
    } else {
        top = Math.round(yearRow + (area.height - yearRow - h) / 2);
    }

    left = clamp(left, 0, Math.max(0, area.width - w));
    top = clamp(top, yearRow, Math.max(yearRow, area.height - h));

    return { left, top };
}

function placementBounds(w, h, area) {
    const yearRow = area.yearRowHeight ?? 0;
    const pad = 8;
    const radiusX = w / 2 + pad;
    const radiusY = h / 2 + pad;
    const minCX = radiusX;
    const maxCX = Math.max(minCX, area.width - radiusX);
    const minCY = yearRow + radiusY;
    const maxCY = Math.max(minCY, area.height - radiusY);
    return { minCX, maxCX, minCY, maxCY };
}

function seededAttemptUnit(
    eventId,
    slotIndex,
    attempt,
    salt,
) {
    return seededHash(`${eventId}#${slotIndex}#${attempt}`, salt);
}

/**
 * Best-candidate center (passport-stamp-studio Poisson-disk approximation).
 * Picks the random center farthest from existing stamps; allows overlap when crowded.
 */
export function findBestCandidateCenter(eventId, slotIndex, w, h, placed, area) {
    const { minCX, maxCX, minCY, maxCY } = placementBounds(w, h, area);

    if (placed.length === 0) {
        return {
            cx: minCX + seededHash(eventId, 11) * (maxCX - minCX),
            cy: minCY + seededHash(eventId, 12) * (maxCY - minCY),
        };
    }

    let bestCX =
        minCX + seededAttemptUnit(eventId, slotIndex, 0, 1) * (maxCX - minCX);
    let bestCY =
        minCY + seededAttemptUnit(eventId, slotIndex, 0, 2) * (maxCY - minCY);
    let maxMinDist = -1;

    for (let i = 0; i < STAMP_BEST_CANDIDATE_ATTEMPTS; i++) {
        const testCX =
            minCX + seededAttemptUnit(eventId, slotIndex, i, 1) * (maxCX - minCX);
        const testCY =
            minCY + seededAttemptUnit(eventId, slotIndex, i, 2) * (maxCY - minCY);

        let minDist = Infinity;
        for (const p of placed) {
            const dx = testCX - p.cx;
            const dy = testCY - p.cy;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < minDist) minDist = dist;
        }

        if (minDist > maxMinDist) {
            maxMinDist = minDist;
            bestCX = testCX;
            bestCY = testCY;
        }
    }

    return { cx: bestCX, cy: bestCY };
}

function buildPassportStampLayoutBundle(
    eventIds,
    area,
) {
    const layouts = new Map();
    const shapes = assignDiverseStampShapes(eventIds);
    const count = eventIds.length;
    if (count === 0) {
        return { layouts, shapes };
    }

    const placed = [];

    eventIds.forEach((eventId, slotIndex) => {
        const shape = shapes.get(eventId);
        const { w, h } = getStampSize(eventId, count, area, shape);
        const rotation = getStampRotationDeg(eventId, shape);
        const { cx, cy } = findBestCandidateCenter(
            eventId,
            slotIndex,
            w,
            h,
            placed,
            area,
        );

        placed.push({ cx, cy, w, h });

        const { left, top } = clampStampPosition({
            centerX: cx,
            centerY: cy,
            w,
            h,
            rotationDeg: rotation,
            area,
        });

        layouts.set(eventId, { left, top, rotation, width: w, height: h });
    });

    return { layouts, shapes };
}

/** Layout + per-event shapes for one passport spread. */
export function computePassportStampBundle(
    eventIds,
    area = DEFAULT_STAMP_LAYOUT_AREA,
) {
    return buildPassportStampLayoutBundle(eventIds, area);
}

/**
 * Layout all stamps in stable order using studio-style best-candidate placement.
 */
export function computeStampLayouts(
    eventIds,
    area = DEFAULT_STAMP_LAYOUT_AREA,
) {
    return buildPassportStampLayoutBundle(eventIds, area).layouts;
}

/** Single-stamp helper — pass full `eventIds` in display order when batching. */
export function getStampLayout(
    eventId,
    slotIndex,
    totalCount = 6,
    area = DEFAULT_STAMP_LAYOUT_AREA,
    eventIdsInOrder,
) {
    const ids =
        eventIdsInOrder ??
        Array.from({ length: Math.max(1, totalCount) }, (_, i) => `__passport_slot_${i}`);
    const map = computeStampLayouts(ids, area);
    const key = ids[slotIndex] ?? eventId;
    return (
        map.get(key) ??
        map.get(eventId) ??
        computeStampLayouts([eventId], area).get(eventId)
    );
}

export function formatStampName(name) {
    return name.toUpperCase().slice(0, 11);
}

export function formatStampDate(startDate) {
    try {
        const d = new Date(startDate);
        if (isNaN(d.getTime())) return '';
        return d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase() + ' ' + d.getFullYear();
    } catch { return ''; }
}

export function formatStampCity(location) {
    if (!location) return '';
    return String(location).split(',')[0].toUpperCase().slice(0, 10);
}

export function getEventYear(startDate) {
    try {
        const y = new Date(startDate).getFullYear();
        return isNaN(y) ? new Date().getFullYear() : y;
    } catch { return new Date().getFullYear(); }
}
