// The line under the split field: what an ambassador would get on a sample PXI fee, worked out the way the
// backend does (cents are floored for the ambassador and the manager keeps the rest, so the parts add up).

export const SAMPLE_FEE_CENTS = 1000;

/**
 * @param {number|null} shareBps the manager's share of PXI revenue, in basis points (2000 = 20%)
 * @param {number} splitPercent the ambassador's split of that share, 0 to 100
 * @returns {{ theirs: number, yours: number }|null} cents, or null when there is nothing to work out
 */
export function splitExample(shareBps, splitPercent) {
    if (shareBps === null || shareBps === undefined) return null;
    if (!Number.isFinite(splitPercent) || splitPercent < 0 || splitPercent > 100) return null;
    const pool = Math.floor((SAMPLE_FEE_CENTS * Number(shareBps)) / 10000);
    const theirs = Math.floor((pool * Math.round(splitPercent * 100)) / 10000);
    return { theirs, yours: pool - theirs };
}

/** "50" from a field's text, as a number; NaN for anything that is not a plain number. */
export function parsePercent(text) {
    const t = String(text ?? '').trim().replace(/%$/, '').trim();
    if (!t || !/^\d+(\.\d{1,2})?$/.test(t)) return Number.NaN;
    return Number(t);
}
