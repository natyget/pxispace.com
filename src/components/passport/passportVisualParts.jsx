// Shared SVG + helpers for dashboard Passport and public profile preview.
// Passport stamps: use PassportStampsLayer only (not inline stamp logic).

export { getEventYear } from '@/utils/stampLayout';
export { StampShapeGraphic } from './StampShapeGraphic';
export { PassportStampsLayer } from './PassportStampsLayer';
export {
    PassportCardShell,
    PASSPORT_INFO_PANEL_BG,
    PASSPORT_AVATAR_FRAME_CLASS,
    PASSPORT_FOOTER_TEXT_CLASS,
    PASSPORT_FOOTER_CHEV_CLASS,
    PASSPORT_ID_OVERLAY_CLASS,
} from './PassportCardShell';
export { PassportMrzFooter, formatPassportIssuedDate } from './PassportMrzFooter';

export function formatMRZ(text, len = 37) {
    if (text.length >= len) return text.substring(0, len);
    return text + '<'.repeat(len - text.length);
}

/**
 * Builds a passport-style footer line by joining tokens with `<<` and padding with
 * `<` so the resulting string always overflows the container — matches mobile
 * NewPassportCard `buildPassportFooterLine`. The host renders chevrons in a larger
 * font and clips overflow at both edges.
 */
export function buildPassportFooterLine(parts, totalChars, fillPosition = 'end') {
    const joined = parts.filter(Boolean).join('<<');
    const charsToTarget = Math.max(0, totalChars - joined.length);
    const adaptiveTail = Math.max(
        Math.ceil(totalChars * 0.5),
        Math.ceil(joined.length * 0.2),
        parts.length + 8,
    );
    const fill = '<'.repeat(charsToTarget + adaptiveTail);
    return fillPosition === 'start' ? `${fill}${joined}` : `${joined}${fill}`;
}

/** Splits an MRZ line so chevron runs can be styled with a larger font (key/value preserved). */
export function renderPassportFooterSegments(line, chevClassName) {
    return line.split(/(<+)/).map((seg, i) => {
        if (!seg) return null;
        if (/^<+$/.test(seg)) {
            return (
                <span key={i} className={chevClassName}>
                    {seg}
                </span>
            );
        }
        return <span key={i}>{seg}</span>;
    });
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

