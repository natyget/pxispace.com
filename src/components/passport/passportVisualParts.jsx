// Shared SVG + helpers for dashboard Passport and public profile preview.

// ─── Stamp layout utilities ───────────────────────────────────────────────────

const STAMP_SHAPES = ['HEXAGON', 'RECTANGLE', 'CIRCLE', 'OVAL', 'TRIANGLE'];

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
};

function seededHash(id, salt) {
    let h = (salt * 2654435761) >>> 0;
    for (let i = 0; i < id.length; i++) {
        h = ((h ^ id.charCodeAt(i)) >>> 0);
        h = Math.imul(h, 2654435761) >>> 0;
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
    return STAMP_TIER_COLORS[tierId] ?? '#F59E0B';
}

export function getStampShape(eventId) {
    return STAMP_SHAPES[Math.floor(seededHash(eventId, 7) * STAMP_SHAPES.length)];
}

const GRID_COLS = 3;
const GRID_ROWS = 2;
const AREA_W = 355;
const AREA_H = 265;
const YEAR_ROW_H = 28;
const PAD_X = 18;
const PAD_Y = 14;

export function getStampLayout(eventId, slotIndex) {
    const shape = getStampShape(eventId);
    const { w, h } = STAMP_DIMENSIONS[shape];
    const col = slotIndex % GRID_COLS;
    const row = Math.floor(slotIndex / GRID_COLS) % GRID_ROWS;
    const gridW = AREA_W - PAD_X * 2;
    const gridH = AREA_H - PAD_Y * 2;
    const cellW = gridW / GRID_COLS;
    const cellH = gridH / GRID_ROWS;
    const centerX = PAD_X + col * cellW + cellW / 2;
    const centerY = YEAR_ROW_H + PAD_Y + row * cellH + cellH / 2;
    const jitterX = (seededHash(eventId, 1) - 0.5) * 24;
    const jitterY = (seededHash(eventId, 2) - 0.5) * 18;
    return {
        left:     Math.round(centerX - w / 2 + jitterX),
        top:      Math.round(centerY - h / 2 + jitterY),
        rotation: Math.round((seededHash(eventId, 3) - 0.5) * 30),
        width: w,
        height: h,
    };
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
    return location.split(',')[0].toUpperCase().slice(0, 10);
}

export function getEventYear(startDate) {
    try {
        const y = new Date(startDate).getFullYear();
        return isNaN(y) ? new Date().getFullYear() : y;
    } catch { return new Date().getFullYear(); }
}

export function DynamicStamp({ shape, color, name, date, city }) {
    const filter = `drop-shadow(0 0 6px ${color})`;
    const fill = color;
    const fo = 0.1;

    if (shape === 'HEXAGON') return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" fill="none" style={{ filter, opacity: 0.85 }}>
            <path d="M50 5 L89 27.5 V72.5 L50 95 L11 72.5 V27.5 L50 5Z" stroke={fill} strokeWidth="2" fill={fill} fillOpacity={fo} />
            <path d="M50 9 L85 29.5 V70.5 L50 91 L15 70.5 V29.5 L50 9Z" stroke={fill} strokeWidth="1" />
            <text x="50" y="24" textAnchor="middle" fill={fill} fontSize="5" letterSpacing="1.5" fontFamily="Courier New, monospace">ADMITTED</text>
            <text x="50" y="48" textAnchor="middle" fill={fill} fontSize="9" fontWeight="bold" fontFamily="Courier New, monospace">{name}</text>
            <text x="50" y="61" textAnchor="middle" fill={fill} fontSize="7" fontFamily="Courier New, monospace">{date}</text>
            <path d="M30 66 H70" stroke={fill} strokeWidth="0.5" strokeDasharray="2 2" />
            <text x="50" y="77" textAnchor="middle" fill={fill} fontSize="6" fontFamily="Courier New, monospace">{city}</text>
        </svg>
    );

    if (shape === 'CIRCLE') return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" fill="none" style={{ filter, opacity: 0.85 }}>
            <circle cx="50" cy="50" r="46" stroke={fill} strokeWidth="2" fill={fill} fillOpacity={fo} />
            <circle cx="50" cy="50" r="34" stroke={fill} strokeWidth="1" />
            <text x="50" y="30" textAnchor="middle" fill={fill} fontSize="5" letterSpacing="1.5" fontFamily="Courier New, monospace">ADMITTED</text>
            <text x="50" y="47" textAnchor="middle" fill={fill} fontSize="9" fontWeight="bold" fontFamily="Courier New, monospace">{name}</text>
            <text x="50" y="60" textAnchor="middle" fill={fill} fontSize="7" fontFamily="Courier New, monospace">{date}</text>
            <text x="50" y="72" textAnchor="middle" fill={fill} fontSize="6" fontFamily="Courier New, monospace">{city}</text>
        </svg>
    );

    if (shape === 'TRIANGLE') return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" fill="none" style={{ filter, opacity: 0.85 }}>
            <path d="M50 10 L90 85 H10 L50 10Z" stroke={fill} strokeWidth="2" fill={fill} fillOpacity={fo} strokeLinejoin="round" />
            <path d="M50 16 L84 81 H16 L50 16Z" stroke={fill} strokeWidth="1" strokeLinejoin="round" />
            <text x="50" y="38" textAnchor="middle" fill={fill} fontSize="6" fontWeight="bold" fontFamily="Courier New, monospace">ADMITTED</text>
            <text x="50" y="53" textAnchor="middle" fill={fill} fontSize="8" fontWeight="bold" fontFamily="Courier New, monospace">{name}</text>
            <text x="50" y="64" textAnchor="middle" fill={fill} fontSize="6" fontFamily="Courier New, monospace">{date}</text>
            <line x1="38" y1="69" x2="62" y2="69" stroke={fill} strokeWidth="0.5" />
            <text x="50" y="76" textAnchor="middle" fill={fill} fontSize="5" fontFamily="Courier New, monospace">{city}</text>
        </svg>
    );

    if (shape === 'RECTANGLE') return (
        <svg viewBox="0 0 100 60" width="100%" height="100%" fill="none" style={{ filter, opacity: 0.85 }}>
            <rect x="2" y="2" width="96" height="56" rx="6" stroke={fill} strokeWidth="2" fill={fill} fillOpacity={fo} />
            <rect x="6" y="6" width="88" height="48" rx="4" stroke={fill} strokeWidth="1" strokeDasharray="3 2" />
            <text x="10" y="18" fill={fill} fontSize="6" fontWeight="bold" fontFamily="Courier New, monospace">ADMITTED</text>
            <text x="50" y="37" textAnchor="middle" fill={fill} fontSize="10" fontWeight="bold" fontFamily="Courier New, monospace">{name}</text>
            <text x="50" y="50" textAnchor="middle" fill={fill} fontSize="7" fontFamily="Courier New, monospace">{date}{city ? ` · ${city}` : ''}</text>
        </svg>
    );

    // OVAL (default)
    return (
        <svg viewBox="0 0 100 60" width="100%" height="100%" fill="none" style={{ filter, opacity: 0.85 }}>
            <ellipse cx="50" cy="30" rx="48" ry="28" stroke={fill} strokeWidth="2" fill={fill} fillOpacity={fo} />
            <ellipse cx="50" cy="30" rx="44" ry="24" stroke={fill} strokeWidth="1" />
            <text x="50" y="15" textAnchor="middle" fill={fill} fontSize="5" letterSpacing="1.5" fontFamily="Courier New, monospace">ADMITTED</text>
            <text x="50" y="31" textAnchor="middle" fill={fill} fontSize="9" fontWeight="bold" fontFamily="Courier New, monospace">{name}</text>
            <line x1="18" y1="37" x2="82" y2="37" stroke={fill} strokeWidth="0.5" />
            <text x="50" y="47" textAnchor="middle" fill={fill} fontSize="7" fontFamily="Courier New, monospace">{date}{city ? ` · ${city}` : ''}</text>
        </svg>
    );
}

export function formatMRZ(text, len = 37) {
    if (text.length >= len) return text.substring(0, len);
    return text + '<'.repeat(len - text.length);
}

export const ODYSSEY_TIER_BANDS = [
    { min: 0, max: 500 },
    { min: 501, max: 2500 },
    { min: 2501, max: 7000 },
    { min: 7001, max: 15000 },
    { min: 15001, max: 30000 },
    { min: 30001, max: null },
];

export function getLevelProgress(odysseyXp) {
    const xp = Math.max(0, Math.floor(Number(odysseyXp) || 0));
    const band = ODYSSEY_TIER_BANDS.find((b) => b.max === null || xp <= b.max) ?? ODYSSEY_TIER_BANDS[0];
    if (band.max === null) return 1;
    const range = Math.max(1, band.max - band.min);
    const withinTier = Math.max(0, Math.min(1, (xp - band.min) / range));
    return Math.max(0.08, withinTier);
}

export function HeaderPolygonBadge({ letter, progress }) {
    const size = 64;
    const stroke = 6;
    const center = size / 2;
    const radius = center - stroke - 1;
    const circumference = 2 * Math.PI * radius;
    const dashOffset = circumference * (1 - Math.max(0.08, Math.min(1, progress)));

    return (
        <div className="relative flex h-[36px] w-[34px] items-center justify-center overflow-visible">
            <svg
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                className="absolute"
                aria-hidden
            >
                <circle
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke="rgba(176,38,255,0.5)"
                    strokeWidth={stroke}
                    fill="none"
                />
                <circle
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke="#C85AFF"
                    strokeWidth={stroke}
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${circumference} ${circumference}`}
                    strokeDashoffset={dashOffset}
                    transform={`rotate(-90 ${center} ${center})`}
                />
            </svg>
            <svg
                width="34"
                height="36"
                viewBox="22 17 42 45"
                preserveAspectRatio="xMidYMid meet"
                fill="none"
                aria-hidden
            >
                <path
                    d="M39.8184 19.6525C40.9842 18.9794 41.5671 18.6429 42.1868 18.5111C42.7351 18.3946 43.3018 18.3946 43.8501 18.5111C44.4698 18.6429 45.0527 18.9794 46.2184 19.6525L58.005 26.4574C59.1707 27.1305 59.7536 27.467 60.1775 27.9378C60.5526 28.3544 60.836 28.8451 61.0092 29.3783C61.205 29.9808 61.205 30.6539 61.205 32V45.6099C61.205 46.956 61.205 47.6291 61.0092 48.2316C60.836 48.7647 60.5526 49.2555 60.1775 49.6721C59.7536 50.1429 59.1707 50.4794 58.005 51.1525L46.2184 57.9574C45.0527 58.6305 44.4698 58.967 43.8501 59.0987C43.3018 59.2153 42.7351 59.2153 42.1868 59.0987C41.5671 58.967 40.9842 58.6305 39.8184 57.9574L28.0319 51.1525C26.8661 50.4794 26.2832 50.1429 25.8593 49.6721C25.4842 49.2555 25.2009 48.7647 25.0277 48.2316C24.8319 47.6291 24.8319 46.956 24.8319 45.6099V32C24.8319 30.6539 24.8319 29.9808 25.0277 29.3783C25.2009 28.8451 25.4842 28.3544 25.8593 27.9378C26.2832 27.467 26.8661 27.1305 28.0319 26.4574L39.8184 19.6525Z"
                    fill="#7F1B99"
                />
                <path
                    d="M39.8184 19.6525C40.9842 18.9794 41.5671 18.6429 42.1868 18.5111C42.7351 18.3946 43.3018 18.3946 43.8501 18.5111C44.4698 18.6429 45.0527 18.9794 46.2184 19.6525L58.005 26.4574C59.1707 27.1305 59.7536 27.467 60.1775 27.9378C60.5526 28.3544 60.836 28.8451 61.0092 29.3783C61.205 29.9808 61.205 30.6539 61.205 32V45.6099C61.205 46.956 61.205 47.6291 61.0092 48.2316C60.836 48.7647 60.5526 49.2555 60.1775 49.6721C59.7536 50.1429 59.1707 50.4794 58.005 51.1525L46.2184 57.9574C45.0527 58.6305 44.4698 58.967 43.8501 59.0987C43.3018 59.2153 42.7351 59.2153 42.1868 59.0987C41.5671 58.967 40.9842 58.6305 39.8184 57.9574L28.0319 51.1525C26.8661 50.4794 26.2832 50.1429 25.8593 49.6721C25.4842 49.2555 25.2009 48.7647 25.0277 48.2316C24.8319 47.6291 24.8319 46.956 24.8319 45.6099V32C24.8319 30.6539 24.8319 29.9808 25.0277 29.3783C25.2009 28.8451 25.4842 28.3544 25.8593 27.9378C26.2832 27.467 26.8661 27.1305 28.0319 26.4574L39.8184 19.6525Z"
                    stroke="rgba(176,38,255,0.9)"
                    strokeWidth="5"
                />
            </svg>
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <span className="text-[13px] font-extrabold leading-[15px] text-white text-shadow-[0_0_3px_rgba(255,255,255,0.35)]">
                    {letter}
                </span>
            </div>
        </div>
    );
}

export const NeonCurvesSVG = ({ className }) => (
    <svg className={className} viewBox="0 0 361 558" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M-100 0 C50 200 300 100 400 300" stroke="url(#neonGrad)" strokeWidth="1" strokeOpacity="0.3" />
        <circle cx="300" cy="50" r="100" stroke="url(#neonGrad)" strokeWidth="0.5" strokeOpacity="0.2" />
        <circle cx="0" cy="500" r="180" stroke="url(#neonGrad)" strokeWidth="0.5" strokeOpacity="0.2" />
        <defs>
            <linearGradient id="neonGrad" x1="0" y1="0" x2="1" y2="1">
                <stop stopColor="#A300D0" />
                <stop offset="1" stopColor="#5C0075" />
            </linearGradient>
        </defs>
    </svg>
);

export const StampRed = () => (
    <svg
        viewBox="0 0 100 100"
        fill="none"
        style={{
            width: 90,
            height: 90,
            position: 'absolute',
            filter: 'drop-shadow(0px 0px 2px #FF4D6D)',
            transform: 'rotate(-15deg)',
            top: 25,
            left: 50,
            opacity: 0.9,
        }}
    >
        <path d="M50 5 L89 27.5 V72.5 L50 95 L11 72.5 V27.5 L50 5Z" stroke="#FF4D6D" strokeWidth="2" fill="rgba(20,20,20,0.4)" />
        <path d="M50 9 L85 29.5 V70.5 L50 91 L15 70.5 V29.5 L50 9Z" stroke="#FF4D6D" strokeWidth="1" />
        <text x="50" y="25" textAnchor="middle" fill="#FF4D6D" fontSize="6" fontFamily="Courier New, monospace" letterSpacing="1">
            IMMIGRATION
        </text>
        <text x="50" y="50" textAnchor="middle" fill="#FF4D6D" fontSize="11" fontFamily="Courier New, monospace" fontWeight="bold">
            SOLANA
        </text>
        <text x="50" y="62" textAnchor="middle" fill="#FF4D6D" fontSize="6" fontFamily="Courier New, monospace">
            BREAKPOINT
        </text>
        <path d="M30 66 H70" stroke="#FF4D6D" strokeWidth="0.5" strokeDasharray="2 2" />
        <text x="50" y="78" textAnchor="middle" fill="#FF4D6D" fontSize="7" fontFamily="Courier New, monospace" fontWeight="bold">
            21 SEP 24
        </text>
        <text x="25" y="50" fill="#FF4D6D" fontSize="8">
            ★
        </text>
        <text x="70" y="50" fill="#FF4D6D" fontSize="8">
            ★
        </text>
    </svg>
);

export const StampYellow = () => (
    <svg
        viewBox="0 0 100 60"
        fill="none"
        style={{
            width: 110,
            height: 70,
            position: 'absolute',
            filter: 'drop-shadow(0px 0px 2px #FFD60A)',
            transform: 'rotate(10deg)',
            top: 130,
            left: 180,
            opacity: 0.8,
        }}
    >
        <rect x="2" y="2" width="96" height="56" rx="6" stroke="#FFD60A" strokeWidth="2" fill="rgba(236,170,3,0.1)" />
        <rect x="6" y="6" width="88" height="48" rx="4" stroke="#FFD60A" strokeWidth="1" strokeDasharray="3 2" />
        <path d="M75 15 L80 18 L76 22 L72 20 L75 15" fill="#FFD60A" />
        <path d="M74 18 L68 28 L72 30 L78 20" stroke="#FFD60A" strokeWidth="1" />
        <text x="15" y="20" fill="#FFD60A" fontSize="7" fontFamily="Courier New, monospace" fontWeight="bold">
            ARRIVAL
        </text>
        <text x="50" y="38" textAnchor="middle" fill="#FFD60A" fontSize="12" fontFamily="Courier New, monospace" fontWeight="bold">
            TOKEN 2049
        </text>
        <text x="50" y="50" textAnchor="middle" fill="#FFD60A" fontSize="8" fontFamily="Courier New, monospace">
            DUBAI • 18 APR
        </text>
    </svg>
);

export const StampCyan = () => (
    <svg
        viewBox="0 0 100 100"
        fill="none"
        style={{
            width: 85,
            height: 85,
            position: 'absolute',
            filter: 'drop-shadow(0px 0px 2px #33E1ED)',
            transform: 'rotate(5deg)',
            top: 50,
            right: 50,
            opacity: 0.9,
        }}
    >
        <circle cx="50" cy="50" r="46" stroke="#33E1ED" strokeWidth="2" fill="rgba(20,20,20,0.4)" />
        <circle cx="50" cy="50" r="34" stroke="#33E1ED" strokeWidth="1" />
        <path id="curveTop2" d="M 20 50 A 30 30 0 0 1 80 50" fill="transparent" />
        <text width="100" textAnchor="middle" fill="#33E1ED" fontSize="7" fontFamily="Courier New, monospace" fontWeight="bold">
            <textPath href="#curveTop2" startOffset="50%">
                PORT OF BOGOTA
            </textPath>
        </text>
        <text x="50" y="48" textAnchor="middle" fill="#33E1ED" fontSize="10" fontFamily="Courier New, monospace" fontWeight="bold">
            DEVCON
        </text>
        <text x="50" y="60" textAnchor="middle" fill="#33E1ED" fontSize="12" fontFamily="Courier New, monospace" fontWeight="bold">
            VI
        </text>
        <text x="50" y="80" textAnchor="middle" fill="#33E1ED" fontSize="6" fontFamily="Courier New, monospace">
            11 OCT 2022
        </text>
    </svg>
);

export const StampWhite = () => (
    <svg
        viewBox="0 0 100 60"
        fill="none"
        style={{
            width: 100,
            height: 60,
            position: 'absolute',
            filter: 'drop-shadow(0px 0px 2px rgba(255,255,255,0.8))',
            transform: 'rotate(-5deg)',
            top: 150,
            left: 60,
            opacity: 0.7,
        }}
    >
        <ellipse cx="50" cy="30" rx="48" ry="28" stroke="white" strokeWidth="2" fill="rgba(20,20,20,0.4)" />
        <ellipse cx="50" cy="30" rx="44" ry="24" stroke="white" strokeWidth="1" />
        <text x="50" y="18" textAnchor="middle" fill="white" fontSize="6" fontFamily="Courier New, monospace" letterSpacing="1">
            FRANCE
        </text>
        <text x="50" y="32" textAnchor="middle" fill="white" fontSize="10" fontFamily="Courier New, monospace" fontWeight="bold">
            NFT PARIS
        </text>
        <line x1="20" y1="38" x2="80" y2="38" stroke="white" strokeWidth="0.5" />
        <text x="50" y="48" textAnchor="middle" fill="white" fontSize="7" fontFamily="Courier New, monospace">
            23 FEB 2024
        </text>
    </svg>
);

export const GreenStampPositioned = () => (
    <svg
        viewBox="0 0 100 100"
        fill="none"
        style={{
            width: 95,
            height: 95,
            position: 'absolute',
            filter: 'drop-shadow(0px 0px 2px #4AF765)',
            transform: 'rotate(12deg)',
            top: 80,
            left: 120,
            opacity: 0.8,
        }}
    >
        <path d="M50 10 L90 85 H10 L50 10Z" stroke="#4AF765" strokeWidth="2" fill="rgba(20,20,20,0.4)" strokeLinejoin="round" />
        <path d="M50 16 L84 81 H16 L50 16Z" stroke="#4AF765" strokeWidth="1" strokeLinejoin="round" />
        <text x="50" y="35" textAnchor="middle" fill="#4AF765" fontSize="7" fontFamily="Courier New, monospace" fontWeight="bold">
            DEPARTED
        </text>
        <text x="50" y="50" textAnchor="middle" fill="#4AF765" fontSize="9" fontFamily="Courier New, monospace" fontWeight="bold">
            ETH DENVER
        </text>
        <text x="50" y="62" textAnchor="middle" fill="#4AF765" fontSize="6" fontFamily="Courier New, monospace">
            29 FEB 2024
        </text>
        <path d="M40 68 H60" stroke="#4AF765" strokeWidth="1" />
        <text x="50" y="76" textAnchor="middle" fill="#4AF765" fontSize="5" fontFamily="Courier New, monospace">
            COLORADO
        </text>
    </svg>
);
