'use client';

import Link from 'next/link';
import { HugeiconsIcon } from '@hugeicons/react';
import { CheckmarkCircle02Icon } from '@hugeicons/core-free-icons';
import { PxiPassportSection } from '@/components/passport/PxiPassportSection';
import AnonymousAvatarSilhouette from '@/components/ui/AnonymousAvatarSilhouette';
import AppStoreCtaPair from '@/components/links/AppStoreCtaPair';
import AppOpenBanner from '@/components/links/AppOpenBanner';

function PublicProfileBottomBar({ userId }) {
    /** Same-origin https://…/u/:id does not reliably open the app from Safari; use registered app scheme (see app.json `scheme`). */
    return (
        <AppOpenBanner
            deepLinkUrl={userId ? `pxi://u/${userId}` : null}
            title="Open in PXI"
            subtitle="Full profile and social features in the app"
            storageKey={`pxi_app_banner_user_${userId || 'unknown'}_dismissed`}
        />
    );
}

function PassportReadOnly({ user }) {
    const headerRight = user?.isVendor ? (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-emerald-400 sm:gap-1.5 sm:px-2.5 sm:text-[10px] md:px-3 md:text-[11px]">
            <HugeiconsIcon icon={CheckmarkCircle02Icon} size={12} className="shrink-0" />
            Vendor
        </span>
    ) : (
        <span className="inline-block w-[52px] shrink-0 sm:w-[72px] md:w-[100px]" aria-hidden />
    );

    return (
        <PxiPassportSection
            user={user}
            friendsCount={user?.friendsCount ?? 0}
            headerRight={headerRight}
            eventsMode="public"
        />
    );
}


export default function PublicProfileClient({ userId, initialProfile }) {
    if (!initialProfile) {
        return (
            <div className="relative flex min-h-[60vh] flex-col items-center justify-center px-4 pb-40 pt-28 text-center md:pt-32">
                <p className="text-lg font-semibold text-white">Profile not found</p>
                <p className="mt-2 max-w-sm text-sm text-zinc-500">This link may be invalid or the account is no longer available.</p>
                <Link href="/" className="mt-6 text-sm font-medium text-pxi-purple hover:text-white">
                    Back to PXI
                </Link>
                <PublicProfileBottomBar userId={userId} />
            </div>
        );
    }

    if (initialProfile.isPrivateAccount) {
        return (
            <div className="relative min-h-screen bg-[#0a0a0a] pb-40 pt-24 text-white md:pb-40 md:pt-28">
                <div className="mx-auto flex max-w-lg flex-col px-4">
                    {/* Same blurred preview treatment as `/p/[postId]` when the account is private */}
                    <div className="relative aspect-[3/4] w-full max-h-[85vh] overflow-hidden rounded-2xl border border-white/10 bg-zinc-900">
                        <div
                            className="absolute inset-0 opacity-90"
                            style={{
                                background:
                                    'radial-gradient(circle at 30% 20%, rgba(168,85,247,0.35), transparent 55%), radial-gradient(circle at 70% 60%, rgba(59,130,246,0.25), transparent 50%), linear-gradient(180deg, #18181b, #09090b)',
                                filter: 'blur(24px)',
                                transform: 'scale(1.08)',
                            }}
                            aria-hidden
                        />
                        <div className="absolute inset-0 flex flex-col">
                            <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 pb-4 pt-8 text-center">
                                <p className="text-lg font-bold tracking-tight">This profile is private</p>
                                <p className="mt-2 text-sm text-zinc-400">
                                    Passport details are only visible in the PXI app for approved connections.
                                </p>
                            </div>
                            <div className="shrink-0 border-t border-white/10 bg-black/30 p-3 backdrop-blur-md md:hidden pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                                <AppStoreCtaPair variant="row" />
                            </div>
                        </div>
                    </div>
                </div>
                <PublicProfileBottomBar userId={userId} />
            </div>
        );
    }

    if (!initialProfile.isPassportIssued) {
        return (
            <div className="relative min-h-screen bg-[#0a0a0a] pb-40 pt-24 text-white md:pb-40 md:pt-28">
                <div className="mx-auto max-w-lg px-4">
                    <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-8 text-center">
                        <div className="mx-auto mb-5 flex justify-center">
                            <AnonymousAvatarSilhouette size={64} />
                        </div>
                        <h1 className="text-xl font-black tracking-tight">
                            {initialProfile.name || initialProfile.username || 'PXI member'}
                        </h1>
                        <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                            This member has not published their PXI Passport on the web yet. Open the app to connect.
                        </p>
                        <div className="mt-8 md:hidden">
                            <AppStoreCtaPair className="mx-auto max-w-md" />
                        </div>
                    </div>
                </div>
                <PublicProfileBottomBar userId={userId} />
            </div>
        );
    }

    return (
        <div className="relative min-h-screen bg-[#0a0a0a] pb-40 pt-24 text-white md:pb-40 md:pt-28">
            <PassportReadOnly user={initialProfile} />
            <PublicProfileBottomBar userId={userId} />
        </div>
    );
}
