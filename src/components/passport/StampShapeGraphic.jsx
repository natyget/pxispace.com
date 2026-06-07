import { STAMP_FONT } from '@/utils/stampLayout';

/** Passport stamp artwork — 10 shapes (viewBox scaled by parent). */
export function StampShapeGraphic({ shape, color, name, date, city }) {
    const cityLine = city ? ` · ${city}` : '';
    const glow = { filter: `drop-shadow(0 0 6px ${color})` };

    switch (shape) {
        case 'HEXAGON':
            return (
                <svg viewBox="0 0 100 100" width="100%" height="100%" fill="none" style={glow}>
                    <g>
                        <path d="M50 5 L89 27.5 V72.5 L50 95 L11 72.5 V27.5 L50 5Z" stroke={color} strokeWidth="2" fill="none" />
                        <path d="M50 9 L85 29.5 V70.5 L50 91 L15 70.5 V29.5 L50 9Z" stroke={color} strokeWidth="1" />
                        <text x="50" y="48" textAnchor="middle" fill={color} fontSize={STAMP_FONT.name} fontWeight="bold">{name}</text>
                        <text x="50" y="61" textAnchor="middle" fill={color} fontSize={STAMP_FONT.date}>{date}</text>
                        <path d="M30 66 H70" stroke={color} strokeWidth="0.5" strokeDasharray="2 2" />
                        <text x="50" y="77" textAnchor="middle" fill={color} fontSize={STAMP_FONT.city}>{city}</text>
                    </g>
                </svg>
            );

        case 'CIRCLE':
            return (
                <svg viewBox="0 0 100 100" width="100%" height="100%" fill="none" style={glow}>
                    <g>
                        <circle cx="50" cy="50" r="46" stroke={color} strokeWidth="2" fill="none" />
                        <circle cx="50" cy="50" r="34" stroke={color} strokeWidth="1" />
                        <text x="50" y="47" textAnchor="middle" fill={color} fontSize={STAMP_FONT.name} fontWeight="bold">{name}</text>
                        <text x="50" y="60" textAnchor="middle" fill={color} fontSize={STAMP_FONT.date}>{date}</text>
                        <text x="50" y="72" textAnchor="middle" fill={color} fontSize={STAMP_FONT.city}>{city}</text>
                    </g>
                </svg>
            );

        case 'TRIANGLE':
            return (
                <svg viewBox="0 0 100 100" width="100%" height="100%" fill="none" style={glow}>
                    <g>
                        <path d="M50 10 L90 85 H10 L50 10Z" stroke={color} strokeWidth="2" fill="none" strokeLinejoin="round" />
                        <path d="M50 16 L84 81 H16 L50 16Z" stroke={color} strokeWidth="1" strokeLinejoin="round" />
                        <text x="50" y="55" textAnchor="middle" fill={color} fontSize={STAMP_FONT.nameCompact} fontWeight="bold">{name}</text>
                        <text x="50" y="66" textAnchor="middle" fill={color} fontSize={STAMP_FONT.dateCompact}>{date}</text>
                        <path d="M38 71 H62" stroke={color} strokeWidth="0.5" />
                        <text x="50" y="78" textAnchor="middle" fill={color} fontSize={STAMP_FONT.cityCompact}>{city}</text>
                    </g>
                </svg>
            );

        case 'DIAMOND':
            return (
                <svg viewBox="0 0 100 100" width="100%" height="100%" fill="none" style={glow}>
                    <g>
                        <path d="M50 6 L94 50 L50 94 L6 50 Z" stroke={color} strokeWidth="2" fill="none" />
                        <path d="M50 12 L88 50 L50 88 L12 50 Z" stroke={color} strokeWidth="1" />
                        <text x="50" y="50" textAnchor="middle" fill={color} fontSize={STAMP_FONT.nameCompact} fontWeight="bold">{name}</text>
                        <text x="50" y="62" textAnchor="middle" fill={color} fontSize={STAMP_FONT.date}>{date}</text>
                        <text x="50" y="74" textAnchor="middle" fill={color} fontSize={STAMP_FONT.city}>{city}</text>
                    </g>
                </svg>
            );

        case 'STAR':
            return (
                <svg viewBox="0 0 100 100" width="100%" height="100%" fill="none" style={glow}>
                    <g>
                        <path d="M50 4 L61 34 L93 34 L67 54 L77 86 L50 70 L23 86 L33 54 L7 34 L39 34 Z" stroke={color} strokeWidth="2" fill="none" strokeLinejoin="round" />
                        <circle cx="50" cy="46" r="22" stroke={color} strokeWidth="1" strokeDasharray="2 2" />
                        <text x="50" y="44" textAnchor="middle" fill={color} fontSize={STAMP_FONT.nameStar} fontWeight="bold">{name}</text>
                        <text x="50" y="54" textAnchor="middle" fill={color} fontSize={STAMP_FONT.dateCompact}>{date}</text>
                        <text x="50" y="64" textAnchor="middle" fill={color} fontSize={STAMP_FONT.cityCompact}>{city}</text>
                    </g>
                </svg>
            );

        case 'SHIELD':
            return (
                <svg viewBox="0 0 100 120" width="100%" height="100%" fill="none" style={glow}>
                    <g>
                        <path d="M10 8 H90 V58 C90 88 50 112 50 112 C50 112 10 88 10 58 Z" stroke={color} strokeWidth="2" fill="none" />
                        <path d="M16 14 H84 V56 C84 82 50 102 50 102 C50 102 16 82 16 56 Z" stroke={color} strokeWidth="1" />
                        <text x="50" y="54" textAnchor="middle" fill={color} fontSize={STAMP_FONT.nameCompact} fontWeight="bold">{name}</text>
                        <text x="50" y="68" textAnchor="middle" fill={color} fontSize={STAMP_FONT.date}>{date}</text>
                        <text x="50" y="82" textAnchor="middle" fill={color} fontSize={STAMP_FONT.city}>{city}</text>
                    </g>
                </svg>
            );

        case 'ARCH':
            return (
                <svg viewBox="0 0 100 100" width="100%" height="100%" fill="none" style={glow}>
                    <g>
                        <path d="M8 42 Q50 4 92 42 V92 H8 Z" stroke={color} strokeWidth="2" fill="none" strokeLinejoin="round" />
                        <path d="M14 42 Q50 10 86 42 V86 H14 Z" stroke={color} strokeWidth="1" />
                        <text x="50" y="52" textAnchor="middle" fill={color} fontSize={STAMP_FONT.nameCompact} fontWeight="bold">{name}</text>
                        <text x="50" y="66" textAnchor="middle" fill={color} fontSize={STAMP_FONT.date}>{date}</text>
                        <text x="50" y="78" textAnchor="middle" fill={color} fontSize={STAMP_FONT.city}>{city}</text>
                    </g>
                </svg>
            );

        case 'POSTMARK':
            return (
                <svg viewBox="0 0 100 100" width="100%" height="100%" fill="none" style={glow}>
                    <g>
                        <circle cx="50" cy="50" r="44" stroke={color} strokeWidth="2" fill="none" />
                        <circle cx="50" cy="50" r="36" stroke={color} strokeWidth="1" />
                        <path d="M12 50 H88" stroke={color} strokeWidth="0.5" strokeDasharray="3 2" />
                        <text x="50" y="50" textAnchor="middle" fill={color} fontSize={STAMP_FONT.nameCompact} fontWeight="bold">{name}</text>
                        <text x="50" y="62" textAnchor="middle" fill={color} fontSize={STAMP_FONT.date}>{date}</text>
                        <text x="50" y="74" textAnchor="middle" fill={color} fontSize={STAMP_FONT.city}>{city}</text>
                    </g>
                </svg>
            );

        case 'RECTANGLE':
            return (
                <svg viewBox="0 0 100 60" width="100%" height="100%" fill="none" style={glow}>
                    <g>
                        <rect x="2" y="2" width="96" height="56" rx="6" stroke={color} strokeWidth="2" fill="none" />
                        <rect x="6" y="6" width="88" height="48" rx="4" stroke={color} strokeWidth="1" strokeDasharray="3 2" />
                        <text x="50" y="36" textAnchor="middle" fill={color} fontSize={STAMP_FONT.nameWide} fontWeight="bold">{name}</text>
                        <text x="50" y="50" textAnchor="middle" fill={color} fontSize={STAMP_FONT.date}>{date}{cityLine}</text>
                    </g>
                </svg>
            );

        case 'OVAL':
            return (
                <svg viewBox="0 0 100 60" width="100%" height="100%" fill="none" style={glow}>
                    <g>
                        <ellipse cx="50" cy="30" rx="48" ry="28" stroke={color} strokeWidth="2" fill="none" />
                        <ellipse cx="50" cy="30" rx="44" ry="24" stroke={color} strokeWidth="1" />
                        <text x="50" y="30" textAnchor="middle" fill={color} fontSize={STAMP_FONT.name} fontWeight="bold">{name}</text>
                        <line x1="18" y1="37" x2="82" y2="37" stroke={color} strokeWidth="0.5" />
                        <text x="50" y="47" textAnchor="middle" fill={color} fontSize={STAMP_FONT.date}>{date}{cityLine}</text>
                    </g>
                </svg>
            );

        default:
            return null;
    }
}

/** Alias for legacy imports from passportVisualParts. */
export const DynamicStamp = StampShapeGraphic;
