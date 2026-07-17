import { isAdminTierUser } from '@/lib/accountTier';

const PXI_DOMAIN = 'pxispace.com';
// Must match the backend's SUPER_ADMIN_EMAIL (utils/accountTier.ts); overridable per-env.
const SUPER_ADMIN_EMAIL = (process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || 'natan@pxispace.com')
    .trim()
    .toLowerCase();

/** Control-room role hierarchy (mirrors backend utils/accountTier.ts). */
const ROLE_RANK = { NONE: 0, SUPPORT: 1, MODERATOR: 2, ADMIN: 3, SUPER_ADMIN: 4 };

export function isPxiEmployee(user) {
    const email = String(user?.email || '').trim().toLowerCase();
    if (!email || !email.includes('@')) return false;
    return email.endsWith(`@${PXI_DOMAIN}`);
}

export function canAccessAdminDashboard(user) {
    return isAdminTierUser(user) || isPxiEmployee(user);
}

/**
 * UI-side role resolution. The backend re-checks the DB on every admin request,
 * so this only decides which controls to render.
 * Legacy sessions (ADMIN tier, no adminRole field yet) render as ADMIN.
 */
export function adminRoleOf(user) {
    if (!user) return 'NONE';
    if (String(user.email || '').trim().toLowerCase() === SUPER_ADMIN_EMAIL) return 'SUPER_ADMIN';
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
