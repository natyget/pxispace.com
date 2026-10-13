'use client';

import DashboardTopBar from '@/components/dashboard/shell/DashboardTopBar';
import PassportHeader from '@/components/dashboard/shell/PassportHeader';
import DashboardTabs from '@/components/dashboard/shell/DashboardTabs';

/**
 * Member (Citizen, Diplomat, and admins in Workspace mode) shell: top bar, passport header, top and sub tabs,
 * then the page. No sidebar. Content is capped at 1320px and centred.
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
        memberTabs,
        pathname,
        searchParams,
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
            <div className="mx-auto flex w-full max-w-[1320px] min-w-0 flex-1 flex-col gap-5 px-4 pt-5 md:px-8">
                <PassportHeader user={user} rolesReady={rolesReady} />
                <DashboardTabs
                    tabs={memberTabs}
                    rolesReady={rolesReady}
                    pathname={pathname}
                    searchParams={searchParams}
                />
            </div>
            <main className="mx-auto w-full max-w-[1320px] min-w-0 flex-1 px-4 pb-10 pt-6 md:px-8">
                {children}
            </main>
        </div>
    );
}
