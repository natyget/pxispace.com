'use client';

// Commissions for the people who may see everyone's money (super and global admins): every seller with their share,
// what they earned, what they were paid and what PXI still owes them. A row opens the seller quick view.

import { useCallback, useEffect, useState } from 'react';
import { DataTable, EmptyState, Notice, PageHeader, Panel, PersonLine, Skeleton } from '@/components/dashboard/ui/kit';
import { fetchAllEarnings } from '@/services/growth';
import { exactMoney } from '@/lib/dashFormat';
import { cityLabel } from '@/lib/dashboardNavConfig';
import { NEEDS_LATEST_API, errorLine, isOlderApi } from '../book/useGrowthAccess';
import SellerDrawer, { ShareText } from './SellerDrawer';

const ROLE_WORDS = { AMBASSADOR: 'Ambassador', REGIONAL_MANAGER: 'Regional manager' };

function Amount({ cents, purple = false }) {
    const zero = !cents;
    return <span className={zero ? 'text-white/35' : purple ? 'font-semibold text-[#c77dff]' : 'text-white/80'}>{exactMoney(cents || 0)}</span>;
}

function kpisOf(totals = {}) {
    return [
        { label: 'Owed now', value: exactMoney(totals.owedCents || 0), tone: totals.owedCents > 0 ? 'purple' : undefined },
        { label: 'Earned', value: exactMoney(totals.earnedCents || 0) },
        { label: 'On the way', value: exactMoney(totals.pendingCents || 0) },
        { label: 'Paid', value: exactMoney(totals.paidCents || 0) },
    ];
}

const COLUMNS = [
    {
        key: 'seller',
        label: 'Seller',
        width: 'minmax(0,1.5fr)',
        render: (s) => (
            <>
                <PersonLine person={s.user} meta={`${ROLE_WORDS[s.role] || 'Seller'}, ${cityLabel(s.city)}`} />
                <div className="mt-2.5 grid grid-cols-3 gap-x-3 text-[12px] text-white/45 md:hidden">
                    <p>
                        Earned <Amount cents={s.earnedCents} />
                    </p>
                    <p>
                        Paid <Amount cents={s.paidCents} />
                    </p>
                    <p>
                        Owed <Amount cents={s.owedCents} purple />
                    </p>
                </div>
            </>
        ),
    },
    {
        key: 'share',
        label: 'Share',
        width: 'minmax(0,1.4fr)',
        render: (s) => (
            <span className="block truncate text-[14px] text-white/80">
                <ShareText seller={s} />
            </span>
        ),
    },
    {
        key: 'accounts',
        label: 'Accounts',
        width: '72px',
        render: (s) => (
            <span className="text-[14px] text-white/80">
                {s.accounts}
                <span className="text-[12px] text-white/45 md:hidden"> {s.accounts === 1 ? 'account' : 'accounts'}</span>
            </span>
        ),
    },
    {
        key: 'earned',
        label: 'Earned',
        width: '96px',
        align: 'right',
        hideOnMobile: true,
        render: (s) => (
            <span className="text-[14px]">
                <Amount cents={s.earnedCents} />
            </span>
        ),
    },
    {
        key: 'paid',
        label: 'Paid',
        width: '96px',
        align: 'right',
        hideOnMobile: true,
        render: (s) => (
            <span className="text-[14px]">
                <Amount cents={s.paidCents} />
            </span>
        ),
    },
    {
        key: 'owed',
        label: 'Owed',
        width: '96px',
        align: 'right',
        hideOnMobile: true,
        render: (s) => (
            <span className="text-[14px]">
                <Amount cents={s.owedCents} purple />
            </span>
        ),
    },
];

export default function AllCommissions({ can }) {
    const [state, setState] = useState({ loading: true, data: null, error: null });
    const [openId, setOpenId] = useState(null);

    const load = useCallback(() => fetchAllEarnings(), []);

    useEffect(() => {
        let cancelled = false;
        load()
            .then((data) => {
                if (!cancelled) setState({ loading: false, data, error: null });
            })
            .catch((error) => {
                if (!cancelled) setState({ loading: false, data: null, error });
            });
        return () => {
            cancelled = true;
        };
    }, [load]);

    // Something was saved in the quick view: read the list again without blanking it.
    const reload = useCallback(() => {
        load()
            .then((data) => setState({ loading: false, data, error: null }))
            .catch(() => {});
    }, [load]);
    const closeDrawer = useCallback(() => setOpenId(null), []);

    const { loading, data, error } = state;
    const sellers = data?.sellers || [];
    const open = sellers.find((s) => s.user.id === openId) || null;

    return (
        <div className="space-y-5 md:space-y-6">
            <PageHeader title="Commissions" subtitle="What every seller has earned, been paid and is owed." kpis={data ? kpisOf(data.totals) : null} />

            {loading ? (
                <Skeleton className="h-64" />
            ) : error ? (
                <Notice tone="error">{isOlderApi(error) ? NEEDS_LATEST_API : errorLine(error, 'Could not load commissions.')}</Notice>
            ) : (
                <Panel>
                    <DataTable
                        columns={COLUMNS}
                        rows={sellers}
                        rowKey={(s) => s.user.id}
                        onRowClick={(s) => setOpenId(s.user.id)}
                        selectedKey={openId}
                        empty={<EmptyState title="No sellers yet." />}
                    />
                    <p className="mt-4 text-[12px] text-white/45">Shares apply to sales after they are set. Payouts are recorded here after PXI pays.</p>
                </Panel>
            )}

            <SellerDrawer seller={open} can={can} onClose={closeDrawer} onChanged={reload} />
        </div>
    );
}

