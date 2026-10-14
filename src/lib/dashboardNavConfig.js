import {
  Activity01Icon,
  Briefcase01Icon,
  IdentityCardIcon,
  InboxIcon,
  GlobalIcon,
  ChartIncreaseIcon,
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
import { canHostEvents, isVendorUser } from '@/lib/accountTier';

export const ADMIN_SIDEBAR_MODE_KEY = 'pxi_dashboard_admin_ui_mode';

/**
 * Dashboard 2: the control room's top tabs, in order of what needs a person first. Today is the inbox; Growth is
 * the organizer side of the business (who brought whom in, who is selling, what the team earns); Platform is the
 * marketplace; Trust is support and safety. `globalOnly` sections are hidden from a city-scoped admin (the backend
 * refuses them with CITY_SCOPE_NOT_PERMITTED).
 */
export const ADMIN_TABS = [
  { key: 'Today', label: 'Today', icon: InboxIcon },
  { key: 'Growth', label: 'Growth', icon: ChartIncreaseIcon },
  { key: 'Platform', label: 'Platform', icon: GlobalIcon },
  { key: 'Trust', label: 'Trust', icon: Shield01Icon },
];

export const adminNavItems = [
  { key: 'admin-inbox', label: 'Inbox', path: '/dashboard/admin', icon: InboxIcon, tab: 'Today', end: true, minRole: 'SUPPORT' },
  { key: 'admin-alerts', label: 'Email alerts', path: '/dashboard/admin/alerts', icon: Mail01Icon, tab: 'Today', end: true, minRole: 'SUPPORT' },
  { key: 'admin-organizers', label: 'Organizers', path: '/dashboard/admin/organizers', icon: FireIcon, tab: 'Growth', end: true, minRole: 'ADMIN' },
  { key: 'admin-claims', label: 'Claims', path: '/dashboard/admin/claims', icon: Briefcase01Icon, tab: 'Growth', end: true, minRole: 'ADMIN' },
  { key: 'admin-commissions', label: 'Commissions', path: '/dashboard/admin/commissions', icon: Wallet01Icon, tab: 'Growth', end: true, minRole: 'ADMIN', cityNeedsManager: true },
  { key: 'admin-venues', label: 'Venues', path: '/dashboard/admin/venues', icon: FloorPlanIcon, tab: 'Growth', end: true, minRole: 'ADMIN' },
  { key: 'admin-promos', label: 'Promos & credits', path: '/dashboard/admin/promos', icon: StarIcon, tab: 'Growth', end: true, globalOnly: true, minRole: 'ADMIN' },
  { key: 'admin-analytics', label: 'Analytics', path: '/dashboard/admin/analytics', icon: Activity01Icon, tab: 'Platform', end: true, minRole: 'ADMIN' },
  { key: 'admin-events', label: 'Events', path: '/dashboard/admin/events', icon: Calendar01Icon, tab: 'Platform', end: true },
  { key: 'admin-users', label: 'Accounts', path: '/dashboard/admin/users', icon: UserGroupIcon, tab: 'Platform', end: true },
  { key: 'admin-ads', label: 'Ads', path: '/dashboard/admin/ads', icon: Megaphone01Icon, tab: 'Platform', end: true, globalOnly: true, minRole: 'ADMIN' },
  { key: 'admin-announcements', label: 'Announcements', path: '/dashboard/admin/announcements', icon: Megaphone01Icon, tab: 'Platform', end: true, globalOnly: true, minRole: 'ADMIN' },
  { key: 'admin-support', label: 'Support', path: '/dashboard/admin/support', icon: Shield01Icon, tab: 'Trust', end: true, globalOnly: true, minRole: 'SUPPORT' },
  { key: 'admin-reports', label: 'Reports', path: '/dashboard/admin/reports', icon: FlagIcon, tab: 'Trust', end: true, globalOnly: true, minRole: 'MODERATOR' },
  { key: 'admin-ugc', label: 'Content', path: '/dashboard/admin/ugc', icon: Notification03Icon, tab: 'Trust', end: true, globalOnly: true, minRole: 'MODERATOR' },
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
export function buildAdminNavItems({ cityScope, adminRole, salesRole } = {}) {
  return adminNavItems.filter(
    (item) =>
      (!cityScope || !item.globalOnly) &&
      // A city admin sees Commissions when they are also the city's regional manager (it shows their own earnings).
      (!cityScope || !item.cityNeedsManager || salesRole === 'REGIONAL_MANAGER') &&
      adminRoleMeets(adminRole, item.minRole),
  );
}

const ADMIN_ROLE_RANK = { NONE: 0, SUPPORT: 1, MODERATOR: 2, ADMIN: 3, SUPER_ADMIN: 4 };

/** Dashboard 2: a section's minimum control-room role (the backend's own gate; hidden so nobody meets a 403 page). */
function adminRoleMeets(role, min) {
  if (!min || !role) return true;
  return (ADMIN_ROLE_RANK[role] ?? 0) >= (ADMIN_ROLE_RANK[min] ?? 0);
}

/**
 * The control room's top tabs for this admin, each with the sub-items it shows. Tabs left with nothing (Trust for a
 * city admin) are dropped. Same shape as buildMemberTabs, so DashboardTabs renders both.
 * @param {{ cityScope?: string|null, adminRole?: string|null, salesRole?: string|null }} ctx
 */
export function buildAdminTabs({ cityScope, adminRole, salesRole } = {}) {
  const items = buildAdminNavItems({ cityScope, adminRole, salesRole });
  return ADMIN_TABS.map((tab) => ({
    ...tab,
    locked: false,
    items: items.filter((item) => item.tab === tab.key).map((item) => ({ ...item, locked: false })),
  })).filter((tab) => tab.items.length > 0);
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
 * @property {'Hub'|'Insights'|'Operations'|'Engagement'|'Sales'|'Today'|'Growth'|'Platform'|'Trust'} [tab] top-bar tab
 * @property {boolean} [end]
 * @property {boolean} [vendorOnly]
 * @property {boolean} [nonVendorOnly]
 * @property {boolean} [bouncerOnly]
 * @property {boolean} [liveOnly]
 * @property {boolean} [salesOnly] ambassadors and regional managers (PART-4)
 * @property {boolean} [managerOnly] regional managers only (GROWTH: their team and its splits)
 * @property {boolean} [hostOnly] accounts that can host events (Citizen and Diplomat; GROWTH: the organizer page)
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
  { key: 'organizer-page', label: 'Organizer page', path: '/dashboard/organizer-page', icon: IdentityCardIcon, section: 'Hub', tab: 'Hub', end: true, hostOnly: true },
  { key: 'analytics', label: 'Analytics', path: '/dashboard/analytics', icon: Activity01Icon, section: 'Intelligence', tab: 'Insights', end: true, vendorOnly: true },
  { key: 'earnings', label: 'Earnings', path: '/dashboard/earnings', icon: Wallet01Icon, section: 'Business', tab: 'Insights', end: true, vendorOnly: true },
  { key: 'operations', label: 'Live Operations', path: '/dashboard/analytics?view=live-ops', icon: QrCodeIcon, section: 'Intelligence', tab: 'Operations', end: true, bouncerOnly: true },
  { key: 'team', label: 'Teams', path: '/dashboard/team', icon: Shield01Icon, section: 'Business', tab: 'Operations', end: true, vendorOnly: true },
  { key: 'floor-plans', label: 'Floor plans', path: '/dashboard/floor-plans', icon: FloorPlanIcon, section: 'Intelligence', tab: 'Operations', end: true, vendorOnly: true, floorPlansOnly: true },
  { key: 'venue', label: 'My Venue', path: '/dashboard/venue', icon: FloorPlanIcon, section: 'Hub', tab: 'Operations', end: true, venueOwnerOnly: true },
  { key: 'audience', label: 'Audience', path: '/dashboard/audience', icon: UserGroupIcon, section: 'People', tab: 'Engagement', end: true, vendorOnly: true },
  { key: 'campaigns', label: 'Campaigns', path: '/dashboard/campaigns', icon: Mail01Icon, section: 'People', tab: 'Engagement', end: true, vendorOnly: true },
  { key: 'ads', label: 'Ads', path: '/dashboard/ads', icon: Megaphone01Icon, section: 'People', tab: 'Engagement', end: true, vendorOnly: true },
  // GROWTH: the sales team's own tab (ambassadors and regional managers). The backend scopes every number.
  { key: 'sales-today', label: 'Today', path: '/dashboard/sales', icon: InboxIcon, section: 'Hub', tab: 'Sales', end: true, salesOnly: true },
  { key: 'sales-accounts', label: 'Accounts', path: '/dashboard/sales/accounts', icon: UserGroupIcon, section: 'Hub', tab: 'Sales', end: true, salesOnly: true },
  { key: 'sales-claims', label: 'Claims', path: '/dashboard/sales/claims', icon: Briefcase01Icon, section: 'Hub', tab: 'Sales', end: true, salesOnly: true },
  { key: 'sales-earnings', label: 'Earnings', path: '/dashboard/sales/earnings', icon: Wallet01Icon, section: 'Hub', tab: 'Sales', end: true, salesOnly: true },
  { key: 'sales-team', label: 'Team', path: '/dashboard/sales/team', icon: UserMultiple02Icon, section: 'Hub', tab: 'Sales', end: true, salesOnly: true, managerOnly: true },
];

/**
 * The member top-bar tabs, in order. Each sub-item sits under one of these via `tab`.
 * @type {{ key: 'Hub'|'Insights'|'Operations'|'Engagement'|'Sales', label: string, icon: import('@hugeicons/core-free-icons').IconSvgObject }[]}
 */
export const DASHBOARD_TABS = [
  { key: 'Hub', label: 'Hub', icon: Home01Icon },
  { key: 'Insights', label: 'Insights', icon: ChartLineData01Icon },
  { key: 'Operations', label: 'Operations', icon: Layers01Icon },
  { key: 'Engagement', label: 'Engagement', icon: UserMultiple02Icon },
  { key: 'Sales', label: 'Sales', icon: Briefcase01Icon },
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
 * @param {'AMBASSADOR'|'REGIONAL_MANAGER'|null} [ctx.salesRole]
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
function memberItemState(item, { hasLiveOpsAccess, isLiveEvent, mounted, user, hasSalesAccess = false, salesRole = null, isVenueOwner = false, canOpenFloorPlans = false }) {
  const hasResolvedUser = mounted && !!user;
  const hasResolvedVendorStatus = typeof user?.isVendor === 'boolean';
  const vendor = isVendorUser(user);
  const isRoleSensitive = item.vendorOnly || item.nonVendorOnly || item.bouncerOnly || item.liveOnly || item.salesOnly || item.managerOnly || item.hostOnly || item.venueOwnerOnly || item.floorPlansOnly;

  if (!hasResolvedUser && isRoleSensitive) return MEMBER_ITEM_HIDDEN;
  if (item.nonVendorOnly && (!hasResolvedVendorStatus || vendor)) return MEMBER_ITEM_HIDDEN;
  if (item.bouncerOnly && !hasLiveOpsAccess) return MEMBER_ITEM_HIDDEN;
  if (item.liveOnly && !isLiveEvent) return MEMBER_ITEM_HIDDEN;
  if (item.salesOnly && !hasSalesAccess) return MEMBER_ITEM_HIDDEN;
  if (item.managerOnly && salesRole !== 'REGIONAL_MANAGER') return MEMBER_ITEM_HIDDEN;
  if (item.hostOnly && !canHostEvents(user)) return MEMBER_ITEM_HIDDEN;
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
