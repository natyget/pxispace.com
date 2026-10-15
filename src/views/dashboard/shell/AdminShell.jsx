'use client';

import DashboardTopBar from '@/components/dashboard/shell/DashboardTopBar';
import DashboardTabs from '@/components/dashboard/shell/DashboardTabs';
import { cityLabel } from '@/lib/dashboardNavConfig';

/**
 * Dashboard 2: the control room on the same layout as the member dashboard (top bar, top tabs, sub-tabs, page),
 * without the passport. The tabs run in order of what needs a person first: Today, Growth, Platform, Trust.
 * A city-scoped admin sees their city next to the Admin / Workspace switch, and only the tabs they can use.
 */
export default function AdminShell({ data, children }) {
    const {
        user,
        rolesReady,
        isAdminUser,
        adminSidebarMode,
        setAdminSidebarModeAndNavigate,
        handleAccountNavigate,
        accountPopoverOpen,
        adminTabs,
        adminCityScope,
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
                context={adminCityScope ? cityLabel(adminCityScope) : null}
            />
            <div className="mx-auto flex w-full max-w-[1320px] min-w-0 flex-col gap-5 px-4 pt-5 md:px-8">
                <DashboardTabs tabs={adminTabs} rolesReady={rolesReady} pathname={pathname} searchParams={searchParams} />
            </div>
            <main className="mx-auto w-full max-w-[1320px] min-w-0 flex-1 px-4 pb-10 pt-6 md:px-8">{children}</main>
        </div>
    );
}
