/**
 * Canonical client-side ACCESS TIER resolution — the single place the web app
 * decides where a user sits on the PARTIAL → CITIZEN → DIPLOMAT ladder.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ACCESS TIER ≠ PASSPORT LEVEL. Do not mix the vocabularies.
 *
 *   ACCESS TIER (this file) — the KYC / capability ladder. What you are allowed
 *   to do. Earned by verifying, not by activity:
 *     PARTIAL   web only, no app, no passport issued
 *     CITIZEN   passport issued in the app
 *     DIPLOMAT  Citizen who cleared Stripe vendor verification — can sell tickets
 *
 *   PASSPORT LEVEL (src/utils/odysseyTier.js) — the XP rank on the passport
 *   itself. How much you've done. Wanderer → Seeker → Voyager → Pathfinder →
 *   Luminary → Odyssey, derived purely from `odysseyXp`.
 *
 * A Wanderer can be a Diplomat; a Luminary can be a plain Citizen. Never label a
 * tier "passport level", and never label a level a "tier", in user-facing copy.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ADMIN is a platform role, not a rung — an admin is also whatever tier their
 * own account has earned. It wins for gating, but it is not "above Diplomat".
 *
 * Mirrors backend utils/accountTier.ts `sessionAccountTier`: ADMIN in the DB
 * always wins; otherwise the tier is derived from `isPassportIssued`, because
 * `GET /api/auth/user/:id` returns the RAW DB tier — a passport-issued user can
 * still carry a stale 'PARTIAL' there. Never read `user.accountTier` directly
 * for gating; go through these helpers. The backend re-checks every privileged
 * request, so this only decides what UI to render.
 */

/** Raw values the DB `accountTier` column can hold. DIPLOMAT is derived, not stored. */
export const ACCOUNT_TIERS = ['PARTIAL', 'CITIZEN', 'ADMIN'];

/** The resolved capability ladder, lowest → highest. */
export const ACCESS_TIERS = ['PARTIAL', 'CITIZEN', 'DIPLOMAT'];

export function normalizeAccountTier(value) {
    const tier = String(value || '').trim().toUpperCase();
    return ACCOUNT_TIERS.includes(tier) ? tier : null;
}

/** Raw session tier for a user object from any endpoint (DB tier + passport flag). */
export function accountTierOf(user) {
    if (!user) return null;
    const stored = normalizeAccountTier(user.accountTier);
    if (stored === 'ADMIN') return 'ADMIN';
    if (typeof user.isPassportIssued === 'boolean') {
        return user.isPassportIssued ? 'CITIZEN' : 'PARTIAL';
    }
    return stored;
}

/**
 * Resolved rung on the capability ladder — the one to use for anything the user
 * reads. Vendor status is checked first because a Diplomat is, by definition, a
 * Citizen who went further.
 * @returns {'PARTIAL'|'CITIZEN'|'DIPLOMAT'|null}
 */
export function accessTierOf(user) {
    if (!user) return null;
    if (isVendorUser(user)) return 'DIPLOMAT';
    const tier = accountTierOf(user);
    if (tier === 'ADMIN') return 'DIPLOMAT';
    if (tier === 'CITIZEN') return 'CITIZEN';
    if (tier === 'PARTIAL') return 'PARTIAL';
    return null;
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
 * Diplomat = verified vendor. Strict boolean check so string junk from old
 * localStorage snapshots ("false", "0") can't grant seller UI.
 */
export function isVendorUser(user) {
    return user?.isVendor === true;
}

/** Alias that reads in product vocabulary at call sites about selling. */
export const isDiplomatUser = isVendorUser;

export const ACCOUNT_TIER_LABELS = {
    PARTIAL: 'Partial',
    CITIZEN: 'Citizen',
    DIPLOMAT: 'Diplomat',
    ADMIN: 'Admin',
};

/**
 * Ladder copy — one place for every "where you are / what's next" surface, so
 * the conversion story reads the same on the Command Center, the CRM, and admin.
 * `blocker` is what actually stops them advancing, which is what sales needs.
 */
export const ACCESS_TIER_META = {
    PARTIAL: {
        label: 'Partial',
        holds: 'Web account, no passport',
        blurb: 'Signed up on the web. Can browse, buy tickets, and attend — but has no passport, so no stamps, no vault, no identity.',
        blocker: 'Has not installed the app',
        next: 'CITIZEN',
        nextAction: 'Issue a passport in the PXI app',
    },
    CITIZEN: {
        label: 'Citizen',
        holds: 'Passport issued',
        blurb: 'Has the app and a live passport — earns stamps, appears in albums, gets face-tagged into their own shots.',
        blocker: 'Not verified to take money',
        next: 'DIPLOMAT',
        nextAction: 'Clear Stripe vendor verification',
    },
    DIPLOMAT: {
        label: 'Diplomat',
        holds: 'Verified to sell',
        blurb: 'A Citizen who cleared identity and banking verification. Can publish paid events, sell tickets, and take payouts.',
        blocker: null,
        next: null,
        nextAction: null,
    },
};

/** @param {'PARTIAL'|'CITIZEN'|'DIPLOMAT'|'ADMIN'|null} tier */
export function accessTierLabel(tier) {
    return ACCOUNT_TIER_LABELS[tier] || '—';
}
