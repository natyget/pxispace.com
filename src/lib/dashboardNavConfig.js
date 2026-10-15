import {
  Activity01Icon,
  Calendar01Icon,
  ChartLineData01Icon,
  DashboardSquare01Icon,
  FireIcon,
  FlagIcon,
  Home01Icon,
  Layers01Icon,
  Megaphone01Icon,
  Mail01Icon,
  Notification03Icon,
  QrCodeIcon,
  FloorPlanIcon,
  Shield01Icon,
  StarIcon,
  UserCircleIcon,
  UserGroupIcon,
  UserMultiple02Icon,
  Wallet01Icon,
} from '@hugeicons/core-free-icons';
import { isVendorUser } from '@/lib/accountTier';

export const ADMIN_SIDEBAR_MODE_KEY = 'pxi_dashboard_admin_ui_mode';

export const adminNavItems = [
  { key: 'admin-overview', label: 'Overview', path: '/dashboard/admin', icon: DashboardSquare01Icon, end: true },
  { key: 'admin-analytics', label: 'Analytics', path: '/dashboard/admin/analytics', icon: Activity01Icon, end: true },
  { key: 'admin-support', label: 'Support', path: '/dashboard/admin/support', icon: Shield01Icon, end: true, globalOnly: true },
  { key: 'admin-users', label: 'Accounts', path: '/dashboard/admin/users', icon: UserGroupIcon, end: true },
  { key: 'admin-events', label: 'Events', path: '/dashboard/admin/events', icon: Calendar01Icon, end: true },
  { key: 'admin-reports', label: 'Reports', path: '/dashboard/admin/reports', icon: FlagIcon, end: true, globalOnly: true },
  { key: 'admin-ugc', label: 'Content', path: '/dashboard/admin/ugc', icon: Notification03Icon, end: true, globalOnly: true },
  { key: 'admin-organizers', label: 'Organizers', path: '/dashboard/admin/organizers', icon: FireIcon, end: true },
  { key: 'admin-venues', label: 'Venues', path: '/dashboard/admin/venues', icon: FloorPlanIcon, end: true },
  { key: 'admin-promos', label: 'Promos & Credits', path: '/dashboard/admin/promos', icon: StarIcon, end: true, globalOnly: true },
  { key: 'admin-ads', label: 'Ads', path: '/dashboard/admin/ads', icon: Megaphone01Icon, end: true, globalOnly: true },
  { key: 'admin-announcements', label: 'Announcements', path: '/dashboard/admin/announcements', icon: Megaphone01Icon, end: true, globalOnly: true },
];

const CITY_LABELS = { NYC: 'New York', BOS: 'Boston' };

/** "New York" for 'NYC'; the code itself for anything unknown. */
export function cityLabel(code) {
  return CITY_LABELS[code] || code || '';
}

/**
 * PART-4: sections a city-scoped admin cannot use. The backend refuses them (CITY_SCOPE_NOT_PERMITTED); the
 * sidebar hides them so the admin does not meet a page of errors.
 * @param {{ cityScope?: string|null }} ctx
 */
export function buildAdminNavItems({ cityScope } = {}) {
  return cityScope ? adminNavItems.filter((item) => !item.globalOnly) : adminNavItems;
}

/** @param {string} pathname */
export function isGlobalOnlyAdminPath(pathname) {
  return adminNavItems.some((item) => item.globalOnly && (pathname === item.path || pathname?.startsWith(`${item.path}/`)));
}

/**
 * Config-driven member dashboard navigation (Phase 2+).
 * @typedef {object} DashboardNavItem
 * @property {string} key
 * @property {string} label
 * @property {string} path
 * @property {import('@hugeicons/core-free-icons').IconSvgObject} icon
 * @property {'Hub'|'Business'|'People'|'Intelligence'} [section] sidebar group label (admin and legacy sidebars)
 * @property {'Hub'|'Insights'|'Operations'|'Engagement'} [tab] member top-bar tab (buildMemberTabs)
 * @property {boolean} [end]
 * @property {boolean} [vendorOnly]
 * @property {boolean} [nonVendorOnly]
 * @property {boolean} [bouncerOnly]
 * @property {boolean} [liveOnly]
 * @property {boolean} [salesOnly] ambassadors and regional managers (PART-4)
 * @property {boolean} [venueOwnerOnly] accounts that own a claimed venue (VEN-8)
 * @property {boolean} [floorPlansOnly] venue accounts, and accounts that already hold a saved venue (PART-3)
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
  { key: 'command', label: 'Command Center', path: '/dashboard', icon: DashboardSquare01Icon, section: 'Hub', tab: 'Hub', end: true },
  { key: 'events', label: 'Events', path: '/dashboard/events', icon: Calendar01Icon, section: 'Hub', tab: 'Hub', end: true },
  { key: 'analytics', label: 'Analytics', path: '/dashboard/analytics', icon: Activity01Icon, section: 'Intelligence', tab: 'Insights', end: true, vendorOnly: true },
  { key: 'earnings', label: 'Earnings', path: '/dashboard/earnings', icon: Wallet01Icon, section: 'Business', tab: 'Insights', end: true, vendorOnly: true },
  { key: 'operations', label: 'Live Operations', path: '/dashboard/analytics?view=live-ops', icon: QrCodeIcon, section: 'Intelligence', tab: 'Operations', end: true, bouncerOnly: true },
  { key: 'team', label: 'Teams', path: '/dashboard/team', icon: Shield01Icon, section: 'Business', tab: 'Operations', end: true, vendorOnly: true },
  { key: 'floor-plans', label: 'Floor plans', path: '/dashboard/floor-plans', icon: FloorPlanIcon, section: 'Intelligence', tab: 'Operations', end: true, vendorOnly: true, floorPlansOnly: true },
  { key: 'venue', label: 'My Venue', path: '/dashboard/venue', icon: FloorPlanIcon, section: 'Hub', tab: 'Operations', end: true, venueOwnerOnly: true },
  { key: 'sales', label: 'Venue Claims', path: '/dashboard/sales', icon: FloorPlanIcon, section: 'Hub', tab: 'Operations', end: true, salesOnly: true },
  { key: 'audience', label: 'Audience', path: '/dashboard/audience', icon: UserGroupIcon, section: 'People', tab: 'Engagement', end: true, vendorOnly: true },
  { key: 'campaigns', label: 'Campaigns', path: '/dashboard/campaigns', icon: Mail01Icon, section: 'People', tab: 'Engagement', end: true, vendorOnly: true },
  { key: 'ads', label: 'Ads', path: '/dashboard/ads', icon: Megaphone01Icon, section: 'People', tab: 'Engagement', end: true, vendorOnly: true },
];

/**
 * The member top-bar tabs, in order. Each sub-item sits under one of these via `tab`.
 * @type {{ key: 'Hub'|'Insights'|'Operations'|'Engagement', label: string, icon: import('@hugeicons/core-free-icons').IconSvgObject }[]}
 */
export const DASHBOARD_TABS = [
  { key: 'Hub', label: 'Hub', icon: Home01Icon },
  { key: 'Insights', label: 'Insights', icon: ChartLineData01Icon },
  { key: 'Operations', label: 'Operations', icon: Layers01Icon },
  { key: 'Engagement', label: 'Engagement', icon: UserMultiple02Icon },
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

const MEMBER_ITEM_HIDDEN = 'hidden';
const MEMBER_ITEM_LOCKED = 'locked';
const MEMBER_ITEM_OPEN = 'open';

/**
 * Build filtered nav items for the current user context.
 * @param {object} ctx
 * @param {boolean} ctx.hasLiveOpsAccess
 * @param {boolean} ctx.isLiveEvent
 * @param {boolean} ctx.mounted
 * @param {boolean} [ctx.hasSalesAccess]
 * @param {boolean} [ctx.isVenueOwner]
 * @param {boolean} [ctx.canOpenFloorPlans]
 * @param {{ isVendor?: boolean }} [ctx.user]
 * @returns {DashboardNavItem[]}
 */
export function buildMemberNavItems(ctx) {
  return dashboardNavConfig.filter((item) => memberItemState(item, ctx) === MEMBER_ITEM_OPEN);
}

/**
 * Hidden: the account can never use it (venue owner, sales, floor plans, bouncer without access).
 * Locked: a vendor-only page a non-vendor still sees, with a lock in the tab bar.
 * @returns {'hidden'|'locked'|'open'}
 */
function memberItemState(item, { hasLiveOpsAccess, isLiveEvent, mounted, user, hasSalesAccess = false, isVenueOwner = false, canOpenFloorPlans = false }) {
  const hasResolvedUser = mounted && !!user;
  const hasResolvedVendorStatus = typeof user?.isVendor === 'boolean';
  const vendor = isVendorUser(user);
  const isRoleSensitive = item.vendorOnly || item.nonVendorOnly || item.bouncerOnly || item.liveOnly || item.salesOnly || item.venueOwnerOnly || item.floorPlansOnly;

  if (!hasResolvedUser && isRoleSensitive) return MEMBER_ITEM_HIDDEN;
  if (item.nonVendorOnly && (!hasResolvedVendorStatus || vendor)) return MEMBER_ITEM_HIDDEN;
  if (item.bouncerOnly && !hasLiveOpsAccess) return MEMBER_ITEM_HIDDEN;
  if (item.liveOnly && !isLiveEvent) return MEMBER_ITEM_HIDDEN;
  if (item.salesOnly && !hasSalesAccess) return MEMBER_ITEM_HIDDEN;
  if (item.venueOwnerOnly && !isVenueOwner) return MEMBER_ITEM_HIDDEN;
  if (item.floorPlansOnly && !canOpenFloorPlans) return MEMBER_ITEM_HIDDEN;
  if (item.vendorOnly && !vendor) return MEMBER_ITEM_LOCKED;
  return MEMBER_ITEM_OPEN;
}

/**
 * Top-bar tabs for a member. Vendor-only sub-items stay visible for non-vendors with `locked: true`; everything
 * else that the account cannot use is dropped. A tab is `locked` only when every visible sub-item is locked.
 * Tabs with no visible sub-items are left out.
 * Takes the same context as buildMemberNavItems.
 * @returns {{ key: string, label: string, icon: object, locked: boolean, items: (DashboardNavItem & { locked: boolean })[] }[]}
 */
export function buildMemberTabs(ctx) {
  return DASHBOARD_TABS.map((tab) => {
    const items = dashboardNavConfig
      .filter((item) => item.tab === tab.key)
      .map((item) => ({ item, state: memberItemState(item, ctx) }))
      .filter(({ state }) => state !== MEMBER_ITEM_HIDDEN)
      .map(({ item, state }) => ({ ...item, locked: state === MEMBER_ITEM_LOCKED }));
    return { ...tab, items, locked: items.length > 0 && items.every((item) => item.locked) };
  }).filter((tab) => tab.items.length > 0);
}

/**
 * The tab whose sub-item matches the current route, or null (passport, notifications, account and other pages
 * outside the nav).
 * @param {string} pathname
 * @param {URLSearchParams|ReadonlyURLSearchParams} [searchParams]
 * @param {ReturnType<typeof buildMemberTabs>} tabs
 */
export function activeTabFor(pathname, searchParams, tabs) {
  return tabs.find((tab) => tab.items.some((item) => isNavItemActive(pathname, item, searchParams))) || null;
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
