'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { HugeiconsIcon } from '@hugeicons/react';
import { Ticket01Icon, ArrowRight02Icon, Loading02Icon, CheckmarkCircle02Icon, CancelCircleIcon, RefreshIcon, Alert02Icon, SmartPhone01Icon, PercentIcon } from '@hugeicons/core-free-icons';
import SurfaceHeader from '@/components/dashboard/SurfaceHeader';
import { useAuth } from '../../contexts/AuthContext';
import { authService, authStorage } from '../../services/auth';

const BENEFITS = [
    {
        icon: Ticket01Icon,
        title: 'Sell tickets',
        desc: 'Create paid events and sell tickets directly through PXI.',
    },
    {
        icon: PercentIcon,
        title: 'Collect revenue',
        desc: 'Payouts go straight to your connected bank account.',
    },
    {
        icon: CheckmarkCircle02Icon,
        title: 'Secure verification',
        desc: 'Stripe handles identity, banking, and payment verification.',
    },
];

// Human-readable labels for Stripe currently_due field keys
const REQUIREMENT_LABELS = {
    'individual.first_name': 'First name',
    'individual.last_name': 'Last name',
    'individual.dob.day': 'Date of birth (day)',
    'individual.dob.month': 'Date of birth (month)',
    'individual.dob.year': 'Date of birth (year)',
    'individual.address.line1': 'Street address',
    'individual.address.city': 'City',
    'individual.address.state': 'State',
    'individual.address.postal_code': 'Postal code',
    'individual.ssn_last_4': 'Last 4 digits of SSN',
    'individual.id_number': 'Government ID number',
    'individual.verification.document': 'Identity document (photo ID)',
    'individual.verification.additional_document': 'Additional identity document',
    'business_profile.url': 'Business website URL',
    'business_profile.mcc': 'Business category',
    'external_account': 'Bank account',
    'tos_acceptance.date': 'Terms of service acceptance',
    'tos_acceptance.ip': 'Terms of service acceptance',
};

function formatRequirement(key) {
    return REQUIREMENT_LABELS[key] || key.replace(/_/g, ' ').replace(/\./g, ' > ');
}

function StatusRow({ label, enabled, description }) {
    return (
        <div className="flex items-start gap-3 rounded-[1.25rem] bg-white/[0.035] px-4 py-3.5">
            <HugeiconsIcon
                icon={enabled ? CheckmarkCircle02Icon : CancelCircleIcon}
                size={16}
                className={`mt-0.5 shrink-0 ${enabled ? 'text-emerald-400' : 'text-amber-400'}`}
            />
            <div className="min-w-0">
                <p className="text-sm font-bold text-white">{label}</p>
                <p className="mt-0.5 text-xs leading-5 text-zinc-500">{description}</p>
            </div>
            <span className={`ml-auto shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium tracking-[0.02em] ${
                enabled ? 'bg-emerald-500/[0.09] text-emerald-300/85' : 'bg-amber-500/[0.09] text-amber-300/85'
            }`}>
                {enabled ? 'Enabled' : 'Pending'}
            </span>
        </div>
    );
}

export default function VendorUpgradePage() {
    const { user, authReady, authRefreshing, updateUser } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    const stripeParam = searchParams.get('stripe'); // 'refresh' | null
    const fromMobile = searchParams.get('from') === 'mobile';
    const [mounted, setMounted] = useState(false);

    const [step, setStep] = useState('idle');
    const [errorMsg, setErrorMsg] = useState('');
    const [checkingStatus, setCheckingStatus] = useState(false);
    const [stripeStatus, setStripeStatus] = useState(null); // { chargesEnabled, payoutsEnabled, currentlyDue }
    const [hasSubmittedVerification, setHasSubmittedVerification] = useState(false);
    const hasOutstandingRequirements = (stripeStatus?.currentlyDue?.length ?? 0) > 0;
    const ready = mounted && authReady && !authRefreshing;

    useEffect(() => {
        const timer = setTimeout(() => setMounted(true), 0);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (!stripeParam) return undefined;
        const timer = setTimeout(() => router.replace('/dashboard/vendor-upgrade', { scroll: false }), 0);
        return () => clearTimeout(timer);
    }, [router, stripeParam]);

    useEffect(() => {
        if (!ready) return undefined;
        const timer = setTimeout(() => {
            if (user?.isVendor) {
                setStep('done');
                return;
            }
            if (stripeParam === 'refresh') {
                setStep('error');
                setErrorMsg('The Stripe verification link expired. Please start again.');
            }
        }, 0);
        return () => clearTimeout(timer);
    }, [ready, user?.isVendor, stripeParam]);

    useEffect(() => {
        if (!ready || !user?.id || user?.isVendor) return undefined;
        let cancelled = false;
        const timer = setTimeout(async () => {
            try {
                const result = await authService.checkVendorStatus();
                if (cancelled) return;
                if (result?.isVendor) {
                    if (result.token) {
                        await authStorage.save({ token: result.token, user: { ...user, isVendor: true } });
                    }
                    updateUser({ isVendor: true });
                    setStep('done');
                    return;
                }
                const hasAccount = result?.code !== 'NO_STRIPE_ACCOUNT';
                setHasSubmittedVerification(!!hasAccount);
                if (result?.code === 'PENDING_VERIFICATION') {
                    setStripeStatus(result?.stripeStatus || null);
                }
            } catch {
                // Keep page usable even if status preflight fails.
            }
        }, 0);
        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [ready, updateUser, user]);

    const handleStartOnboarding = async () => {
        setStep('loading');
        setErrorMsg('');
        setStripeStatus(null);
        try {
            const { url } = await authService.vendorOnboard({ fromMobile });
            setStep('redirecting');
            setTimeout(() => { window.location.href = url; }, 800);
        } catch (err) {
            if (err.code === 'STRIPE_ACCOUNT_EXISTS') {
                setStep('idle');
                setErrorMsg('You have already submitted your Stripe verification. Click Check Status below to confirm your account.');
            } else {
                setErrorMsg(err.message || 'Unable to start onboarding. Please try again.');
                setStep('error');
            }
        }
    };

    const handleResubmitOnboarding = async () => {
        setStep('loading');
        setErrorMsg('');
        try {
            const { url } = await authService.vendorOnboard({ fromMobile });
            setStep('redirecting');
            setTimeout(() => { window.location.href = url; }, 800);
        } catch (err) {
            setErrorMsg(err.message || 'Unable to reopen Stripe verification. Please try again.');
            setStep('error');
        }
    };

    const handleCheckStatus = async () => {
        setCheckingStatus(true);
        setErrorMsg('');
        setStripeStatus(null);
        try {
            const result = await authService.checkVendorStatus();
            if (result?.isVendor) {
                if (result.token) {
                    await authStorage.save({ token: result.token, user: { ...user, isVendor: true } });
                }
                updateUser({ isVendor: true });
                setStep('done');
            } else if (result?.code === 'NO_STRIPE_ACCOUNT') {
                setErrorMsg("You haven't submitted hosting setup yet. Please start now.");
                setStep('error');
            } else {
                // PENDING_VERIFICATION: show Stripe status breakdown.
                setStripeStatus(result?.stripeStatus || null);
                setErrorMsg('Your Stripe verification is still being processed.');
                setStep('error');
            }
        } catch (err) {
            setErrorMsg(err.message || 'Failed to check status. Please try again.');
            setStep('error');
        } finally {
            setCheckingStatus(false);
        }
    };

    if (!ready) {
        return <div className="mx-auto max-w-7xl space-y-8" />;
    }

    if (step === 'done' || user?.isVendor) {
        return (
            <div className="mx-auto flex max-w-xl flex-col items-center py-12 text-center">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/[0.09]">
                    <HugeiconsIcon icon={CheckmarkCircle02Icon} size={28} className="text-emerald-400" />
                </div>
                <p className="text-[13px] font-medium text-zinc-500">Vendor setup</p>
                <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-white md:text-[28px]">
                    Hosting is active
                </h1>
                <p className="mt-3 mb-8 text-sm leading-6 text-zinc-400">
                    Your command center is unlocked. Create paid events, sell tickets, and collect revenue on PXI.
                </p>
                {fromMobile ? (
                    <a
                        href="pxi://vendor-onboarding-complete"
                        className="pill-solid inline-flex items-center gap-2 px-6 py-3 text-sm tracking-[0.02em]"
                    >
                        <HugeiconsIcon icon={SmartPhone01Icon} size={14} />
                        Return to PXI App
                    </a>
                ) : (
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="pill-solid inline-flex items-center gap-2 px-6 py-3 text-sm tracking-[0.02em]"
                    >
                        Go to Dashboard
                        <HugeiconsIcon icon={ArrowRight02Icon} size={14} />
                    </button>
                )}
            </div>
        );
    }

    const statusLabel = !hasSubmittedVerification
        ? 'Not started'
        : hasOutstandingRequirements
            ? 'Action needed'
            : 'Submitted';

    return (
        <div className="mx-auto max-w-7xl space-y-5 md:space-y-6">
            <section className="px-1">
                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,420px)] xl:items-end">
                    <div className="min-w-0">
                        <p className="text-[13px] font-medium text-zinc-500">Vendor setup</p>
                        <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-white md:text-[28px]">
                            Start hosting on PXI
                        </h1>
                        <p className="mt-1.5 max-w-2xl text-sm leading-6 text-zinc-500">
                            One verification unlocks paid events, ticket sales, payouts, and the full operations desk.
                        </p>
                    </div>
                    <div className="grid grid-cols-3 gap-px overflow-hidden rounded-[1.25rem] bg-white/[0.06] ring-1 ring-white/[0.07]">
                        {[
                            { label: 'Status', value: statusLabel },
                            { label: 'Provider', value: 'Stripe' },
                            { label: 'Takes', value: '2–5 min' },
                        ].map((metric) => (
                            <div key={metric.label} className="bg-[#0e0e13] px-4 py-3.5">
                                <p className="text-[12px] font-medium text-zinc-500">{metric.label}</p>
                                <p className="mt-1.5 truncate text-[19px] font-semibold leading-none tracking-tight text-white">
                                    {metric.value}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {step === 'error' && errorMsg && (
                <div className="dashboard-surface flex items-start gap-3 rounded-[1.25rem] px-4 py-3.5 text-sm leading-6 text-red-300">
                    <HugeiconsIcon icon={Alert02Icon} size={16} className="mt-0.5 shrink-0" />
                    {errorMsg}
                </div>
            )}

            <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
                <section className="dashboard-surface-b rounded-[1.25rem] p-5 md:p-6">
                    <SurfaceHeader eyebrow="Step 1" title="Connect with Stripe" />
                    <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-400">
                        You&apos;ll be redirected to Stripe to complete identity and banking verification. This typically takes
                        2-5 minutes. After finishing, return here and check your status.
                    </p>

                    {step === 'redirecting' ? (
                        <div className="mt-5 flex items-center gap-3 text-sm font-semibold text-zinc-400">
                            <HugeiconsIcon icon={Loading02Icon} size={16} className="animate-spin text-white opacity-75" />
                            Redirecting to Stripe...
                        </div>
                    ) : (
                        <div className="mt-5 flex flex-wrap items-center gap-3">
                            {hasSubmittedVerification && hasOutstandingRequirements && (
                                <button
                                    onClick={handleResubmitOnboarding}
                                    disabled={step === 'loading'}
                                    className="pill-solid inline-flex items-center gap-2 px-6 py-3 text-sm tracking-[0.02em] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {step === 'loading' ? (
                                        <><HugeiconsIcon icon={Loading02Icon} size={14} className="animate-spin" />Reopening...</>
                                    ) : (
                                        <>Resubmit verification<HugeiconsIcon icon={ArrowRight02Icon} size={14} /></>
                                    )}
                                </button>
                            )}

                            <button
                                onClick={handleStartOnboarding}
                                disabled={step === 'loading' || hasSubmittedVerification}
                                title={hasSubmittedVerification ? 'Submitted hosting verification already' : undefined}
                                className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold tracking-[0.02em] transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                                    hasSubmittedVerification && hasOutstandingRequirements
                                        ? 'pill-ghost text-zinc-500'
                                        : 'pill-solid'
                                }`}
                            >
                                {step === 'loading' ? (
                                    <><HugeiconsIcon icon={Loading02Icon} size={14} className="animate-spin" />Connecting...</>
                                ) : (
                                    <>Start Stripe verification<HugeiconsIcon icon={ArrowRight02Icon} size={14} /></>
                                )}
                            </button>

                            {hasSubmittedVerification && !hasOutstandingRequirements && (
                                <button
                                    onClick={handleResubmitOnboarding}
                                    disabled={step === 'loading'}
                                    className="pill-ghost inline-flex items-center gap-2 px-5 py-3 text-sm font-bold tracking-[0.02em] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Resubmit verification
                                    <HugeiconsIcon icon={ArrowRight02Icon} size={13} />
                                </button>
                            )}

                            <button
                                onClick={handleCheckStatus}
                                disabled={checkingStatus}
                                className="pill-ghost inline-flex items-center gap-2 px-5 py-3 text-sm font-bold tracking-[0.02em] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {checkingStatus
                                    ? <HugeiconsIcon icon={Loading02Icon} size={14} className="animate-spin" />
                                    : <HugeiconsIcon icon={RefreshIcon} size={14} />}
                                Check status
                            </button>
                        </div>
                    )}

                    {hasSubmittedVerification && hasOutstandingRequirements && (
                        <p className="mt-4 rounded-[1rem] bg-amber-500/[0.07] px-4 py-3 text-xs leading-5 text-amber-300/90">
                            Outstanding requirements found. Use <span className="font-bold">Resubmit verification</span> to update
                            your Stripe information.
                        </p>
                    )}
                </section>

                <aside className="dashboard-surface rounded-[1.25rem] p-5 md:p-6">
                    <SurfaceHeader eyebrow="Included" title="What you're unlocking" />
                    <div className="mt-5 space-y-3">
                        {BENEFITS.map(({ icon, title, desc }) => (
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
                </aside>
            </div>

            {/* Stripe status breakdown — shown after a Check Status call returns PENDING */}
            {stripeStatus && (
                <section className="dashboard-surface rounded-[1.25rem] p-5 md:p-6">
                    <SurfaceHeader eyebrow="Step 2" title="Verification status" />
                    <div className="mt-5 space-y-3">
                        <StatusRow
                            label="Charges"
                            enabled={stripeStatus.chargesEnabled}
                            description="Your account can accept ticket payments from buyers."
                        />
                        <StatusRow
                            label="Payouts"
                            enabled={stripeStatus.payoutsEnabled}
                            description="Stripe can transfer your earnings to your bank account."
                        />
                    </div>

                    {stripeStatus.currentlyDue?.length > 0 && (
                        <div className="mt-4 rounded-[1.25rem] bg-white/[0.035] p-4">
                            <p className="text-[12px] font-medium text-zinc-500">Outstanding requirements</p>
                            <p className="mt-1 text-xs leading-5 text-zinc-500">
                                Complete these items in Stripe to finish verification:
                            </p>
                            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                                {stripeStatus.currentlyDue.map((key) => (
                                    <li key={key} className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
                                        <HugeiconsIcon icon={CancelCircleIcon} size={13} className="shrink-0 text-amber-400" />
                                        {formatRequirement(key)}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </section>
            )}

            <p className="px-1 text-xs leading-5 text-zinc-600">
                By connecting with Stripe, you agree to Stripe&apos;s{' '}
                <a href="https://stripe.com/connect-account/legal" target="_blank" rel="noopener noreferrer" className="underline transition-colors hover:text-zinc-400">
                    Connected Account Agreement
                </a>
                . PXI charges a 4.59% consumer fee and a $0.90 organizer flat fee per transaction.
            </p>
        </div>
    );
}
