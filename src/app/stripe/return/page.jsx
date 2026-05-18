'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { HugeiconsIcon } from '@hugeicons/react';
import { CheckmarkCircle02Icon, SmartPhone01Icon, ArrowRight02Icon, Loading02Icon } from '@hugeicons/core-free-icons';

function StripeReturnContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const fromMobile = searchParams.get('from') === 'mobile';

    useEffect(() => {
        if (fromMobile) return;
        const timer = setTimeout(() => {
            router.replace('/dashboard/vendor-upgrade');
        }, 4000);
        return () => clearTimeout(timer);
    }, []);

    if (fromMobile) {
        return (
            <div className="relative text-center max-w-md w-full">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <HugeiconsIcon icon={CheckmarkCircle02Icon} size={36} className="text-emerald-400" />
                </div>
                <h1 className="text-3xl font-black text-white tracking-tight mb-3">
                    Submission Received
                </h1>
                <p className="text-zinc-400 leading-relaxed mb-2">
                    Your Stripe information has been submitted successfully.
                </p>
                <p className="text-zinc-500 text-sm leading-relaxed mb-8">
                    Tap the button below to return to the PXI app. Your verification will be confirmed automatically.
                </p>
                <a
                    href="pxi://vendor-onboarding-complete"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-pxi-purple text-white font-bold text-sm uppercase tracking-widest shadow-[0_0_24px_rgba(216,74,255,0.3)] hover:brightness-110 transition-all"
                >
                    <HugeiconsIcon icon={SmartPhone01Icon} size={14} />
                    Return to PXI App
                </a>
            </div>
        );
    }

    return (
        <div className="relative text-center max-w-md w-full">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={36} className="text-emerald-400" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight mb-3">
                Submission Received
            </h1>
            <p className="text-zinc-400 leading-relaxed mb-2">
                Your Stripe information has been submitted successfully.
            </p>
            <p className="text-zinc-500 text-sm leading-relaxed mb-8">
                Stripe may take a moment to verify your details. Head to the Vendor Status page and click <span className="text-white font-semibold">Check Status</span> to confirm approval.
            </p>
            <button
                onClick={() => router.replace('/dashboard/vendor-upgrade')}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-pxi-purple text-white font-bold text-sm uppercase tracking-widest shadow-[0_0_24px_rgba(216,74,255,0.3)] hover:brightness-110 transition-all"
            >
                Go to Vendor Status
                <HugeiconsIcon icon={ArrowRight02Icon} size={14} />
            </button>
            <div className="flex items-center justify-center gap-2 text-zinc-600 text-xs mt-5">
                <HugeiconsIcon icon={Loading02Icon} size={12} className="animate-spin" />
                Redirecting automatically…
            </div>
        </div>
    );
}

export default function StripeReturnPage() {
    return (
        <div className="min-h-screen bg-black flex items-center justify-center px-6">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-pxi-purple/5 blur-3xl" />
            </div>
            <Suspense fallback={<HugeiconsIcon icon={Loading02Icon} size={24} className="animate-spin text-pxi-purple" />}>
                <StripeReturnContent />
            </Suspense>
        </div>
    );
}
