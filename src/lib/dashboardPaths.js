/**
 * Default dashboard route after login when no explicit redirect is requested.
 * Platform admins (AccountTier ADMIN in DB) land on the admin dashboard.
 */
export function defaultPostLoginPath(user) {
    if (user?.accountTier === 'ADMIN') return '/dashboard/admin';
    return '/dashboard';
}
