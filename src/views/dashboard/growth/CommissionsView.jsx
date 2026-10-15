'use client';

// GROWTH: Commissions (/dashboard/admin/commissions). Super and global admins see every seller's share, earnings,
// payouts and what is owed. A sales person who is also an admin gets their own Earnings page. Everyone else is told
// the money is run by the PXI team.

import { EmptyState, Notice, PageHeader, Skeleton } from '@/components/dashboard/ui/kit';
import EarningsView from './EarningsView';
import AllCommissions from './money/AllCommissions';
import { NEEDS_LATEST_API, errorLine, isOlderApi, useGrowthAccess } from './book/useGrowthAccess';

export default function CommissionsView({ surface = 'admin' }) {
    const { access, error, loading } = useGrowthAccess();

    if (loading) {
        return (
            <div className="space-y-5 md:space-y-6" data-surface={surface}>
                <Skeleton className="h-16 w-full max-w-md" />
                <Skeleton className="h-72" />
            </div>
        );
    }
    if (error) {
        return (
            <div className="space-y-5 md:space-y-6" data-surface={surface}>
                <Notice tone="error">{isOlderApi(error) ? NEEDS_LATEST_API : errorLine(error)}</Notice>
            </div>
        );
    }

    const can = access?.can || {};
    if (can.seeAllEarnings) return <AllCommissions can={can} />;
    if (access?.salesRole && access.salesRole !== 'NONE') return <EarningsView surface={surface} />;
    return (
        <div className="space-y-5 md:space-y-6" data-surface={surface}>
            <PageHeader title="Commissions" />
            <EmptyState title="Commissions are run by the PXI team." />
        </div>
    );
}
