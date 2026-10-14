'use client';

// Today: what needs this person now, with the button to deal with it, most urgent first. Money context on the
// right (sales earnings, or what the team is owed). Used by the control room (surface="admin") and the member
// Sales tab (surface="sales").

import { useMemo, useState } from 'react';
import { EmptyState, Notice, PageHeader, Panel, Skeleton } from '@/components/dashboard/ui/kit';
import { usePageAction } from '@/components/dashboard/shell/usePageAction';
import { fetchAllEarnings, fetchClaims, fetchGrowthAccess, fetchInbox, fetchMyEarnings } from '@/services/growth';
import { approvedLine, rejectedLine } from './claims/claimText';
import ApiNotice from './today/ApiNotice';
import InboxRow from './today/InboxRow';
import LinkButton from './today/LinkButton';
import MoneyPanels from './today/MoneyPanels';
import { useLoad } from './today/useLoad';

const GROUPS = [
    { key: 'now', title: 'Needs you now' },
    { key: 'today', title: 'Today' },
    { key: 'later', title: 'When you have a minute' },
];

// The inbox, plus the claims waiting for this person (the inbox row only says what it is; the claim has the
// seller's note and who it is about, for the line shown after Approve).
async function loadInbox() {
    const [inbox, queue] = await Promise.all([fetchInbox(), fetchClaims({ view: 'queue' }).catch(() => ({ claims: [] }))]);
    return { items: inbox.items || [], claims: queue.claims || [] };
}

// Who this person is, then the money they should see. A failed earnings call only hides its panel.
async function loadMoney() {
    const access = await fetchGrowthAccess();
    const sells = Boolean(access.salesRole) && access.salesRole !== 'NONE';
    const [mine, all] = await Promise.all([
        sells ? fetchMyEarnings().catch(() => null) : null,
        access.can?.seeAllEarnings ? fetchAllEarnings().catch(() => null) : null,
    ]);
    return { mine, all };
}

export default function InboxView({ surface = 'admin' }) {
    const inbox = useLoad(loadInbox);
    const cash = useLoad(loadMoney);
    const [gone, setGone] = useState(() => new Set());
    const [notice, setNotice] = useState(null);

    const alertsHref = surface === 'sales' ? '/dashboard/sales/alerts' : '/dashboard/admin/alerts';
    const earningsHref = surface === 'sales' ? '/dashboard/sales/earnings' : '/dashboard/admin/commissions';
    // The control room's sub-tabs already carry Email alerts, so the action is only added on the Sales tab.
    const pageAction = useMemo(
        () =>
            surface === 'sales' ? (
                <LinkButton href={alertsHref} variant="quiet">
                    Email alerts
                </LinkButton>
            ) : null,
        [surface, alertsHref],
    );
    usePageAction(pageAction);

    const items = (inbox.data?.items || []).filter((item) => !gone.has(item.key));
    const claimOf = (item) => (inbox.data?.claims || []).find((c) => c.id === item.action?.claimId) || null;
    const needNow = items.filter((item) => item.urgency === 'now').length;

    const onDecided = (item, claim, kind) => {
        setGone((prev) => new Set(prev).add(item.key));
        setNotice({ group: item.urgency, text: kind === 'approve' ? approvedLine(claim) : rejectedLine(claim) });
        inbox.reload();
    };

    let subtitle = null;
    if (inbox.data) subtitle = needNow > 0 ? `${needNow} ${needNow === 1 ? 'thing needs' : 'things need'} you now.` : 'Nothing needs you right now.';

    const hasMoney = Boolean(cash.data?.mine || cash.data?.all);
    const rightColumn = cash.loading || hasMoney;
    const noticeInPanel = Boolean(notice) && items.some((item) => item.urgency === notice.group);

    return (
        <div className="space-y-5 md:space-y-6" data-surface={surface}>
            <PageHeader title="Today" subtitle={subtitle} />

            <div className={`grid items-start gap-5 ${rightColumn ? 'xl:grid-cols-[minmax(0,1fr)_360px]' : ''}`}>
                <div className="min-w-0 space-y-5">
                    {inbox.error ? <ApiNotice error={inbox.error} /> : null}
                    {inbox.loading ? <Skeleton className="h-72" /> : null}
                    {notice && !noticeInPanel ? <Notice tone="good">{notice.text}</Notice> : null}

                    {inbox.data
                        ? GROUPS.map((group) => {
                              const rows = items.filter((item) => item.urgency === group.key);
                              if (!rows.length) return null;
                              return (
                                  <Panel key={group.key} title={group.title}>
                                      {notice && notice.group === group.key ? (
                                          <Notice tone="good" className="mb-3">
                                              {notice.text}
                                          </Notice>
                                      ) : null}
                                      <ul className="space-y-1.5">
                                          {rows.map((item) => (
                                              <InboxRow key={item.key} item={item} claim={claimOf(item)} onDecided={onDecided} />
                                          ))}
                                      </ul>
                                  </Panel>
                              );
                          })
                        : null}

                    {inbox.data && items.length === 0 ? (
                        <EmptyState
                            title="Nothing needs you right now."
                            line="Claims, support tickets and organizers worth a call land here and in your email."
                        />
                    ) : null}
                </div>

                {rightColumn ? (
                    <div className="min-w-0 space-y-5">
                        {cash.loading ? <Skeleton className="hidden h-44 xl:block" /> : <MoneyPanels mine={cash.data.mine} all={cash.data.all} earningsHref={earningsHref} />}
                    </div>
                ) : null}
            </div>
        </div>
    );
}
