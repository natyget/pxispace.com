'use client';

import Link from 'next/link';
import { HugeiconsIcon } from '@hugeicons/react';
import {
    Menu01Icon,
    Cancel01Icon,
    PanelLeftCloseIcon,
    PanelLeftOpenIcon,
} from '@hugeicons/core-free-icons';
import MobileMenu from '@/components/layout/MobileMenu';
import AccountCardPopover from '@/components/dashboard/AccountCardPopover';
import SidebarIconTooltip from '@/components/dashboard/SidebarIconTooltip';
import { dashboardShellActions } from '@/lib/dashboardShellStore';
import { isNavItemActive } from '@/lib/dashboardNavConfig';

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
    // App look: the active item is a flat purple pill; "live" is the orange accent.
    const activeClasses = isLiveOperations
        ? 'bg-pxi-orange/15 text-pxi-orange'
        : 'bg-pxi-purple text-white';
    const inactiveClasses = isLiveOperations
        ? 'group bg-transparent hover:bg-pxi-orange/10'
        : 'group bg-transparent hover:bg-white/[0.06]';
    const iconClasses = isLiveOperations
        ? 'text-pxi-orange opacity-80 group-hover:opacity-100 transition-opacity duration-300'
        : isActive
            ? 'text-white opacity-100'
            : 'text-white opacity-50 group-hover:opacity-80 transition-opacity duration-300';
    const labelClasses = isLiveOperations
        ? 'text-pxi-orange/80 group-hover:text-pxi-orange transition-colors duration-300'
        : isActive
            ? 'text-white'
            : 'text-[#9a9a9a] group-hover:text-white transition-colors duration-300';

    const linkClasses = sidebarCollapsed
        ? `w-10 h-10 rounded-full flex items-center justify-center mx-auto transition-all duration-300 ease-in-out ${
            isActive ? activeClasses : inactiveClasses
        }`
        : `relative w-full inline-flex items-center px-4 py-[10px] rounded-full transition-all duration-300 ease-in-out ${
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
                className={`block overflow-hidden whitespace-nowrap text-[13px] font-bold tracking-wide transition-all duration-300 ease-in-out ${labelClasses} ${
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

/** Platform admin mode: the sidebar stays as it was. Only admins in admin mode render this. */
export default function AdminShell({ data, children }) {
    const {
        user,
        rolesReady,
        pathname,
        searchParams,
        isAdminUser,
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
        hasLiveEvent,
        showDevCaps,
        capabilities,
        handleAccountNavigate,
    } = data;

    return (
        <div className="dashboard-page-surface flex h-screen overflow-hidden">
            <aside
                className={`dashboard-sidebar hidden h-full flex-col overflow-hidden bg-pxi-surface transition-all duration-300 ease-in-out md:flex
                    ${sidebarCollapsed ? 'md:w-[72px] w-[240px]' : 'w-[240px]'}`}
            >
                <div className="flex h-full flex-col justify-between">
                    <div className="flex min-h-0 flex-col">
                        <div className={`flex items-center px-4 py-4 ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
                            <Link href="/" className={`flex items-center ${sidebarCollapsed ? 'hidden' : 'block'} md:block ${sidebarCollapsed ? 'md:hidden' : ''} min-w-0 transition-opacity hover:opacity-80`}>
                                <img src="/logo-mark.png" alt="PXI" className="h-[38px] md:h-[44px] w-auto object-contain" />
                            </Link>

                            <button
                                onClick={() => dashboardShellActions.toggleSidebar()}
                                className={`group relative hidden items-center justify-center overflow-hidden rounded-full transition md:flex ${sidebarCollapsed ? 'bg-transparent hover:bg-white/[0.08]' : 'bg-pxi-field hover:bg-[#3a3a3a]'} text-white/70 hover:text-white ${sidebarCollapsed ? 'h-11 w-11' : 'h-9 w-9 shrink-0'}`}
                                aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                                type="button"
                            >
                                {sidebarCollapsed ? (
                                    <img src="/logo-mark.png" alt="PXI" className="absolute inset-0 m-auto h-[38px] w-auto object-contain transition duration-200 group-hover:scale-75 group-hover:opacity-0" />
                                ) : null}
                                <HugeiconsIcon icon={sidebarCollapsed ? PanelLeftCloseIcon : PanelLeftOpenIcon} size={sidebarCollapsed ? 26 : 18} className={sidebarCollapsed ? 'opacity-0 transition duration-200 group-hover:opacity-100' : ''} />
                            </button>
                        </div>

                        {isAdminUser && (
                            <div className={`mb-2 px-3 md:px-4 ${sidebarCollapsed ? 'flex flex-col items-center' : ''}`}>
                                <div
                                    className={`flex rounded-full bg-pxi-field p-0.5 ${sidebarCollapsed ? 'w-11 flex-col gap-0.5 py-1' : 'w-full'}`}
                                    role="group"
                                    aria-label="Switch between platform admin and workspace dashboard"
                                >
                                    <button
                                        type="button"
                                        onClick={() => setAdminSidebarModeAndNavigate('admin')}
                                        className={`${sidebarCollapsed ? 'py-2 text-[10px]' : 'flex-1 py-2 text-xs'} rounded-full font-bold tracking-wide transition-colors ${
                                            adminSidebarMode === 'admin'
                                                ? 'bg-pxi-purple text-white'
                                                : 'text-white/50 hover:text-white/80'
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
                                                ? 'bg-pxi-purple text-white'
                                                : 'text-white/50 hover:text-white/80'
                                        }`}
                                        title="Workspace dashboard"
                                    >
                                        {sidebarCollapsed ? 'W' : 'WORKSPACE'}
                                    </button>
                                </div>
                            </div>
                        )}

                        <nav className={`dashboard-scrollbar-none mt-1 flex-1 overflow-hidden ${sidebarCollapsed ? 'flex flex-col items-center gap-1.5 px-0' : 'space-y-1.5 px-3 md:px-4'}`}>
                            {navItems.map((item) => (
                                <div key={item.key} className={sidebarCollapsed ? 'w-full flex justify-center' : 'w-full'}>
                                    <NavLink
                                        item={item}
                                        pathname={pathname}
                                        searchParams={searchParams}
                                        sidebarCollapsed={sidebarCollapsed}
                                        isLiveEvent={hasLiveEvent}
                                    />
                                </div>
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
                            <div className={`mt-2 rounded-xl bg-pxi-field px-2 py-1 text-[10px] text-white/70 ${sidebarCollapsed ? 'text-center' : ''}`}>
                                {capabilities.hasBouncerAccess ? 'LiveOps: enabled' : 'LiveOps: disabled'}
                                {' '}events:{capabilities.source?.events ? 'Y' : 'N'}
                                {' '}notif:{capabilities.source?.notifications ? 'Y' : 'N'}
                                {' '}user:{capabilities.source?.user ? 'Y' : 'N'}
                                {' '}live:{hasLiveEvent ? 'Y' : 'N'}
                            </div>
                        )}
                    </div>
                </div>
            </aside>

            <div className="flex min-w-0 flex-1 flex-col">
                <header className={`glass-panel flex items-center gap-4 rounded-none px-5 py-4 md:hidden ${menuOpen ? 'relative z-50 bg-[#050505]' : ''}`}>
                    <button
                        onClick={() => setMenuOpen((v) => !v)}
                        className="text-zinc-400 hover:text-white"
                        type="button"
                        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                        aria-expanded={menuOpen}
                        aria-controls="mnav"
                    >
                        <HugeiconsIcon icon={menuOpen ? Cancel01Icon : Menu01Icon} size={22} />
                    </button>
                    <img src="/logo-mark.png" alt="PXI" className="h-[38px] w-auto object-contain" />
                    {isAdminUser && (
                        <div
                            className="ml-auto flex rounded-full bg-pxi-field p-0.5"
                            role="group"
                            aria-label="Switch between platform admin and workspace dashboard"
                        >
                            {[['admin', 'ADMIN'], ['user', 'WORKSPACE']].map(([mode, label]) => (
                                <button
                                    key={mode}
                                    type="button"
                                    onClick={() => setAdminSidebarModeAndNavigate(mode)}
                                    className={`rounded-full px-3 py-1.5 text-[11px] font-bold tracking-wide transition-colors ${
                                        adminSidebarMode === mode ? 'bg-pxi-purple text-white' : 'text-white/50'
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    )}
                </header>

                <MobileMenu
                    open={menuOpen}
                    onClose={closeMobileMenu}
                    page={activeMenuPage}
                    links={menuLinks}
                    user={rolesReady ? user : null}
                    LinkComponent={Link}
                    desktopMin={768}
                    onSignOut={() => {
                        closeMobileMenu();
                        dashboardShellActions.openModal('logoutConfirm');
                    }}
                />

                <main className="flex-1 overflow-auto p-6 md:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
