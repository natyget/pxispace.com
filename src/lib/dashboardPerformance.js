export const DASHBOARD_LOADING_DELAYS = {
  skeletonMinMs: 180,
  optimisticNavMs: 120,
};

export const DASHBOARD_PREFETCH_ROUTES = [
  '/dashboard',
  '/dashboard/events',
  '/dashboard/analytics',
  '/dashboard/audience',
  '/dashboard/ads',
  '/dashboard/team',
  '/dashboard/account',
  '/dashboard/earnings',
];

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
