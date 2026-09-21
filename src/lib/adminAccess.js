import { isAdminTierUser } from '@/lib/accountTier';

const PXI_DOMAIN = 'pxispace.com';
// Must match the backend's SUPER_ADMIN_EMAIL (utils/accountTier.ts); overridable per-env.
// One address or a comma-separated list, e.g. "natan@pxispace.com,simon@pxispace.com".
const SUPER_ADMIN_EMAILS = new Set(
    (process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || 'natan@pxispace.com')
        .split(',')
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean)
);

/** Control-room role hierarchy (mirrors backend utils/accountTier.ts). */
const ROLE_RANK = { NONE: 0, SUPPORT: 1, MODERATOR: 2, ADMIN: 3, SUPER_ADMIN: 4 };

export function isPxiEmployee(user) {
    const email = String(user?.email || '').trim().toLowerCase();
    if (!email || !email.includes('@')) return false;
    return email.endsWith(`@${PXI_DOMAIN}`);
}

/**
 * The control room opens on a granted role, not on the ADMIN tier alone (backend
 * middleware/auth.middleware.ts). A session that carries an explicit role of NONE is refused here
 * too, so the account is not shown a dashboard the server will refuse. Legacy sessions with no
 * adminRole field keep the old tier rule, and adminRoleOf resolves them to ADMIN.
 */
export function canAccessAdminDashboard(user) {
    if (isPxiEmployee(user)) return true;
    if (!isAdminTierUser(user)) return false;
    return adminRoleOf(user) !== 'NONE';
}

/**
 * UI-side role resolution. The backend re-checks the DB on every admin request,
 * so this only decides which controls to render.
 * Legacy sessions (ADMIN tier, no adminRole field yet) render as ADMIN.
 */
export function adminRoleOf(user) {
    if (!user) return 'NONE';
    if (SUPER_ADMIN_EMAILS.has(String(user.email || '').trim().toLowerCase())) return 'SUPER_ADMIN';
    if (user.adminRole && ROLE_RANK[user.adminRole] != null) return user.adminRole;
    if (isAdminTierUser(user) || isPxiEmployee(user)) return 'ADMIN';
    return 'NONE';
}

export function hasAdminRole(user, min) {
    return (ROLE_RANK[adminRoleOf(user)] ?? 0) >= (ROLE_RANK[min] ?? 0);
}

export function isSuperAdmin(user) {
    return adminRoleOf(user) === 'SUPER_ADMIN';
}
