'use client';

// Your team (regional managers): the ambassadors under them, what each one's split is, and what they have earned
// and are owed. A row opens a quick view to set the split or take them off the team; "Add ambassador" puts an
// account on the team by its exact username.

import { useCallback, useMemo, useState } from 'react';
import { Button, DataTable, EmptyState, Notice, PageHeader, Panel, PersonLine, Skeleton } from '@/components/dashboard/ui/kit';
import { usePageAction } from '@/components/dashboard/shell/usePageAction';
import { cityLabel } from '@/lib/dashboardNavConfig';
import { count, money, percentFromBps } from '@/lib/dashFormat';
import { fetchMyEarnings, fetchTeamEarnings } from '@/services/growth';
import { fetchSalesTeam } from '@/services/sales';
import AddDrawer from './team/AddDrawer';
import MemberDrawer from './team/MemberDrawer';
import ApiNotice from './today/ApiNotice';
import { useLoad } from './today/useLoad';

// The team list (who is on it) joined by username with what they earn (splits, accounts, earned, owed).
async function loadTeam() {
    const [team, earnings, mine] = await Promise.all([fetchSalesTeam(), fetchTeamEarnings(), fetchMyEarnings()]);
    const sellers = new Map((earnings.sellers || []).map((s) => [s.user?.username, s]));
    const rows = (team.ambassadors || []).map((a) => {
        const s = sellers.get(a.username);
        return {
            id: a.username || a.name,
            username: a.username,
            name: a.name,
            suspended: Boolean(a.suspended),
            claims: a.claims,
            avatarUrl: s?.user?.avatarUrl ?? null,
            splitBps: s?.splitBps ?? null,
            accounts: s?.accounts ?? 0,
            earnedCents: s?.earnedCents ?? 0,
            owedCents: s?.owedCents ?? 0,
        };
    });
    return { city: team.cityCode, rows, shareBps: mine.rates?.managerShareBps ?? null };
}

const plural = (n, word) => `${count(n)} ${word}${Number(n) === 1 ? '' : 's'}`;

export default function TeamView({ surface = 'sales' }) {
    const team = useLoad(loadTeam);
    const [adding, setAdding] = useState(false);
    const [selected, setSelected] = useState(null);
    const [notice, setNotice] = useState(null);

    const d = team.data;
    const failed = Boolean(team.error);
    const pageAction = useMemo(
        () =>
            failed ? null : (
                <Button variant="primary" onClick={() => setAdding(true)}>
                    Add ambassador
                </Button>
            ),
        [failed],
    );
    usePageAction(pageAction);

    // Stable handlers: the drawers re-focus themselves whenever their close handler changes.
    const closeAdd = useCallback(() => setAdding(false), []);
    const closeMember = useCallback(() => setSelected(null), []);

    const city = d ? cityLabel(d.city) : '';
    const rows = d?.rows || [];
    const member = rows.find((r) => r.username === selected) || null;

    const onAdded = (text) => {
        setAdding(false);
        setNotice(text);
        team.reload();
    };
    const onRemoved = (m) => {
        setSelected(null);
        setNotice(`@${m.username} is off your team. The claims they raised stay as they are.`);
        team.reload();
    };

    const columns = [
        {
            key: 'person',
            label: 'Ambassador',
            width: 'minmax(0,1.6fr)',
            render: (r) => (
                <PersonLine
                    person={{ name: r.name, username: r.username, avatarUrl: r.avatarUrl }}
                    meta={
                        <>
                            <span className="block truncate">{r.name && r.username ? `@${r.username}` : ''}</span>
                            {r.suspended ? <span className="block truncate text-amber-300">Suspended</span> : null}
                            <span className="block truncate md:hidden">
                                {plural(r.accounts, 'account')}, {money(r.earnedCents)} earned, {money(r.owedCents)} owed
                            </span>
                        </>
                    }
                />
            ),
        },
        {
            key: 'split',
            label: 'Their split',
            width: 'minmax(0,1.1fr)',
            render: (r) =>
                r.splitBps === null ? (
                    <span className="text-[13px] font-semibold text-amber-300">Not set</span>
                ) : (
                    <span className="text-[13px] text-white/80">{percentFromBps(r.splitBps)} of your share</span>
                ),
        },
        { key: 'accounts', label: 'Accounts', width: '80px', align: 'right', hideOnMobile: true, render: (r) => <span className="text-[13px] text-white/80">{count(r.accounts)}</span> },
        { key: 'earned', label: 'Earned', width: '96px', align: 'right', hideOnMobile: true, render: (r) => <span className="text-[13px] text-white/80">{money(r.earnedCents)}</span> },
        { key: 'owed', label: 'Owed', width: '96px', align: 'right', hideOnMobile: true, render: (r) => <span className="text-[13px] font-semibold text-white">{money(r.owedCents)}</span> },
    ];

    const kpis = d
        ? [
              { label: 'Ambassadors', value: count(rows.length) },
              { label: 'Your share', value: percentFromBps(d.shareBps), tone: d.shareBps === null ? 'warn' : undefined },
              { label: 'Owed to them', value: money(rows.reduce((sum, r) => sum + r.owedCents, 0)) },
          ]
        : null;

    return (
        <div className="space-y-5 md:space-y-6" data-surface={surface}>
            <PageHeader title="Your team" subtitle={d ? `Your ambassadors in ${city}.` : null} kpis={kpis} />

            {team.error ? <ApiNotice error={team.error} /> : null}
            {team.loading ? <Skeleton className="h-64" /> : null}
            {notice ? <Notice tone="good">{notice}</Notice> : null}

            {d ? (
                <Panel>
                    <DataTable
                        columns={columns}
                        rows={rows}
                        selectedKey={selected}
                        onRowClick={(r) => setSelected(r.username)}
                        empty={
                            <EmptyState
                                title="No ambassadors yet."
                                line="Add someone by their PXI username and they can raise claims for you to approve."
                                action={
                                    <Button variant="primary" onClick={() => setAdding(true)}>
                                        Add ambassador
                                    </Button>
                                }
                            />
                        }
                    />
                    {rows.length ? (
                        <p className="mt-4 text-[13px] text-white/45">
                            On accounts your ambassadors bring in, you get your share of PXI revenue and pass each of them their split of it.
                        </p>
                    ) : null}
                </Panel>
            ) : null}

            <AddDrawer open={adding} onClose={closeAdd} onAdded={onAdded} cityName={city} />
            <MemberDrawer member={member} shareBps={d?.shareBps ?? null} onClose={closeMember} onSaved={team.reload} onRemoved={onRemoved} />
        </div>
    );
}
