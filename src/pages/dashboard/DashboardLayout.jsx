import { useState } from 'react';
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    TrendingUp,
    Star,
    Shield,
    LogOut,
    Menu,
    X,
    ChevronRight,
    AlertCircle,
    UserCog,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import LogoSVG from '../../assets/logo.svg';

const navItems = [
    { label: 'Overview', path: '/dashboard', icon: LayoutDashboard, end: true },
    { label: 'PXI Passport', path: '/dashboard/passport', icon: Shield },
    { label: 'Earnings', path: '/dashboard/earnings', icon: TrendingUp },
    { label: 'Vendor Setup', path: '/dashboard/vendor-upgrade', icon: Star },
    { label: 'Account', path: '/dashboard/account', icon: UserCog },
];

export default function DashboardLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/', { replace: true });
    };

    const avatarFallback = user?.name?.charAt(0)?.toUpperCase() || '?';

    return (
        <div className="min-h-screen bg-[#050505] flex">
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 h-full w-64 z-50 bg-zinc-950 border-r border-white/5 flex flex-col transition-transform duration-300
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static md:z-auto`}
            >
                {/* Logo */}
                <div className="flex items-center gap-3 px-6 py-5 border-b border-white/5">
                    <Link to="/" className="flex items-center gap-2.5">
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

                {/* User Info */}
                <div className="px-5 py-4 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        {user?.avatarUrl ? (
                            <img
                                src={user.avatarUrl}
                                alt={user.name}
                                className="w-9 h-9 rounded-full object-cover border border-white/10"
                            />
                        ) : (
                            <div className="w-9 h-9 rounded-full bg-pxi-purple/20 border border-pxi-purple/30 flex items-center justify-center text-pxi-purple font-bold text-sm">
                                {avatarFallback}
                            </div>
                        )}
                        <div className="min-w-0">
                            <p className="text-white text-sm font-semibold truncate">
                                {user?.name || 'PXI User'}
                            </p>
                            <p className="text-zinc-500 text-xs truncate">
                                @{user?.handle || '—'}
                            </p>
                        </div>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-pxi-purple/15 border border-pxi-purple/25 text-pxi-purple text-xs font-bold uppercase tracking-widest">
                            {user?.accountTier || 'CITIZEN'}
                        </span>
                        {user?.isVendor && (
                            <span className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/25 text-amber-400 text-xs font-bold uppercase tracking-widest">
                                Vendor
                            </span>
                        )}
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-4 space-y-1">
                    {navItems.map(({ label, path, icon: Icon, end }) => {
                        const showPassportAlert = path === '/dashboard/passport' && !user?.isPassportIssued;
                        return (
                            <NavLink
                                key={path}
                                to={path}
                                end={end}
                                onClick={() => setSidebarOpen(false)}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                        isActive
                                            ? 'bg-pxi-purple/15 text-white'
                                            : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/5'
                                    }`
                                }
                            >
                                {({ isActive }) => (
                                    <>
                                        <Icon
                                            size={16}
                                            className={isActive ? 'text-pxi-purple' : 'text-zinc-600'}
                                        />
                                        {label}
                                        <span className="ml-auto flex items-center gap-1">
                                            {showPassportAlert && (
                                                <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" title="Passport not issued" />
                                            )}
                                            {isActive && !showPassportAlert && (
                                                <ChevronRight size={14} className="text-pxi-purple/60" />
                                            )}
                                        </span>
                                    </>
                                )}
                            </NavLink>
                        );
                    })}
                </nav>

                {/* Logout */}
                <div className="px-3 py-4 border-t border-white/5">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-500 hover:text-red-400 hover:bg-red-500/8 transition-all"
                    >
                        <LogOut size={16} />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Mobile Header */}
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
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
