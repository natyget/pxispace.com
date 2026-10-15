'use client';

// GROWTH: what a seller has earned, what is on the way, what they are on course to make, and what they were paid.
// For ambassadors and regional managers (the Sales tab). The Commissions page renders this for sales staff who are
// not allowed to see everyone's numbers. A row opens the organizer quick view (?organizer=<id>).

import { useCallback, useEffect, useState } from 'react';
import { EmptyState, Notice, PageHeader, Panel, Skeleton } from '@/components/dashboard/ui/kit';
import { fetchMyEarnings } from '@/services/growth';
import LinkButton from './book/LinkButton';
import OrganizerDrawer from './book/OrganizerDrawer';
import { useOrganizerParam } from './book/useOrganizerParam';
import { NEEDS_LATEST_API, errorLine, isOlderApi } from './book/useGrowthAccess';
import { AccountsTable, NoAccounts, NoPayouts, PayoutsList, SetupNotices } from './money/EarningsParts';
import { myEarningsKpis, rateSentence } from './money/earningsFormat';

const CLAIM_HREF = '/dashboard/sales/claims?claim=organizer';

export default function EarningsView({ surface = 'sales' }) {
    const [state, setState] = useState({ loading: true, data: null, error: null });
    const [organizerId, setOrganizerId] = useOrganizerParam();
    const closeDrawer = useCallback(() => setOrganizerId(null), [setOrganizerId]);

    useEffect(() => {
        let cancelled = false;
        fetchMyEarnings()
            .then((data) => {
                if (!cancelled) setState({ loading: false, data, error: null });
            })
            .catch((error) => {
                if (!cancelled) setState({ loading: false, data: null, error });
            });
        return () => {
            cancelled = true;
        };
    }, []);

    const { loading, data, error } = state;

    if (loading) {
        return (
            <div className="space-y-5 md:space-y-6" data-surface={surface}>
                <PageHeader title="Earnings" />
                <Skeleton className="h-24" />
                <Skeleton className="h-64" />
            </div>
        );
    }

    if (error) {
        const notSales = error.status === 403 && error.code === 'SALES_ROLE_REQUIRED';
        return (
            <div className="space-y-5 md:space-y-6" data-surface={surface}>
                <PageHeader title="Earnings" />
                {notSales ? (
                    <EmptyState title="Earnings are for ambassadors and regional managers." />
                ) : (
                    <Notice tone="error">{isOlderApi(error) ? NEEDS_LATEST_API : errorLine(error, 'Could not load your earnings.')}</Notice>
                )}
            </div>
        );
    }

    const accounts = data.accounts || [];
    const payouts = data.payouts || [];
    const selected = accounts.find((a) => a.organizer?.id === organizerId) || null;

    return (
        <div className="space-y-5 md:space-y-6" data-surface={surface}>
            <PageHeader title="Earnings" subtitle={rateSentence(data)} kpis={myEarningsKpis(data.totals)} />
            <SetupNotices setup={data.setup} />

            <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
                <Panel title="Accounts">
                    <AccountsTable
                        accounts={accounts}
                        onOpen={(account) => setOrganizerId(account.organizer.id)}
                        selectedKey={selected?.claimId ?? null}
                        empty={<NoAccounts action={<LinkButton href={CLAIM_HREF} variant="primary">Claim an organizer</LinkButton>} />}
                    />
                </Panel>
                <Panel title="Payouts">{payouts.length ? <PayoutsList payouts={payouts} /> : <NoPayouts />}</Panel>
            </div>

            <OrganizerDrawer organizerId={organizerId} row={selected?.organizer || null} surface={surface} onClose={closeDrawer} />
        </div>
    );
}
