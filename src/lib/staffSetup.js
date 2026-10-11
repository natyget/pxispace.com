// Staff setup on Admin, Accounts: one choice instead of five controls.
//
// What a person can do in the control room and the sales tools is stored in four fields (admin role, city,
// sales role, manager), and the admin role only works on the ADMIN tier. Setting them one at a time, in the
// right order, is what made this page hard to use. Here a super admin picks what the person is, and this
// file turns that choice into the four fields. The backend sets them in one step and moves the tier itself
// (POST /api/admin/users/:id/staff-access).
//
// Pure: no React, no network. Tests: npm run test:staff-setup

const CITY_NAMES = { NYC: 'New York', BOS: 'Boston' };
const cityName = (code) => CITY_NAMES[code] || code || '';

/** The cities a staff member can be given, in the order they are offered. */
export const STAFF_CITIES = [
    { code: 'NYC', label: 'New York' },
    { code: 'BOS', label: 'Boston' },
];

/**
 * The choices, most used first. `needs` is what else has to be picked before it can be saved.
 * @type {Array<{ key: string, label: string, hint: string, needs: 'city' | 'manager' | null }>}
 */
export const STAFF_SETUPS = [
    { key: 'NONE', label: 'No staff access', needs: null, hint: 'An ordinary account. No control room and no sales tools.' },
    {
        key: 'CITY_ADMIN_AND_MANAGER',
        label: 'City admin and regional manager',
        needs: 'city',
        hint: "Runs the control room for one city, approves that city's venue claims, and adds their own ambassadors.",
    },
    { key: 'CITY_ADMIN', label: 'City admin', needs: 'city', hint: 'Runs the control room for one city. No sales tools.' },
    {
        key: 'REGIONAL_MANAGER',
        label: 'Regional manager',
        needs: 'city',
        hint: "Approves one city's venue claims and adds their own ambassadors. No control room.",
    },
    { key: 'AMBASSADOR', label: 'Ambassador', needs: 'manager', hint: "Raises venue claims in their manager's city. No control room." },
    { key: 'GLOBAL_ADMIN', label: 'Admin for all cities', needs: null, hint: 'Runs the control room for every city.' },
    { key: 'MODERATOR', label: 'Moderator', needs: null, hint: 'Reports, suspensions and the audit log, for every city.' },
    { key: 'SUPPORT', label: 'Support', needs: null, hint: 'The support queue, for every city.' },
];

/** Shown in the choice when the account's fields match none of the choices above. */
export const CUSTOM_SETUP = { key: 'CUSTOM', label: 'A mix not listed here', needs: null, hint: 'This account has a mix set under Advanced. Pick a choice to replace it.' };

const setupByKey = (key) => STAFF_SETUPS.find((s) => s.key === key) || null;

/**
 * The four staff fields for a choice. This is the request body, and it always names all four, so a choice
 * replaces what the account had: no leftover city, no leftover manager.
 * @param {{ key: string, cityCode?: string|null, managerId?: string|null }} setup
 */
export function staffBody(setup) {
    const city = setup?.cityCode || null;
    const off = { adminRole: 'NONE', adminCityCode: null, salesRole: 'NONE', salesManagerId: null };
    switch (setup?.key) {
        case 'NONE':
            return off;
        case 'CITY_ADMIN_AND_MANAGER':
            return { ...off, adminRole: 'ADMIN', adminCityCode: city, salesRole: 'REGIONAL_MANAGER' };
        case 'CITY_ADMIN':
            return { ...off, adminRole: 'ADMIN', adminCityCode: city };
        case 'REGIONAL_MANAGER':
            return { ...off, adminCityCode: city, salesRole: 'REGIONAL_MANAGER' };
        case 'AMBASSADOR':
            return { ...off, salesRole: 'AMBASSADOR', salesManagerId: setup.managerId || null };
        case 'GLOBAL_ADMIN':
            return { ...off, adminRole: 'ADMIN' };
        case 'MODERATOR':
            return { ...off, adminRole: 'MODERATOR' };
        case 'SUPPORT':
            return { ...off, adminRole: 'SUPPORT' };
        default:
            return null;
    }
}

const fieldsOf = (row) => ({
    adminRole: row?.adminRole || 'NONE',
    adminCityCode: row?.adminCityCode || null,
    salesRole: row?.salesRole || 'NONE',
    salesManagerId: row?.salesManagerId || null,
});
const sameFields = (a, b) => Boolean(a && b) && ['adminRole', 'adminCityCode', 'salesRole', 'salesManagerId'].every((k) => (a[k] || null) === (b[k] || null));

/**
 * Which choice an account is on now: the one whose four fields are exactly the account's. Anything else is
 * CUSTOM, so the page never says an account is something it is only partly.
 * @returns {{ key: string, cityCode: string|null, managerId: string|null }}
 */
export function setupOf(row) {
    const fields = fieldsOf(row);
    const picked = { cityCode: fields.adminCityCode, managerId: fields.salesManagerId };
    // A choice that needs a city is only a match with one: an admin with no city is the all-cities admin.
    const has = { city: Boolean(picked.cityCode), manager: Boolean(picked.managerId) };
    const match = STAFF_SETUPS.find((s) => (!s.needs || has[s.needs]) && sameFields(staffBody({ key: s.key, ...picked }), fields));
    return { key: match ? match.key : CUSTOM_SETUP.key, ...picked };
}

/** What is still missing before a choice can be saved, as a sentence, or null. */
export function setupProblem(setup) {
    const choice = setupByKey(setup?.key);
    if (!choice) return 'Choose what this person is.';
    if (choice.needs === 'city' && !setup.cityCode) return 'Choose a city.';
    if (choice.needs === 'manager' && !setup.managerId) return 'Choose their regional manager.';
    return null;
}

/** True when saving this choice would change the account. */
export function setupChanges(row, setup) {
    const body = staffBody(setup);
    if (!body) return false;
    return !sameFields(body, fieldsOf(row)) || roleIsWaiting(row);
}

/**
 * The control-room role in force right now. Newer backends send it (`liveAdminRole`); it is not always the
 * stored role, because a stored role waits on the ADMIN tier and a company email is an admin with nothing
 * stored. Without it, work it out the way the backend does for an ordinary account.
 */
export function liveAdminRoleOf(row) {
    if (row?.liveAdminRole) return row.liveAdminRole;
    if (row?.suspendedAt) return 'NONE';
    return row?.accountTier === 'ADMIN' ? row?.adminRole || 'NONE' : 'NONE';
}

/** A role is stored but not switched on: the state the old controls left behind when the tier was missed. */
export function roleIsWaiting(row) {
    return !row?.suspendedAt && (row?.adminRole || 'NONE') !== 'NONE' && liveAdminRoleOf(row) === 'NONE';
}

const ADMIN_PHRASES = { SUPPORT: 'support', MODERATOR: 'moderator' };
const adminPhrase = (role, city) => (role === 'ADMIN' ? (city ? `admin for ${cityName(city)}` : 'admin for all cities') : ADMIN_PHRASES[role] || '');
const managerNameOf = (row, managers) => {
    const m = (managers || []).find((x) => x.id === row?.salesManagerId);
    return m ? m.name || `@${m.username}` : '';
};
const cap = (text) => (text ? `${text.charAt(0).toUpperCase()}${text.slice(1)}` : '');

/**
 * What this account can do right now, in words.
 * @param {object} row an account from GET /api/admin/users
 * @param {Array<{ id: string, name?: string|null, username?: string|null }>} [managers]
 * @returns {{ text: string, warning: string|null }}
 */
export function describeStaff(row, managers) {
    const fields = fieldsOf(row);
    const live = liveAdminRoleOf(row);
    const parts = [];
    let warning = null;

    if (live === 'SUPER_ADMIN') {
        parts.push('super admin');
    } else if (live !== 'NONE' && fields.adminRole === 'NONE') {
        // Nothing is stored: the role comes from a verified company email address.
        parts.push(`${adminPhrase(live, fields.adminCityCode)}, through their company email`);
    } else if (live !== 'NONE') {
        parts.push(adminPhrase(live, fields.adminCityCode));
    }

    if (fields.salesRole === 'REGIONAL_MANAGER') {
        parts.push(fields.adminCityCode ? `regional manager for ${cityName(fields.adminCityCode)}` : 'regional manager with no city');
    } else if (fields.salesRole === 'AMBASSADOR') {
        const manager = managerNameOf(row, managers);
        parts.push(manager ? `ambassador under ${manager}` : 'ambassador');
    }

    if (row?.suspendedAt && (fields.adminRole !== 'NONE' || fields.salesRole !== 'NONE')) {
        warning = 'This account is suspended, so none of its staff access works until it is unsuspended.';
    } else if (roleIsWaiting(row)) {
        warning = `The ${adminPhrase(fields.adminRole, fields.adminCityCode)} role is saved but not switched on, so this person cannot open the control room. Press Save to switch it on.`;
    }
    if (live === 'SUPER_ADMIN') {
        return { text: 'Super admin. This is set by email on the server and cannot be changed here.', warning };
    }
    return { text: parts.length ? `${cap(parts.join(' and '))}.` : 'No staff access.', warning };
}

/**
 * The staff badges for a row of the accounts table: what is in force, and what is stored but off.
 * @returns {Array<{ label: string, tone: 'admin' | 'sales' | 'off' }>}
 */
export function staffBadges(row) {
    const fields = fieldsOf(row);
    const live = liveAdminRoleOf(row);
    const badges = [];
    if (live === 'SUPER_ADMIN') {
        badges.push({ label: 'Super admin', tone: 'admin' });
    } else if (live !== 'NONE') {
        badges.push({ label: cap(adminPhrase(live, fields.adminCityCode)), tone: 'admin' });
    } else if (fields.adminRole !== 'NONE') {
        badges.push({ label: `${cap(adminPhrase(fields.adminRole, fields.adminCityCode))}, not on`, tone: 'off' });
    }
    if (fields.salesRole === 'REGIONAL_MANAGER') {
        badges.push({ label: `Regional manager${fields.adminCityCode ? `, ${cityName(fields.adminCityCode)}` : ''}`, tone: 'sales' });
    } else if (fields.salesRole === 'AMBASSADOR') {
        badges.push({ label: 'Ambassador', tone: 'sales' });
    }
    return badges;
}

/** What a saved choice did, for the line shown after Save. */
export function savedNotice(row, setup) {
    const choice = setupByKey(setup?.key);
    if (!choice) return '';
    const who = row?.username ? `@${row.username}` : row?.email || 'This account';
    if (choice.key === 'NONE') return `Saved. ${who} has no staff access now.`;
    const where = choice.needs === 'city' ? ` for ${cityName(setup.cityCode)}` : '';
    return `Saved. ${who} is now: ${choice.label.toLowerCase()}${where}.`;
}

// ── a regional manager's own team (Venue claims page) ────────────────────────────────────────────────────

/** "Claims: 2 approved, 1 waiting" from the counts the team list sends. */
export function claimSummary(claims) {
    const c = claims || {};
    const parts = [
        [c.approved, 'approved'],
        [c.waiting, 'waiting'],
        [c.rejected, 'rejected'],
        [c.revoked, 'revoked'],
    ]
        .filter(([n]) => Number(n) > 0)
        .map(([n, word]) => `${n} ${word}`);
    return parts.length ? `Claims: ${parts.join(', ')}` : 'No claims yet';
}

/** A typed username as the API wants it: no "@", no spaces around it. */
export function cleanUsername(raw) {
    return String(raw || '').trim().replace(/^@+/, '').trim();
}
