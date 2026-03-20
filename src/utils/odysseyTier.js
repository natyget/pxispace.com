/**
 * Odyssey passport LEVEL tiers — MUST match pxi-backend/src/utils/odyssey-tier.ts
 *
 * Wanderer 0–500 · Seeker 501–2.5K · Voyager 2.5K–7K · Pathfinder 7K–15K · Luminary 15K–30K · Odyssey 30K+
 */

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
