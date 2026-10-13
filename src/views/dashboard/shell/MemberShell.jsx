'use client';

import Link from 'next/link';
import { HugeiconsIcon } from '@hugeicons/react';
import { Menu01Icon, Cancel01Icon } from '@hugeicons/core-free-icons';
import MobileMenu from '@/components/layout/MobileMenu';
import { dashboardShellActions } from '@/lib/dashboardShellStore';

/**
 * Member (Citizen, Diplomat, and admins in Workspace mode) shell. Interim: the phone header and menu only.
 * The top bar, passport header and tab row land here next.
 */
export default function MemberShell({ data, children }) {
    const {
        user,
        rolesReady,
        isAdminUser,
        adminSidebarMode,
        setAdminSidebarModeAndNavigate,
        menuLinks,
        activeMenuPage,
        menuOpen,
        setMenuOpen,
        closeMobileMenu,
    } = data;

    return (
        <div className="dashboard-page-surface flex min-h-screen flex-col">
            <div className="flex min-w-0 flex-1 flex-col">
                <header className={`glass-panel flex items-center gap-4 rounded-none px-5 py-4 ${menuOpen ? 'relative z-50 bg-[#050505]' : ''}`}>
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

                <main className="mx-auto w-full max-w-[1320px] flex-1 px-4 py-6 md:px-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
