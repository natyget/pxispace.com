'use client';

// Claims: the organizers and venues the team brought in, in one place. Claims waiting for this person to decide
// come first; then the claims they raised (sales) or every claim in their scope (admins). A new claim opens in a
// drawer from the page action, or from the URL (?claim=organizer or ?claim=venue). Replaces the old Venue claims page.

import { useCallback, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button, EmptyState, Notice, PageHeader, Panel, Skeleton, WordTabs } from '@/components/dashboard/ui/kit';
import { usePageAction } from '@/components/dashboard/shell/usePageAction';
import { cityLabel } from '@/lib/dashboardNavConfig';
import { count, displayName, handle } from '@/lib/dashFormat';
import { fetchClaims, fetchGrowthAccess, fetchMyEarnings } from '@/services/growth';
import ClaimTable from './claims/ClaimTable';
import QueueRow from './claims/QueueRow';
import RaiseDrawer from './claims/RaiseDrawer';
import { approvedLine, claimSubject, rejectedLine } from './claims/claimText';
import ApiNotice from './today/ApiNotice';
import { useLoad } from './today/useLoad';

const NONE = { claims: [] };

async function loadClaims() {
    const access = await fetchGrowthAccess();
    const can = access.can || {};
    const admin = access.adminRole === 'ADMIN' || access.adminRole === 'SUPER_ADMIN';
    const raises = Boolean(can.raiseClaims);
    const [queue, mine, all, manager] = await Promise.all([
        can.decideClaims ? fetchClaims({ view: 'queue' }) : NONE,
        raises || !admin ? fetchClaims({ view: 'mine' }) : NONE,
        admin ? fetchClaims({ view: 'all' }) : NONE,
        access.salesRole === 'AMBASSADOR' ? fetchMyEarnings().then((e) => e.rates?.manager || null).catch(() => null) : null,
    ]);
    return { access, admin, queue: queue.claims || [], mine: mine.claims || [], all: all.claims || [], manager };
}

// Who decides a claim the person just sent.
function approverName(access, manager) {
    if (access.salesRole === 'AMBASSADOR') return manager ? displayName(manager) : 'Your regional manager';
    if (access.salesRole === 'REGIONAL_MANAGER') return 'An admin';
    return 'Someone on the team';
}

export default function ClaimsView({ surface = 'admin' }) {
    const router = useRouter();
    const pathname = usePathname();
    const params = useSearchParams();
    const claims = useLoad(loadClaims);
    const [tab, setTab] = useState('yours');
    const [gone, setGone] = useState(() => new Set());
    const [notice, setNotice] = useState(null);
    const [drawer, setDrawer] = useState(undefined);

    const d = claims.data;
    const can = d?.access.can || {};
    const raises = Boolean(can.raiseClaims);
    const urlTab = params.get('claim') === 'venue' ? 'venue' : params.get('claim') === 'organizer' ? 'organizer' : null;
    // undefined means nobody has opened or closed it yet, so the URL decides.
    const drawerState = drawer === undefined ? (raises && urlTab ? { tab: urlTab } : null) : drawer;

    const closeDrawer = useCallback(() => {
        setDrawer(null);
        if (urlTab) router.replace(pathname, { scroll: false });
    }, [urlTab, router, pathname]);

    const pageAction = useMemo(
        () =>
            raises ? (
                <Button variant="primary" onClick={() => setDrawer({ tab: 'organizer' })}>
                    Claim an organizer
                </Button>
            ) : null,
        [raises],
    );
    usePageAction(pageAction);

    const organizerHref = (id) => (surface === 'sales' ? `/dashboard/sales/accounts?organizer=${id}` : `/dashboard/admin/organizers?organizer=${id}`);

    const queue = (d?.queue || []).filter((c) => !gone.has(c.id));
    const mine = d?.mine || [];
    const all = d?.all || [];
    const admin = Boolean(d?.admin);
    const inQueue = Boolean(notice) && notice.place === 'queue' && queue.length > 0;

    const onDecided = (claim, kind) => {
        setGone((prev) => new Set(prev).add(claim.id));
        setNotice({ place: 'queue', text: kind === 'approve' ? approvedLine(claim) : rejectedLine(claim) });
        claims.reload();
    };
    const onRevoked = (claim) => {
        setNotice({ place: 'page', text: claim.seller ? `Revoked. ${claimSubject(claim)} is no longer ${handle(claim.seller)}'s account.` : `Revoked. The claim on ${claimSubject(claim)} is closed.` });
        claims.reload();
    };
    const onSent = () => {
        setNotice({ place: 'page', text: `Sent. ${approverName(d.access, d.manager)} decides it.` });
        closeDrawer();
        claims.reload();
    };

    let subtitle = null;
    let kpis = null;
    if (d) {
        const city = d.access.scope === 'ALL' ? null : cityLabel(d.access.city || d.access.salesCity || d.access.adminCity);
        subtitle = city ? `${city} venues and organizers your team brought in.` : 'Venues and organizers the team brought in.';
        kpis = [];
        if (can.decideClaims) kpis.push({ label: 'Waiting for you', value: count(queue.length), tone: queue.length ? 'warn' : undefined });
        if (raises) {
            kpis.push({ label: 'Yours waiting', value: count(mine.filter((c) => c.status === 'PENDING_APPROVAL').length) });
            kpis.push({ label: 'Yours approved', value: count(mine.filter((c) => c.status === 'ACTIVE').length) });
        } else if (admin) {
            kpis.push({ label: 'Waiting', value: count(all.filter((c) => c.status === 'PENDING_APPROVAL').length) });
            kpis.push({ label: 'Approved', value: count(all.filter((c) => c.status === 'ACTIVE').length) });
        }
    }

    const claimButton = (
        <Button variant="primary" onClick={() => setDrawer({ tab: 'organizer' })}>
            Claim an organizer
        </Button>
    );
    const noClaims = (
        <EmptyState
            title="No claims yet."
            line={raises ? 'When you bring in an organizer or a venue, claim them here so the sales count as yours.' : null}
            action={raises ? claimButton : null}
        />
    );

    // What the table shows: admins can look at every claim in their scope; sales people see the claims they raised.
    const showAll = admin && (tab === 'all' || !raises);

    return (
        <div className="space-y-5 md:space-y-6" data-surface={surface}>
            <PageHeader title="Claims" subtitle={subtitle} kpis={kpis?.length ? kpis : null} />

            {claims.error ? <ApiNotice error={claims.error} /> : null}
            {claims.loading ? (
                <>
                    <Skeleton className="h-48" />
                    <Skeleton className="h-64" />
                </>
            ) : null}
            {notice && !inQueue ? <Notice tone="good">{notice.text}</Notice> : null}

            {d ? (
                <>
                    {queue.length ? (
                        <Panel title="Waiting for you">
                            {inQueue ? (
                                <Notice tone="good" className="mb-3">
                                    {notice.text}
                                </Notice>
                            ) : null}
                            <ul className="space-y-1.5">
                                {queue.map((claim) => (
                                    <QueueRow key={claim.id} claim={claim} organizerHref={organizerHref} onDecided={onDecided} />
                                ))}
                            </ul>
                        </Panel>
                    ) : null}

                    {admin ? (
                        <Panel title={raises ? null : 'All claims'}>
                            {raises ? (
                                <WordTabs
                                    className="mb-4"
                                    value={tab}
                                    onChange={setTab}
                                    items={[
                                        { key: 'yours', label: 'Yours' },
                                        { key: 'all', label: 'All' },
                                    ]}
                                />
                            ) : null}
                            <ClaimTable claims={showAll ? all : mine} organizerHref={organizerHref} showRaiser={showAll} empty={noClaims} onRevoked={onRevoked} />
                        </Panel>
                    ) : (
                        <Panel title="Claims you raised">
                            <ClaimTable claims={mine} organizerHref={organizerHref} empty={noClaims} onRevoked={onRevoked} />
                        </Panel>
                    )}
                </>
            ) : null}

            <RaiseDrawer
                state={drawerState}
                onTab={(key) => setDrawer({ tab: key })}
                onClose={closeDrawer}
                onSent={onSent}
                cityName={d ? cityLabel(d.access.salesCity || d.access.city) : ''}
            />
        </div>
    );
}
