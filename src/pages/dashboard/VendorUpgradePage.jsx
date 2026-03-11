import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Star,
    ShieldCheck,
    Banknote,
    Ticket,
    ArrowRight,
    Loader2,
    CheckCircle2,
    RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/auth';

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

export default function VendorUpgradePage() {
    const { user, updateUser } = useAuth();
    const navigate = useNavigate();

    const [step, setStep] = useState('idle'); // idle | loading | redirecting | pending | done | error
    const [errorMsg, setErrorMsg] = useState('');
    const [checkingStatus, setCheckingStatus] = useState(false);

    // If already a vendor, redirect to overview
    useEffect(() => {
        if (user?.isVendor) {
            setStep('done');
        }
    }, [user?.isVendor]);

    const handleStartOnboarding = async () => {
        setStep('loading');
        setErrorMsg('');
        try {
            const { url } = await authService.vendorOnboard();
            setStep('redirecting');
            // Small delay so user sees the transition message
            setTimeout(() => {
                window.location.href = url;
            }, 800);
        } catch (err) {
            setErrorMsg(
                err.message || 'Unable to start onboarding. Please try again.'
            );
            setStep('error');
        }
    };

    const handleCheckStatus = async () => {
        if (!user?.id) return;
        setCheckingStatus(true);
        try {
            const fresh = await authService.getMe(user.id);
            if (fresh?.isVendor) {
                updateUser({ isVendor: true });
                setStep('done');
            }
        } catch {
            // silently fail
        } finally {
            setCheckingStatus(false);
        }
    };

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
                    Your Diplomatic Passport has been issued. You can now create paid
                    events and collect revenue on PXI.
                </p>
                <button
                    onClick={() => navigate('/dashboard')}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-pxi-purple text-white font-bold text-sm uppercase tracking-widest shadow-[0_0_24px_rgba(216,74,255,0.3)] hover:brightness-110 transition-all"
                >
                    Go to Dashboard
                    <ArrowRight size={14} />
                </button>
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
                    Get Your Diplomatic Passport
                </h1>
                <p className="text-zinc-400 mt-2 leading-relaxed">
                    Unlock the ability to host paid events, sell tickets, and receive
                    payouts. Verification is handled securely by Stripe.
                </p>
            </div>

            {/* Benefits */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {BENEFITS.map(({ icon: Icon, title, desc }) => (
                    <div
                        key={title}
                        className="bg-zinc-900/50 border border-white/5 rounded-2xl p-5"
                    >
                        <div className="w-10 h-10 rounded-xl bg-pxi-purple/10 border border-pxi-purple/20 flex items-center justify-center mb-4">
                            <Icon size={18} className="text-pxi-purple" />
                        </div>
                        <h3 className="text-white font-bold text-sm mb-1">{title}</h3>
                        <p className="text-zinc-500 text-xs leading-relaxed">{desc}</p>
                    </div>
                ))}
            </div>

            {/* Error */}
            {step === 'error' && (
                <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {errorMsg}
                </div>
            )}

            {/* CTA Card */}
            <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6">
                <h2 className="text-white font-bold text-base mb-1">
                    Connect with Stripe
                </h2>
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
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        <button
                            onClick={handleStartOnboarding}
                            disabled={step === 'loading'}
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-pxi-purple text-white font-bold text-sm uppercase tracking-widest shadow-[0_0_24px_rgba(216,74,255,0.3)] hover:shadow-[0_0_36px_rgba(216,74,255,0.5)] hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {step === 'loading' ? (
                                <>
                                    <Loader2 size={14} className="animate-spin" />
                                    Connecting…
                                </>
                            ) : (
                                <>
                                    Start Stripe Verification
                                    <ArrowRight size={14} />
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>

            {/* Check Status (shown after user has left and returned) */}
            <div className="bg-zinc-900/30 border border-white/5 rounded-2xl p-5">
                <p className="text-zinc-500 text-sm mb-3">
                    Already completed Stripe verification? Check if your account has
                    been approved.
                </p>
                <button
                    onClick={handleCheckStatus}
                    disabled={checkingStatus}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-zinc-300 text-sm font-medium hover:bg-white/5 transition-all disabled:opacity-50"
                >
                    {checkingStatus ? (
                        <Loader2 size={14} className="animate-spin" />
                    ) : (
                        <RefreshCw size={14} />
                    )}
                    Check Status
                </button>
            </div>

            {/* Fine print */}
            <p className="text-zinc-600 text-xs leading-relaxed">
                By connecting with Stripe, you agree to Stripe's{' '}
                <a
                    href="https://stripe.com/connect-account/legal"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-zinc-400 transition-colors"
                >
                    Connected Account Agreement
                </a>
                . PXI charges a 4.59% consumer fee and a $0.90 vendor flat fee per
                transaction.
            </p>
        </div>
    );
}
