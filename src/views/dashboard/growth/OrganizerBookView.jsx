'use client';

// GROWTH: the organizer book. Who is selling, who needs a call, who brought them in. One list for the control room
// (/dashboard/admin/organizers) and the Sales tab (/dashboard/sales/accounts); the backend decides which accounts
// and which numbers each person gets. A row opens the quick view (?organizer=<id>).

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Button,
    DataTable,
    EmptyState,
    Field,
    Notice,
    PageHeader,
    Panel,
    PersonLine,
    Select,
    Skeleton,
    StateText,
    WordTabs,
} from '@/components/dashboard/ui/kit';
import { usePageAction } from '@/components/dashboard/shell/usePageAction';
import { fetchOrganizers } from '@/services/growth';
import { count, displayName, handle, money } from '@/lib/dashFormat';
import { cityLabel } from '@/lib/dashboardNavConfig';
import LinkButton from './book/LinkButton';
import OrganizerDrawer from './book/OrganizerDrawer';
import { useOrganizerParam } from './book/useOrganizerParam';
import { NEEDS_LATEST_API, errorLine, isOlderApi, useGrowthAccess } from './book/useGrowthAccess';
import { lastContactText, nextNightLine, stageOf, ticketsText } from './book/bookFormat';

const CLAIM_HREF = '/dashboard/sales/claims?claim=organizer';
const PAGE_SIZE = 50;
const CITY_OPTIONS = [
    { value: '', label: 'All cities' },
    { value: 'NYC', label: cityLabel('NYC') },
    { value: 'BOS', label: cityLabel('BOS') },
];

export default function OrganizerBookView({ surface = 'admin' }) {
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
    if (!access?.hasAccess) {
        return (
            <div className="space-y-5 md:space-y-6" data-surface={surface}>
                <PageHeader title="Organizers" />
                <EmptyState title="Organizers are run by the PXI sales team." />
            </div>
        );
    }
    return <OrganizerBook surface={surface} access={access} />;
}

function titleFor(surface, scope) {
    if (surface !== 'sales') return 'Organizers';
    return scope === 'OWN' ? 'Your accounts' : 'Accounts';
}

function OrganizerBook({ surface, access }) {
    const can = access.can || {};
    const scope = access.scope;
    const isSales = Boolean(access.salesRole) && access.salesRole !== 'NONE';

    const [params, setParams] = useState({ view: 'signals', q: '', city: '', page: 1 });
    const [search, setSearch] = useState('');
    const [result, setResult] = useState({ key: null, rows: [], total: 0, totals: null, error: null });
    const [organizerId, setOrganizerId] = useOrganizerParam();

    const patch = useCallback((next) => setParams((p) => ({ ...p, page: 1, ...next })), []);

    // The search box waits a moment after the last key before it asks.
    useEffect(() => {
        const value = search.trim();
        const timer = setTimeout(() => setParams((p) => (p.q === value ? p : { ...p, q: value, page: 1 })), 300);
        return () => clearTimeout(timer);
    }, [search]);

    const city = scope === 'ALL' ? params.city : '';
    const key = `${params.view}|${city}|${params.q}|${params.page}`;
    useEffect(() => {
        let cancelled = false;
        fetchOrganizers({ view: params.view, city, q: params.q, page: params.page, limit: PAGE_SIZE })
            .then((res) => {
                if (cancelled) return;
                const incoming = res.organizers || [];
                setResult((prev) => ({
                    key,
                    rows: params.page > 1 ? [...prev.rows, ...incoming] : incoming,
                    total: res.total || 0,
                    totals: res.totals || prev.totals,
                    error: null,
                }));
            })
            .catch((err) => {
                if (cancelled) return;
                setResult((prev) => ({ ...prev, key, rows: params.page > 1 ? prev.rows : [], total: 0, error: err }));
            });
        return () => {
            cancelled = true;
        };
    }, [key, params.view, params.q, params.page, city]);

    const loading = result.key !== key;
    const firstLoad = loading && params.page === 1;

    const canClaim = isSales && Boolean(can.raiseClaims);
    const pageAction = useMemo(() => (canClaim ? <LinkButton href={CLAIM_HREF} variant="primary">Claim an organizer</LinkButton> : null), [canClaim]);
    usePageAction(pageAction);

    const tabs = useMemo(() => {
        const items = [
            { key: 'signals', label: 'Needs a call' },
            { key: 'all', label: 'All' },
        ];
        if (isSales && scope !== 'OWN') items.push({ key: 'mine', label: 'Mine' });
        if (scope === 'ALL' || scope === 'CITY') items.push({ key: 'unclaimed', label: 'Unclaimed' });
        items.push({ key: 'pending', label: 'Waiting' });
        return items;
    }, [isSales, scope]);

    const totals = result.totals;
    const kpis = totals
        ? [
              {
                  label: 'PXI revenue this month',
                  value: money(totals.pxiRevenueMonthCents),
                  hint: totals.grossMonthCents != null ? `${money(totals.grossMonthCents)} in ticket sales` : undefined,
              },
              { label: 'Selling', value: count(totals.selling) },
              { label: 'Need a call', value: count(totals.needsCall), tone: totals.needsCall > 0 ? 'warn' : undefined },
              { label: 'New this month', value: count(totals.newThisMonth) },
          ]
        : null;

    const columns = useMemo(() => bookColumns(params.view === 'signals'), [params.view]);
    const selectedRow = result.rows.find((r) => r.id === organizerId) || null;

    const onTouch = useCallback((id, touch) => {
        if (!touch) return;
        setResult((prev) => ({
            ...prev,
            rows: prev.rows.map((r) => (r.id === id ? { ...r, lastTouch: { kind: touch.kind, at: touch.at, actor: touch.actor } } : r)),
        }));
    }, []);

    const empty = emptyFor(params.view, { searching: Boolean(params.q), ownsOnly: scope === 'OWN', claimAction: canClaim ? <LinkButton href={CLAIM_HREF} variant="primary">Claim an organizer</LinkButton> : null });
    const hasMore = result.rows.length < result.total;
    const errored = result.key === key && result.error;
    const subtitle = 'Who is selling, who needs a call, and who brought them in.';

    return (
        <div className="space-y-5 md:space-y-6" data-surface={surface}>
            <PageHeader title={titleFor(surface, scope)} subtitle={subtitle} kpis={kpis} />

            <Panel>
                <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between md:gap-6 md:border-b md:border-white/[0.08]">
                    <WordTabs items={tabs} value={params.view} onChange={(view) => patch({ view })} className="md:border-b-0!" />
                    <div className="flex flex-col gap-2 md:flex-row md:pb-1.5">
                        <Field
                            type="search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search name or @username"
                            aria-label="Search name or @username"
                            className="md:w-[260px]"
                        />
                        {scope === 'ALL' ? (
                            <div className="relative md:w-[150px]">
                                <Select
                                    value={params.city}
                                    onChange={(e) => patch({ city: e.target.value })}
                                    options={CITY_OPTIONS}
                                    aria-label="City"
                                />
                                <svg
                                    aria-hidden="true"
                                    width="12"
                                    height="12"
                                    viewBox="0 0 12 12"
                                    fill="none"
                                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/50"
                                >
                                    <path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                        ) : null}
                    </div>
                </div>

                {errored ? (
                    <Notice tone="error">{isOlderApi(result.error) ? NEEDS_LATEST_API : errorLine(result.error, 'Could not load organizers.')}</Notice>
                ) : (
                    <>
                        <DataTable
                            columns={columns}
                            rows={result.rows}
                            loading={firstLoad}
                            empty={empty}
                            onRowClick={(row) => setOrganizerId(row.id)}
                            selectedKey={organizerId}
                        />
                        {hasMore && !firstLoad ? (
                            <div className="mt-4 flex justify-center">
                                <Button variant="quiet" disabled={loading} onClick={() => setParams((p) => ({ ...p, page: p.page + 1 }))}>
                                    {loading ? 'Loading' : `Show more (${count(result.total - result.rows.length)} left)`}
                                </Button>
                            </div>
                        ) : null}
                    </>
                )}
            </Panel>

            <OrganizerDrawer organizerId={organizerId} row={selectedRow} surface={surface} onClose={() => setOrganizerId(null)} onTouch={onTouch} />
        </div>
    );
}

function emptyFor(view, { searching, ownsOnly, claimAction }) {
    if (searching) return <EmptyState title="No organizers match that search." />;
    if (view === 'signals') return <EmptyState title="Nobody needs a call right now." />;
    if (view === 'mine' || (view === 'all' && ownsOnly)) return <EmptyState title="No accounts yet." action={claimAction} />;
    if (view === 'unclaimed') return <EmptyState title="No unclaimed organizers." />;
    if (view === 'pending') return <EmptyState title="No claims waiting." />;
    return <EmptyState title="No organizers yet." />;
}

// The six columns. On a phone each row stacks, so the last two collapse into one small block of text.
function bookColumns(signalsView) {
    return [
        {
            key: 'organizer',
            label: 'Organizer',
            width: 'minmax(0,1.15fr)',
            render: (o) => <PersonLine person={o} />,
        },
        signalsView
            ? {
                  key: 'why',
                  label: 'Why now',
                  width: 'minmax(0,2fr)',
                  render: (o) => <p className="text-[14px] leading-5 text-white/80">{o.signal?.text || ''}</p>,
              }
            : {
                  key: 'stage',
                  label: 'Stage',
                  width: '96px',
                  render: (o) => {
                      const s = stageOf(o.stage);
                      return <StateText tone={s.tone}>{s.label}</StateText>;
                  },
              },
        {
            key: 'next',
            label: 'Next night',
            width: 'minmax(0,1.25fr)',
            render: (o) =>
                o.next ? (
                    <div className="min-w-0">
                        <p className="truncate text-[14px] font-semibold text-white">{o.next.name}</p>
                        <p className="truncate text-[12px] text-white/45">{nextNightLine(o.next)}</p>
                    </div>
                ) : (
                    <p className="text-[13px] text-white/35">None booked</p>
                ),
        },
        {
            key: 'last30',
            label: 'Last 30 days',
            width: '108px',
            align: 'right',
            render: (o) => <Last30 last30={o.last30} />,
        },
        {
            key: 'owner',
            label: 'Brought in by',
            width: 'minmax(0,1fr)',
            render: (o) => <BroughtInBy owner={o.owner} lastTouch={o.lastTouch} />,
        },
        {
            key: 'contact',
            label: 'Last contact',
            width: 'minmax(0,1fr)',
            hideOnMobile: true,
            render: (o) =>
                o.lastTouch ? (
                    <div className="min-w-0">
                        <p className="truncate text-[13px] text-white/80">{lastContactText(o.lastTouch)}</p>
                        {o.lastTouch.actor ? <p className="truncate text-[12px] text-white/45">{displayName(o.lastTouch.actor)}</p> : null}
                    </div>
                ) : (
                    <p className="text-[13px] text-white/35">Never</p>
                ),
        },
    ];
}

function Last30({ last30 }) {
    const quiet = !last30?.pxiRevenueCents && !last30?.tickets;
    return (
        <>
            <div className="hidden md:block">
                <p className={`text-[14px] font-semibold ${quiet ? 'text-white/35' : 'text-white'}`}>{money(last30?.pxiRevenueCents || 0)}</p>
                <p className={`text-[12px] ${quiet ? 'text-white/35' : 'text-white/45'}`}>{ticketsText(last30?.tickets || 0)}</p>
            </div>
            <p className="text-[12px] text-white/45 md:hidden">
                Last 30 days: {money(last30?.pxiRevenueCents || 0)} PXI revenue, {ticketsText(last30?.tickets || 0)}
            </p>
        </>
    );
}

function BroughtInBy({ owner, lastTouch }) {
    const pending = owner?.status === 'PENDING_APPROVAL';
    return (
        <>
            <div className="hidden min-w-0 md:block">
                {owner ? (
                    <>
                        <p className="truncate text-[14px] text-white">{handle(owner.seller)}</p>
                        {pending ? <StateText tone="warn">Waiting</StateText> : null}
                    </>
                ) : (
                    <p className="text-[13px] text-white/35">No one</p>
                )}
            </div>
            <div className="space-y-0.5 text-[12px] text-white/45 md:hidden">
                <p>
                    {owner ? `Brought in by ${handle(owner.seller)}` : 'Not brought in by anyone'}
                    {pending ? <span className="ml-2 font-semibold text-amber-300">Waiting</span> : null}
                </p>
                <p>Last contact: {lastContactText(lastTouch)}</p>
            </div>
        </>
    );
}
