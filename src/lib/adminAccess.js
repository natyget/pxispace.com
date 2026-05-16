const PXI_DOMAIN = 'pxispace.com';

export function isPxiEmployee(user) {
    const email = String(user?.email || '').trim().toLowerCase();
    if (!email || !email.includes('@')) return false;
    return email.endsWith(`@${PXI_DOMAIN}`);
}

export function canAccessAdminDashboard(user) {
    return user?.accountTier === 'ADMIN' || isPxiEmployee(user);
}
