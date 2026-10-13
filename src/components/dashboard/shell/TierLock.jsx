'use client';

import Link from 'next/link';
import { HugeiconsIcon } from '@hugeicons/react';
import { LockIcon } from '@hugeicons/core-free-icons';
import { PXI_GET_APP_HREF } from '@/lib/appStoreLinks';

/**
 * What a locked tab or action shows in place of the page. The page itself is never mounted behind it, so a
 * Citizen opening Earnings does not fire vendor-only API calls; the backend stays the real gate.
 *
 * requirement:
 * - 'passport': Partial (web-only) accounts. Finishing the account in the app issues the passport.
 * - 'vendor': Citizens. Stripe verification makes them a Diplomat.
 * - 'bouncer': door staff access, granted per event by the host.
 */
const DEFAULTS = {
    passport: {
        title: 'Finish your account in the PXI app',
        body: 'Your passport is issued in the app. It lets you host events here.',
        primaryHref: PXI_GET_APP_HREF,
        primaryLabel: 'Get the app',
    },
    vendor: {
        title: 'Diplomats only',
        body: 'Verify with Stripe once to sell tickets, get paid and open this tab.',
        primaryHref: '/dashboard/vendor-upgrade',
        primaryLabel: 'Start vendor setup',
    },
    bouncer: {
        title: 'Door staff only',
        body: 'The host adds you to an event to open the scanner.',
        primaryHref: '/dashboard/events',
        primaryLabel: 'My events',
    },
};

export default function TierLock({ requirement = 'vendor', title, body, primaryHref, primaryLabel, compact = false }) {
    const copy = DEFAULTS[requirement] || DEFAULTS.vendor;
    const href = primaryHref || copy.primaryHref;
    const label = primaryLabel || copy.primaryLabel;

    return (
        <section
            className={`dashboard-surface mx-auto flex w-full max-w-xl flex-col items-center rounded-[1.25rem] text-center ${
                compact ? 'px-5 py-8' : 'px-6 py-14 md:py-20'
            }`}
        >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-pxi-field">
                <HugeiconsIcon icon={LockIcon} size={18} className="text-white/70" />
            </span>
            <h2 className="mt-5 text-lg font-semibold text-white">{title || copy.title}</h2>
            <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-400">{body || copy.body}</p>
            {href ? (
                <Link href={href} className="pill-solid mt-6 inline-flex items-center px-6 py-3 text-sm tracking-[0.02em]">
                    {label}
                </Link>
            ) : null}
        </section>
    );
}
