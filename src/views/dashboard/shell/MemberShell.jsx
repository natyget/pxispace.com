'use client';

import DashboardTopBar from '@/components/dashboard/shell/DashboardTopBar';

/**
 * Member (Citizen, Diplomat, and admins in Workspace mode) shell: top bar, then the page. No sidebar.
 * Passport header and the tab row slot in between the top bar and the page next.
 */
export default function MemberShell({ data, children }) {
    const {
        user,
        rolesReady,
        isAdminUser,
        adminSidebarMode,
        setAdminSidebarModeAndNavigate,
        handleAccountNavigate,
        accountPopoverOpen,
    } = data;

    return (
        <div className="dashboard-page-surface flex min-h-screen flex-col">
            <DashboardTopBar
                user={user}
                rolesReady={rolesReady}
                isAdminUser={isAdminUser}
                adminSidebarMode={adminSidebarMode}
                setAdminSidebarModeAndNavigate={setAdminSidebarModeAndNavigate}
                handleAccountNavigate={handleAccountNavigate}
                accountPopoverOpen={accountPopoverOpen}
            />
            <main className="mx-auto w-full max-w-[1320px] flex-1 px-4 py-6 md:px-8">
                {children}
            </main>
        </div>
    );
}
