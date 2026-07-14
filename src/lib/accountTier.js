/**
 * Canonical client-side account-tier resolution — the single place the web app
 * decides PARTIAL / CITIZEN / ADMIN and vendor status from a user object.
 *
 * Mirrors backend utils/accountTier.ts `sessionAccountTier`: ADMIN in the DB
 * always wins; otherwise the tier is derived from `isPassportIssued`, because
 * `GET /api/auth/user/:id` returns the RAW DB tier — a passport-issued user can
 * still carry a stale 'PARTIAL' there. Never read `user.accountTier` directly
 * for gating; go through these helpers. The backend re-checks every privileged
 * request, so this only decides what UI to render.
 */

export const ACCOUNT_TIERS = ['PARTIAL', 'CITIZEN', 'ADMIN'];

export function normalizeAccountTier(value) {
    const tier = String(value || '').trim().toUpperCase();
    return ACCOUNT_TIERS.includes(tier) ? tier : null;
}

/** Session tier for a user object from any endpoint (raw DB tier + passport flag). */
export function accountTierOf(user) {
    if (!user) return null;
    const stored = normalizeAccountTier(user.accountTier);
    if (stored === 'ADMIN') return 'ADMIN';
    if (typeof user.isPassportIssued === 'boolean') {
        return user.isPassportIssued ? 'CITIZEN' : 'PARTIAL';
    }
    return stored;
}

export function isAdminTierUser(user) {
    return accountTierOf(user) === 'ADMIN';
}

export function isCitizenUser(user) {
    return accountTierOf(user) === 'CITIZEN';
}

export function isPartialUser(user) {
    return accountTierOf(user) === 'PARTIAL';
}

/**
 * Vendor is a flag orthogonal to tier. Strict boolean check so string junk from
 * old localStorage snapshots ("false", "0") can't grant vendor UI.
 */
export function isVendorUser(user) {
    return user?.isVendor === true;
}

export const ACCOUNT_TIER_LABELS = {
    PARTIAL: 'Partial',
    CITIZEN: 'Citizen',
    ADMIN: 'Admin',
};
