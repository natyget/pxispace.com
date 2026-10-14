'use client';

// The pieces of an earnings answer (GET /api/growth/earnings/me, or /earnings/:userId for one seller). The Earnings
// page and the Commissions quick view both use them, so a seller's numbers read the same wherever they show up.

import { DataTable, EmptyState, Notice, PersonLine } from '@/components/dashboard/ui/kit';
import { handle, exactMoney, shortDate } from '@/lib/dashFormat';
import { nextNightLine } from '../book/bookFormat';

const SETUP_SELF = {
    SPLIT_NOT_SET: 'Your manager has not set your split yet. Until they do, your accounts earn for them.',
    MANAGER_SHARE_NOT_SET: "PXI has not set this city's share yet.",
};
const SETUP_OTHER = {
    SPLIT_NOT_SET: 'Their manager has not set their split yet. Until then, their accounts earn for the manager.',
    MANAGER_SHARE_NOT_SET: "PXI has not set this city's share yet.",
};

/** One Notice per gap in the setup, amber text. viewer: 'self' (their own page) or 'admin'. */
export function SetupNotices({ setup, viewer = 'self' }) {
    const lines = viewer === 'self' ? SETUP_SELF : SETUP_OTHER;
    const items = (setup || []).filter((code) => lines[code]);
    if (!items.length) return null;
    return (
        <div className="space-y-2">
            {items.map((code) => (
                <Notice key={code}>
                    <span className="text-amber-300">{lines[code]}</span>
                </Notice>
            ))}
        </div>
    );
}

function Money({ cents, strong = false }) {
    const zero = !cents;
    return <span className={zero ? 'text-white/35' : strong ? 'font-semibold text-white' : 'text-white/80'}>{exactMoney(cents || 0)}</span>;
}

function accountPerson(account) {
    return account.organizer;
}

function accountMeta(account) {
    if (account.via === 'TEAM' && account.ambassador) return `through ${handle(account.ambassador)}`;
    return null;
}

/** Account, Since, PXI revenue, Earned, On the way, Projected, Next night. A row opens the organizer quick view. */
export function AccountsTable({ accounts, onOpen, selectedKey = null, empty = null }) {
    const columns = [
        {
            key: 'account',
            label: 'Account',
            width: 'minmax(0,1.5fr)',
            render: (a) => (
                <>
                    <PersonLine person={accountPerson(a)} meta={accountMeta(a)} />
                    <div className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-1 text-[12px] text-white/45 md:hidden">
                        <p>
                            PXI revenue <Money cents={a.pxiRevenueCents} strong />
                        </p>
                        <p>
                            Earned <Money cents={a.earnedCents} strong />
                        </p>
                        <p>
                            On the way <Money cents={a.pendingCents} />
                        </p>
                        <p>
                            Projected <Money cents={a.projectedCents} />
                        </p>
                    </div>
                </>
            ),
        },
        {
            key: 'since',
            label: 'Since',
            width: '68px',
            hideOnMobile: true,
            render: (a) => <span className="text-[13px] text-white/70">{shortDate(a.since)}</span>,
        },
        {
            key: 'revenue',
            label: 'PXI revenue',
            width: '92px',
            align: 'right',
            hideOnMobile: true,
            render: (a) => (
                <span className="text-[14px]">
                    <Money cents={a.pxiRevenueCents} strong />
                </span>
            ),
        },
        {
            key: 'earned',
            label: 'Earned',
            width: '84px',
            align: 'right',
            hideOnMobile: true,
            render: (a) => (
                <span className="text-[14px]">
                    <Money cents={a.earnedCents} strong />
                </span>
            ),
        },
        {
            key: 'pending',
            label: 'On the way',
            width: '84px',
            align: 'right',
            hideOnMobile: true,
            render: (a) => (
                <span className="text-[14px]">
                    <Money cents={a.pendingCents} />
                </span>
            ),
        },
        {
            key: 'projected',
            label: 'Projected',
            width: '84px',
            align: 'right',
            hideOnMobile: true,
            render: (a) => (
                <span className="text-[14px]">
                    <Money cents={a.projectedCents} />
                </span>
            ),
        },
        {
            key: 'next',
            label: 'Next night',
            width: 'minmax(0,1.2fr)',
            render: (a) =>
                a.next ? (
                    <div className="min-w-0">
                        <p className="truncate text-[14px] font-semibold text-white">{a.next.name}</p>
                        <p className="truncate text-[12px] text-white/45">{nextNightLine(a.next)}</p>
                    </div>
                ) : (
                    <p className="text-[13px] text-white/35">None booked</p>
                ),
        },
    ];
    return <DataTable columns={columns} rows={accounts} rowKey="claimId" onRowClick={onOpen} selectedKey={selectedKey} empty={empty} />;
}

/** The accounts in a narrow place (a drawer): name and since on the left, earned and on the way on the right. */
export function AccountsList({ accounts, onOpen }) {
    return (
        <ul className="space-y-1.5">
            {accounts.map((a) => (
                <li key={a.claimId}>
                    <div
                        role={onOpen ? 'button' : undefined}
                        tabIndex={onOpen ? 0 : undefined}
                        onClick={onOpen ? () => onOpen(a) : undefined}
                        onKeyDown={
                            onOpen
                                ? (e) => {
                                      if (e.key === 'Enter' || e.key === ' ') {
                                          e.preventDefault();
                                          onOpen(a);
                                      }
                                  }
                                : undefined
                        }
                        className={`flex items-center justify-between gap-3 rounded-2xl bg-pxi-field px-3.5 py-3 ${onOpen ? 'cursor-pointer transition hover:bg-[#363636]' : ''}`}
                    >
                        <PersonLine person={accountPerson(a)} size={32} meta={accountMeta(a) || `Since ${shortDate(a.since)}`} />
                        <div className="shrink-0 text-right">
                            <p className="text-[14px]">
                                <Money cents={a.earnedCents} strong /> <span className="text-[12px] text-white/45">earned</span>
                            </p>
                            <p className="text-[12px] text-white/45">{exactMoney(a.pendingCents || 0)} on the way</p>
                        </div>
                    </div>
                </li>
            ))}
        </ul>
    );
}

/** Payouts as they were recorded, newest first: amount and date, then method and reference. renderAction(payout) adds a control. */
export function PayoutsList({ payouts, renderAction = null }) {
    const sorted = [...payouts].sort((a, b) => new Date(b.paidAt) - new Date(a.paidAt));
    return (
        <ul className="space-y-1.5">
            {sorted.map((p) => (
                <li key={p.id} className="flex items-center gap-3 rounded-2xl bg-pxi-field px-3.5 py-3">
                    <div className="min-w-0 shrink-0">
                        <p className="text-[14px] font-semibold text-white">{exactMoney(p.amountCents)}</p>
                        <p className="text-[12px] text-white/45">{shortDate(p.paidAt)}</p>
                    </div>
                    <div className="min-w-0 flex-1 text-right">
                        {p.method ? <p className="truncate text-[13px] text-white/70">{p.method}</p> : null}
                        {p.reference ? <p className="truncate text-[12px] text-white/45">{p.reference}</p> : null}
                    </div>
                    {renderAction ? <div className="shrink-0">{renderAction(p)}</div> : null}
                </li>
            ))}
        </ul>
    );
}

export function NoPayouts() {
    return <EmptyState title="No payouts yet." line="PXI records them here when it pays you." />;
}

export function NoAccounts({ action = null }) {
    return <EmptyState title="No accounts yet." line="Claim the organizers you bring in and they earn here." action={action} />;
}

