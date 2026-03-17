'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertTriangle, Smartphone, RefreshCw, Loader2 } from 'lucide-react';

function StripeRefreshContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const fromMobile = searchParams.get('from') === 'mobile';

    useEffect(() => {
        if (fromMobile) return;
        const timer = setTimeout(() => {
            router.replace('/dashboard/vendor-upgrade?stripe=refresh');
        }, 4000);
        return () => clearTimeout(timer);
    }, []);

    if (fromMobile) {
        return (
            <div className="relative text-center max-w-md w-full">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                    <AlertTriangle size={36} className="text-amber-400" />
                </div>
                <h1 className="text-3xl font-black text-white tracking-tight mb-3">
                    Verification Failed
                </h1>
                <p className="text-zinc-400 leading-relaxed mb-2">
                    Your Stripe verification link has expired or could not be completed.
                </p>
                <p className="text-zinc-500 text-sm leading-relaxed mb-8">
                    Return to the PXI app and tap <span className="text-white font-semibold">Start Verification</span> again to get a fresh link.
                </p>
                <a
                    href="pxi://vendor-onboarding-refresh"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-pxi-purple text-white font-bold text-sm uppercase tracking-widest shadow-[0_0_24px_rgba(216,74,255,0.3)] hover:brightness-110 transition-all"
                >
                    <Smartphone size={14} />
                    Return to PXI App
                </a>
            </div>
        );
    }

    return (
        <div className="relative text-center max-w-md w-full">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <AlertTriangle size={36} className="text-amber-400" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight mb-3">
                Link Expired
            </h1>
            <p className="text-zinc-400 leading-relaxed mb-2">
                Your Stripe verification link has expired or is no longer valid.
            </p>
            <p className="text-zinc-500 text-sm leading-relaxed mb-8">
                This usually happens if you took too long or closed the tab. No worries — you can start again from the Vendor Status page.
            </p>
            <button
                onClick={() => router.replace('/dashboard/vendor-upgrade?stripe=refresh')}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-pxi-purple text-white font-bold text-sm uppercase tracking-widest shadow-[0_0_24px_rgba(216,74,255,0.3)] hover:brightness-110 transition-all"
            >
                <RefreshCw size={14} />
                Try Again
            </button>
            <div className="flex items-center justify-center gap-2 text-zinc-600 text-xs mt-5">
                <Loader2 size={12} className="animate-spin" />
                Redirecting automatically…
            </div>
        </div>
    );
}

export default function StripeRefreshPage() {
    return (
        <div className="min-h-screen bg-black flex items-center justify-center px-6">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-amber-500/5 blur-3xl" />
            </div>
            <Suspense fallback={<Loader2 size={24} className="animate-spin text-pxi-purple" />}>
                <StripeRefreshContent />
            </Suspense>
        </div>
    );
}
