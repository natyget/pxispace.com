/**
 * Odyssey passport LEVEL tiers — MUST match pxi-backend/src/utils/odyssey-tier.ts
 *
 * Wanderer 0–500 · Seeker 501–2.5K · Voyager 2.5K–7K · Pathfinder 7K–15K · Luminary 15K–30K · Odyssey 30K+
 */

/** Passport level hex badge colors per tier — not stamp colors. Wanderer = brand purple. */
export const PXI_PASSPORT_LEVEL_BADGE_THEMES = {
    WANDERER: {
        fill: '#7F1B99',
        stroke: 'rgba(176,38,255,0.9)',
        letter: '#FFFFFF',
        ringMuted: 'rgba(176,38,255,0.38)',
        ringBright: '#C084FC',
        progressTrack: 'rgba(176,38,255,0.22)',
        progressFill: 'rgba(176,38,255,0.9)',
    },
    SEEKER: {
        fill: '#312E81',
        stroke: 'rgba(96,165,250,0.95)',
        letter: '#FFFFFF',
        ringMuted: 'rgba(96,165,250,0.38)',
        ringBright: '#60A5FA',
        progressTrack: 'rgba(96,165,250,0.22)',
        progressFill: 'rgba(96,165,250,0.95)',
    },
    VOYAGER: {
        fill: '#065F46',
        stroke: 'rgba(52,211,153,0.95)',
        letter: '#FFFFFF',
        ringMuted: 'rgba(52,211,153,0.38)',
        ringBright: '#34D399',
        progressTrack: 'rgba(52,211,153,0.22)',
        progressFill: 'rgba(52,211,153,0.95)',
    },
    PATHFINDER: {
        fill: '#9A3412',
        stroke: 'rgba(251,146,60,0.95)',
        letter: '#FFFFFF',
        ringMuted: 'rgba(251,146,60,0.38)',
        ringBright: '#FB923C',
        progressTrack: 'rgba(251,146,60,0.22)',
        progressFill: 'rgba(251,146,60,0.95)',
    },
    LUMINARY: {
        fill: '#713F12',
        stroke: 'rgba(252,211,77,0.95)',
        letter: '#FFFFFF',
        ringMuted: 'rgba(252,211,77,0.38)',
        ringBright: '#FCD34D',
        progressTrack: 'rgba(252,211,77,0.22)',
        progressFill: 'rgba(252,211,77,0.95)',
    },
    ODYSSEY: {
        fill: '#374151',
        stroke: 'rgba(229,231,235,0.95)',
        letter: '#0C0C0C',
        ringMuted: 'rgba(229,231,235,0.35)',
        ringBright: '#E5E7EB',
        progressTrack: 'rgba(229,231,235,0.18)',
        progressFill: 'rgba(229,231,235,0.95)',
    },
};

export function getPassportLevelBadgeTheme(tierId) {
    return PXI_PASSPORT_LEVEL_BADGE_THEMES[tierId] ?? PXI_PASSPORT_LEVEL_BADGE_THEMES.WANDERER;
}

export function getOdysseyTierFromXp(odysseyXp) {
    const xp = Math.max(0, Math.floor(Number(odysseyXp) || 0));
    if (xp <= 500) {
        return { id: 'WANDERER', label: 'Wanderer', badgeLetter: 'W' };
    }
    if (xp <= 2500) {
        return { id: 'SEEKER', label: 'Seeker', badgeLetter: 'S' };
    }
    if (xp <= 7000) {
        return { id: 'VOYAGER', label: 'Voyager', badgeLetter: 'V' };
    }
    if (xp <= 15000) {
        return { id: 'PATHFINDER', label: 'Pathfinder', badgeLetter: 'P' };
    }
    if (xp <= 30000) {
        return { id: 'LUMINARY', label: 'Luminary', badgeLetter: 'L' };
    }
    return { id: 'ODYSSEY', label: 'Odyssey', badgeLetter: 'O' };
}

/**
 * Passport LEVEL row (tier label) + hex badge letter — based on odysseyXp only, not vendor status.
 */
export function getPassportLevelDisplay(user) {
    const t = getOdysseyTierFromXp(user?.odysseyXp ?? 0);
    return { levelText: t.label, badgeLetter: t.badgeLetter };
}
