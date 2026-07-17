'use client';

import { useId, useState, useEffect } from 'react';
import {
    ARCH_GATE_INNER_PATH,
    ARCH_GATE_OUTER_PATH,
    BARCODE_LABEL_BORDER_RX,
    BARCODE_LABEL_LINE_GAP,
    BARCODE_LABEL_SIGNATURE_POS,
    BARCODE_LABEL_TEXT_START,
    buildStampBannerFields,
    buildStampFieldLines,
    CIRCLE_MEMBER_STAMP,
    CIRCLE_MEMBER_TEXT_AVAIL,
    CIRCLE_MEMBER_TEXT_START,
    HOLOGRAM_TICKET_LINE_GAP,
    maxTextWidthAt,
    SQUARE_BORDER_RECT,
    SQUARE_BORDER_STROKE,
    STAMP_ARC_GEOMETRY,
    STAMP_BANNER_GEOMETRY,
    STAMP_RADIAL_NAME,
    buildStampStackedRows,
    STAR_BURST_PATH,
    STAR_BURST_INNER_CIRCLE,
    stampFieldLineGap,
    stampRoleY,
    VISA_STICKER_LINE_GAP,
    VISA_STICKER_PAD_X,
    WAX_SEAL_INK,
} from '@/utils/stampLayout';
import { fitStampText, stampCharWidths } from '@/utils/stampTextFit';

const CONDENSED_FAMILY = "'Arial Narrow', 'Helvetica Neue Condensed', sans-serif";
const MONO_FAMILY = 'Courier New, monospace';

function grungeRand(seed, i, salt) {
    let h = (seed * 374761393 + i * 668265263 + salt * 2246822519) >>> 0;
    h = (h ^ (h >>> 13)) >>> 0;
    h = Math.imul(h, 1274126177) >>> 0;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

function seedToInt(seed) {
    if (!seed) return 7;
    let h = 0;
    const s = String(seed);
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return (h % 997) + 1;
}

function pointOnArc(cx, cy, r, angleDeg) {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: cx + r * Math.sin(rad), y: cy - r * Math.cos(rad) };
}

function StampFieldLines({ cx, lines, color, yStart, lineGap, shape }) {
    return (
        <>
            {lines.map((line, i) => {
                if (!line.text) return null;
                const y = yStart + i * lineGap;
                const { text, size } = fitStampText(line.text, line.size, maxTextWidthAt(shape, y), MONO_FAMILY, line.bold);
                if (!text) return null;
                return (
                    <text
                        key={`${line.text}-${i}`}
                        x={cx}
                        y={y}
                        textAnchor="middle"
                        fill={color}
                        fontSize={size}
                        fontWeight={line.bold ? 'bold' : 'normal'}
                        fontFamily={MONO_FAMILY}
                    >
                        {text}
                    </text>
                );
            })}
        </>
    );
}

function StampFieldLinesLeft({ x, lines, color, yStart, lineGap, shape }) {
    return (
        <>
            {lines.map((line, i) => {
                if (!line.text) return null;
                const y = yStart + i * lineGap;
                const { text, size } = fitStampText(line.text, line.size, maxTextWidthAt(shape, y) - x, MONO_FAMILY, line.bold);
                if (!text) return null;
                return (
                    <text
                        key={`${line.text}-${i}`}
                        x={x}
                        y={y}
                        textAnchor="start"
                        fill={color}
                        fontSize={size}
                        fontWeight={line.bold ? 'bold' : 'normal'}
                        fontFamily={MONO_FAMILY}
                    >
                        {text}
                    </text>
                );
            })}
        </>
    );
}

function VisaQrIcon({ color }) {
    return (
        <g transform="translate(80 44)" stroke={color} fill={color} strokeWidth="1">
            <rect x="0" y="0" width="16" height="16" fill="none" strokeWidth="1.2" />
            <rect x="2" y="2" width="5" height="5" fill="none" strokeWidth="1" />
            <rect x="9" y="2" width="5" height="5" fill="none" strokeWidth="1" />
            <rect x="2" y="9" width="5" height="5" fill="none" strokeWidth="1" />
            <rect x="10" y="10" width="2" height="2" />
            <rect x="13" y="10" width="2" height="2" />
            <rect x="10" y="13" width="2" height="2" />
            <rect x="13" y="13" width="2" height="2" />
        </g>
    );
}

function BarcodeSignatureIcon({ color, x, y }) {
    return (
        <g
            transform={`translate(${x} ${y}) scale(0.58)`}
            stroke={color}
            fill="none"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M22 12.6344C18 16.1465 17.4279 10.621 15.3496 11.0165C13 11.4637 11.5 16.4445 13 16.4445C14.5 16.4445 12.5 10.5 10.5 12.5556C8.5 14.6111 7.85936 17.2946 6.23526 15.3025C-1.5 5.81446 4.99998 -1.14994 8.16322 3.45685C10.1653 6.37256 6.5 16.9769 2 22" />
            <path d="M9 21H19" />
        </g>
    );
}

/** Outer ring drawn twice — genuine double-ring/double-outline, not a soft shadow. */
function DoubleOutline({ d, shape = 'path', geo, color, strokeWidth = 3, innerScale = 0.9, center = { cx: 50, cy: 50 } }) {
    if (shape === 'circle') {
        return (
            <>
                <circle cx={geo.cx} cy={geo.cy} r={geo.r} stroke={color} strokeWidth={strokeWidth} fill="none" />
                <circle cx={geo.cx} cy={geo.cy} r={Math.max(1, geo.r - 3)} stroke={color} strokeWidth={strokeWidth * 0.55} fill="none" opacity={0.8} />
            </>
        );
    }
    return (
        <>
            <path d={d} stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinejoin="round" />
            <path
                d={d}
                stroke={color}
                strokeWidth={strokeWidth * 0.55}
                fill="none"
                strokeLinejoin="round"
                opacity={0.8}
                transform={`translate(${center.cx} ${center.cy}) scale(${innerScale}) translate(${-center.cx} ${-center.cy})`}
            />
        </>
    );
}

/** Scattered worn-ink specks near the ring — texture doing the "worn" work instead of a soft shadow. */
function GrungeSpecks({ cx, cy, rMin, rMax, count, color, seed }) {
    const nodes = [];
    for (let i = 0; i < count; i++) {
        const angle = grungeRand(seed, i, 1) * Math.PI * 2;
        const r = rMin + grungeRand(seed, i, 2) * (rMax - rMin);
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        const radius = 0.35 + grungeRand(seed, i, 3) * 1.05;
        const opacity = 0.1 + grungeRand(seed, i, 4) * 0.24;
        nodes.push(<circle key={i} cx={x} cy={y} r={radius} fill={color} opacity={opacity} />);
    }
    return <>{nodes}</>;
}

const TINY_STAR_PATH = 'M0 -3.4 L0.9 -1.1 L3.4 -1.1 L1.3 0.5 L2.1 3.1 L0 1.5 L-2.1 3.1 L-1.3 0.5 L-3.4 -1.1 L-0.9 -1.1 Z';
const PLANE_PATH = 'M-6.5 0 L-1 -1.5 L2.2 -5.4 L3.7 -5.4 L2.1 -1.5 L6.5 -0.6 L6.5 0.6 L2.1 1.5 L3.7 5.4 L2.2 5.4 L-1 1.5 Z';

function OrnamentStar({ x, y, color, scale = 1 }) {
    return (
        <g transform={`translate(${x} ${y}) scale(${scale})`}>
            <path d={TINY_STAR_PATH} fill={color} opacity={0.85} />
        </g>
    );
}

function OrnamentPlane({ x, y, color, rotateDeg = 0, scale = 1 }) {
    return (
        <g transform={`translate(${x} ${y}) rotate(${rotateDeg}) scale(${scale})`}>
            <path d={PLANE_PATH} fill={color} opacity={0.8} />
        </g>
    );
}

/**
 * Central banner ribbon — carries CITY + DATE in the largest type on the
 * stamp. Shrinks the natural text to fit the ribbon instead of stretching it
 * to an exact length (the old `textLength`/`lengthAdjust` forced short combos
 * into ugly wide letter-spacing and squished long ones).
 */
function StampBanner({ cx, cy, w, h, color, text }) {
    const notch = h * 0.32;
    const d = `M${cx - w / 2} ${cy - h / 2} L${cx + w / 2} ${cy - h / 2} L${cx + w / 2 - notch} ${cy} L${cx + w / 2} ${cy + h / 2} L${cx - w / 2} ${cy + h / 2} L${cx - w / 2 + notch} ${cy} Z`;
    const maxWidth = w - notch * 2 - 6;
    const fitted = text ? fitStampText(text, h * 0.6, maxWidth, CONDENSED_FAMILY, true) : null;
    return (
        <g>
            <path d={d} fill={color} opacity={0.16} />
            <path d={d} stroke={color} strokeWidth={1.3} fill="none" strokeLinejoin="round" />
            {fitted?.text ? (
                <text
                    x={cx}
                    y={cy + fitted.size * 0.32}
                    textAnchor="middle"
                    fill={color}
                    fontSize={fitted.size}
                    fontWeight="bold"
                    fontFamily={CONDENSED_FAMILY}
                >
                    {fitted.text}
                </text>
            ) : null}
        </g>
    );
}

/** Event name curved around a true-circle stamp's ring, one glyph at a time. */
function ArcName({ shape, color, text }) {
    const arc = STAMP_ARC_GEOMETRY[shape];
    if (!arc || !text) return null;
    const arcLength = (arc.r * arc.sweepDeg * Math.PI) / 180;
    const fit = fitStampText(text, 10.5, arcLength * 0.9, CONDENSED_FAMILY, true);
    if (!fit.text) return null;
    const chars = Array.from(fit.text);
    const widths = stampCharWidths(fit.text, fit.size, CONDENSED_FAMILY, true);
    const total = widths.reduce((a, b) => a + b, 0);
    const totalAngle = total / arc.r;
    let acc = 0;
    const nodes = [];
    chars.forEach((ch, i) => {
        const w = widths[i];
        const deg = ((-totalAngle / 2 + (acc + w / 2) / arc.r) * 180) / Math.PI;
        const pt = pointOnArc(arc.cx, arc.cy, arc.r, deg);
        nodes.push(
            <text key={i} x={0} y={0} textAnchor="middle" transform={`translate(${pt.x} ${pt.y}) rotate(${deg})`} fill={color} fontSize={fit.size} fontWeight="bold" fontFamily={CONDENSED_FAMILY}>
                {ch}
            </text>,
        );
        acc += w;
    });
    return <>{nodes}</>;
}

/**
 * Clean stacked text (date → name[1–2 lines] → city → role) for non-circular
 * stamps. Each row fit to the shape's real interior width (`maxTextWidthAt`)
 * so it can't overflow; rows fill the shape's text box. Matches mobile.
 */
function StackedText({ shape, color, date, name, city, role }) {
    const rows = buildStampStackedRows(shape, date, name, city, role);
    return (
        <>
            {rows.map((row, i) => {
                if (!row.text) return null;
                const family = row.bold ? CONDENSED_FAMILY : MONO_FAMILY;
                const { text, size } = fitStampText(row.text, row.size, maxTextWidthAt(shape, row.y) - 6, family, row.bold);
                if (!text) return null;
                return (
                    <text
                        key={i}
                        x={50}
                        y={row.y}
                        textAnchor="middle"
                        fill={color}
                        fontSize={size}
                        fontWeight={row.bold ? 'bold' : 'normal'}
                        fontFamily={family}
                        opacity={row.faded ? 0.78 : 1}
                    >
                        {text}
                    </text>
                );
            })}
        </>
    );
}

/**
 * Stamp face — true circles (STAMP_RADIAL_NAME) get the curved name + banner +
 * role + ornaments; every other shape gets clean stacked text (fit to its real
 * width) + edge grunge only (center ornaments would collide with the text).
 */
function StampFace({ shape, color, seedInt, date, name, city, role, grungeRadius }) {
    const arc = STAMP_ARC_GEOMETRY[shape];
    const banner = STAMP_BANNER_GEOMETRY[shape];
    const roleY = stampRoleY(shape);
    const fields = buildStampBannerFields(date, name, city, role);

    if (STAMP_RADIAL_NAME[shape]) {
        return (
            <>
                <ArcName shape={shape} color={color} text={fields.arcText} />
                {banner ? <StampBanner cx={banner.cx} cy={banner.cy} w={banner.w} h={banner.h} color={color} text={fields.bannerLine} /> : null}
                {fields.roleText ? (
                    <text x={50} y={roleY} textAnchor="middle" fill={color} fontSize={6.5} fontFamily={MONO_FAMILY} opacity={0.82}>
                        {fields.roleText}
                    </text>
                ) : null}
                {arc ? (
                    <>
                        <OrnamentStar {...pointOnArc(arc.cx, arc.cy, arc.r + 4, -arc.sweepDeg / 2 - 12)} color={color} scale={0.85} />
                        <OrnamentStar {...pointOnArc(arc.cx, arc.cy, arc.r + 4, arc.sweepDeg / 2 + 12)} color={color} scale={0.85} />
                        <OrnamentPlane {...pointOnArc(arc.cx, arc.cy, arc.r * 0.55, 180)} color={color} rotateDeg={90} scale={0.8} />
                    </>
                ) : null}
                <GrungeSpecks cx={50} cy={50} rMin={grungeRadius.min} rMax={grungeRadius.max} count={14} color={color} seed={seedInt} />
            </>
        );
    }

    return (
        <>
            <StackedText shape={shape} color={color} date={date} name={name} city={city} role={role} />
            <GrungeSpecks cx={50} cy={50} rMin={grungeRadius.min} rMax={grungeRadius.max} count={14} color={color} seed={seedInt} />
        </>
    );
}

/** Passport stamp artwork — 12 level-based templates (passport-stamp-studio). Travel-visa art direction on the 9 "stamp" shapes; the 3 label shapes stay printed-document styled. */
function StampShapeGraphicImpl({ shape, color, textColor, name, date, city, role, seed }) {
    const ink = textColor || color;
    const uid = useId().replace(/[:]/g, '');
    const seedInt = seedToInt(seed ?? name);

    switch (shape) {
        case 'square-border': {
            const { x, y, w, h } = SQUARE_BORDER_RECT;
            return (
                <svg viewBox="0 0 100 100" width="100%" height="100%" fill="none">
                    <g>
                        <rect x={x} y={y} width={w} height={h} stroke={color} strokeWidth={SQUARE_BORDER_STROKE} fill="none" />
                        <rect x={x + 3} y={y + 3} width={w - 6} height={h - 6} stroke={color} strokeWidth="1.6" fill="none" opacity={0.8} />
                        <rect x={x + 9} y={y + 9} width={w - 18} height={h - 18} stroke={color} strokeWidth="1" strokeDasharray="2.5 2" fill="none" />
                        <StampFace shape={shape} color={ink} seedInt={seedInt} date={date} name={name} city={city} role={role} grungeRadius={{ min: 40, max: 47 }} />
                    </g>
                </svg>
            );
        }

        case 'circle-exit': {
            const { cx, cy, rOuter, rInner } = CIRCLE_MEMBER_STAMP;
            return (
                <svg viewBox="0 0 100 100" width="100%" height="100%" fill="none">
                    <g>
                        <DoubleOutline shape="circle" geo={{ cx, cy, r: rOuter }} color={color} strokeWidth={3} />
                        <circle cx={cx} cy={cy} r={rInner} stroke={color} strokeWidth="1" strokeDasharray="3 2" fill="none" />
                        <StampFace shape={shape} color={ink} seedInt={seedInt} date={date} name={name} city={city} role={role} grungeRadius={{ min: rOuter - 8, max: rOuter + 2 }} />
                    </g>
                </svg>
            );
        }

        case 'diamond-pass': {
            const d = 'M50 5 L95 50 L50 95 L5 50 Z';
            return (
                <svg viewBox="0 0 100 100" width="100%" height="100%" fill="none">
                    <g>
                        <DoubleOutline d={d} color={color} strokeWidth={3} center={{ cx: 50, cy: 50 }} />
                        <path d="M50 15 L83 50 L50 85 L17 50 Z" stroke={color} strokeWidth="1" strokeDasharray="2 2" fill="none" />
                        <StampFace shape={shape} color={ink} seedInt={seedInt} date={date} name={name} city={city} role={role} grungeRadius={{ min: 34, max: 43 }} />
                    </g>
                </svg>
            );
        }

        case 'hexagon-pass': {
            const d = 'M50 5 L89 27.5 V72.5 L50 95 L11 72.5 V27.5 L50 5Z';
            return (
                <svg viewBox="0 0 100 100" width="100%" height="100%" fill="none">
                    <g>
                        <DoubleOutline d={d} color={color} strokeWidth={2.5} center={{ cx: 50, cy: 50 }} />
                        <path d="M50 12 L83 30 V70 L50 88 L17 70 V30 L50 12Z" stroke={color} strokeWidth="1" strokeDasharray="2 2" fill="none" />
                        <StampFace shape={shape} color={ink} seedInt={seedInt} date={date} name={name} city={city} role={role} grungeRadius={{ min: 36, max: 44 }} />
                    </g>
                </svg>
            );
        }

        case 'oval-entry': {
            return (
                <svg viewBox="0 0 100 60" width="100%" height="100%" fill="none">
                    <g>
                        <ellipse cx="50" cy="30" rx="48" ry="28" stroke={color} strokeWidth="3" fill="none" />
                        <ellipse cx="50" cy="30" rx="45" ry="25" stroke={color} strokeWidth="1.6" fill="none" opacity={0.8} />
                        <ellipse cx="50" cy="30" rx="41" ry="21" stroke={color} strokeWidth="1" strokeDasharray="2.5 2" fill="none" />
                        <StampFace shape={shape} color={ink} seedInt={seedInt} date={date} name={name} city={city} role={role} grungeRadius={{ min: 24, max: 30 }} />
                    </g>
                </svg>
            );
        }

        case 'arch-gate': {
            return (
                <svg viewBox="0 0 100 120" width="100%" height="100%" fill="none">
                    <g>
                        <DoubleOutline d={ARCH_GATE_OUTER_PATH} color={color} strokeWidth={3} innerScale={0.94} center={{ cx: 50, cy: 60 }} />
                        <path d={ARCH_GATE_INNER_PATH} stroke={color} strokeWidth="1" strokeDasharray="2.5 2" fill="none" />
                        <StampFace shape={shape} color={ink} seedInt={seedInt} date={date} name={name} city={city} role={role} grungeRadius={{ min: 40, max: 48 }} />
                    </g>
                </svg>
            );
        }

        case 'star-burst': {
            const { cx, cy, r } = STAR_BURST_INNER_CIRCLE;
            return (
                <svg viewBox="0 0 100 100" width="100%" height="100%" fill="none">
                    <g>
                        <DoubleOutline d={STAR_BURST_PATH} color={color} strokeWidth={2} innerScale={0.92} center={{ cx: 50, cy: 50 }} />
                        <circle cx={cx} cy={cy} r={r} stroke={color} strokeWidth="1" strokeDasharray="2 2" fill="none" />
                        <StampFace shape={shape} color={ink} seedInt={seedInt} date={date} name={name} city={city} role={role} grungeRadius={{ min: r - 4, max: r + 8 }} />
                    </g>
                </svg>
            );
        }

        case 'shield-crest': {
            const d = 'M10 8 H90 V58 C90 88 50 112 50 112 C50 112 10 88 10 58 Z';
            return (
                <svg viewBox="0 0 100 120" width="100%" height="100%" fill="none">
                    <g>
                        <DoubleOutline d={d} color={color} strokeWidth={3} innerScale={0.94} center={{ cx: 50, cy: 60 }} />
                        <path d="M16 14 H84 V56 C84 82 50 102 50 102 C50 102 16 82 16 56 Z" stroke={color} strokeWidth="1" strokeDasharray="2.5 2" fill="none" />
                        <StampFace shape={shape} color={ink} seedInt={seedInt} date={date} name={name} city={city} role={role} grungeRadius={{ min: 36, max: 44 }} />
                    </g>
                </svg>
            );
        }

        case 'visa-sticker': {
            const lines = buildStampFieldLines(date, name, city, role);
            return (
                <svg viewBox="0 0 100 62" width="100%" height="100%" fill="none">
                    <g>
                        <rect x="1" y="1" width="98" height="60" rx="2" fill="rgba(255,255,255,0.92)" stroke={color} strokeWidth="1" />
                        <StampFieldLinesLeft
                            x={VISA_STICKER_PAD_X}
                            lines={lines}
                            color={ink}
                            yStart={14}
                            lineGap={VISA_STICKER_LINE_GAP}
                            shape={shape}
                        />
                        <VisaQrIcon color={ink} />
                    </g>
                </svg>
            );
        }

        case 'barcode-label': {
            const lines = buildStampFieldLines(date, name, city, role);
            const { topLeft, bottomRight } = BARCODE_LABEL_SIGNATURE_POS;
            return (
                <svg viewBox="0 0 100 100" width="100%" height="100%" fill="none">
                    <g>
                        <rect
                            x="1"
                            y="1"
                            width="98"
                            height="98"
                            rx={BARCODE_LABEL_BORDER_RX}
                            fill="rgba(255,255,255,0.95)"
                            stroke={color}
                            strokeWidth="1.5"
                        />
                        <BarcodeSignatureIcon color={ink} x={topLeft.x} y={topLeft.y} />
                        <BarcodeSignatureIcon color={ink} x={bottomRight.x} y={bottomRight.y} />
                        <StampFieldLines
                            cx={50}
                            lines={lines}
                            color={ink}
                            yStart={BARCODE_LABEL_TEXT_START}
                            lineGap={BARCODE_LABEL_LINE_GAP}
                            shape={shape}
                        />
                    </g>
                </svg>
            );
        }

        case 'wax-seal': {
            const lines = buildStampFieldLines(date, name, city, role);
            const gap = stampFieldLineGap(lines.length, CIRCLE_MEMBER_TEXT_AVAIL);
            const { cx, cy, rOuter, rInner } = CIRCLE_MEMBER_STAMP;
            return (
                <svg viewBox="0 0 100 100" width="100%" height="100%" fill="none">
                    <g>
                        <circle cx={cx} cy={cy} r={rOuter} fill={color} />
                        <circle cx={cx} cy={cy} r={rOuter - 3} stroke="rgba(0,0,0,0.18)" strokeWidth="1.2" fill="none" />
                        <circle cx={cx} cy={cy} r={rInner} stroke="rgba(0,0,0,0.35)" strokeWidth="1" strokeDasharray="3 2" fill="none" />
                        <StampFieldLines cx={cx} lines={lines} color={WAX_SEAL_INK} yStart={CIRCLE_MEMBER_TEXT_START} lineGap={gap} shape={shape} />
                    </g>
                </svg>
            );
        }

        case 'hologram-ticket': {
            const lines = buildStampFieldLines(date, name, city, role);
            return (
                <svg viewBox="0 0 100 56" width="100%" height="100%" fill="none">
                    <defs>
                        <linearGradient id={`holoGrad-${uid}`} x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0" stopColor="#FDE68A" stopOpacity="0.9" />
                            <stop offset="0.5" stopColor="#FEF3C7" stopOpacity="0.95" />
                            <stop offset="1" stopColor="#F59E0B" stopOpacity="0.85" />
                        </linearGradient>
                    </defs>
                    <g>
                        <rect x="1" y="1" width="98" height="54" rx="3" fill={`url(#holoGrad-${uid})`} stroke={color} strokeWidth="1.5" />
                        <rect x="4" y="4" width="92" height="48" rx="2" fill="rgba(255,255,255,0.55)" stroke={color} strokeWidth="0.5" opacity="0.6" />
                        <StampFieldLines cx={50} lines={lines} color={ink} yStart={12} lineGap={HOLOGRAM_TICKET_LINE_GAP} shape={shape} />
                    </g>
                </svg>
            );
        }

        default:
            return null;
    }
}

export function StampShapeGraphic(props) {
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) return null;

    return <StampShapeGraphicImpl {...props} />;
}

/** Alias for legacy imports from passportVisualParts. */
export const DynamicStamp = StampShapeGraphic;
