'use client';

import DashboardModalHost from '@/components/dashboard/DashboardModalHost';
import TierLock from '@/components/dashboard/shell/TierLock';
import { dashboardShellActions } from '@/lib/dashboardShellStore';
import { useDashboardShellData } from './shell/useDashboardShellData';
import AdminShell from './shell/AdminShell';
import MemberShell from './shell/MemberShell';

function RouteSkeleton() {
    return (
        <div aria-busy="true" aria-label="Loading" className="dashboard-surface mx-auto h-40 w-full max-w-xl animate-pulse rounded-[1.25rem]" />
    );
}

export default function DashboardLayout({ children }) {
    const data = useDashboardShellData();

    let content = children;
    if (data.routeGate === 'pending') content = <RouteSkeleton />;
    else if (data.routeGate === 'vendor') content = <TierLock requirement="vendor" />;
    else if (data.routeGate === 'bouncer') content = <TierLock requirement="bouncer" />;

    const modalRenderers = {
        logoutConfirm: () => ({
            title: 'Sign out?',
            description: "You'll need to sign in again to access your account.",
            footer: (
                <>
                    <button
                        onClick={data.handleLogout}
                        className="pill-solid flex-1 px-4 py-2.5 text-sm"
                    >
                        Sign Out
                    </button>
                    <button
                        onClick={() => dashboardShellActions.closeTopLayer()}
                        className="pill-cancel flex-1 px-4 py-2.5 text-sm font-medium"
                    >
                        Cancel
                    </button>
                </>
            ),
        }),
    };

    return (
        <>
            {data.isAdminNav
                ? <AdminShell data={data}>{content}</AdminShell>
                : <MemberShell data={data}>{content}</MemberShell>}
            <DashboardModalHost
                stack={data.modalStack}
                onCloseTop={() => dashboardShellActions.closeTopLayer()}
                renderers={modalRenderers}
            />
        </>
    );
}
