'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowRight02Icon, PlusSignIcon } from '@hugeicons/core-free-icons';
import EventCard from '@/components/dashboard/hub/EventCard';
import { toLiveOrUpcomingCard } from '@/components/dashboard/hub/eventCards';
import { usePageAction } from '@/components/dashboard/shell/usePageAction';
import { PXI_GET_APP_HREF } from '@/lib/appStoreLinks';
import { accessTierLabel, accessTierOf } from '@/lib/accountTier';
import { authService } from '../../services/auth';
import { eventsService } from '../../services/events';

/**
 * Command Center for everyone who isn't a Diplomat yet: Partials (web-only) and Citizens (passport issued).
 * One card shows where you are, what Diplomat adds, and the three steps with one way through.
 * Citizens who host see their live and upcoming events below it, the same cards Diplomats get.
 */
const DIPLOMAT_ADDS = ['Sell tickets', 'Get paid directly', 'Keep your audience'];

const PARTIAL_STEPS = ['Finish your account in the PXI app', 'Verify with Stripe', 'Run the room'];
const CITIZEN_STEPS = ['Verify with Stripe', 'Publish a paid event', 'Run the room'];

export default function MemberCommandCenter({ user }) {
    const [setupState, setSetupState] = useState('loading'); // loading | not-started | in-review
    const [events, setEvents] = useState([]);

    const tier = accessTierOf(user) === 'PARTIAL' ? 'PARTIAL' : 'CITIZEN';
    const isPartial = tier === 'PARTIAL';
    const tierLabel = accessTierLabel(tier);
    const steps = isPartial ? PARTIAL_STEPS : CITIZEN_STEPS;
    const inReview = setupState === 'in-review';
    const ctaLabel = inReview ? 'Continue vendor setup' : 'Start vendor setup';

    const createAction = useMemo(
        () => (isPartial ? null : (
            <Link href="/dashboard/events/new" className="pill-ghost inline-flex min-h-[42px] items-center gap-2 px-5 text-sm font-bold">
                <HugeiconsIcon icon={PlusSignIcon} size={15} />
                Create event
            </Link>
        )),
        [isPartial]
    );
    usePageAction(createAction);

    useEffect(() => {
        if (!user?.id) return undefined;
        let cancelled = false;
        const timer = setTimeout(() => {
            authService.checkVendorStatus()
                .then((result) => {
                    if (cancelled) return;
                    setSetupState(result?.code === 'NO_STRIPE_ACCOUNT' ? 'not-started' : 'in-review');
                })
                .catch(() => {
                    if (!cancelled) setSetupState('not-started');
                });
        }, 0);
        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [user?.id]);

    useEffect(() => {
        if (!user?.id || isPartial) return undefined;
        let cancelled = false;
        const timer = setTimeout(() => {
            eventsService
                .getMyEvents({ limit: 100, offset: 0 })
                .then((res) => {
                    if (!cancelled) setEvents(res.events || []);
                })
                .catch(() => {
                    if (!cancelled) setEvents([]);
                });
        }, 0);
        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [user?.id, isPartial]);

    const liveAndUpcoming = useMemo(
        () => events.map((event) => toLiveOrUpcomingCard(event)).filter(Boolean).slice(0, 6),
        [events]
    );

    return (
        <div className="mx-auto max-w-7xl space-y-5 md:space-y-6">
            <h1 className="text-2xl font-semibold text-white md:text-[28px]">Command Center</h1>

            <section className="dashboard-surface rounded-[1.25rem] p-5 md:p-6">
                <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
                    <div className="min-w-0">
                        <p className="text-xs text-zinc-500">Your tier</p>
                        <p className="mt-1 text-2xl font-semibold text-white">{tierLabel}</p>
                        <p className="mt-6 text-sm text-zinc-400">Diplomat adds</p>
                        <ul className="mt-2 space-y-2">
                            {DIPLOMAT_ADDS.map((line) => (
                                <li key={line} className="text-sm font-semibold text-white">{line}</li>
                            ))}
                        </ul>
                    </div>

                    <div className="min-w-0">
                        <ol className="space-y-2">
                            {steps.map((step, index) => {
                                const current = index === 0;
                                return (
                                    <li
                                        key={step}
                                        aria-current={current ? 'step' : undefined}
                                        className={`flex items-center gap-3 rounded-[1rem] px-4 py-3 ${current ? 'bg-pxi-field' : 'bg-pxi-surface'}`}
                                    >
                                        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${current ? 'bg-pxi-purple text-white' : 'bg-white/[0.07] text-white/50'}`}>
                                            {index + 1}
                                        </span>
                                        <p className={`text-sm font-semibold ${current ? 'text-white' : 'text-zinc-500'}`}>{step}</p>
                                    </li>
                                );
                            })}
                        </ol>
                        {isPartial ? (
                            <Link href={PXI_GET_APP_HREF} className="pill-solid mt-5 inline-flex items-center gap-2 px-6 py-3 text-sm tracking-[0.02em]">
                                Get the app
                                <HugeiconsIcon icon={ArrowRight02Icon} size={14} />
                            </Link>
                        ) : (
                            <Link href="/dashboard/vendor-upgrade" className="pill-solid mt-5 inline-flex items-center gap-2 px-6 py-3 text-sm tracking-[0.02em]">
                                {ctaLabel}
                                <HugeiconsIcon icon={ArrowRight02Icon} size={14} />
                            </Link>
                        )}
                    </div>
                </div>
                <p className="mt-6 text-xs leading-5 text-zinc-500">
                    Free events stay free to host. PXI charges a 5.49% consumer fee and a $0.99 organizer flat fee per ticket on paid transactions.
                </p>
            </section>

            {!isPartial && liveAndUpcoming.length ? (
                <section className="dashboard-surface rounded-[1.25rem] p-5 md:p-6">
                    <h2 className="text-base font-semibold text-white">Live and upcoming</h2>
                    <div className="mt-5 flex gap-3 overflow-x-auto pb-1 md:grid md:grid-cols-2 md:overflow-visible xl:grid-cols-3">
                        {liveAndUpcoming.map((event) => (
                            <EventCard key={event.id} event={event} />
                        ))}
                    </div>
                </section>
            ) : null}
        </div>
    );
}
