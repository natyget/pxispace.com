'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Loader2 } from 'lucide-react';

export default function StripeReturnPage() {
    const router = useRouter();

    useEffect(() => {
        const timer = setTimeout(() => {
            router.replace('/dashboard/vendor-upgrade?stripe=success');
        }, 2000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="min-h-screen bg-black flex items-center justify-center px-6">
            {/* Background glow */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-pxi-purple/5 blur-3xl" />
            </div>

            <div className="relative text-center max-w-md w-full">
                {/* Icon */}
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <CheckCircle2 size={36} className="text-emerald-400" />
                </div>

                {/* Heading */}
                <h1 className="text-3xl font-black text-white tracking-tight mb-3">
                    Verification Complete
                </h1>
                <p className="text-zinc-400 leading-relaxed mb-8">
                    Your Stripe information has been submitted. We're checking your
                    account status now.
                </p>

                {/* Redirect indicator */}
                <div className="flex items-center justify-center gap-2 text-zinc-500 text-sm">
                    <Loader2 size={14} className="animate-spin text-pxi-purple" />
                    Redirecting to your dashboard…
                </div>
            </div>
        </div>
    );
}
