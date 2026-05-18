import { canAccessAdminDashboard } from './adminAccess';

/**
 * Default dashboard route after login when no explicit redirect is requested.
 * PXI admins/employees land on the admin dashboard.
 */
export function defaultPostLoginPath(user) {
    if (canAccessAdminDashboard(user)) return '/dashboard/admin';
    return '/dashboard';
}
