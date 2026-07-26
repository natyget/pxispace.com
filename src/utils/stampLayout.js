/** @typedef {'square-border'|'circle-exit'|'diamond-pass'|'hexagon-pass'|'oval-entry'|'arch-gate'|'star-burst'|'shield-crest'|'visa-sticker'|'barcode-label'|'wax-seal'|'hologram-ticket'} StampType */
/** @typedef {1|2|3|4} StampLevel */
/** @typedef {'staff'|'member'|'owner'} StampRoleSlot */

/** Passport stamp template ids — aligned with passport-stamp-studio `StampType`. */
export const STAMP_TYPES = [
    'square-border',
    'circle-exit',
    'diamond-pass',
    'hexagon-pass',
    'oval-entry',
    'arch-gate',
    'star-burst',
    'shield-crest',
    'visa-sticker',
    'barcode-label',
    'wax-seal',
    'hologram-ticket',
];

/** @deprecated Use STAMP_TYPES */
export const STAMP_SHAPES = STAMP_TYPES;

/**
 * Per-level templates ordered [staff, member, owner] — least to most ornate.
 * Level from ticket price; slot from album role.
 */
export const STAMP_TYPES_BY_LEVEL = {
    1: ['square-border', 'circle-exit', 'diamond-pass'],
    2: ['hexagon-pass', 'oval-entry', 'arch-gate'],
    3: ['star-burst', 'shield-crest', 'visa-sticker'],
    4: ['barcode-label', 'wax-seal', 'hologram-ticket'],
};

const STAMP_SLOT_INDEX = {
    staff: 0,
    member: 1,
    owner: 2,
};

export const STAMP_VIEWBOX = {
    'square-border':   { w: 100, h: 100 },
    'circle-exit':     { w: 100, h: 100 },
    'diamond-pass':    { w: 100, h: 100 },
    'hexagon-pass':    { w: 100, h: 100 },
    'oval-entry':      { w: 100, h: 60 },
    'arch-gate':       { w: 100, h: 120 },
    'star-burst':      { w: 100, h: 100 },
    'shield-crest':    { w: 100, h: 120 },
    'visa-sticker':    { w: 100, h: 62 },
    'barcode-label':   { w: 100, h: 100 },
    'wax-seal':        { w: 100, h: 100 },
    'hologram-ticket': { w: 100, h: 56 },
};

/** Inner stamp fill (0 = transparent; strokes/text use full tier color). */
export const STAMP_SHAPE_FILL_OPACITY = 0;

/** SVG text sizes in stamp viewBox units. */
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

// Synced with mobile's corrected STAMP_TIER_COLORS (was mismatched from mobile
// entirely, and LUMINARY/WANDERER collided on the same hex — two tiers reading
// identically). WANDERER is pxiPurple: measured 2.4:1 against the passport map
// as the old #B026FF-family purple; pxiPurple clears 3.3:1.
export const STAMP_TIER_COLORS = {
    WANDERER:   '#d84aff',
    SEEKER:     '#60A5FA',
    VOYAGER:    '#34D399',
    PATHFINDER: '#FB923C',
    LUMINARY:   '#FCD34D',
    ODYSSEY:    '#E5E7EB',
};

export const STAMP_DIMENSIONS = {
    'square-border':   { w: 76, h: 76 },
    'circle-exit':     { w: 80, h: 80 },
    'diamond-pass':    { w: 98, h: 98 },
    'hexagon-pass':    { w: 90, h: 90 },
    'oval-entry':      { w: 106, h: 64 },
    'arch-gate':       { w: 86, h: 104 },
    'star-burst':      { w: 92, h: 92 },
    'shield-crest':    { w: 86, h: 104 },
    'visa-sticker':    { w: 110, h: 68 },
    'barcode-label':   { w: 80, h: 80 },
    'wax-seal':        { w: 80, h: 80 },
    'hologram-ticket': { w: 112, h: 63 },
};

export function getStampViewBox(shape) {
    return STAMP_VIEWBOX[shape];
}

/** Max full SVG stamps rendered per season (rest shown as +N pill, bottom-right). */
export const MAX_VISIBLE_PASSPORT_STAMPS = 14;

/** Floor scale for very dense seasons (30+). Raised so worn-ink texture + arc text stay legible. */
export const MIN_STAMP_SCALE = 0.36;

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

/** Level 1 staff (square-border) — thinner frame, more room for copy. */
export const SQUARE_BORDER_RECT = { x: 8, y: 8, w: 84, h: 84 };
export const SQUARE_BORDER_STROKE = 3;

/** Level 3 staff (star-burst) — outer tips at R=46; valleys at R=31. */
export const STAR_BURST_PATH =
    'M50 4 L68 25 L94 36 L80 60 L77 87 L50 81 L23 87 L21 60 L6 36 L32 25 Z';
export const STAR_BURST_INNER_CIRCLE = { cx: 50, cy: 46, r: 22 };

/** Level 4 staff (barcode-label) — square label with rounded corners. */
export const BARCODE_LABEL_BORDER_RX = 5;
export const BARCODE_LABEL_LINE_GAP = 10;
export const BARCODE_LABEL_TEXT_START = 38;
export const BARCODE_LABEL_SIGNATURE_POS = {
    topLeft: { x: 5, y: 6 },
    bottomRight: { x: 80, y: 82 },
};

export const ARCH_GATE_OUTER_PATH = 'M6 50 Q50 8 94 50 V118 H6 Z';
export const ARCH_GATE_INNER_PATH = 'M12 54 Q50 16 88 54 V113 H12 Z';

/** Level 1 member (outline) & level 4 member (filled) — shared circle geometry. */
export const CIRCLE_MEMBER_STAMP = { cx: 50, cy: 50, rOuter: 46, rInner: 38 };
export const CIRCLE_MEMBER_TEXT_START = 34;
export const CIRCLE_MEMBER_TEXT_AVAIL = 44;
/** Ink on filled wax-seal (level 4 member). */
export const WAX_SEAL_INK = 'rgba(0,0,0,0.55)';

/** Line spacing for oval-entry (level 2 member). */
export const OVAL_ENTRY_LINE_GAP = 10;

export const VISA_STICKER_PAD_X = 8;
export const VISA_STICKER_LINE_GAP = 10;

/** Wider line spacing for hologram-ticket (level 4 owner). */
export const HOLOGRAM_TICKET_LINE_GAP = 11;

function seededHash(id, salt) {
    let h = (salt * 2654435761) >>> 0;
    for (let i = 0; i < id.length; i++) {
        h = ((h ^ id.charCodeAt(i)) >>> 0);
        h = (Math.imul(h, 2654435761)) >>> 0;
    }
    return h / 0x100000000;
}

/**
 * Stamp tier from XP earned *at a single event* — deliberately NOT the lifetime bands in
 * `odysseyTier.js`. A stamp answers "how hard did you go that night", so it tops out at
 * roughly one legendary night, where the lifetime ladder tops out at a year of them.
 * Mirror any change in pxi-mobile-app/src/utils/stampLayout.ts.
 */
function xpToTierId(xp) {
    if (xp <= 250)  return 'WANDERER';
    if (xp <= 700)  return 'SEEKER';
    if (xp <= 1500) return 'VOYAGER';
    if (xp <= 3000) return 'PATHFINDER';
    if (xp <= 6000) return 'LUMINARY';
    return 'ODYSSEY';
}

/** Stamp color from per-event Odyssey XP (missing XP treated as 0 → WANDERER amber). */
export function getStampColor(xp) {
    const score = xp == null ? 0 : Math.max(0, Math.floor(xp));
    const tierId = xpToTierId(score);
    return STAMP_TIER_COLORS[tierId] ?? '#B026FF';
}

/** Map album RBAC role → stamp template slot within a price level. */
export function albumRoleToStampSlot(albumRole) {
    const role = String(albumRole || 'MEMBER').toUpperCase();
    if (role === 'OWNER' || role === 'ADMIN') return 'owner';
    if (role === 'MEMBER') return 'member';
    return 'staff';
}

/** Map ticket face price (USD) to stamp prestige level. */
export function getStampLevel(ticketPriceUsd) {
    const price = Math.max(0, ticketPriceUsd);
    if (price <= 0) return 1;
    if (price <= 50) return 2;
    if (price <= 100) return 3;
    return 4;
}

/** Stamp template from ticket price level + album role. */
export function getStampTypeForEvent(ticketPriceUsd, albumRole) {
    const pool = STAMP_TYPES_BY_LEVEL[getStampLevel(ticketPriceUsd)];
    const slot = albumRoleToStampSlot(albumRole);
    return pool[STAMP_SLOT_INDEX[slot]];
}

/** @deprecated Use getStampTypeForEvent */
export function getStampShape(_eventId, ticketPriceUsd = 0, albumRole) {
    return getStampTypeForEvent(ticketPriceUsd, albumRole);
}

/** Assign stamp templates from ticket price + role per event. */
export function assignStampTypes(events) {
    const map = new Map();
    for (const e of events) {
        map.set(e.id, getStampTypeForEvent(e.ticketPriceUsd ?? 0, e.albumRole));
    }
    return map;
}

/** @deprecated Use assignStampTypes */
export function assignDiverseStampShapes(eventIdsOrEvents) {
    if (eventIdsOrEvents.length === 0) return new Map();
    const first = eventIdsOrEvents[0];
    if (typeof first === 'string') {
        return assignStampTypes(
            eventIdsOrEvents.map((id) => ({
                id,
                ticketPriceUsd: 0,
                albumRole: 'MEMBER',
            })),
        );
    }
    return assignStampTypes(eventIdsOrEvents);
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

export function getStampScaleForCount(count, base, area) {
    const c = Math.max(1, Math.floor(count));
    const yearRow = area.yearRowHeight ?? 0;
    const pad = c <= 8 ? 14 : c <= 16 ? 11 : c <= 24 ? 9 : 7;
    const availW = Math.max(1, area.width - pad * 2);
    const availH = Math.max(1, area.height - yearRow - pad * 2);

    const fillFactor = clamp(0.34 + 0.54 * Math.pow(6 / c, 0.42), 0.4, 0.9);

    const targetPerStampArea = (availW * availH * fillFactor) / c;
    const baseArea = base.w * base.h;
    let scale = Math.sqrt(targetPerStampArea / baseArea) * 1.04 * STAMP_LAYOUT_SIZE_FACTOR;

    const minScale =
        c <= 4 ? 0.6 : c <= 8 ? 0.52 : c <= 14 ? 0.44 : c <= 22 ? 0.4 : MIN_STAMP_SCALE;

    return clamp(scale, minScale, maxScaleForPassport(base, area));
}

export function getStampSize(
    eventId,
    totalCount,
    area,
    shapeOverride,
    ticketPriceUsd = 0,
    albumRole,
) {
    const count = Math.max(1, totalCount);
    const shape = shapeOverride ?? getStampTypeForEvent(ticketPriceUsd, albumRole);
    const base = STAMP_DIMENSIONS[shape];
    const scale = getStampScaleForCount(count, base, area);
    return {
        w: Math.round(base.w * scale),
        h: Math.round(base.h * scale),
        shape,
    };
}

const LOW_ROTATION_TYPES = [
    'oval-entry',
    'barcode-label',
    'hologram-ticket',
    'visa-sticker',
];

export function getStampRotationDeg(eventId, shape) {
    const t = seededHash(eventId, 3);
    if (LOW_ROTATION_TYPES.includes(shape)) {
        return Math.round((t - 0.5) * 20);
    }
    return Math.round((t - 0.5) * 60);
}

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
    // Reduced overlap allowance — more breathing room between stamps so the
    // new arc text / grunge texture doesn't collide with a neighbor's ring.
    const pad = 13;
    const radiusX = w / 2 + pad;
    const radiusY = h / 2 + pad;
    const minCX = radiusX;
    const maxCX = Math.max(minCX, area.width - radiusX);
    const minCY = yearRow + radiusY;
    const maxCY = Math.max(minCY, area.height - radiusY);
    return { minCX, maxCX, minCY, maxCY };
}

function seededAttemptUnit(eventId, slotIndex, attempt, salt) {
    return seededHash(`${eventId}#${slotIndex}#${attempt}`, salt);
}

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

function toStampEvents(eventsOrIds) {
    if (eventsOrIds.length === 0) return [];
    const first = eventsOrIds[0];
    if (typeof first === 'string') {
        return eventsOrIds.map((id) => ({
            id,
            ticketPriceUsd: 0,
            albumRole: 'MEMBER',
        }));
    }
    return eventsOrIds;
}

function buildPassportStampLayoutBundle(eventsOrIds, area) {
    const events = toStampEvents(eventsOrIds);
    const layouts = new Map();
    const shapes = assignStampTypes(events);
    const count = events.length;
    if (count === 0) {
        return { layouts, shapes };
    }

    const placed = [];

    events.forEach((event, slotIndex) => {
        const shape = shapes.get(event.id);
        const { w, h } = getStampSize(
            event.id,
            count,
            area,
            shape,
            event.ticketPriceUsd ?? 0,
            event.albumRole,
        );
        const rotation = getStampRotationDeg(event.id, shape);
        const { cx, cy } = findBestCandidateCenter(
            event.id,
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

        layouts.set(event.id, { left, top, rotation, width: w, height: h });
    });

    return { layouts, shapes };
}

export function computePassportStampBundle(
    eventsOrIds,
    area = DEFAULT_STAMP_LAYOUT_AREA,
) {
    return buildPassportStampLayoutBundle(eventsOrIds, area);
}

export function computeStampLayouts(
    eventsOrIds,
    area = DEFAULT_STAMP_LAYOUT_AREA,
) {
    return buildPassportStampLayoutBundle(eventsOrIds, area).layouts;
}

export function getStampLayout(
    eventId,
    slotIndex,
    totalCount = 6,
    area = DEFAULT_STAMP_LAYOUT_AREA,
    eventIdsInOrder,
    ticketPriceUsd = 0,
) {
    const ids =
        eventIdsInOrder ??
        Array.from({ length: Math.max(1, totalCount) }, (_, i) => `__passport_slot_${i}`);
    const events = ids.map((id) => ({
        id,
        ticketPriceUsd: id === eventId ? ticketPriceUsd : 0,
    }));
    const map = computeStampLayouts(events, area);
    const key = ids[slotIndex] ?? eventId;
    return (
        map.get(key) ??
        map.get(eventId) ??
        computeStampLayouts([{ id: eventId, ticketPriceUsd }], area).get(eventId)
    );
}

/**
 * Generous safety cap only — real text fitting now happens by measured pixel
 * width in the renderer (see `maxTextWidthAt`), not by guessing a char count.
 */
export function formatStampName(name) {
    return name.toUpperCase().slice(0, 24);
}

/**
 * Approximate available width (in the shape's own viewBox units, see
 * `STAMP_VIEWBOX`) for a text row drawn at `y`, based on each stamp
 * template's inner boundary. The renderer measures actual glyph width against
 * this to shrink-to-fit (and, as a last resort, truncate with an ellipsis)
 * instead of letting long names spill past the ink outline. Kept in sync
 * with mobile's `stampLayout.ts`.
 */
export function maxTextWidthAt(shape, y) {
    const PAD = 8;
    switch (shape) {
        case 'square-border': {
            const { w } = SQUARE_BORDER_RECT;
            return Math.max(10, w - PAD);
        }
        case 'circle-exit': {
            const { cy, rInner } = CIRCLE_MEMBER_STAMP;
            const dy = y - cy;
            const r2 = rInner * rInner - dy * dy;
            return Math.max(10, 2 * Math.sqrt(Math.max(0, r2)) - PAD);
        }
        case 'wax-seal': {
            const { cy, rOuter } = CIRCLE_MEMBER_STAMP;
            const dy = y - cy;
            const r2 = rOuter * rOuter - dy * dy;
            return Math.max(10, 2 * Math.sqrt(Math.max(0, r2)) - PAD);
        }
        case 'diamond-pass': {
            const half = 45 - Math.abs(y - 50);
            return Math.max(8, 2 * half - PAD);
        }
        case 'hexagon-pass': {
            if (y >= 27.5 && y <= 72.5) return 78 - PAD;
            const dist = y < 27.5 ? 27.5 - y : y - 72.5;
            const t = Math.max(0, 1 - dist / 22.5);
            return Math.max(8, 78 * t - PAD);
        }
        case 'oval-entry': {
            const cy = 30, rx = 44, ry = 24;
            const dy = y - cy;
            const t = 1 - (dy * dy) / (ry * ry);
            return Math.max(10, 2 * rx * Math.sqrt(Math.max(0, t)) - PAD);
        }
        case 'arch-gate':
            return Math.max(10, 88 - PAD - 4);
        case 'star-burst': {
            const { cy, r } = STAR_BURST_INNER_CIRCLE;
            const dy = y - cy;
            const r2 = r * r - dy * dy;
            return Math.max(8, 2 * Math.sqrt(Math.max(0, r2)) - PAD * 0.6);
        }
        case 'shield-crest': {
            if (y <= 58) return 80 - PAD;
            const t = Math.max(0, (112 - y) / (112 - 58));
            return Math.max(8, 80 * t - PAD);
        }
        case 'visa-sticker':
            // Leave room for the QR icon overlay at the bottom-right.
            return 100 - VISA_STICKER_PAD_X * 2 - 14;
        case 'barcode-label':
            return 98 - PAD * 2;
        case 'hologram-ticket':
            return 92 - PAD;
        default:
            return 60;
    }
}

/** Two short lines for diamond-pass — keeps title inside the narrow center column. */
export function splitDiamondPassTitleLines(name) {
    const n = name.trim();
    if (!n) return [''];
    const space = n.indexOf(' ');
    if (space > 0 && space <= 7) {
        const second = n.slice(space + 1);
        if (second.length <= 7) return [n.slice(0, space), second];
    }
    if (n.length <= 7) return [n];
    const cut = Math.ceil(n.length / 2);
    return [n.slice(0, cut), n.slice(cut)];
}

/** Standard stamp copy: date → name (optional split) → city → role. */
export function buildStampFieldLines(date, name, city, role, splitName = false) {
    const nameParts = splitName ? splitDiamondPassTitleLines(name) : [name];
    return [
        { text: date, size: STAMP_FONT.dateCompact },
        ...nameParts.map((part) => ({ text: part, size: STAMP_FONT.nameCompact, bold: true })),
        { text: city, size: STAMP_FONT.cityCompact },
        { text: role, size: STAMP_FONT.cityCompact },
    ];
}

export function stampFieldLineGap(lineCount, avail) {
    return Math.min(11, avail / Math.max(1, lineCount));
}

/** Diamond-pass: event title centered at widest row (y=50); date above; city + role below. */
export function layoutDiamondPassFields(date, name, city, role) {
    const nameParts = splitDiamondPassTitleLines(name);
    const nameLineGap = 8;
    const blockGap = 10;
    const nameBlockHeight = (nameParts.length - 1) * nameLineGap;
    const firstNameY = 50 - nameBlockHeight / 2;

    return [
        { text: date, size: STAMP_FONT.dateCompact, y: firstNameY - blockGap },
        ...nameParts.map((part, i) => ({
            text: part,
            size: STAMP_FONT.nameCompact,
            bold: true,
            y: firstNameY + i * nameLineGap,
        })),
        { text: city, size: STAMP_FONT.cityCompact, y: firstNameY + nameBlockHeight + blockGap },
        { text: role, size: STAMP_FONT.cityCompact, y: firstNameY + nameBlockHeight + blockGap * 2 },
    ];
}

/** Oval-entry: event name vertically centered (viewBox height 60 → y=30). */
export function layoutOvalEntryFields(date, name, city, role) {
    const nameY = 30;
    const gap = OVAL_ENTRY_LINE_GAP;
    return [
        { text: date, size: STAMP_FONT.dateCompact, y: nameY - gap },
        { text: name, size: STAMP_FONT.nameCompact, bold: true, y: nameY },
        { text: city, size: STAMP_FONT.cityCompact, y: nameY + gap },
        { text: role, size: STAMP_FONT.cityCompact, y: nameY + gap * 2 },
    ];
}

/**
 * Travel-visa art direction — geometry for the 9 true "stamp" templates
 * (the 3 label templates — visa-sticker, barcode-label, hologram-ticket —
 * stay printed-document styled, not rubber-stamped, so they keep the plain
 * stacked-line layout). Kept in sync with mobile's `stampLayout.ts`.
 */
export const STAMP_ARC_GEOMETRY = {
    'square-border':  { cx: 50, cy: 50, r: 36, sweepDeg: 128 },
    'circle-exit':    { cx: CIRCLE_MEMBER_STAMP.cx, cy: CIRCLE_MEMBER_STAMP.cy, r: CIRCLE_MEMBER_STAMP.rInner - 5, sweepDeg: 150 },
    'diamond-pass':   { cx: 50, cy: 46, r: 30, sweepDeg: 104 },
    'hexagon-pass':   { cx: 50, cy: 48, r: 33, sweepDeg: 126 },
    'oval-entry':     { cx: 50, cy: 28, r: 19, sweepDeg: 144 },
    'arch-gate':      { cx: 50, cy: 56, r: 34, sweepDeg: 136 },
    'star-burst':     { cx: STAR_BURST_INNER_CIRCLE.cx, cy: STAR_BURST_INNER_CIRCLE.cy, r: STAR_BURST_INNER_CIRCLE.r - 4, sweepDeg: 150 },
    'shield-crest':   { cx: 50, cy: 48, r: 32, sweepDeg: 118 },
    'wax-seal':       { cx: CIRCLE_MEMBER_STAMP.cx, cy: CIRCLE_MEMBER_STAMP.cy, r: CIRCLE_MEMBER_STAMP.rInner - 5, sweepDeg: 150 },
};

/** Central banner ribbon (viewBox units) — carries CITY + DATE in the largest type. */
export const STAMP_BANNER_GEOMETRY = {
    'square-border':  { cx: 50, cy: 60, w: 62, h: 17 },
    'circle-exit':    { cx: CIRCLE_MEMBER_STAMP.cx, cy: 58, w: 58, h: 16 },
    'diamond-pass':   { cx: 50, cy: 58, w: 44, h: 14 },
    'hexagon-pass':   { cx: 50, cy: 58, w: 54, h: 15 },
    'oval-entry':     { cx: 50, cy: 34, w: 68, h: 14 },
    'arch-gate':      { cx: 50, cy: 80, w: 60, h: 16 },
    'star-burst':     { cx: 50, cy: 54, w: 44, h: 14 },
    'shield-crest':   { cx: 50, cy: 68, w: 56, h: 15 },
    'wax-seal':       { cx: CIRCLE_MEMBER_STAMP.cx, cy: 58, w: 58, h: 16 },
};

/** Small role caption sits directly under the banner. */
export function stampRoleY(shape) {
    const b = STAMP_BANNER_GEOMETRY[shape];
    return b ? b.cy + b.h / 2 + 8 : 80;
}

/** Travel-visa field set for the 9 arc-text stamp templates. */
export function buildStampBannerFields(date, name, city, role) {
    return {
        arcText: name,
        bannerLine: [city, date].filter(Boolean).join('   •   '),
        roleText: role,
    };
}

/**
 * True-circle shapes whose event name curves around their ring
 * (`STAMP_ARC_GEOMETRY`). Every other stamp uses the stacked layout below —
 * clean straight lines fit to the shape's real width, which can't overflow and
 * fills the vertical space. Kept in sync with mobile's `stampLayout.ts`.
 */
export const STAMP_RADIAL_NAME = {
    'circle-exit': true,
    'wax-seal': true,
};

/** Vertical interior band each non-radial stamp lays its stacked text into (viewBox units). */
export const STAMP_TEXT_BOX = {
    'square-border': { top: 24, bottom: 76 },
    'diamond-pass':  { top: 34, bottom: 66 },
    'hexagon-pass':  { top: 32, bottom: 68 },
    'oval-entry':    { top: 15, bottom: 45 },
    'arch-gate':     { top: 56, bottom: 106 },
    'star-burst':    { top: 34, bottom: 60 },
    'shield-crest':  { top: 24, bottom: 78 },
};

/** Split a long name near its middle (preferring a space) so it fills two rows instead of shrinking tiny. */
export function splitStampName(name, maxChars = 11) {
    const n = String(name || '').trim();
    if (!n) return [];
    if (n.length <= maxChars) return [n];
    const mid = Math.floor(n.length / 2);
    let best = -1;
    let bestDist = Infinity;
    for (let i = 1; i < n.length - 1; i++) {
        if (n[i] === ' ') {
            const d = Math.abs(i - mid);
            if (d < bestDist) { bestDist = d; best = i; }
        }
    }
    if (best > 0) return [n.slice(0, best).trim(), n.slice(best + 1).trim()];
    return [n.slice(0, mid), n.slice(mid)];
}

/**
 * Stacked rows (date → name[1–2 lines] → city → role) with natural line height,
 * centered in the shape's `STAMP_TEXT_BOX`. Each row's `y` is a baseline; the
 * renderer fits every row to `maxTextWidthAt(shape, y)` so nothing overflows.
 */
export function buildStampStackedRows(shape, date, name, city, role) {
    const box = STAMP_TEXT_BOX[shape] ?? { top: 30, bottom: 70 };
    const nameLines = splitStampName(name);
    const nameSize = nameLines.length > 1 ? STAMP_FONT.nameCompact : STAMP_FONT.name;
    const base = [
        ...(date ? [{ text: date, size: STAMP_FONT.dateCompact }] : []),
        ...nameLines.map((t) => ({ text: t, size: nameSize, bold: true })),
        ...(city ? [{ text: city, size: STAMP_FONT.cityCompact }] : []),
        ...(role ? [{ text: role, size: STAMP_FONT.cityCompact, faded: true }] : []),
    ];
    const LINE_HEIGHT = 1.32;
    const heights = base.map((r) => r.size * LINE_HEIGHT);
    const totalH = heights.reduce((a, b) => a + b, 0);
    const center = (box.top + box.bottom) / 2;
    let cursor = center - totalH / 2;
    return base.map((r, i) => {
        const baseline = cursor + heights[i] * 0.74;
        cursor += heights[i];
        return { ...r, y: baseline };
    });
}

export function formatStampDate(startDate) {
    try {
        const d = new Date(startDate);
        if (isNaN(d.getTime())) return '';
        const day = String(d.getDate()).padStart(2, '0');
        const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
        return `${day} ${month}`;
    } catch { return ''; }
}

/** Generous safety cap — see `formatStampName`; real fit happens by measured width. */
export function formatStampCity(location) {
    if (!location) return '';
    return String(location).split(',')[0].toUpperCase().slice(0, 18);
}

/** Short album role label for stamp face (OWNER, ADMIN, MEMBER, BOUNCER, …). */
export function formatStampRole(albumRole) {
    const role = String(albumRole || 'MEMBER').toUpperCase();
    if (role === 'OWNER' || role === 'ADMIN' || role === 'MEMBER' || role === 'BOUNCER') {
        return role;
    }
    return role.slice(0, 8);
}

export function getEventYear(startDate) {
    try {
        const y = new Date(startDate).getFullYear();
        return isNaN(y) ? new Date().getFullYear() : y;
    } catch { return new Date().getFullYear(); }
}
