'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { HugeiconsIcon } from '@hugeicons/react';
import {
    DashboardSquare01Icon,
    Menu01Icon,
    Cancel01Icon,
    UserGroupIcon,
    Calendar01Icon,
    Notification03Icon,
    FlagIcon,
    PanelLeftCloseIcon,
    PanelLeftOpenIcon,
} from '@hugeicons/core-free-icons';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/auth';
import { getNotifications } from '../../services/notifications';
import { eventsService } from '../../services/events';
import { getDashboardCapabilities } from '@/lib/dashboardCapabilities';
import { canAccessAdminDashboard } from '@/lib/adminAccess';
import AccountCardPopover from '@/components/dashboard/AccountCardPopover';
import SidebarIconTooltip from '@/components/dashboard/SidebarIconTooltip';
import DashboardModalHost from '@/components/dashboard/DashboardModalHost';
import { dashboardShellActions, useDashboardShellStore } from '@/lib/dashboardShellStore';
import { prefetchDashboardRoutes } from '@/lib/dashboardPerformance';
import {
    ADMIN_SIDEBAR_MODE_KEY,
    adminNavItems,
    buildMemberNavItems,
    isNavItemActive,
} from '@/lib/dashboardNavConfig';

const LogoSVG = '/images/logo.svg';

function shouldClearAuth(error) {
    const status = error?.status;
    const code = error?.code;
    return status === 401 || status === 403 || status === 404 || code === 'ACCOUNT_DELETED' || code === 'INVALID_TOKEN';
}

function NavLink({
    item,
    pathname,
    sidebarCollapsed,
    notificationCount,
    showPassportAlert,
    onNavigate,
}) {
    const isActive = isNavItemActive(pathname, item);
    const showNotificationBadge = item.badge === 'notifications' && notificationCount > 0;

    const linkClasses = sidebarCollapsed
        ? `w-10 h-10 rounded-full flex items-center justify-center mx-auto transition-all duration-300 ease-in-out ${
            isActive
                ? 'bg-white/[0.10] text-white'
                : 'bg-transparent text-white/45 hover:bg-white/[0.06] hover:text-white/80'
        }`
        : `w-full inline-flex items-center px-4 py-[9px] rounded-full transition-all duration-300 ease-in-out ${
            isActive
                ? 'bg-white/[0.10] text-white'
                : 'bg-transparent text-white/45 hover:bg-white/[0.06] hover:text-white/80'
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
                    className={isActive ? 'text-white' : 'text-white/50 transition-colors duration-300'}
                />
                {showNotificationBadge && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-white px-1 text-xs font-bold text-black">
                        {notificationCount > 99 ? '99+' : notificationCount}
                    </span>
                )}
            </span>
            <span
                className={`block overflow-hidden whitespace-nowrap text-[13px] font-semibold tracking-wide transition-all duration-300 ease-in-out ${
                    sidebarCollapsed ? 'max-w-0 opacity-0 ml-0' : 'max-w-[180px] opacity-100 ml-2.5'
                }`}
                style={{ color: isActive ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0.5)' }}
            >
                {item.label}
            </span>
            {!sidebarCollapsed && showPassportAlert && (
                <span
                    className="ml-auto h-2 w-2 animate-pulse rounded-full bg-[var(--dashboard-accent)]"
                    title="PXI Passport not issued"
                />
            )}
        </Link>
    );

    if (sidebarCollapsed) {
        return <SidebarIconTooltip label={item.label}>{linkNode}</SidebarIconTooltip>;
    }

    return linkNode;
}

export default function DashboardLayout({ children }) {
    const { user, logout, updateUser } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const fromMobile = searchParams.get('from') === 'mobile';
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [notificationCount, setNotificationCount] = useState(0);
    const [phoneCheckDone, setPhoneCheckDone] = useState(false);
    const [hasLiveEvent, setHasLiveEvent] = useState(false);
    const [capabilities, setCapabilities] = useState({
        hasBouncerAccess: false,
        loading: true,
        determined: false,
        source: {},
    });

    useEffect(() => setMounted(true), []);

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

    useEffect(() => {
        if (!mounted) return;
        prefetchDashboardRoutes(router);
    }, [mounted, router]);

    const refreshCapabilities = useCallback(async () => {
        if (!mounted || !user?.id) {
            setCapabilities({ hasBouncerAccess: false, loading: false, determined: false, source: {} });
            return;
        }
        setCapabilities((prev) => ({ ...prev, loading: true }));
        try {
            const next = await getDashboardCapabilities(user);
            setCapabilities({
                hasBouncerAccess: !!next.hasBouncerAccess,
                loading: false,
                determined: !!next.determined,
                source: next.source || {},
            });
            if (next?.freshUser) {
                updateUser(next.freshUser);
            }
        } catch {
            setCapabilities((prev) => ({ ...prev, loading: false, determined: false, source: {} }));
        }
    }, [mounted, user?.id, updateUser]);

    useEffect(() => {
        refreshCapabilities();
    }, [refreshCapabilities]);

    useEffect(() => {
        if (!mounted || typeof window === 'undefined') return undefined;
        const handleRefresh = () => refreshCapabilities();
        window.addEventListener('pxi:capabilities-refresh', handleRefresh);
        return () => window.removeEventListener('pxi:capabilities-refresh', handleRefresh);
    }, [mounted, refreshCapabilities]);

    useEffect(() => {
        if (!mounted || !user?.id) return;
        if (user.phoneNumber || fromMobile) {
            setPhoneCheckDone(true);
            getNotifications(user.id, 50)
                .then((res) => setNotificationCount(res.unreadCount ?? res.notifications?.length ?? 0))
                .catch(() => setNotificationCount(0));
            return;
        }
        if (!phoneCheckDone) {
            setPhoneCheckDone(true);
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
    }, [mounted, user?.id, user?.phoneNumber, fromMobile, phoneCheckDone, router, updateUser, logout]);

    useEffect(() => {
        if (!mounted || !user?.id) return;
        let cancelled = false;
        eventsService.getMyEvents({ limit: 50, offset: 0 })
            .then((res) => {
                if (cancelled) return;
                const now = Date.now();
                const live = (res?.events || []).some((event) => {
                    const status = String(event?.status || '').toUpperCase();
                    if (status === 'LIVE' || status === 'ACTIVE') return true;
                    const startMs = event.startDate ? new Date(event.startDate).getTime() : 0;
                    const endMs = event.endDate ? new Date(event.endDate).getTime() : 0;
                    return startMs && startMs <= now && (!endMs || endMs >= now);
                });
                setHasLiveEvent(live);
                dashboardShellActions.setIsLiveEvent(live);
            })
            .catch(() => {
                if (!cancelled) {
                    setHasLiveEvent(false);
                    dashboardShellActions.setIsLiveEvent(false);
                }
            });
        return () => {
            cancelled = true;
        };
    }, [mounted, user?.id, pathname]);

    const hasLiveOpsAccess = capabilities.hasBouncerAccess || !!user?.isVendor;
    const hasOrganizerAccess = hasLiveOpsAccess;

    useEffect(() => {
        if (!mounted || capabilities.loading || !capabilities.determined) return;
        if (pathname.startsWith('/dashboard/live-scan') && !hasLiveOpsAccess) {
            router.replace('/dashboard');
        }
    }, [mounted, pathname, capabilities.loading, capabilities.determined, hasLiveOpsAccess, router]);

    useEffect(() => {
        dashboardShellActions.setAccountPopoverOpen(false);
    }, [pathname]);

    const sidebarCollapsed = useDashboardShellStore((store) => store.sidebarCollapsed);
    const accountPopoverOpen = useDashboardShellStore((store) => store.accountPopoverOpen);
    const modalStack = useDashboardShellStore((store) => store.modalStack);
    const [adminSidebarMode, setAdminSidebarMode] = useState('user');

    useEffect(() => {
        if (!mounted || typeof window === 'undefined') return;
        if (!canAccessAdminDashboard(user)) return;
        const saved = window.localStorage.getItem(ADMIN_SIDEBAR_MODE_KEY);
        if (saved === 'admin' || saved === 'user') {
            setAdminSidebarMode(saved);
        } else {
            setAdminSidebarMode('admin');
        }
    }, [mounted, user]);

    useEffect(() => {
        if (!mounted || !canAccessAdminDashboard(user)) return;
        if (pathname.startsWith('/dashboard/admin')) {
            setAdminSidebarMode('admin');
            try {
                window.localStorage.setItem(ADMIN_SIDEBAR_MODE_KEY, 'admin');
            } catch {
                /* ignore */
            }
        }
    }, [mounted, pathname, user]);

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
            passport: '/dashboard/passport',
            settings: '/dashboard/account?tab=profile',
            billing: '/dashboard/account?tab=billing',
            usage: '/dashboard/account?tab=usage',
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
                        className="flex-1 rounded-xl bg-pxi-purple px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-pxi-purple/90"
                    >
                        Sign Out
                    </button>
                    <button
                        onClick={() => dashboardShellActions.closeTopLayer()}
                        className="glow-surface-soft flex-1 rounded-xl px-4 py-2.5 text-sm font-medium text-zinc-400 transition-all hover:bg-white/5"
                    >
                        Cancel
                    </button>
                </>
            ),
        }),
    };

    const memberNavItems = useMemo(
        () => buildMemberNavItems({
            hasOrganizerAccess,
            hasLiveOpsAccess,
            isLiveEvent: hasLiveEvent,
            mounted,
            user,
        }),
        [hasOrganizerAccess, hasLiveOpsAccess, hasLiveEvent, mounted, user]
    );

    const navItems = mounted && canAccessAdminDashboard(user) && adminSidebarMode === 'admin'
        ? adminNavItems
        : memberNavItems;

    const closeMobileSidebar = () => setSidebarOpen(false);

    return (
        <div className="flex h-screen overflow-hidden bg-[var(--dashboard-bg-base)]">
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
                    onClick={closeMobileSidebar}
                />
            )}

            <aside
                className={`dashboard-sidebar fixed top-0 left-0 z-50 flex h-full flex-col bg-black/95 backdrop-blur-xl transition-all duration-300 ease-in-out
                    ${sidebarCollapsed ? 'md:w-[72px] w-[240px]' : 'w-[240px]'}
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:static md:z-auto md:translate-x-0`}
            >
                <div className="flex h-full flex-col justify-between">
                    <div className="flex min-h-0 flex-col">
                        <div className={`flex items-center px-5 py-4 ${sidebarCollapsed ? 'justify-center' : 'justify-center md:justify-start'}`}>
                            {!sidebarCollapsed && (
                                <Link href="/" className="flex min-w-0 items-center">
                                    <Image
                                        src={LogoSVG}
                                        alt="PXI"
                                        width={110}
                                        height={94}
                                        quality={100}
                                        className="h-10 w-auto shrink-0 object-contain"
                                        style={{ imageRendering: 'auto' }}
                                        priority
                                    />
                                </Link>
                            )}
                            <button
                                onClick={() => dashboardShellActions.toggleSidebar()}
                                className={`${sidebarCollapsed ? '' : 'ml-auto'} hidden h-8 w-8 items-center justify-center rounded-full glow-surface-soft text-white/55 transition hover:bg-white/10 hover:text-white md:flex`}
                                aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                                type="button"
                            >
                                <HugeiconsIcon icon={sidebarCollapsed ? PanelLeftOpenIcon : PanelLeftCloseIcon} size={16} />
                            </button>
                            <button
                                className="ml-auto text-zinc-600 hover:text-zinc-400 md:hidden"
                                onClick={closeMobileSidebar}
                                type="button"
                            >
                                <HugeiconsIcon icon={Cancel01Icon} size={18} />
                            </button>
                        </div>

                        {mounted && canAccessAdminDashboard(user) && (
                            <div className={`mb-2 px-3 md:px-5 ${sidebarCollapsed ? 'flex flex-col items-center' : ''}`}>
                                <div
                                    className={`flex rounded-full bg-white/[0.06] p-0.5 glow-surface-soft ${sidebarCollapsed ? 'w-11 flex-col gap-0.5 py-1' : 'w-full'}`}
                                    role="group"
                                    aria-label="Switch between platform admin and member dashboard"
                                >
                                    <button
                                        type="button"
                                        onClick={() => setAdminSidebarModeAndNavigate('admin')}
                                        className={`${sidebarCollapsed ? 'py-2 text-[10px]' : 'flex-1 py-2 text-xs'} rounded-full font-bold tracking-wide transition-colors ${
                                            adminSidebarMode === 'admin'
                                                ? 'bg-white text-black shadow-sm'
                                                : 'text-white/45 hover:text-white/80'
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
                                                ? 'bg-white text-black shadow-sm'
                                                : 'text-white/45 hover:text-white/80'
                                        }`}
                                        title="Member dashboard"
                                    >
                                        {sidebarCollapsed ? 'U' : 'USER'}
                                    </button>
                                </div>
                            </div>
                        )}

                        <nav className={`hide-scrollbar-open mt-1 flex-1 overflow-y-auto ${sidebarCollapsed ? 'flex flex-col items-center gap-1.5 px-0' : 'space-y-1.5 px-3 md:px-4'}`}>
                            {navItems.map((item) => (
                                <div key={item.key} className={sidebarCollapsed ? 'w-full flex justify-center' : 'w-full'}>
                                    <NavLink
                                        item={item}
                                        pathname={pathname}
                                        sidebarCollapsed={sidebarCollapsed}
                                        notificationCount={notificationCount}
                                        showPassportAlert={mounted && item.path === '/dashboard/passport' && !user?.isPassportIssued}
                                        onNavigate={closeMobileSidebar}
                                    />
                                </div>
                            ))}
                        </nav>
                    </div>

                    <div className={`relative ${sidebarCollapsed ? 'flex justify-center px-0 py-5' : 'p-5'} glow-surface-soft border-t-0`}>
                        <AccountCardPopover
                            user={mounted ? user : null}
                            collapsed={sidebarCollapsed}
                            isOpen={accountPopoverOpen}
                            onOpenChange={dashboardShellActions.setAccountPopoverOpen}
                            onNavigate={handleAccountNavigate}
                            onSignOut={() => dashboardShellActions.openModal('logoutConfirm')}
                        />
                        {showDevCaps && (
                            <div className={`mt-2 rounded-xl glow-surface-soft px-2 py-1 text-[10px] text-white/70 ${sidebarCollapsed ? 'text-center' : ''}`}>
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
                <header className="flex items-center gap-4 border-b-0 px-5 py-4 glow-surface-soft md:hidden">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="text-zinc-400 hover:text-white"
                        type="button"
                    >
                        <HugeiconsIcon icon={Menu01Icon} size={22} />
                    </button>
                    <Image src={LogoSVG} alt="PXI" width={24} height={24} className="h-6 w-6" />
                    <span className="text-sm font-black uppercase tracking-widest text-white">
                        PXI
                    </span>
                </header>

                <main className="flex-1 overflow-auto p-6 md:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
