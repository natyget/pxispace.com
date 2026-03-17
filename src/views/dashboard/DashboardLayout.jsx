'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    TrendingUp,
    Star,
    Shield,
    LogOut,
    Menu,
    X,
    ChevronRight,
    UserCog,
    Calendar,
    Bell,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/auth';
import { getNotifications } from '../../services/notifications';
const LogoSVG = "/images/logo.svg";

const navItems = [
    { label: 'Overview', path: '/dashboard', icon: LayoutDashboard, end: true },
    { label: 'Notifications', path: '/dashboard/notifications', icon: Bell },
    { label: 'PXI Passport', path: '/dashboard/passport', icon: Shield },
    { label: 'Earnings', path: '/dashboard/earnings', icon: TrendingUp, vendorOnly: true },
    { label: 'Vendor Setup', path: '/dashboard/vendor-upgrade', icon: Star },
    { label: 'Events', path: '/dashboard/events', icon: Calendar, vendorOnly: true },
    { label: 'Account', path: '/dashboard/account', icon: UserCog },
];

export default function DashboardLayout({ children }) {
    const { user, logout, updateUser } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [notificationCount, setNotificationCount] = useState(0);
    const [phoneCheckDone, setPhoneCheckDone] = useState(false);

    useEffect(() => setMounted(true), []);

    useEffect(() => {
        if (!mounted || !user?.id) return;
        if (user.phoneNumber) {
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
                .catch(() => router.replace('/verify-phone'));
        }
    }, [mounted, user?.id, user?.phoneNumber, phoneCheckDone, router, updateUser]);

    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const handleLogout = () => {
        logout();
        setShowLogoutModal(false);
        router.replace('/');
    };

    // Use stable placeholder until mounted to avoid hydration mismatch (server has no user, client has name initial)
    const avatarFallback = mounted ? (user?.name?.charAt(0)?.toUpperCase() || '?') : '?';

    return (
        <div className="min-h-screen bg-[#050505] flex">
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <aside
                className={`fixed top-0 left-0 h-full w-64 z-50 bg-zinc-950 border-r border-white/5 flex flex-col transition-transform duration-300
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static md:z-auto`}
            >
                <div className="flex items-center gap-3 px-6 py-5 border-b border-white/5">
                    <Link href="/" className="flex items-center gap-2.5">
                        <img src={LogoSVG} alt="PXI" className="h-7 w-7" />
                        <span className="text-white font-black tracking-widest text-sm uppercase">
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

                <div className="px-5 py-4 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        {mounted && user?.avatarUrl ? (
                            <img
                                src={user.avatarUrl}
                                alt={user?.name ?? ''}
                                className="w-9 h-9 rounded-full object-cover border border-white/10"
                            />
                        ) : (
                            <div className="w-9 h-9 rounded-full bg-pxi-purple/20 border border-pxi-purple/30 flex items-center justify-center text-pxi-purple font-bold text-sm">
                                {avatarFallback}
                            </div>
                        )}
                        <div className="min-w-0">
                            <p className="text-white text-sm font-semibold truncate">
                                {mounted ? (user?.name || 'PXI User') : 'PXI User'}
                            </p>
                            <p className="text-zinc-500 text-xs truncate">
                                @{mounted ? (user?.username || '—') : '—'}
                            </p>
                        </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                        {mounted && (
                            user?.isVendor ? (
                                <span className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/25 text-amber-400 text-xs font-bold uppercase tracking-widest">
                                    Vendor
                                </span>
                            ) : user?.isPassportIssued ? (
                                <span className="px-2 py-0.5 rounded-md bg-pxi-purple/15 border border-pxi-purple/25 text-pxi-purple text-xs font-bold uppercase tracking-widest">
                                    {user?.accountTier || 'CITIZEN'}
                                </span>
                            ) : null
                        )}
                    </div>
                </div>

                <nav className="flex-1 px-3 py-4 space-y-1">
                    {navItems.map(({ label, path, icon: Icon, end, vendorOnly }) => {
                        if (vendorOnly && mounted && !user?.isVendor) return null;
                        const isActive = end ? pathname === path : pathname.startsWith(path + '/') || pathname === path;
                        const showPassportAlert = mounted && path === '/dashboard/passport' && !user?.isPassportIssued;
                        const showNotificationBadge = path === '/dashboard/notifications' && notificationCount > 0;
                        return (
                            <Link
                                key={path}
                                href={path}
                                onClick={() => setSidebarOpen(false)}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                    isActive
                                        ? 'bg-pxi-purple/15 text-white'
                                        : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/5'
                                }`}
                            >
                                <span className="relative flex-shrink-0">
                                    <Icon
                                        size={16}
                                        className={isActive ? 'text-pxi-purple' : 'text-zinc-600'}
                                    />
                                    {showNotificationBadge && (
                                        <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-pxi-purple text-white text-xs font-bold">
                                            {notificationCount > 99 ? '99+' : notificationCount}
                                        </span>
                                    )}
                                </span>
                                {label}
                                <span className="ml-auto flex items-center gap-1">
                                    {showPassportAlert && (
                                        <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" title="PXI Passport not issued" />
                                    )}
                                    {isActive && !showPassportAlert && (
                                        <ChevronRight size={14} className="text-pxi-purple/60" />
                                    )}
                                </span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="px-3 py-4 border-t border-white/5">
                    <button
                        onClick={() => setShowLogoutModal(true)}
                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-500 hover:text-pxi-purple hover:bg-pxi-purple/10 transition-all"
                    >
                        <LogOut size={16} />
                        Sign Out
                    </button>
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

            <div className="flex-1 flex flex-col min-w-0">
                <header className="md:hidden flex items-center gap-4 px-5 py-4 border-b border-white/5 bg-zinc-950">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="text-zinc-400 hover:text-white"
                    >
                        <Menu size={22} />
                    </button>
                    <img src={LogoSVG} alt="PXI" className="h-6 w-6" />
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
