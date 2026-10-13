'use client';

import { useState } from 'react';
import Link from 'next/link';
import { HugeiconsIcon } from '@hugeicons/react';
import { Settings01Icon } from '@hugeicons/core-free-icons';
import AccountCardPopover from '@/components/dashboard/AccountCardPopover';
import NotificationPopover from './NotificationPopover';
import { dashboardShellActions } from '@/lib/dashboardShellStore';

/**
 * Member top bar: PXI mark, the admin/workspace switch for admins, then bell, settings gear and avatar.
 */
export default function DashboardTopBar({
    user,
    rolesReady,
    isAdminUser,
    adminSidebarMode,
    setAdminSidebarModeAndNavigate,
    handleAccountNavigate,
    accountPopoverOpen,
}) {
    const [unreadCount, setUnreadCount] = useState(0);

    return (
        <header className="flex min-w-0 items-center gap-3 border-b border-white/[0.06] bg-pxi-surface px-4 py-3 md:px-8">
            <Link href="/" className="shrink-0 transition-opacity hover:opacity-80">
                <img src="/logo-mark.png" alt="PXI" className="h-[34px] w-auto object-contain md:h-[38px]" />
            </Link>

            {isAdminUser && (
                <div
                    className="ml-2 flex min-w-0 rounded-full bg-pxi-field p-0.5"
                    role="group"
                    aria-label="Switch between platform admin and workspace dashboard"
                >
                    {[['admin', 'ADMIN'], ['user', 'WORKSPACE']].map(([mode, label]) => (
                        <button
                            key={mode}
                            type="button"
                            onClick={() => setAdminSidebarModeAndNavigate(mode)}
                            className={`rounded-full px-3 py-1.5 text-[11px] font-bold tracking-wide transition-colors ${
                                adminSidebarMode === mode ? 'bg-pxi-purple text-white' : 'text-white/50 hover:text-white/80'
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            )}

            <div className="ml-auto flex shrink-0 items-center gap-2">
                <NotificationPopover
                    userId={rolesReady ? user?.id : null}
                    unreadCount={unreadCount}
                    onUnreadChange={setUnreadCount}
                />
                <Link
                    href="/dashboard/account?tab=profile"
                    aria-label="Settings"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-pxi-field text-white/70 transition hover:bg-white/[0.07] hover:text-white"
                >
                    <HugeiconsIcon icon={Settings01Icon} size={18} />
                </Link>
                <AccountCardPopover
                    anchor="below"
                    user={rolesReady ? user : null}
                    isOpen={accountPopoverOpen}
                    onOpenChange={dashboardShellActions.setAccountPopoverOpen}
                    onNavigate={handleAccountNavigate}
                    onSignOut={() => dashboardShellActions.openModal('logoutConfirm')}
                />
            </div>
        </header>
    );
}
