'use client';

// One seller's money, from the Commissions page: the same numbers and pieces as their own Earnings page, plus what a
// super admin can do about them: set a regional manager's share (with its history) and record or void payouts.

import { useCallback, useEffect, useState } from 'react';
import { Avatar, Button, Drawer, KpiStrip, Notice, Skeleton, StateText } from '@/components/dashboard/ui/kit';
import { fetchEarningsFor, fetchRates, voidPayout } from '@/services/growth';
import { displayName, handle, percentFromBps, shortDate } from '@/lib/dashFormat';
import { cityLabel } from '@/lib/dashboardNavConfig';
import { Section } from '../book/OrganizerSections';
import { NEEDS_LATEST_API, errorLine, isOlderApi } from '../book/useGrowthAccess';
import { AccountsList, PayoutsList, SetupNotices } from './EarningsParts';
import { sellerEarningsKpis } from './earningsFormat';
import { PayoutForm, ShareForm } from './SellerForms';

const ROLE_WORDS = { AMBASSADOR: 'Ambassador', REGIONAL_MANAGER: 'Regional manager' };

/** What the seller gets, in words: "20% of PXI revenue", "50% of @rm's share", or "Not set". */
export function ShareText({ seller }) {
    if (seller.role === 'REGIONAL_MANAGER') {
        return seller.managerShareBps == null ? <StateText tone="warn">Not set</StateText> : <span>{percentFromBps(seller.managerShareBps)} of PXI revenue</span>;
    }
    if (seller.splitBps == null) return <StateText tone="warn">Not set</StateText>;
    return (
        <span>
            {percentFromBps(seller.splitBps)} of {seller.manager ? `${handle(seller.manager)}'s` : "their manager's"} share
        </span>
    );
}

function Header({ seller }) {
    const { user } = seller;
    return (
        <div className="flex min-w-0 items-center gap-4">
            <Avatar person={user} size={56} />
            <div className="min-w-0">
                <p className="truncate text-[20px] font-semibold leading-6 text-white">{displayName(user)}</p>
                <p className="truncate text-[13px] text-white/50">@{user.username}</p>
                <p className="mt-1 text-[12px] font-normal text-white/45">
                    {ROLE_WORDS[seller.role] || 'Seller'}, {cityLabel(seller.city)}
                </p>
            </div>
        </div>
    );
}

/**
 * seller: a row of GET /earnings. can: what the viewer may do. onChanged(): something was saved, so the list reloads.
 */
export default function SellerDrawer({ seller, can, onClose, onChanged }) {
    if (!seller) return null;
    return <OpenSeller key={seller.user.id} seller={seller} can={can} onClose={onClose} onChanged={onChanged} />;
}

function OpenSeller({ seller, can, onClose, onChanged }) {
    const userId = seller.user.id;
    const [state, setState] = useState({ earnings: null, rates: [], error: null });
    const [mode, setMode] = useState(null); // null | 'share' | 'payout'
    const [notice, setNotice] = useState(null);
    const [confirmVoid, setConfirmVoid] = useState(null);
    const [voiding, setVoiding] = useState(false);

    const load = useCallback(async () => {
        const [earnings, rates] = await Promise.all([fetchEarningsFor(userId), fetchRates(userId).catch(() => ({ rates: [] }))]);
        return { earnings, rates: rates?.rates || [] };
    }, [userId]);

    useEffect(() => {
        let cancelled = false;
        load()
            .then((res) => {
                if (!cancelled) setState({ ...res, error: null });
            })
            .catch((error) => {
                if (!cancelled) setState({ earnings: null, rates: [], error });
            });
        return () => {
            cancelled = true;
        };
    }, [load]);

    // After a save: read this seller again and tell the list to do the same.
    const saved = async (text) => {
        setMode(null);
        setConfirmVoid(null);
        setNotice({ tone: 'good', text });
        try {
            setState({ ...(await load()), error: null });
        } catch {
            // keep what is on screen
        }
        onChanged?.();
    };

    const doVoid = async (payout) => {
        setVoiding(true);
        try {
            await voidPayout(payout.id);
            await saved('Payout voided.');
        } catch (err) {
            setNotice({ tone: 'error', text: errorLine(err, 'Could not void that payout.') });
            setConfirmVoid(null);
        } finally {
            setVoiding(false);
        }
    };

    const { earnings, rates, error } = state;
    const isManager = seller.role === 'REGIONAL_MANAGER';
    const history = [...rates].sort((a, b) => new Date(b.effectiveFrom) - new Date(a.effectiveFrom));
    const owed = earnings?.totals?.owedCents ?? seller.owedCents ?? 0;

    let body;
    if (error) {
        body = <Notice tone="error">{isOlderApi(error) ? NEEDS_LATEST_API : errorLine(error, 'Could not load this seller.')}</Notice>;
    } else if (!earnings) {
        body = (
            <div className="space-y-4">
                <Skeleton className="h-24" />
                <Skeleton className="h-32" />
                <Skeleton className="h-40" />
            </div>
        );
    } else {
        const payouts = earnings.payouts || [];
        const accounts = earnings.accounts || [];
        body = (
            <div className="space-y-7 pt-2">
                {notice ? <Notice tone={notice.tone}>{notice.text}</Notice> : null}
                <KpiStrip items={sellerEarningsKpis(earnings.totals)} className="xl:w-full!" />
                <SetupNotices setup={earnings.setup} viewer="admin" />

                <Section
                    title="Share"
                    aside={
                        isManager && can.setManagerRates && mode !== 'share' ? (
                            <Button size="sm" variant="secondary" onClick={() => { setNotice(null); setMode('share'); }}>
                                Set share
                            </Button>
                        ) : null
                    }
                >
                    <p className="text-[14px] text-white">
                        <ShareText seller={seller} />
                    </p>
                    {mode === 'share' ? (
                        <div className="mt-3">
                            <ShareForm userId={userId} currentBps={seller.managerShareBps} onCancel={() => setMode(null)} onDone={() => saved('Share saved. It applies to sales from now on.')} />
                        </div>
                    ) : null}
                    {history.length ? (
                        <ul className="mt-3 space-y-2">
                            {history.map((rate, i) => (
                                <li key={`${rate.effectiveFrom}-${i}`}>
                                    <p className="text-[13px] text-white/70">
                                        {percentFromBps(rate.rateBps)} from {shortDate(rate.effectiveFrom)}, set by {displayName(rate.setBy)}
                                    </p>
                                    {rate.note ? <p className="text-[12px] text-white/45">{rate.note}</p> : null}
                                </li>
                            ))}
                        </ul>
                    ) : null}
                </Section>

                <Section
                    title="Payouts"
                    aside={
                        can.recordPayouts && mode !== 'payout' ? (
                            <Button size="sm" variant={owed > 0 ? 'primary' : 'secondary'} onClick={() => { setNotice(null); setMode('payout'); }}>
                                Record payout
                            </Button>
                        ) : null
                    }
                >
                    {mode === 'payout' ? (
                        <div className="mb-3">
                            <PayoutForm userId={userId} owedCents={owed} onCancel={() => setMode(null)} onDone={() => saved('Payout recorded.')} />
                        </div>
                    ) : null}
                    {payouts.length ? (
                        <PayoutsList
                            payouts={payouts}
                            renderAction={
                                can.recordPayouts
                                    ? (p) =>
                                          confirmVoid === p.id ? (
                                              <div className="flex gap-1.5">
                                                  <Button size="sm" variant="danger" disabled={voiding} onClick={() => doVoid(p)}>
                                                      Void
                                                  </Button>
                                                  <Button size="sm" variant="quiet" disabled={voiding} onClick={() => setConfirmVoid(null)}>
                                                      Keep
                                                  </Button>
                                              </div>
                                          ) : (
                                              <Button size="sm" variant="quiet" onClick={() => setConfirmVoid(p.id)}>
                                                  Void
                                              </Button>
                                          )
                                    : null
                            }
                        />
                    ) : (
                        <p className="text-[14px] text-white/50">No payouts yet.</p>
                    )}
                </Section>

                <Section title="Accounts">
                    {accounts.length ? <AccountsList accounts={accounts} /> : <p className="text-[14px] text-white/50">No accounts yet.</p>}
                </Section>
            </div>
        );
    }

    return (
        <Drawer open onClose={onClose} title={<Header seller={seller} />}>
            {body}
        </Drawer>
    );
}
