'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Star,
    ShieldCheck,
    Banknote,
    Ticket,
    ArrowRight,
    Loader2,
    CheckCircle2,
    XCircle,
    RefreshCw,
    AlertTriangle,
    Smartphone,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { authService, authStorage } from '../../services/auth';

const BENEFITS = [
    {
        icon: Ticket,
        title: 'Sell Tickets',
        desc: 'Create paid events and sell tickets directly through PXI.',
    },
    {
        icon: Banknote,
        title: 'Collect Revenue',
        desc: 'Payouts go straight to your connected bank account.',
    },
    {
        icon: ShieldCheck,
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
        <div className="flex items-start gap-3 py-3 border-b border-white/5 last:border-0">
            <div className="mt-0.5 flex-shrink-0">
                {enabled
                    ? <CheckCircle2 size={16} className="text-emerald-400" />
                    : <XCircle size={16} className="text-red-400" />
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
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                    <CheckCircle2 size={34} className="text-amber-400" />
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
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-pxi-purple text-white font-bold text-sm uppercase tracking-widest shadow-[0_0_24px_rgba(216,74,255,0.3)] hover:brightness-110 transition-all"
                    >
                        <Smartphone size={14} />
                        Return to PXI App
                    </a>
                ) : (
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-pxi-purple text-white font-bold text-sm uppercase tracking-widest shadow-[0_0_24px_rgba(216,74,255,0.3)] hover:brightness-110 transition-all"
                    >
                        Go to Dashboard
                        <ArrowRight size={14} />
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
                    <Star size={14} className="text-pxi-purple" />
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
                    <div key={title} className="bg-zinc-900/50 border border-white/5 rounded-2xl p-5">
                        <div className="w-10 h-10 rounded-xl bg-pxi-purple/10 border border-pxi-purple/20 flex items-center justify-center mb-4">
                            <Icon size={18} className="text-pxi-purple" />
                        </div>
                        <h3 className="text-white font-bold text-sm mb-1">{title}</h3>
                        <p className="text-zinc-500 text-xs leading-relaxed">{desc}</p>
                    </div>
                ))}
            </div>

            {/* Error banner */}
            {step === 'error' && errorMsg && (
                <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                    {errorMsg}
                </div>
            )}

            {/* Stripe status breakdown — shown after a Check Status call returns PENDING */}
            {stripeStatus && (
                <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-5 space-y-1">
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
                                        <XCircle size={13} className="text-amber-400 flex-shrink-0" />
                                        {formatRequirement(key)}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            {/* CTA Card */}
            <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6">
                <h2 className="text-white font-bold text-base mb-1">Connect with Stripe</h2>
                <p className="text-zinc-500 text-sm mb-5 leading-relaxed">
                    You'll be redirected to Stripe to complete identity and banking
                    verification. This typically takes 2–5 minutes. After finishing,
                    return here to check your status.
                </p>

                {step === 'redirecting' ? (
                    <div className="flex items-center gap-3 text-zinc-400 text-sm">
                        <Loader2 size={16} className="animate-spin text-pxi-purple" />
                        Redirecting to Stripe…
                    </div>
                ) : (
                    <div className="flex flex-wrap items-center gap-3">
                        {hasSubmittedVerification && hasOutstandingRequirements && (
                            <button
                                onClick={handleResubmitOnboarding}
                                disabled={step === 'loading'}
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-pxi-purple text-white font-bold text-sm uppercase tracking-widest shadow-[0_0_24px_rgba(216,74,255,0.3)] hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {step === 'loading' ? (
                                    <><Loader2 size={14} className="animate-spin" />Reopening…</>
                                ) : (
                                    <>Resubmit Verification<ArrowRight size={14} /></>
                                )}
                            </button>
                        )}

                        <button
                            onClick={handleStartOnboarding}
                            disabled={step === 'loading' || hasSubmittedVerification}
                            title={hasSubmittedVerification ? 'Submitted the vendor verification already' : undefined}
                            className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                                hasSubmittedVerification && hasOutstandingRequirements
                                    ? 'bg-zinc-800 border border-white/10 text-zinc-500 shadow-none'
                                    : 'bg-pxi-purple text-white shadow-[0_0_24px_rgba(216,74,255,0.3)] hover:brightness-110'
                            }`}
                        >
                            {step === 'loading' ? (
                                <><Loader2 size={14} className="animate-spin" />Connecting…</>
                            ) : (
                                <>Start Stripe Verification<ArrowRight size={14} /></>
                            )}
                        </button>

                        {hasSubmittedVerification && !hasOutstandingRequirements && (
                            <button
                                onClick={handleResubmitOnboarding}
                                disabled={step === 'loading'}
                                className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border border-pxi-purple/35 text-pxi-purple font-bold text-xs uppercase tracking-widest hover:bg-pxi-purple/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Resubmit Verification
                                <ArrowRight size={13} />
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
            <div className="bg-zinc-900/30 border border-white/5 rounded-2xl p-5">
                <p className="text-zinc-500 text-sm mb-3">
                    Already completed Stripe verification? Check if your account has been approved.
                </p>
                <button
                    onClick={handleCheckStatus}
                    disabled={checkingStatus}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-zinc-300 text-sm font-medium hover:bg-white/5 transition-all disabled:opacity-50"
                >
                    {checkingStatus ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
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
