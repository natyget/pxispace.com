'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
    LayoutDashboard,
    TrendingUp,
    Shield,
    LogOut,
    Menu,
    X,
    ChevronRight,
    ChevronLeft,
    UserCog,
    Calendar,
    Bell,
    Plus,
    Activity,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/auth';
import { getNotifications } from '../../services/notifications';
import { getPassportLevelDisplay } from '../../utils/odysseyTier';
const LogoSVG = "/images/logo.svg";
const SIDEBAR_BTN_BASE =
    'w-full inline-flex items-center px-[14px] py-[12px] rounded-full text-[14px] font-semibold tracking-wide transition-all duration-300';

const navItems = [
    { label: 'Overview', path: '/dashboard', icon: LayoutDashboard, end: true },
    { label: 'My events', path: '/dashboard/events', icon: Calendar, end: true },
    { label: 'Create event', path: '/dashboard/events/new', icon: Plus, end: true },
    { label: 'PXI Passport', path: '/dashboard/passport', icon: Shield },
    { label: 'Earnings', path: '/dashboard/earnings', icon: TrendingUp, vendorOnly: true },
    { label: 'Analytics', path: '/dashboard/analytics', icon: Activity, vendorOnly: true },
    { label: 'Notifications', path: '/dashboard/notifications', icon: Bell },
    { label: 'Settings', path: '/dashboard/account', icon: UserCog },
];

export default function DashboardLayout({ children }) {
    const { user, logout, updateUser } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const fromMobile = searchParams.get('from') === 'mobile';
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [notificationCount, setNotificationCount] = useState(0);
    const [phoneCheckDone, setPhoneCheckDone] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);

    useEffect(() => setMounted(true), []);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const mq = window.matchMedia('(max-width: 767px)');
        const syncMobileSidebar = () => {
            if (mq.matches) setSidebarCollapsed(false);
        };
        syncMobileSidebar();
        mq.addEventListener('change', syncMobileSidebar);
        return () => mq.removeEventListener('change', syncMobileSidebar);
    }, []);

    useEffect(() => {
        if (!mounted || !user?.id) return;
        // Skip phone verification when user came from mobile app (e.g. "Go to Web" for vendor setup)
        if (user.phoneNumber || fromMobile) {
            setPhoneCheckDone(true);
            getNotifications(user.id, 50)
                .then((res) => setNotificationCount(res.unreadCount ?? res.notifications?.length ?? 0))
                .catch(() => setNotificationCount(0));
            return;
        }
        // Refetch user once to avoid stale cache (e.g. user added phone on mobile)
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
                .catch(() => { /* Don't redirect on network/API failure; user may have phone */ });
        }
    }, [mounted, user?.id, user?.phoneNumber, fromMobile, phoneCheckDone, router, updateUser]);

    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [showCreateEventModal, setShowCreateEventModal] = useState(false);

    const handleLogout = () => {
        logout();
        setShowLogoutModal(false);
        router.replace('/');
    };

    // Use stable placeholder until mounted to avoid hydration mismatch (server has no user, client has name initial)
    const avatarFallback = mounted ? (user?.name?.charAt(0)?.toUpperCase() || '?') : '?';

    return (
        <div className="h-screen bg-[#050505] flex overflow-hidden">
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <aside
                className={`fixed top-0 left-0 h-full z-50 bg-black border-r border-white/5 flex flex-col transition-all duration-300
                    ${sidebarCollapsed ? 'md:w-[84px] w-[240px]' : 'w-[240px]'}
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static md:z-auto`}
            >
                <div className="flex h-full flex-col justify-between">
                    <div className="flex min-h-0 flex-col">
                        <div className={`p-6 flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-center md:justify-start'}`}>
                            <Link href="/" className={`flex ${sidebarCollapsed ? 'flex-col items-center gap-1.5' : 'items-center'}`}>
                                <Image src="/favicon.svg" alt="PXI favicon" width={40} height={40} className="w-10 h-10 object-contain shrink-0" />
                                <span className={`${sidebarCollapsed ? 'block text-[11px] tracking-[0.2em] mt-0.5' : 'ml-4 hidden md:block text-2xl'} font-black tracking-tighter uppercase text-white`}>
                                    PXI
                                </span>
                            </Link>
                            <button
                                className="ml-auto text-zinc-600 hover:text-zinc-400 md:hidden"
                                onClick={() => setSidebarOpen(false)}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <nav className={`flex-1 overflow-y-auto mt-4 ${sidebarCollapsed ? 'flex flex-col items-center gap-2 px-0' : 'space-y-2 px-3 md:px-5'}`}>
                            {navItems.map(({ label, path, icon: Icon, end, vendorOnly }) => {
                                if (vendorOnly && mounted && !user?.isVendor) return null;
                                const isActive = end ? pathname === path : pathname.startsWith(path + '/') || pathname === path;
                                const showPassportAlert = mounted && path === '/dashboard/passport' && !user?.isPassportIssued;
                                const showNotificationBadge = path === '/dashboard/notifications' && notificationCount > 0;
                                return (
                                    <Link
                                        key={path}
                                        href={path}
                                        onClick={(e) => {
                                            if (path === '/dashboard/events/new') {
                                                e.preventDefault();
                                                setShowCreateEventModal(true);
                                                return;
                                            }
                                            setSidebarOpen(false);
                                        }}
                                        className={`${sidebarCollapsed ? 'inline-flex h-11 w-11 mx-auto items-center justify-center rounded-full transition-all duration-300' : `${SIDEBAR_BTN_BASE} justify-start rounded-full`} ${
                                            isActive
                                                ? 'bg-white text-black shadow-[0_4px_20px_rgba(255,255,255,0.15)]'
                                                : 'bg-transparent text-white/50 hover:bg-white/10 hover:text-white'
                                        }`}
                                        title={sidebarCollapsed ? label : undefined}
                                    >
                                        <span className="relative flex-shrink-0">
                                            <Icon size={20} className={isActive ? 'text-black' : 'text-white/60 group-hover:text-white transition-colors'} />
                                            {showNotificationBadge && (
                                                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-white text-black text-xs font-bold">
                                                    {notificationCount > 99 ? '99+' : notificationCount}
                                                </span>
                                            )}
                                        </span>
                                        {!sidebarCollapsed && <span className={`ml-[12px] block text-[14px] font-semibold tracking-wide truncate ${isActive ? 'text-black' : ''}`}>{label}</span>}
                                        {!sidebarCollapsed && showPassportAlert && (
                                            <span className="ml-auto w-2 h-2 rounded-full bg-white animate-pulse" title="PXI Passport not issued" />
                                        )}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>

                    <button
                        onClick={() => setSidebarCollapsed((v) => !v)}
                        className="hidden md:flex items-center justify-center w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors absolute -right-4 top-[108px] border border-white/10 z-50"
                        aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                        type="button"
                    >
                        {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                    </button>

                    <div className="p-6 border-t border-white/5 relative">
                        {userMenuOpen && (
                            <div className={`absolute bottom-full mb-2 rounded-xl border border-white/10 bg-black/90 p-1.5 ${sidebarCollapsed ? 'left-2 right-2' : 'left-6 right-6'}`}>
                                <button
                                    onClick={() => {
                                        setUserMenuOpen(false);
                                        setShowLogoutModal(true);
                                    }}
                                    className={`${SIDEBAR_BTN_BASE} ${sidebarCollapsed ? 'justify-center' : 'justify-start'} text-red-300 hover:bg-red-500/10 hover:text-red-200`}
                                    title={sidebarCollapsed ? 'Sign Out' : undefined}
                                >
                                    <LogOut size={18} />
                                    {!sidebarCollapsed && <span className="ml-2">Sign Out</span>}
                                </button>
                            </div>
                        )}

                        <button
                            onClick={() => setUserMenuOpen((v) => !v)}
                            className={`${sidebarCollapsed ? 'inline-flex h-11 w-11 mx-auto items-center justify-center rounded-full transition-all duration-300' : `${SIDEBAR_BTN_BASE} justify-center md:justify-start`} bg-transparent border border-transparent text-white/80 hover:bg-white/5`}
                            title={sidebarCollapsed ? 'User menu' : undefined}
                            type="button"
                        >
                            {mounted && user?.avatarUrl ? (
                                <Image
                                    src={user.avatarUrl}
                                    alt={user?.name ?? ''}
                                    width={36}
                                    height={36}
                                    unoptimized
                                    className="w-10 h-10 rounded-full overflow-hidden"
                                />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-pxi-purple/20 flex items-center justify-center text-pxi-purple font-bold text-sm">
                                    {avatarFallback}
                                </div>
                            )}
                            {!sidebarCollapsed && (
                                <>
                                    <span className="ml-3 block overflow-hidden text-left">
                                        <span className="block text-[14px] font-bold text-white truncate leading-tight">{mounted ? (user?.name || 'PXI User') : 'PXI User'}</span>
                                        <span className="block text-[12px] text-white/40 truncate leading-tight mt-0.5">@{mounted ? (user?.username || '—') : '—'}</span>
                                    </span>
                                    <ChevronRight size={16} className={`ml-auto block text-white/50 transition-transform ${userMenuOpen ? '-rotate-90' : ''}`} />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </aside>

            {/* Sign-out confirmation modal */}
            {showLogoutModal && (
                <div
                    className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm"
                    onClick={() => setShowLogoutModal(false)}
                >
                    <div
                        className="bg-zinc-950 border border-white/10 rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-white font-black text-lg mb-2 tracking-tight">Sign out?</h2>
                        <p className="text-zinc-400 text-sm mb-6">You'll need to sign in again to access your account.</p>
                        <div className="flex gap-3">
                            <button
                                onClick={handleLogout}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-pxi-purple text-white font-bold text-sm hover:bg-pxi-purple/90 transition-all"
                            >
                                Sign Out
                            </button>
                            <button
                                onClick={() => setShowLogoutModal(false)}
                                className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-zinc-400 font-medium text-sm hover:bg-white/5 transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showCreateEventModal && (
                <div
                    className="fixed inset-0 z-[210] flex items-center justify-center bg-black/70 backdrop-blur-sm"
                    onClick={() => setShowCreateEventModal(false)}
                >
                    <div
                        className="bg-zinc-950 border border-white/10 rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-white font-black text-lg mb-2 tracking-tight">Create new event?</h2>
                        <p className="text-zinc-400 text-sm mb-6">You will navigate to the event creation page.</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowCreateEventModal(false);
                                    setSidebarOpen(false);
                                    router.push('/dashboard/events/new');
                                }}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-pxi-purple text-white font-bold text-sm hover:bg-pxi-purple/90 transition-all"
                            >
                                Continue
                            </button>
                            <button
                                onClick={() => setShowCreateEventModal(false)}
                                className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-zinc-400 font-medium text-sm hover:bg-white/5 transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex-1 flex flex-col min-w-0">
                <header className="md:hidden flex items-center gap-4 px-5 py-4 border-b border-white/5 bg-zinc-950">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="text-zinc-400 hover:text-white"
                    >
                        <Menu size={22} />
                    </button>
                    <Image src={LogoSVG} alt="PXI" width={24} height={24} className="h-6 w-6" />
                    <span className="text-white font-black tracking-widest text-sm uppercase">
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
