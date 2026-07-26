import {
  Activity01Icon,
  Calendar01Icon,
  DashboardSquare01Icon,
  FireIcon,
  FlagIcon,
  Megaphone01Icon,
  Mail01Icon,
  Notification03Icon,
  QrCodeIcon,
  FloorPlanIcon,
  Shield01Icon,
  StarIcon,
  UserCircleIcon,
  UserGroupIcon,
  Wallet01Icon,
} from '@hugeicons/core-free-icons';
import { isVendorUser } from '@/lib/accountTier';

export const ADMIN_SIDEBAR_MODE_KEY = 'pxi_dashboard_admin_ui_mode';

export const adminNavItems = [
  { key: 'admin-overview', label: 'Overview', path: '/dashboard/admin', icon: DashboardSquare01Icon, end: true },
  { key: 'admin-analytics', label: 'Analytics', path: '/dashboard/admin/analytics', icon: Activity01Icon, end: true },
  { key: 'admin-support', label: 'Support', path: '/dashboard/admin/support', icon: Shield01Icon, end: true },
  { key: 'admin-users', label: 'Accounts', path: '/dashboard/admin/users', icon: UserGroupIcon, end: true },
  { key: 'admin-events', label: 'Events', path: '/dashboard/admin/events', icon: Calendar01Icon, end: true },
  { key: 'admin-reports', label: 'Reports', path: '/dashboard/admin/reports', icon: FlagIcon, end: true },
  { key: 'admin-ugc', label: 'Content', path: '/dashboard/admin/ugc', icon: Notification03Icon, end: true },
  { key: 'admin-organizers', label: 'Organizers', path: '/dashboard/admin/organizers', icon: FireIcon, end: true },
  { key: 'admin-promos', label: 'Promos & Credits', path: '/dashboard/admin/promos', icon: StarIcon, end: true },
  { key: 'admin-ads', label: 'Ads', path: '/dashboard/admin/ads', icon: Megaphone01Icon, end: true },
  { key: 'admin-announcements', label: 'Announcements', path: '/dashboard/admin/announcements', icon: Megaphone01Icon, end: true },
];

/**
 * Config-driven member dashboard navigation (Phase 2+).
 * @typedef {object} DashboardNavItem
 * @property {string} key
 * @property {string} label
 * @property {string} path
 * @property {import('@hugeicons/core-free-icons').IconSvgObject} icon
 * @property {'Hub'|'Business'|'People'|'Intelligence'} [section]
 * @property {boolean} [end]
 * @property {boolean} [vendorOnly]
 * @property {boolean} [nonVendorOnly]
 * @property {boolean} [bouncerOnly]
 * @property {boolean} [liveOnly]
 * @property {'notifications'} [badge]
 */

/**
 * Everything below "My Events" is Diplomat (vendor) territory — a plain Citizen
 * sees the Hub only, and their Command Center pitches vendor setup instead.
 * Live Operations is the one exception: event staff (bouncers) are Citizens who
 * still need the scan console on the events they work.
 * @type {DashboardNavItem[]}
 */
export const dashboardNavConfig = [
  { key: 'command', label: 'Command Center', path: '/dashboard', icon: DashboardSquare01Icon, section: 'Hub', end: true },
  { key: 'events', label: 'My Events', path: '/dashboard/events', icon: Calendar01Icon, section: 'Hub', end: true },
  { key: 'earnings', label: 'Earnings', path: '/dashboard/earnings', icon: Wallet01Icon, section: 'Business', end: true, vendorOnly: true },
  { key: 'team', label: 'Teams & Security', path: '/dashboard/team', icon: Shield01Icon, section: 'Business', end: true, vendorOnly: true },
  { key: 'audience', label: 'CRM', path: '/dashboard/audience', icon: UserGroupIcon, section: 'People', end: true, vendorOnly: true },
  { key: 'ads', label: 'Ads Manager', path: '/dashboard/ads', icon: Megaphone01Icon, section: 'People', end: true, vendorOnly: true },
  { key: 'campaigns', label: 'Email Campaigns', path: '/dashboard/campaigns', icon: Mail01Icon, section: 'People', end: true, vendorOnly: true },
  { key: 'analytics', label: 'Analytics', path: '/dashboard/analytics', icon: Activity01Icon, section: 'Intelligence', end: true, vendorOnly: true },
  { key: 'operations', label: 'Live Operations', path: '/dashboard/analytics?view=live-ops', icon: QrCodeIcon, section: 'Intelligence', end: true, bouncerOnly: true },
  { key: 'floor-plans', label: 'Venues', path: '/dashboard/floor-plans', icon: FloorPlanIcon, section: 'Intelligence', end: true, vendorOnly: true },
];

/**
 * Routes the sidebar hides from Citizens. Typing one in by hand bounces back to
 * the Command Center — the backend re-checks anyway, this just avoids dead ends.
 * `/dashboard/analytics?view=live-ops` is handled separately by live-ops access.
 */
export const VENDOR_ONLY_ROUTE_PREFIXES = [
  '/dashboard/analytics',
  '/dashboard/audience',
  '/dashboard/ads',
  '/dashboard/campaigns',
  '/dashboard/earnings',
  '/dashboard/floor-plans',
  '/dashboard/team',
  '/dashboard/organizer',
];

/** @param {string} pathname */
export function isVendorOnlyRoute(pathname) {
  return VENDOR_ONLY_ROUTE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

/**
 * Build filtered nav items for the current user context.
 * @param {object} ctx
 * @param {boolean} ctx.hasLiveOpsAccess
 * @param {boolean} ctx.isLiveEvent
 * @param {boolean} ctx.mounted
 * @param {{ isVendor?: boolean }} [ctx.user]
 * @returns {DashboardNavItem[]}
 */
export function buildMemberNavItems({ hasLiveOpsAccess, isLiveEvent, mounted, user }) {
  const items = [...dashboardNavConfig];
  const hasResolvedUser = mounted && !!user;
  const hasResolvedVendorStatus = typeof user?.isVendor === 'boolean';
  const vendor = isVendorUser(user);

  return items.filter((item) => {
    const isRoleSensitive = item.vendorOnly || item.nonVendorOnly || item.bouncerOnly || item.liveOnly;
    if (!hasResolvedUser && isRoleSensitive) return false;
    if (item.vendorOnly && !vendor) return false;
    if (item.nonVendorOnly && (!hasResolvedVendorStatus || vendor)) return false;
    if (item.bouncerOnly && !hasLiveOpsAccess) return false;
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
    return pathname === '/dashboard/audience' || pathname.startsWith('/dashboard/organizer/audience');
  }
  if (item.end) return pathname === path;
  return pathname.startsWith(`${item.path}/`) || pathname === item.path;
}

export const accountPopoverItems = [
  { id: 'settings', label: 'Settings', icon: UserCircleIcon },
  { id: 'signout', label: 'Sign Out', icon: Megaphone01Icon, tone: 'danger' },
];
