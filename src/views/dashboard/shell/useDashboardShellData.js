'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { authService, authStorage } from '@/services/auth';
import { canAccessAdminDashboard } from '@/lib/adminAccess';
import { isVendorUser } from '@/lib/accountTier';
import { dashboardShellActions, useDashboardShellStore } from '@/lib/dashboardShellStore';
import { dashboardPrefetchRoutes, prefetchDashboardRoutes } from '@/lib/dashboardPerformance';
import { useCapabilities, useEvents } from '@/lib/dashboardStore';
import {
    ADMIN_SIDEBAR_MODE_KEY,
    buildAdminNavItems,
    buildMemberNavItems,
    isNavItemActive,
    isVendorOnlyRoute,
    dashboardNavConfig,
} from '@/lib/dashboardNavConfig';
import { fetchAdminWhoami } from '@/services/admin';
import { fetchSalesAccess } from '@/services/sales';
import { fetchMyVenues } from '@/services/venues';
import { listFloorPlans } from '@/services/floorPlans';
import { floorPlanAccess } from '@/lib/floorPlanAccess';

function shouldClearAuth(error) {
    const status = error?.status;
    const code = error?.code;
    return status === 401 || status === 403 || status === 404 || code === 'ACCOUNT_DELETED' || code === 'INVALID_TOKEN';
}

function deferDashboardState(callback) {
    if (typeof queueMicrotask === 'function') {
        queueMicrotask(callback);
        return;
    }
    setTimeout(callback, 0);
}

/**
 * Everything the dashboard shell needs to know about the user, the route and the nav. No JSX here: the
 * admin and member shells render it.
 *
 * routeGate says what the page area shows instead of children:
 * - 'pending': roles or live-ops access are still resolving. Show a skeleton; do not mount the page.
 * - 'vendor': a member opened a vendor-only page. Show TierLock requirement="vendor".
 * - 'bouncer': a non-bouncer opened live ops. Show TierLock requirement="bouncer".
 * - null: render children.
 * Admin mode keeps the old behaviour (redirects), so routeGate is null there.
 */
export function useDashboardShellData() {
    const { user, authReady, authRefreshing, logout, updateUser, phoneVerificationRequired } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const fromMobile = searchParams.get('from') === 'mobile';
    const [menuOpen, setMenuOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [phoneCheckDone, setPhoneCheckDone] = useState(false);
    const [liveNow, setLiveNow] = useState(0);
    const { capabilities, refresh: refreshCapabilities } = useCapabilities();
    const { events: shellEvents } = useEvents({ limit: 100, offset: 0 });
    const vendorStatusCheckedUserRef = useRef(null);

    useEffect(() => {
        const frame = requestAnimationFrame(() => setMounted(true));
        return () => cancelAnimationFrame(frame);
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const mq = window.matchMedia('(max-width: 767px)');
        const syncMobileSidebar = () => {
            if (mq.matches) dashboardShellActions.setSidebarCollapsed(false);
        };
        syncMobileSidebar();
        mq.addEventListener('change', syncMobileSidebar);
        return () => mq.removeEventListener('change', syncMobileSidebar);
    }, []);

    // Tablet tier (768–1023px): default to the 72px rail so content keeps room —
    // the collapse toggle still lets the user expand; widening to desktop restores it.
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const mq = window.matchMedia('(min-width: 768px) and (max-width: 1023px)');
        const syncTabletSidebar = (e) => {
            if (e.matches) dashboardShellActions.setSidebarCollapsed(true);
            else if (window.innerWidth >= 1024) dashboardShellActions.setSidebarCollapsed(false);
        };
        syncTabletSidebar(mq);
        mq.addEventListener('change', syncTabletSidebar);
        return () => mq.removeEventListener('change', syncTabletSidebar);
    }, []);

    useEffect(() => {
        if (!mounted) return undefined;
        const initialTimer = setTimeout(() => setLiveNow(Date.now()), 0);
        const intervalTimer = setInterval(() => setLiveNow(Date.now()), 60_000);
        return () => {
            clearTimeout(initialTimer);
            clearInterval(intervalTimer);
        };
    }, [mounted]);

    useEffect(() => {
        if (!mounted || typeof window === 'undefined') return undefined;
        const handleRefresh = () => refreshCapabilities();
        window.addEventListener('pxi:capabilities-refresh', handleRefresh);
        return () => window.removeEventListener('pxi:capabilities-refresh', handleRefresh);
    }, [mounted, refreshCapabilities]);

    const rolesReady = mounted && authReady && !authRefreshing;

    useEffect(() => {
        if (!mounted || !authReady || !user?.id) return;
        // Server isn't enforcing phones right now — nothing to check (re-runs if the flag flips).
        if (!phoneVerificationRequired) return;
        if (user.phoneNumber || fromMobile) {
            deferDashboardState(() => setPhoneCheckDone(true));
            return;
        }
        if (!phoneCheckDone) {
            deferDashboardState(() => setPhoneCheckDone(true));
            authService.getMe(user.id)
                .then(({ user: fresh }) => {
                    if (fresh.phoneNumber) {
                        updateUser(fresh);
                    } else {
                        router.replace('/verify-phone');
                    }
                })
                .catch(async (error) => {
                    if (shouldClearAuth(error)) {
                        await logout();
                        router.replace('/');
                    }
                });
        }
    }, [mounted, authReady, user?.id, user?.phoneNumber, fromMobile, phoneCheckDone, phoneVerificationRequired, router, updateUser, logout]);

    useEffect(() => {
        if (!rolesReady || !user?.id || isVendorUser(user) || vendorStatusCheckedUserRef.current === user.id) return;
        vendorStatusCheckedUserRef.current = user.id;
        authService.checkVendorStatus()
            .then(async (result) => {
                if (!result?.isVendor) return;
                if (result.token) {
                    await authStorage.save({ token: result.token, user: { ...user, isVendor: true } });
                }
                updateUser({ isVendor: true });
                refreshCapabilities({ force: true });
            })
            .catch(() => {
                /* Vendor status is opportunistic; keep the current session state if unavailable. */
            });
    }, [refreshCapabilities, rolesReady, updateUser, user]);

    const hasLiveEvent = useMemo(() => {
        if (!mounted || !user?.id) return false;
        return (shellEvents || []).some((event) => {
            const status = String(event?.status || '').toUpperCase();
            if (status === 'LIVE' || status === 'ACTIVE') return true;
            const startMs = event.startDate ? new Date(event.startDate).getTime() : 0;
            const endMs = event.endDate ? new Date(event.endDate).getTime() : 0;
            return startMs && startMs <= liveNow && (!endMs || endMs >= liveNow);
        });
    }, [liveNow, mounted, shellEvents, user?.id]);

    useEffect(() => {
        dashboardShellActions.setIsLiveEvent(hasLiveEvent);
    }, [hasLiveEvent]);

    const isVendor = rolesReady && isVendorUser(user);
    const hasLiveOpsAccess = capabilities.hasBouncerAccess || isVendor;
    // Live Operations rides on /dashboard/analytics?view=live-ops, so it has to be
    // carved out of the vendor gate — bouncers are Citizens who still scan tickets.
    const onLiveOpsSurface = pathname.startsWith('/dashboard/live-scan')
        || (pathname === '/dashboard/analytics' && searchParams.get('view') === 'live-ops');

    useEffect(() => {
        if (!rolesReady) return;
        prefetchDashboardRoutes(router, dashboardPrefetchRoutes({ isVendor }));
    }, [rolesReady, isVendor, router]);

    useEffect(() => {
        dashboardShellActions.setAccountPopoverOpen(false);
    }, [pathname]);

    const sidebarCollapsed = useDashboardShellStore((store) => store.sidebarCollapsed);
    const accountPopoverOpen = useDashboardShellStore((store) => store.accountPopoverOpen);
    const modalStack = useDashboardShellStore((store) => store.modalStack);
    const routeAdminMode = pathname.startsWith('/dashboard/admin') ? 'admin' : 'user';
    const [adminSidebarMode, setAdminSidebarMode] = useState(routeAdminMode);

    useEffect(() => {
        if (!rolesReady || typeof window === 'undefined') return;
        if (!canAccessAdminDashboard(user)) return;
        deferDashboardState(() => setAdminSidebarMode(routeAdminMode));
        try {
            window.localStorage.setItem(ADMIN_SIDEBAR_MODE_KEY, routeAdminMode);
        } catch {
            /* ignore */
        }
    }, [rolesReady, routeAdminMode, user]);

    const setAdminSidebarModeAndNavigate = (mode) => {
        setAdminSidebarMode(mode);
        try {
            window.localStorage.setItem(ADMIN_SIDEBAR_MODE_KEY, mode);
        } catch {
            /* ignore */
        }
        if (mode === 'user' && pathname.startsWith('/dashboard/admin')) {
            router.replace('/dashboard');
        } else if (mode === 'admin' && !pathname.startsWith('/dashboard/admin')) {
            router.replace('/dashboard/admin');
        }
    };

    const handleLogout = () => {
        logout();
        dashboardShellActions.closeTopLayer();
        dashboardShellActions.setAccountPopoverOpen(false);
        router.replace('/');
    };

    const showDevCaps = searchParams.get('debugCaps') === '1';

    const handleAccountNavigate = (target) => {
        const targetPathMap = {
            settings: '/dashboard/account?tab=profile',
        };
        const nextPath = targetPathMap[target];
        if (nextPath) router.push(nextPath);
    };

    const isAdminNav = rolesReady && canAccessAdminDashboard(user) && adminSidebarMode === 'admin';
    const isAdminUser = rolesReady && canAccessAdminDashboard(user);

    // Admin mode keeps the old redirects. Members (and admins in Workspace mode) get the locked-state gates below.
    useEffect(() => {
        if (!rolesReady || !isAdminNav) return;
        if (onLiveOpsSurface) {
            if (!capabilities.loading && capabilities.determined && !hasLiveOpsAccess) router.replace('/dashboard');
            return;
        }
        // WEB-2: say why. /403 names the reason and offers the upgrade, which is the actual way in.
        if (!isVendor && isVendorOnlyRoute(pathname)) router.replace('/403?reason=vendor');
    }, [rolesReady, isAdminNav, pathname, capabilities.loading, capabilities.determined, hasLiveOpsAccess, isVendor, onLiveOpsSurface, router]);

    // PART-4: a city-scoped admin's sidebar leaves out central sections, and staff with a sales role get
    // Venue Claims. Both come from the backend, which re-checks on every request.
    const [adminCityScope, setAdminCityScope] = useState(null);
    const [hasSalesAccess, setHasSalesAccess] = useState(false);
    // VEN-8: the venue section appears only while this account owns a venue; a revoked claim removes it.
    const [isVenueOwner, setIsVenueOwner] = useState(false);
    // PART-3: Venues (floor plans) is offered to venue accounts, and to an account that already holds one.
    const [canOpenFloorPlans, setCanOpenFloorPlans] = useState(false);
    useEffect(() => {
        if (!isAdminNav) return undefined;
        let cancelled = false;
        fetchAdminWhoami()
            .then((data) => { if (!cancelled) setAdminCityScope(data?.cityScope ?? null); })
            .catch(() => { if (!cancelled) setAdminCityScope(null); });
        return () => { cancelled = true; };
    }, [isAdminNav]);
    useEffect(() => {
        if (!rolesReady || !user?.id) return undefined;
        let cancelled = false;
        // /access answers 200 for everyone, so people without a sales role no longer log a 403 on every page.
        fetchSalesAccess()
            .then((res) => { if (!cancelled) setHasSalesAccess(Boolean(res?.hasAccess)); })
            .catch(() => { if (!cancelled) setHasSalesAccess(false); });
        fetchMyVenues()
            .then((res) => { if (!cancelled) setIsVenueOwner((res?.venues?.length ?? 0) > 0); })
            .catch(() => { if (!cancelled) setIsVenueOwner(false); });
        return () => { cancelled = true; };
    }, [rolesReady, user?.id]);
    useEffect(() => {
        if (!isVendor || !user?.id) return undefined;
        let cancelled = false;
        listFloorPlans()
            .then((res) => { if (!cancelled) setCanOpenFloorPlans(floorPlanAccess(res).canOpen); })
            .catch(() => { if (!cancelled) setCanOpenFloorPlans(false); });
        return () => { cancelled = true; };
    }, [isVendor, user?.id]);

    const navItems = useMemo(() => {
        if (!rolesReady) {
            return dashboardNavConfig.filter((item) => (
                !item.vendorOnly &&
                !item.nonVendorOnly &&
                !item.organizerOnly &&
                !item.bouncerOnly &&
                !item.liveOnly
            ));
        }
        if (isAdminNav) {
            return buildAdminNavItems({ cityScope: adminCityScope });
        }
        return buildMemberNavItems({
            hasLiveOpsAccess,
            isLiveEvent: hasLiveEvent,
            mounted: rolesReady,
            user,
            hasSalesAccess,
            isVenueOwner,
            canOpenFloorPlans,
        });
    }, [isAdminNav, adminCityScope, rolesReady, hasLiveOpsAccess, hasLiveEvent, user, hasSalesAccess, isVenueOwner, canOpenFloorPlans]);

    const closeMobileMenu = useCallback(() => setMenuOpen(false), []);
    // The phone menu is the shared one: the sidebar's pages on top, then Dashboard / Wishlist and the account row.
    const menuLinks = useMemo(
        () => navItems.map((item) => ({
            page: item.key,
            href: item.path,
            label: item.label,
            active: isNavItemActive(pathname, item, searchParams),
        })),
        [navItems, pathname, searchParams],
    );
    const activeMenuPage = menuLinks.find((l) => l.active)?.page;

    // What the page area shows. See the typedef above.
    let routeGate = null;
    if (!isAdminNav) {
        if (!rolesReady) {
            routeGate = (onLiveOpsSurface || isVendorOnlyRoute(pathname)) ? 'pending' : null;
        } else if (onLiveOpsSurface) {
            if (!hasLiveOpsAccess) {
                routeGate = capabilities.loading ? 'pending' : (capabilities.determined ? 'bouncer' : null);
            }
        } else if (!isVendor && isVendorOnlyRoute(pathname)) {
            routeGate = 'vendor';
        }
    }

    return {
        user,
        logout,
        authReady,
        rolesReady,
        pathname,
        searchParams,
        router,
        capabilities,
        isVendor,
        hasLiveOpsAccess,
        hasLiveEvent,
        onLiveOpsSurface,
        isAdminUser,
        isAdminNav,
        adminSidebarMode,
        setAdminSidebarModeAndNavigate,
        navItems,
        menuLinks,
        activeMenuPage,
        menuOpen,
        setMenuOpen,
        closeMobileMenu,
        sidebarCollapsed,
        accountPopoverOpen,
        modalStack,
        showDevCaps,
        handleLogout,
        handleAccountNavigate,
        routeGate,
    };
}
