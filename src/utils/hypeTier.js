/**
 * Hype SCORE tiers — MUST match PXIStudio-App/src/utils/hype-tier.ts
 *
 * Quiet 0–19 · Warm 20–49 · Buzzing 50–89 · Electric 90–149 · Wildfire 150+
 *
 * Deliberately uncapped — unlike the old /100 hype index, a legendary event
 * can score far above a merely good one instead of both clamping near the
 * same ceiling. Bands are starting constants, revisit once there's a real
 * score distribution to calibrate against.
 */

/** Tier badge colors — same visual language as the Odyssey passport badges. */
export const HYPE_TIER_BADGE_THEMES = {
    QUIET: { fill: '#374151', stroke: 'rgba(156,163,175,0.7)', letter: '#E5E7EB' },
    WARM: { fill: '#7C2D12', stroke: 'rgba(251,146,60,0.85)', letter: '#FFFFFF' },
    BUZZING: { fill: '#7F1B99', stroke: 'rgba(216,74,255,0.9)', letter: '#FFFFFF' },
    ELECTRIC: { fill: '#0369A1', stroke: 'rgba(56,189,248,0.95)', letter: '#FFFFFF' },
    WILDFIRE: { fill: '#991B1B', stroke: 'rgba(248,113,113,0.95)', letter: '#FFFFFF' },
};

export function getHypeTierBadgeTheme(tierId) {
    return HYPE_TIER_BADGE_THEMES[tierId] ?? HYPE_TIER_BADGE_THEMES.QUIET;
}

export function getHypeTierFromScore(hypeScore) {
    const score = Math.max(0, Math.round(Number(hypeScore) || 0));
    if (score <= 19) return { id: 'QUIET', label: 'Quiet', badgeLetter: 'Q' };
    if (score <= 49) return { id: 'WARM', label: 'Warm', badgeLetter: 'W' };
    if (score <= 89) return { id: 'BUZZING', label: 'Buzzing', badgeLetter: 'B' };
    if (score <= 149) return { id: 'ELECTRIC', label: 'Electric', badgeLetter: 'E' };
    return { id: 'WILDFIRE', label: 'Wildfire', badgeLetter: 'F' };
}
