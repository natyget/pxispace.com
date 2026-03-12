'use client';

import { useRouter } from 'next/navigation';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function StripeRefreshPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-black flex items-center justify-center px-6">
            {/* Background glow */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-amber-500/5 blur-3xl" />
            </div>

            <div className="relative text-center max-w-md w-full">
                {/* Icon */}
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                    <AlertTriangle size={36} className="text-amber-400" />
                </div>

                {/* Heading */}
                <h1 className="text-3xl font-black text-white tracking-tight mb-3">
                    Link Expired
                </h1>
                <p className="text-zinc-400 leading-relaxed mb-8">
                    Your Stripe verification link has expired or is no longer valid.
                    This usually happens if you took too long or closed the tab.
                    No worries — you can start again.
                </p>

                {/* Retry button */}
                <button
                    onClick={() => router.replace('/dashboard/vendor-upgrade?stripe=refresh')}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-pxi-purple text-white font-bold text-sm uppercase tracking-widest shadow-[0_0_24px_rgba(216,74,255,0.3)] hover:brightness-110 transition-all"
                >
                    <RefreshCw size={14} />
                    Try Again
                </button>

                <p className="text-zinc-600 text-xs mt-6">
                    If this keeps happening, contact{' '}
                    <a
                        href="mailto:support@pxispace.com"
                        className="underline hover:text-zinc-400 transition-colors"
                    >
                        support@pxispace.com
                    </a>
                </p>
            </div>
        </div>
    );
}
