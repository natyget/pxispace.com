'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { HugeiconsIcon } from '@hugeicons/react';
import { StarIcon, HelpCircleIcon, Ticket01Icon, ArrowRight02Icon, Loading02Icon, CheckmarkCircle02Icon, CancelCircleIcon, RefreshIcon, Alert02Icon, SmartPhone01Icon, PercentIcon } from '@hugeicons/core-free-icons';
import { useAuth } from '../../contexts/AuthContext';
import { authService, authStorage } from '../../services/auth';

const BENEFITS = [
    {
        icon: Ticket01Icon,
        title: 'Sell Tickets',
        desc: 'Create paid events and sell tickets directly through PXI.',
    },
    {
        icon: PercentIcon,
        title: 'Collect Revenue',
        desc: 'Payouts go straight to your connected bank account.',
    },
    {
        icon: CheckmarkCircle02Icon,
        title: 'Secure Verification',
        desc: 'Powered by Stripe — industry-standard identity and payment verification.',
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
    return REQUIREMENT_LABELS[key] || key.replace(/_/g, ' ').replace(/\./g, ' → ');
}

function StatusRow({ label, enabled, description }) {
    return (
        <div className="flex items-start gap-3 py-3 shadow-[inset_0_-1px_0_rgba(255,255,255,0.035)] last:shadow-none">
            <div className="mt-0.5 flex-shrink-0">
                {enabled
                    ? <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} className="text-emerald-400" />
                    : <HugeiconsIcon icon={CancelCircleIcon} size={16} className="text-red-400" />
                }
            </div>
            <div>
                <p className={`text-sm font-semibold ${enabled ? 'text-emerald-400' : 'text-red-400'}`}>{label}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{description}</p>
            </div>
        </div>
    );
}

export default function VendorUpgradePage() {
    const { user, updateUser } = useAuth();
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

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (stripeParam) router.replace('/dashboard/vendor-upgrade', { scroll: false });
    }, []);

    useEffect(() => {
        if (!mounted) return;
        if (user?.isVendor) {
            setStep('done');
            return;
        }
        if (stripeParam === 'refresh') {
            setStep('error');
            setErrorMsg('The Stripe verification link expired. Please start again.');
        }
    }, [mounted, user?.isVendor, stripeParam]);

    useEffect(() => {
        if (!user?.id || user?.isVendor) return;
        let cancelled = false;
        (async () => {
            try {
                const result = await authService.checkVendorStatus();
                if (cancelled) return;
                const hasAccount = result?.code !== 'NO_STRIPE_ACCOUNT';
                setHasSubmittedVerification(!!hasAccount);
                if (result?.code === 'PENDING_VERIFICATION') {
                    setStripeStatus(result?.stripeStatus || null);
                }
            } catch {
                // Keep page usable even if status preflight fails.
            }
        })();
        return () => { cancelled = true; };
    }, [user?.id, user?.isVendor]);

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
                setErrorMsg("You haven't submitted vendor setup yet. Please start now.");
                setStep('error');
            } else {
                // PENDING_VERIFICATION — show Stripe status breakdown
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

    if (!mounted) {
        return <div className="max-w-2xl mx-auto space-y-8" />;
    }

    if (step === 'done' || user?.isVendor) {
        return (
            <div className="max-w-xl mx-auto py-12 text-center">
                <div className="glass-panel mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/10">
                    <HugeiconsIcon icon={CheckmarkCircle02Icon} size={34} className="text-amber-400" />
                </div>
                <h1 className="text-3xl font-black text-white mb-3 tracking-tight">
                    You're a Vendor!
                </h1>
                <p className="text-zinc-400 mb-8">
                    Your PXI Passport has been issued. You can now create paid
                    events and collect revenue on PXI.
                </p>
                {fromMobile ? (
                    <a
                        href="pxi://vendor-onboarding-complete"
                        className="pill-solid inline-flex items-center gap-2 px-6 py-3 text-sm uppercase tracking-widest"
                    >
                        <HugeiconsIcon icon={SmartPhone01Icon} size={14} />
                        Return to PXI App
                    </a>
                ) : (
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="pill-solid inline-flex items-center gap-2 px-6 py-3 text-sm uppercase tracking-widest"
                    >
                        Go to Dashboard
                        <HugeiconsIcon icon={ArrowRight02Icon} size={14} />
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <HugeiconsIcon icon={StarIcon} size={14} className="text-pxi-purple" />
                    <span className="text-pxi-purple text-xs font-bold uppercase tracking-widest">
                        Vendor Upgrade
                    </span>
                </div>
                <h1 className="text-3xl font-black text-white tracking-tight">
                    Get Your PXI Passport
                </h1>
                <p className="text-zinc-400 mt-2 leading-relaxed">
                    Unlock the ability to host paid events, sell tickets, and receive
                    payouts. Verification is handled securely by Stripe.
                </p>
            </div>

            {/* Benefits */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {BENEFITS.map(({ icon: Icon, title, desc }) => (
                    <div key={title} className="glass-panel rounded-2xl p-5">
                        <div className="glass-field mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-pxi-purple/10">
                            <HugeiconsIcon icon={Icon} size={18} className="text-pxi-purple" />
                        </div>
                        <h3 className="text-white font-bold text-sm mb-1">{title}</h3>
                        <p className="text-zinc-500 text-xs leading-relaxed">{desc}</p>
                    </div>
                ))}
            </div>

            {/* Error banner */}
            {step === 'error' && errorMsg && (
                <div className="glass-panel flex items-start gap-3 rounded-2xl px-4 py-3 text-sm text-red-300">
                    <HugeiconsIcon icon={Alert02Icon} size={16} className="mt-0.5 flex-shrink-0" />
                    {errorMsg}
                </div>
            )}

            {/* Stripe status breakdown — shown after a Check Status call returns PENDING */}
            {stripeStatus && (
                <div className="glass-panel rounded-2xl p-5 space-y-1">
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">Stripe Account Status</p>

                    <StatusRow
                        label="Charges Enabled"
                        enabled={stripeStatus.chargesEnabled}
                        description="Your account can accept ticket payments from buyers."
                    />
                    <StatusRow
                        label="Payouts Enabled"
                        enabled={stripeStatus.payoutsEnabled}
                        description="Stripe can transfer your earnings to your bank account."
                    />

                    {stripeStatus.currentlyDue?.length > 0 && (
                        <div className="pt-3">
                            <p className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-2">
                                Outstanding Requirements
                            </p>
                            <p className="text-xs text-zinc-500 mb-3">
                                Complete these items in your Stripe dashboard to finish verification:
                            </p>
                            <ul className="space-y-1.5">
                                {stripeStatus.currentlyDue.map((key) => (
                                    <li key={key} className="flex items-center gap-2 text-xs text-zinc-300">
                                        <HugeiconsIcon icon={CancelCircleIcon} size={13} className="text-amber-400 flex-shrink-0" />
                                        {formatRequirement(key)}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            {/* CTA Card */}
            <div className="glass-panel rounded-2xl p-6">
                <h2 className="text-white font-bold text-base mb-1">Connect with Stripe</h2>
                <p className="text-zinc-500 text-sm mb-5 leading-relaxed">
                    You'll be redirected to Stripe to complete identity and banking
                    verification. This typically takes 2–5 minutes. After finishing,
                    return here to check your status.
                </p>

                {step === 'redirecting' ? (
                    <div className="flex items-center gap-3 text-zinc-400 text-sm">
                        <HugeiconsIcon icon={Loading02Icon} size={16} className="animate-spin text-pxi-purple" />
                        Redirecting to Stripe…
                    </div>
                ) : (
                    <div className="flex flex-wrap items-center gap-3">
                        {hasSubmittedVerification && hasOutstandingRequirements && (
                            <button
                                onClick={handleResubmitOnboarding}
                                disabled={step === 'loading'}
                                className="pill-solid inline-flex items-center gap-2 px-6 py-3 text-sm uppercase tracking-widest disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {step === 'loading' ? (
                                    <><HugeiconsIcon icon={Loading02Icon} size={14} className="animate-spin" />Reopening…</>
                                ) : (
                                    <>Resubmit Verification<HugeiconsIcon icon={ArrowRight02Icon} size={14} /></>
                                )}
                            </button>
                        )}

                        <button
                            onClick={handleStartOnboarding}
                            disabled={step === 'loading' || hasSubmittedVerification}
                            title={hasSubmittedVerification ? 'Submitted the vendor verification already' : undefined}
                            className={`inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                                hasSubmittedVerification && hasOutstandingRequirements
                                    ? 'pill-ghost text-zinc-500'
                                    : 'pill-solid'
                            }`}
                        >
                            {step === 'loading' ? (
                                <><HugeiconsIcon icon={Loading02Icon} size={14} className="animate-spin" />Connecting…</>
                            ) : (
                                <>Start Stripe Verification<HugeiconsIcon icon={ArrowRight02Icon} size={14} /></>
                            )}
                        </button>

                        {hasSubmittedVerification && !hasOutstandingRequirements && (
                            <button
                                onClick={handleResubmitOnboarding}
                                disabled={step === 'loading'}
                                className="pill-ghost inline-flex items-center gap-2 px-4 py-3 text-xs uppercase tracking-widest disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Resubmit Verification
                                <HugeiconsIcon icon={ArrowRight02Icon} size={13} />
                            </button>
                        )}
                    </div>
                )}
                {hasSubmittedVerification && hasOutstandingRequirements && (
                    <p className="text-amber-400 text-xs mt-3">
                        Outstanding requirements found. Use <span className="font-semibold">Resubmit Verification</span> to update your Stripe information.
                    </p>
                )}
            </div>

            {/* Check Status */}
            <div className="glass-panel rounded-2xl p-5">
                <p className="text-zinc-500 text-sm mb-3">
                    Already completed Stripe verification? Check if your account has been approved.
                </p>
                <button
                    onClick={handleCheckStatus}
                    disabled={checkingStatus}
                    className="pill-ghost inline-flex items-center gap-2 px-4 py-2 text-sm font-medium disabled:opacity-50"
                >
                    {checkingStatus ? <HugeiconsIcon icon={Loading02Icon} size={14} className="animate-spin" /> : <HugeiconsIcon icon={RefreshIcon} size={14} />}
                    Check Status
                </button>
            </div>

            {/* Fine print */}
            <p className="text-zinc-600 text-xs leading-relaxed">
                By connecting with Stripe, you agree to Stripe's{' '}
                <a href="https://stripe.com/connect-account/legal" target="_blank" rel="noopener noreferrer" className="underline hover:text-zinc-400 transition-colors">
                    Connected Account Agreement
                </a>
                . PXI charges a 4.59% consumer fee and a $0.90 vendor flat fee per transaction.
            </p>
        </div>
    );
}
