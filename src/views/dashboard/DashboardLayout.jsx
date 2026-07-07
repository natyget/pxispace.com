'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { HugeiconsIcon } from '@hugeicons/react';
import {
    Menu01Icon,
    Cancel01Icon,
    PanelLeftCloseIcon,
    PanelLeftOpenIcon,
} from '@hugeicons/core-free-icons';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/auth';
import { canAccessAdminDashboard } from '@/lib/adminAccess';
import AccountCardPopover from '@/components/dashboard/AccountCardPopover';
import SidebarIconTooltip from '@/components/dashboard/SidebarIconTooltip';
import DashboardModalHost from '@/components/dashboard/DashboardModalHost';
import { dashboardShellActions, useDashboardShellStore } from '@/lib/dashboardShellStore';
import { prefetchDashboardRoutes } from '@/lib/dashboardPerformance';
import { useCapabilities, useEvents } from '@/lib/dashboardStore';
import {
    ADMIN_SIDEBAR_MODE_KEY,
    adminNavItems,
    buildMemberNavItems,
    isNavItemActive,
    dashboardNavConfig,
} from '@/lib/dashboardNavConfig';

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

function NavLink({
    item,
    pathname,
    searchParams,
    sidebarCollapsed,
    isLiveEvent,
    onNavigate,
}) {
    const isActive = isNavItemActive(pathname, item, searchParams);
    const isLiveOperations = item.key === 'operations' && isLiveEvent;
    const activeClasses = isLiveOperations
        ? 'bg-emerald-500/[0.06] text-emerald-200'
        : 'bg-white/[0.04] text-white/90';
    const inactiveClasses = isLiveOperations
        ? 'bg-transparent text-emerald-300/60 hover:bg-emerald-500/[0.04] hover:text-emerald-200/80'
        : 'bg-transparent text-white/40 hover:bg-white/[0.02] hover:text-white/70';
    const iconClasses = isLiveOperations
        ? 'text-emerald-300/80 transition-colors duration-300'
        : isActive
            ? 'text-white/80'
            : 'text-white/40 transition-colors duration-300';
    const labelClasses = isLiveOperations
        ? 'text-emerald-300/80'
        : isActive
            ? 'text-white/90'
            : 'text-white/50';

    const linkClasses = sidebarCollapsed
        ? `w-10 h-10 rounded-full flex items-center justify-center mx-auto transition-all duration-300 ease-in-out ${
            isActive ? activeClasses : inactiveClasses
        }`
        : `w-full inline-flex items-center px-4 py-[9px] rounded-full transition-all duration-300 ease-in-out ${
            isActive ? activeClasses : inactiveClasses
        }`;

    const linkNode = (
        <Link
            href={item.path}
            onClick={onNavigate}
            className={linkClasses}
            title={sidebarCollapsed ? item.label : undefined}
        >
            <span className="relative flex-shrink-0">
                <HugeiconsIcon
                    icon={item.icon}
                    size={18}
                    className={iconClasses}
                />
            </span>
            <span
                className={`block overflow-hidden whitespace-nowrap text-[13px] font-semibold tracking-wide transition-all duration-300 ease-in-out ${labelClasses} ${
                    sidebarCollapsed ? 'max-w-0 opacity-0 ml-0' : 'max-w-[180px] opacity-100 ml-2.5'
                }`}
            >
                {item.label}
            </span>
        </Link>
    );

    if (sidebarCollapsed) {
        return <SidebarIconTooltip label={item.label}>{linkNode}</SidebarIconTooltip>;
    }

    return linkNode;
}

export default function DashboardLayout({ children }) {
    const { user, authReady, authRefreshing, logout, updateUser } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const fromMobile = searchParams.get('from') === 'mobile';
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [phoneCheckDone, setPhoneCheckDone] = useState(false);
    const [liveNow, setLiveNow] = useState(0);
    const { capabilities, refresh: refreshCapabilities } = useCapabilities();
    const { events: shellEvents } = useEvents({ limit: 100, offset: 0 });

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
        if (!mounted) return;
        prefetchDashboardRoutes(router);
    }, [mounted, router]);

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
    }, [mounted, authReady, user?.id, user?.phoneNumber, fromMobile, phoneCheckDone, router, updateUser, logout]);

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

    const hasLiveOpsAccess = capabilities.hasBouncerAccess || (rolesReady && !!user?.isVendor);
    const hasOrganizerAccess = hasLiveOpsAccess;

    useEffect(() => {
        if (!rolesReady || capabilities.loading || !capabilities.determined) return;
        if (pathname.startsWith('/dashboard/live-scan') && !hasLiveOpsAccess) {
            router.replace('/dashboard');
        }
    }, [rolesReady, pathname, capabilities.loading, capabilities.determined, hasLiveOpsAccess, router]);

    useEffect(() => {
        dashboardShellActions.setAccountPopoverOpen(false);
    }, [pathname]);

    const sidebarCollapsed = useDashboardShellStore((store) => store.sidebarCollapsed);
    const accountPopoverOpen = useDashboardShellStore((store) => store.accountPopoverOpen);
    const modalStack = useDashboardShellStore((store) => store.modalStack);
    const [adminSidebarMode, setAdminSidebarMode] = useState('user');

    useEffect(() => {
        if (!rolesReady || typeof window === 'undefined') return;
        if (!canAccessAdminDashboard(user)) return;
        const saved = window.localStorage.getItem(ADMIN_SIDEBAR_MODE_KEY);
        deferDashboardState(() => setAdminSidebarMode(saved === 'admin' || saved === 'user' ? saved : 'admin'));
    }, [rolesReady, user]);

    useEffect(() => {
        if (!rolesReady || !canAccessAdminDashboard(user)) return;
        if (pathname.startsWith('/dashboard/admin')) {
            deferDashboardState(() => setAdminSidebarMode('admin'));
            try {
                window.localStorage.setItem(ADMIN_SIDEBAR_MODE_KEY, 'admin');
            } catch {
                /* ignore */
            }
        }
    }, [rolesReady, pathname, user]);

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

    const modalRenderers = {
        logoutConfirm: () => ({
            title: 'Sign out?',
            description: "You'll need to sign in again to access your account.",
            footer: (
                <>
                    <button
                        onClick={handleLogout}
                        className="pill-solid flex-1 px-4 py-2.5 text-sm"
                    >
                        Sign Out
                    </button>
                    <button
                        onClick={() => dashboardShellActions.closeTopLayer()}
                        className="pill-ghost flex-1 px-4 py-2.5 text-sm font-medium"
                    >
                        Cancel
                    </button>
                </>
            ),
        }),
    };

    const isAdminNav = rolesReady && canAccessAdminDashboard(user) && adminSidebarMode === 'admin';

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
            return adminNavItems;
        }
        return buildMemberNavItems({
            hasOrganizerAccess,
            hasLiveOpsAccess,
            isLiveEvent: hasLiveEvent,
            mounted: rolesReady,
            user,
        });
    }, [isAdminNav, rolesReady, hasOrganizerAccess, hasLiveOpsAccess, hasLiveEvent, user]);
    const navEntries = useMemo(() => {
        if (isAdminNav || sidebarCollapsed) {
            return navItems.map((item) => ({ type: 'item', key: item.key, item }));
        }
        let currentSection = null;
        return navItems.flatMap((item) => {
            const entries = [];
            if (item.section && item.section !== currentSection) {
                currentSection = item.section;
                entries.push({ type: 'section', key: `section-${item.section}`, label: item.section });
            }
            entries.push({ type: 'item', key: item.key, item });
            return entries;
        });
    }, [isAdminNav, navItems, sidebarCollapsed]);

    const closeMobileSidebar = () => setSidebarOpen(false);

    return (
        <div className="dashboard-page-surface flex h-screen overflow-hidden">
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
                    onClick={closeMobileSidebar}
                />
            )}

            <aside
                className={`dashboard-sidebar glass-panel fixed top-0 left-0 z-50 flex h-full flex-col overflow-hidden transition-all duration-300 ease-in-out shadow-[12px_0_42px_rgba(0,0,0,0.42)]
                    ${sidebarCollapsed ? 'md:w-[72px] w-[240px]' : 'w-[240px]'}
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:static md:z-auto md:translate-x-0`}
            >
                <div className="flex h-full flex-col justify-between">
                    <div className="flex min-h-0 flex-col">
                        <div className={`flex items-center px-4 py-4 ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
                            <Link href="/" className={`flex items-center ${sidebarCollapsed ? 'hidden' : 'block'} md:block ${sidebarCollapsed ? 'md:hidden' : ''} min-w-0 transition-opacity hover:opacity-80`}>
                                <img src="/favicon.png" alt="PXI" className="h-[38px] md:h-[44px] w-auto translate-y-[3px] object-contain" />
                            </Link>

                            <button
                                onClick={() => dashboardShellActions.toggleSidebar()}
                                className={`group relative hidden items-center justify-center overflow-hidden rounded-full transition md:flex bg-white/[0.04] hover:bg-white/[0.08] text-white/70 hover:text-white ${sidebarCollapsed ? 'h-11 w-11' : 'h-9 w-9 shrink-0'}`}
                                aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                                type="button"
                            >
                                {sidebarCollapsed ? (
                                    <img src="/favicon.png" alt="PXI" className="absolute inset-0 m-auto h-[38px] w-auto translate-y-[3px] object-contain transition duration-200 group-hover:scale-75 group-hover:opacity-0" />
                                ) : null}
                                <HugeiconsIcon icon={sidebarCollapsed ? PanelLeftOpenIcon : PanelLeftCloseIcon} size={sidebarCollapsed ? 26 : 18} className={sidebarCollapsed ? 'opacity-0 transition duration-200 group-hover:opacity-100' : ''} />
                            </button>
                            <button
                                className="ml-auto text-zinc-600 hover:text-zinc-400 md:hidden"
                                onClick={closeMobileSidebar}
                                type="button"
                            >
                                <HugeiconsIcon icon={Cancel01Icon} size={18} />
                            </button>
                        </div>

                        {rolesReady && canAccessAdminDashboard(user) && (
                            <div className={`mb-2 px-3 md:px-4 ${sidebarCollapsed ? 'flex flex-col items-center' : ''}`}>
                                <div
                                    className={`flex rounded-full bg-white/[0.045] p-0.5 ${sidebarCollapsed ? 'w-11 flex-col gap-0.5 py-1' : 'w-full'}`}
                                    role="group"
                                    aria-label="Switch between platform admin and member dashboard"
                                >
                                    <button
                                        type="button"
                                        onClick={() => setAdminSidebarModeAndNavigate('admin')}
                                        className={`${sidebarCollapsed ? 'py-2 text-[10px]' : 'flex-1 py-2 text-xs'} rounded-full font-bold tracking-wide transition-colors ${
                                            adminSidebarMode === 'admin'
                                                ? 'bg-white/[0.04] text-white/90'
                                                : 'text-white/40 hover:text-white/70'
                                        }`}
                                        title="Platform admin"
                                    >
                                        {sidebarCollapsed ? 'A' : 'ADMIN'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setAdminSidebarModeAndNavigate('user')}
                                        className={`${sidebarCollapsed ? 'py-2 text-[10px]' : 'flex-1 py-2 text-xs'} rounded-full font-bold tracking-wide transition-colors ${
                                            adminSidebarMode === 'user'
                                                ? 'bg-white/[0.04] text-white/90'
                                                : 'text-white/40 hover:text-white/70'
                                        }`}
                                        title="Member dashboard"
                                    >
                                        {sidebarCollapsed ? 'M' : 'MEMBER'}
                                    </button>
                                </div>
                            </div>
                        )}

                        <nav className={`dashboard-scrollbar-none mt-1 flex-1 overflow-hidden ${sidebarCollapsed ? 'flex flex-col items-center gap-1.5 px-0' : 'space-y-1.5 px-3 md:px-4'}`}>
                            {navEntries.map((entry) => (
                                entry.type === 'section' ? (
                                    <div key={entry.key} className="px-4 pt-4 pb-1 text-[10px] font-black uppercase tracking-[0.22em] text-white/[0.28] first:pt-1">
                                        {entry.label}
                                    </div>
                                ) : (
                                <div key={entry.key} className={sidebarCollapsed ? 'w-full flex justify-center' : 'w-full'}>
                                    <NavLink
                                        item={entry.item}
                                        pathname={pathname}
                                        searchParams={searchParams}
                                        sidebarCollapsed={sidebarCollapsed}
                                        isLiveEvent={hasLiveEvent}
                                        onNavigate={closeMobileSidebar}
                                    />
                                </div>
                                )
                            ))}
                        </nav>
                    </div>

                    <div className={`relative ${sidebarCollapsed ? 'flex justify-center px-0 py-5' : 'p-4'}`}>
                        <AccountCardPopover
                            user={rolesReady ? user : null}
                            collapsed={sidebarCollapsed}
                            isOpen={accountPopoverOpen}
                            onOpenChange={dashboardShellActions.setAccountPopoverOpen}
                            onNavigate={handleAccountNavigate}
                            onSignOut={() => dashboardShellActions.openModal('logoutConfirm')}
                        />
                        {showDevCaps && (
                            <div className={`mt-2 rounded-xl bg-white/[0.045] px-2 py-1 text-[10px] text-white/70 ${sidebarCollapsed ? 'text-center' : ''}`}>
                                {capabilities.hasBouncerAccess ? 'LiveOps: enabled' : 'LiveOps: disabled'} ·
                                {' '}events:{capabilities.source?.events ? 'Y' : 'N'}
                                {' '}notif:{capabilities.source?.notifications ? 'Y' : 'N'}
                                {' '}user:{capabilities.source?.user ? 'Y' : 'N'}
                                {' '}live:{hasLiveEvent ? 'Y' : 'N'}
                            </div>
                        )}
                    </div>
                </div>
            </aside>

            <DashboardModalHost
                stack={modalStack}
                onCloseTop={() => dashboardShellActions.closeTopLayer()}
                renderers={modalRenderers}
            />

            <div className="flex min-w-0 flex-1 flex-col">
                <header className="glass-panel flex items-center gap-4 rounded-none px-5 py-4 md:hidden">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="text-zinc-400 hover:text-white"
                        type="button"
                    >
                        <HugeiconsIcon icon={Menu01Icon} size={22} />
                    </button>
                    <img src="/favicon.png" alt="PXI" className="h-[38px] w-auto translate-y-[4px] object-contain" />
                </header>

                <main className="flex-1 overflow-auto p-6 md:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
