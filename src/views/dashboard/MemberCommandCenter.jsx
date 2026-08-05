'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { HugeiconsIcon } from '@hugeicons/react';
import {
    Activity01Icon,
    ArrowRight02Icon,
    FloorPlanIcon,
    Mail01Icon,
    Megaphone01Icon,
    QrCodeIcon,
    Shield01Icon,
    Ticket01Icon,
    UserGroupIcon,
    Wallet01Icon,
} from '@hugeicons/core-free-icons';
import SurfaceHeader from '@/components/dashboard/SurfaceHeader';
import { ACCESS_TIER_META, accessTierLabel, accessTierOf } from '@/lib/accountTier';
import { authService } from '../../services/auth';

/**
 * Command Center for everyone who isn't a Diplomat yet — Partials (web-only) and
 * Citizens (passport issued). The full operations desk (analytics, CRM, ads,
 * venues, payouts) is Diplomat territory, so this stands in its place: where you
 * are on the ladder, what unlocks, and one way through.
 *
 * Partials are the top of the conversion funnel — usually the venue owner who
 * just signed up on a laptop — so the page adapts to their rung instead of
 * assuming everyone already has the app.
 */

/** Mirrors the sidebar items a Diplomat passport lights up, in sidebar order. */
const UNLOCKS = [
    { icon: Activity01Icon, title: 'Analytics', desc: 'Sales, scans, and posted media per event.' },
    { icon: QrCodeIcon, title: 'Live Operations', desc: 'Door scanning and real-time headcount.' },
    { icon: FloorPlanIcon, title: 'Venues', desc: 'Floor plans with live heat by zone.' },
    { icon: UserGroupIcon, title: 'CRM', desc: 'Your attendee list, saved as reusable segments.' },
    { icon: Megaphone01Icon, title: 'Ads Manager', desc: 'Paid placements across the PXI feed.' },
    { icon: Mail01Icon, title: 'Email Campaigns', desc: 'Send to opted-in attendees, consent handled.' },
    { icon: Wallet01Icon, title: 'Earnings', desc: 'Revenue, payouts, and receipts in one ledger.' },
    { icon: Shield01Icon, title: 'Teams & Security', desc: 'Add door staff and co-hosts with scoped access.' },
];

const OUTCOMES = [
    {
        icon: Ticket01Icon,
        title: 'Charge for the door',
        desc: 'Publish paid events and sell tickets natively — no third-party ticketing link.',
    },
    {
        icon: Wallet01Icon,
        title: 'Get paid directly',
        desc: 'Payouts land in your own bank account on Stripe’s schedule, not ours.',
    },
    {
        icon: UserGroupIcon,
        title: 'Keep the room',
        desc: 'Everyone who attends becomes an audience you can segment and re-invite.',
    },
];

/**
 * The ladder, rendered from where the user actually stands. A Partial signed up
 * on a laptop and has no app — telling them to "verify with Stripe" skips the
 * rung they're on. Everything below the first step is still shown, so they can
 * see the whole climb rather than one instruction at a time.
 */
const PARTIAL_STEPS = [
    { title: 'Issue your passport', desc: 'Install PXI on your phone — this makes you a Citizen.' },
    { title: 'Verify with Stripe', desc: 'Identity and banking, 2–5 minutes.' },
    { title: 'Run the room', desc: 'Sell tickets, scan the door, get paid.' },
];

const CITIZEN_STEPS = [
    { title: 'Verify with Stripe', desc: 'Identity and banking, 2–5 minutes.' },
    { title: 'Publish paid events', desc: 'Ticket tiers, capacity, and door rules.' },
    { title: 'Run the room', desc: 'Scanning, analytics, and payouts turn on.' },
];

export default function MemberCommandCenter({ user }) {
    const [setupState, setSetupState] = useState('loading'); // loading | not-started | in-review

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

    const inReview = setupState === 'in-review';
    const setupLabel = setupState === 'loading' ? '—' : inReview ? 'In review' : 'Not started';
    const ctaLabel = inReview ? 'Continue vendor setup' : 'Start vendor setup';

    const tier = accessTierOf(user) === 'PARTIAL' ? 'PARTIAL' : 'CITIZEN';
    const tierLabel = accessTierLabel(tier);
    const isPartial = tier === 'PARTIAL';
    const steps = isPartial ? PARTIAL_STEPS : CITIZEN_STEPS;
    const heroCopy = isPartial
        ? 'You have a web account. The app issues your passport, and Stripe verification turns this workspace into the desk you run events from.'
        : 'Your passport gets you in the room. Vendor setup turns this workspace into the desk you run it from.';

    return (
        <div className="mx-auto max-w-7xl space-y-5 md:space-y-6">
            <section className="px-1">
                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,420px)] xl:items-end">
                    <div className="min-w-0">
                        <p className="text-[13px] font-medium text-zinc-500">Command center</p>
                        <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-white md:text-[28px]">
                            Unlock the host desk
                        </h1>
                        <p className="mt-1.5 max-w-2xl text-sm leading-6 text-zinc-500">
                            {heroCopy}
                        </p>
                    </div>
                    <div className="grid grid-cols-3 gap-px overflow-hidden rounded-[1.25rem] bg-white/[0.06] ring-1 ring-white/[0.07]">
                        {[
                            // "Tier", never "Passport" — Citizen/Diplomat is the KYC
                            // ladder, not the passport LEVEL (Wanderer→Odyssey). Mixing
                            // the two makes verification read as a game. See
                            // src/lib/accountTier.js.
                            { label: 'Tier', value: tierLabel },
                            { label: 'Next', value: accessTierLabel(ACCESS_TIER_META[tier].next) },
                            { label: 'Setup', value: setupLabel },
                        ].map((metric) => (
                            <div key={metric.label} className="bg-[#0e0e13] px-4 py-3.5">
                                <p className="text-[12px] font-medium text-zinc-500">{metric.label}</p>
                                <p className="mt-1.5 truncate text-[22px] font-semibold leading-none tracking-tight text-white">
                                    {metric.value}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="dashboard-surface-b relative overflow-hidden rounded-[1.25rem] p-5 md:p-6">
                <span
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#d84aff]/[0.07] blur-3xl"
                />
                <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] lg:items-center">
                    <div className="min-w-0">
                        <SurfaceHeader
                            eyebrow="Vendor setup"
                            title={inReview ? 'Your setup is being reviewed' : 'One setup, everything turns on'}
                        />
                        <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-400">
                            {inReview
                                ? 'Stripe is still verifying your details. Reopen setup to finish any outstanding requirements, or check your status.'
                                : 'PXI verifies hosts through Stripe — identity and banking, once. When it clears, the rest of this sidebar unlocks and you can start selling tickets.'}
                        </p>
                        <div className="mt-5 flex flex-wrap items-center gap-3">
                            <Link
                                href="/dashboard/vendor-upgrade"
                                className="pill-solid inline-flex items-center gap-2 px-6 py-3 text-sm tracking-[0.02em]"
                            >
                                {ctaLabel}
                                <HugeiconsIcon icon={ArrowRight02Icon} size={14} />
                            </Link>
                            <Link
                                href="/dashboard/events"
                                className="pill-ghost px-5 py-3 text-sm font-bold tracking-[0.02em]"
                            >
                                Back to my events
                            </Link>
                        </div>
                    </div>

                    <ol className="space-y-2">
                        {steps.map((step, index) => (
                            <li key={step.title} className="flex items-start gap-3 rounded-[1rem] bg-white/[0.035] px-4 py-3">
                                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/[0.07] text-[11px] font-bold text-white/70">
                                    {index + 1}
                                </span>
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-white">{step.title}</p>
                                    <p className="mt-0.5 text-xs leading-5 text-zinc-500">{step.desc}</p>
                                </div>
                            </li>
                        ))}
                    </ol>
                </div>
            </section>

            <section className="dashboard-surface rounded-[1.25rem] p-5 md:p-6">
                <SurfaceHeader eyebrow="Locked today" title="What vendor setup unlocks" />
                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {UNLOCKS.map(({ icon, title, desc }) => (
                        <div key={title} className="rounded-[1.25rem] bg-white/[0.035] p-4">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.055]">
                                <HugeiconsIcon icon={icon} size={17} className="text-white opacity-60" />
                            </div>
                            <p className="mt-3.5 text-sm font-bold text-white">{title}</p>
                            <p className="mt-1 text-xs leading-5 text-zinc-500">{desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="dashboard-surface rounded-[1.25rem] p-5 md:p-6">
                <SurfaceHeader eyebrow="After setup" title="What becomes achievable" />
                <div className="mt-5 grid gap-3 lg:grid-cols-3">
                    {OUTCOMES.map(({ icon, title, desc }) => (
                        <div key={title} className="flex items-start gap-3.5 rounded-[1.25rem] bg-white/[0.035] p-4">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.055]">
                                <HugeiconsIcon icon={icon} size={17} className="text-white opacity-60" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-bold text-white">{title}</p>
                                <p className="mt-1 text-xs leading-5 text-zinc-500">{desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <p className="mt-5 text-xs leading-5 text-zinc-600">
                    Free events stay free to host. PXI charges a 5.49% consumer fee and a $0.99 organizer flat fee per ticket on paid
                    transactions.
                </p>
            </section>
        </div>
    );
}
