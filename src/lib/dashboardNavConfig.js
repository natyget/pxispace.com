import {
  Activity01Icon,
  Calendar01Icon,
  DashboardSquare01Icon,
  FlagIcon,
  Megaphone01Icon,
  Notification03Icon,
  QrCodeIcon,
  Shield01Icon,
  StarIcon,
  UserCircleIcon,
  UserGroupIcon,
  Wallet01Icon,
} from '@hugeicons/core-free-icons';

export const ADMIN_SIDEBAR_MODE_KEY = 'pxi_dashboard_admin_ui_mode';

export const adminNavItems = [
  { key: 'admin-overview', label: 'Overview', path: '/dashboard/admin', icon: DashboardSquare01Icon, end: true },
  { key: 'admin-analytics', label: 'Platform Analytics', path: '/dashboard/admin/analytics', icon: Activity01Icon, end: true },
  { key: 'admin-support', label: 'Support Tickets', path: '/dashboard/admin/support', icon: Shield01Icon, end: true },
  { key: 'admin-users', label: 'User Management', path: '/dashboard/admin/users', icon: UserGroupIcon, end: true },
  { key: 'admin-events', label: 'Event Management', path: '/dashboard/admin/events', icon: Calendar01Icon, end: true },
  { key: 'admin-reports', label: 'Report Management', path: '/dashboard/admin/reports', icon: FlagIcon, end: true },
  { key: 'admin-ugc', label: 'UGC Moderation', path: '/dashboard/admin/ugc', icon: Notification03Icon, end: true },
  { key: 'admin-promos', label: 'Promos & Credits', path: '/dashboard/admin/promos', icon: StarIcon, end: true },
];

/**
 * Config-driven member dashboard navigation (Phase 2+).
 * @typedef {object} DashboardNavItem
 * @property {string} key
 * @property {string} label
 * @property {string} path
 * @property {import('@hugeicons/core-free-icons').IconSvgObject} icon
 * @property {'Hub'|'Intelligence'|'People'|'Business'} [section]
 * @property {boolean} [end]
 * @property {boolean} [organizerOnly]
 * @property {boolean} [vendorOnly]
 * @property {boolean} [nonVendorOnly]
 * @property {boolean} [bouncerOnly]
 * @property {boolean} [liveOnly]
 * @property {'notifications'} [badge]
 */

/** @type {DashboardNavItem[]} */
export const dashboardNavConfig = [
  { key: 'command', label: 'Command Center', path: '/dashboard', icon: DashboardSquare01Icon, section: 'Hub', end: true },
  { key: 'events', label: 'My Events', path: '/dashboard/events', icon: Calendar01Icon, section: 'Hub', end: true },
  { key: 'analytics', label: 'Analytics', path: '/dashboard/analytics', icon: Activity01Icon, section: 'Intelligence', end: true, organizerOnly: true },
  { key: 'operations', label: 'Operations', path: '/dashboard/analytics?view=live-ops', icon: QrCodeIcon, section: 'Intelligence', end: true, organizerOnly: true },
  { key: 'audience', label: 'Audience & Campaigns', path: '/dashboard/audience', icon: UserGroupIcon, section: 'People', end: true, organizerOnly: true },
  { key: 'campaigns', label: 'Email Campaigns', path: '/dashboard/campaigns', icon: Megaphone01Icon, section: 'People', end: true, organizerOnly: true },
  { key: 'earnings', label: 'Earnings', path: '/dashboard/earnings', icon: Wallet01Icon, section: 'Business', end: true, vendorOnly: true },
  { key: 'team', label: 'Teams & Security', path: '/dashboard/team', icon: Shield01Icon, section: 'Business', end: true, organizerOnly: true },
  { key: 'vendor-setup', label: 'Start Hosting', path: '/dashboard/vendor-upgrade', icon: StarIcon, section: 'Business', nonVendorOnly: true },
];

/**
 * Build filtered nav items for the current user context.
 * @param {object} ctx
 * @param {boolean} ctx.hasOrganizerAccess
 * @param {boolean} ctx.hasLiveOpsAccess
 * @param {boolean} ctx.isLiveEvent
 * @param {boolean} ctx.mounted
 * @param {{ isVendor?: boolean }} [ctx.user]
 * @returns {DashboardNavItem[]}
 */
export function buildMemberNavItems({ hasOrganizerAccess, hasLiveOpsAccess, isLiveEvent, mounted, user }) {
  const items = [...dashboardNavConfig];
  const hasResolvedUser = mounted && !!user;
  const hasResolvedVendorStatus = typeof user?.isVendor === 'boolean';

  return items.filter((item) => {
    const isRoleSensitive = item.vendorOnly || item.nonVendorOnly || item.organizerOnly || item.bouncerOnly || item.liveOnly;
    if (!hasResolvedUser && isRoleSensitive) return false;
    if (item.vendorOnly && !user?.isVendor) return false;
    if (item.nonVendorOnly && (!hasResolvedVendorStatus || user.isVendor)) return false;
    if (item.bouncerOnly && !hasLiveOpsAccess) return false;
    if (item.organizerOnly && !hasOrganizerAccess) return false;
    if (item.liveOnly && !isLiveEvent) return false;
    return true;
  });
}

/**
 * Resolve whether a nav path is active.
 * @param {string} pathname
 * @param {DashboardNavItem} item
 * @param {URLSearchParams|ReadonlyURLSearchParams} [searchParams]
 */
export function isNavItemActive(pathname, item, searchParams) {
  const path = item.path.split('?')[0];
  const currentView = searchParams?.get?.('view') || null;

  if (item.key === 'analytics') {
    return pathname === '/dashboard/analytics' && currentView !== 'live-ops';
  }
  if (item.key === 'operations') {
    return (pathname === path && currentView === 'live-ops') || pathname.startsWith('/dashboard/live-scan');
  }
  if (item.key === 'audience') {
    return pathname === '/dashboard/audience'
      || pathname.startsWith('/dashboard/organizer/audience')
      || pathname.startsWith('/dashboard/organizer/campaigns');
  }
  if (item.end) return pathname === path;
  return pathname.startsWith(`${item.path}/`) || pathname === item.path;
}

export const accountPopoverItems = [
  { id: 'settings', label: 'Settings', icon: UserCircleIcon },
  { id: 'signout', label: 'Sign Out', icon: Megaphone01Icon, tone: 'danger' },
];
