import {
    ARCH_GATE_INNER_PATH,
    ARCH_GATE_OUTER_PATH,
    BARCODE_LABEL_BORDER_RX,
    BARCODE_LABEL_LINE_GAP,
    BARCODE_LABEL_SIGNATURE_POS,
    BARCODE_LABEL_TEXT_START,
    buildStampFieldLines,
    CIRCLE_MEMBER_STAMP,
    CIRCLE_MEMBER_TEXT_AVAIL,
    CIRCLE_MEMBER_TEXT_START,
    HOLOGRAM_TICKET_LINE_GAP,
    layoutDiamondPassFields,
    layoutOvalEntryFields,
    SQUARE_BORDER_RECT,
    SQUARE_BORDER_STROKE,
    STAR_BURST_PATH,
    STAR_BURST_INNER_CIRCLE,
    stampFieldLineGap,
    VISA_STICKER_LINE_GAP,
    VISA_STICKER_PAD_X,
    WAX_SEAL_INK,
} from '@/utils/stampLayout';

function StampFieldLines({ cx, lines, color, yStart, lineGap }) {
    let y = yStart;
    return (
        <>
            {lines.map((line, i) => {
                const el = (
                    <text
                        key={`${line.text}-${i}`}
                        x={cx}
                        y={y}
                        textAnchor="middle"
                        fill={color}
                        fontSize={line.size}
                        fontWeight={line.bold ? 'bold' : 'normal'}
                        fontFamily="Courier New, monospace"
                    >
                        {line.text}
                    </text>
                );
                y += lineGap;
                return el;
            })}
        </>
    );
}

function StampFieldLinesLeft({ x, lines, color, yStart, lineGap }) {
    let y = yStart;
    return (
        <>
            {lines.map((line, i) => {
                const el = (
                    <text
                        key={`${line.text}-${i}`}
                        x={x}
                        y={y}
                        textAnchor="start"
                        fill={color}
                        fontSize={line.size}
                        fontWeight={line.bold ? 'bold' : 'normal'}
                        fontFamily="Courier New, monospace"
                    >
                        {line.text}
                    </text>
                );
                y += lineGap;
                return el;
            })}
        </>
    );
}

function StampFieldAt({ cx, lines, color }) {
    return (
        <>
            {lines.map((line, i) => (
                <text
                    key={`${line.text}-${i}`}
                    x={cx}
                    y={line.y}
                    textAnchor="middle"
                    fill={color}
                    fontSize={line.size}
                    fontWeight={line.bold ? 'bold' : 'normal'}
                    fontFamily="Courier New, monospace"
                >
                    {line.text}
                </text>
            ))}
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

/** Passport stamp artwork — 12 level-based templates (passport-stamp-studio). */
export function StampShapeGraphic({ shape, color, name, date, city, role }) {
    switch (shape) {
        case 'square-border': {
            const lines = buildStampFieldLines(date, name, city, role);
            const gap = stampFieldLineGap(lines.length, 56);
            const { x, y, w, h } = SQUARE_BORDER_RECT;
            return (
                <svg viewBox="0 0 100 100" width="100%" height="100%" fill="none">
                    <g>
                        <rect x={x} y={y} width={w} height={h} stroke={color} strokeWidth={SQUARE_BORDER_STROKE} fill="none" />
                        <StampFieldLines cx={50} lines={lines} color={color} yStart={32} lineGap={gap} />
                    </g>
                </svg>
            );
        }

        case 'circle-exit': {
            const lines = buildStampFieldLines(date, name, city, role);
            const gap = stampFieldLineGap(lines.length, CIRCLE_MEMBER_TEXT_AVAIL);
            const { cx, cy, rOuter, rInner } = CIRCLE_MEMBER_STAMP;
            return (
                <svg viewBox="0 0 100 100" width="100%" height="100%" fill="none">
                    <g>
                        <circle cx={cx} cy={cy} r={rOuter} stroke={color} strokeWidth="3" fill="none" />
                        <circle cx={cx} cy={cy} r={rInner} stroke={color} strokeWidth="1" strokeDasharray="3 2" />
                        <StampFieldLines cx={cx} lines={lines} color={color} yStart={CIRCLE_MEMBER_TEXT_START} lineGap={gap} />
                    </g>
                </svg>
            );
        }

        case 'diamond-pass': {
            const lines = layoutDiamondPassFields(date, name, city, role);
            return (
                <svg viewBox="0 0 100 100" width="100%" height="100%" fill="none">
                    <g>
                        <path d="M50 5 L95 50 L50 95 L5 50 Z" stroke={color} strokeWidth="3" fill="none" />
                        <path d="M50 12 L88 50 L50 88 L12 50 Z" stroke={color} strokeWidth="1" />
                        <StampFieldAt cx={50} lines={lines} color={color} />
                    </g>
                </svg>
            );
        }

        case 'hexagon-pass': {
            const lines = buildStampFieldLines(date, name, city, role);
            const gap = stampFieldLineGap(lines.length, 40);
            return (
                <svg viewBox="0 0 100 100" width="100%" height="100%" fill="none">
                    <g>
                        <path d="M50 5 L89 27.5 V72.5 L50 95 L11 72.5 V27.5 L50 5Z" stroke={color} strokeWidth="2.5" fill="none" />
                        <path d="M50 12 L83 30 V70 L50 88 L17 70 V30 L50 12Z" stroke={color} strokeWidth="1" strokeDasharray="2 2" />
                        <StampFieldLines cx={50} lines={lines} color={color} yStart={36} lineGap={gap} />
                    </g>
                </svg>
            );
        }

        case 'oval-entry': {
            const lines = layoutOvalEntryFields(date, name, city, role);
            return (
                <svg viewBox="0 0 100 60" width="100%" height="100%" fill="none">
                    <g>
                        <ellipse cx="50" cy="30" rx="48" ry="28" stroke={color} strokeWidth="3" fill="none" />
                        <ellipse cx="50" cy="30" rx="44" ry="24" stroke={color} strokeWidth="1" />
                        <StampFieldAt cx={50} lines={lines} color={color} />
                    </g>
                </svg>
            );
        }

        case 'arch-gate': {
            const lines = buildStampFieldLines(date, name, city, role);
            const gap = stampFieldLineGap(lines.length, 48);
            return (
                <svg viewBox="0 0 100 120" width="100%" height="100%" fill="none">
                    <g>
                        <path d={ARCH_GATE_OUTER_PATH} stroke={color} strokeWidth="3" fill="none" />
                        <path d={ARCH_GATE_INNER_PATH} stroke={color} strokeWidth="1" fill="none" />
                        <StampFieldLines cx={50} lines={lines} color={color} yStart={58} lineGap={gap} />
                    </g>
                </svg>
            );
        }

        case 'star-burst': {
            const lines = buildStampFieldLines(date, name, city, role);
            const gap = stampFieldLineGap(lines.length, 36);
            const { cx, cy, r } = STAR_BURST_INNER_CIRCLE;
            return (
                <svg viewBox="0 0 100 100" width="100%" height="100%" fill="none">
                    <g>
                        <path d={STAR_BURST_PATH} stroke={color} strokeWidth="2" fill="none" strokeLinejoin="round" />
                        <circle cx={cx} cy={cy} r={r} stroke={color} strokeWidth="1" strokeDasharray="2 2" />
                        <StampFieldLines cx={50} lines={lines} color={color} yStart={36} lineGap={gap} />
                    </g>
                </svg>
            );
        }

        case 'shield-crest': {
            const lines = buildStampFieldLines(date, name, city, role);
            const gap = stampFieldLineGap(lines.length, 44);
            return (
                <svg viewBox="0 0 100 120" width="100%" height="100%" fill="none">
                    <g>
                        <path d="M10 8 H90 V58 C90 88 50 112 50 112 C50 112 10 88 10 58 Z" stroke={color} strokeWidth="3" fill="none" />
                        <path d="M16 14 H84 V56 C84 82 50 102 50 102 C50 102 16 82 16 56 Z" stroke={color} strokeWidth="1" />
                        <StampFieldLines cx={50} lines={lines} color={color} yStart={48} lineGap={gap} />
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
                            color={color}
                            yStart={14}
                            lineGap={VISA_STICKER_LINE_GAP}
                        />
                        <VisaQrIcon color={color} />
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
                        <BarcodeSignatureIcon color={color} x={topLeft.x} y={topLeft.y} />
                        <BarcodeSignatureIcon color={color} x={bottomRight.x} y={bottomRight.y} />
                        <StampFieldLines
                            cx={50}
                            lines={lines}
                            color={color}
                            yStart={BARCODE_LABEL_TEXT_START}
                            lineGap={BARCODE_LABEL_LINE_GAP}
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
                        <circle cx={cx} cy={cy} r={rInner} stroke="rgba(0,0,0,0.35)" strokeWidth="1" strokeDasharray="3 2" fill="none" />
                        <StampFieldLines cx={cx} lines={lines} color={WAX_SEAL_INK} yStart={CIRCLE_MEMBER_TEXT_START} lineGap={gap} />
                    </g>
                </svg>
            );
        }

        case 'hologram-ticket': {
            const lines = buildStampFieldLines(date, name, city, role);
            return (
                <svg viewBox="0 0 100 56" width="100%" height="100%" fill="none">
                    <defs>
                        <linearGradient id="holoGrad" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0" stopColor="#FDE68A" stopOpacity="0.9" />
                            <stop offset="0.5" stopColor="#FEF3C7" stopOpacity="0.95" />
                            <stop offset="1" stopColor="#F59E0B" stopOpacity="0.85" />
                        </linearGradient>
                    </defs>
                    <g>
                        <rect x="1" y="1" width="98" height="54" rx="3" fill="url(#holoGrad)" stroke={color} strokeWidth="1.5" />
                        <rect x="4" y="4" width="92" height="48" rx="2" fill="rgba(255,255,255,0.55)" stroke={color} strokeWidth="0.5" opacity="0.6" />
                        <StampFieldLines cx={50} lines={lines} color={color} yStart={12} lineGap={HOLOGRAM_TICKET_LINE_GAP} />
                    </g>
                </svg>
            );
        }

        default:
            return null;
    }
}

/** Alias for legacy imports from passportVisualParts. */
export const DynamicStamp = StampShapeGraphic;
