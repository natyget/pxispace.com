export const DASHBOARD_LOADING_DELAYS = {
  skeletonMinMs: 180,
  optimisticNavMs: 120,
};

/** Routes every dashboard member can reach. */
export const DASHBOARD_PREFETCH_ROUTES = [
  '/dashboard',
  '/dashboard/events',
  '/dashboard/account',
];

/** Diplomat-only surfaces — no point shipping these chunks to a Citizen. */
export const VENDOR_PREFETCH_ROUTES = [
  '/dashboard/analytics',
  '/dashboard/audience',
  '/dashboard/ads',
  '/dashboard/team',
  '/dashboard/earnings',
];

/** @param {{ isVendor?: boolean }} ctx */
export function dashboardPrefetchRoutes({ isVendor } = {}) {
  return isVendor
    ? [...DASHBOARD_PREFETCH_ROUTES, ...VENDOR_PREFETCH_ROUTES]
    : [...DASHBOARD_PREFETCH_ROUTES, '/dashboard/vendor-upgrade'];
}

export function prefetchDashboardRoutes(router, routes = DASHBOARD_PREFETCH_ROUTES) {
  if (!router?.prefetch) return;
  routes.forEach((route) => {
    try {
      router.prefetch(route);
    } catch {
      // Prefetch should never block the UX path.
    }
  });
}
