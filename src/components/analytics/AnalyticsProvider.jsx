'use client';

// Client-side analytics runtime: SPA page_views on App Router navigations,
// GA User-ID sync from the auth session, and first-party campaign-attribution
// capture. Mounted once inside AuthProvider in the root layout.

import { Suspense, useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
    analyticsEnabled,
    clearUserId,
    setUserId,
    setUserProperties,
    trackPageView,
} from '@/lib/analytics';
import { captureAttribution } from '@/lib/attribution';

// Isolated so the useSearchParams() Suspense boundary wraps ONLY this null
// renderer — never the app tree (Next would otherwise client-bail the layout).
function PageViewTracker() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const search = searchParams?.toString() ?? '';

    useEffect(() => {
        trackPageView({ path: search ? `${pathname}?${search}` : pathname });
    }, [pathname, search]);

    return null;
}

function IdentityBridge() {
    const { user } = useAuth();
    const hadUser = useRef(false);

    useEffect(() => {
        if (user?.id) {
            hadUser.current = true;
            setUserId(user.id);
            setUserProperties(user);
        } else if (hadUser.current) {
            // Only clear on a real login→logout transition, not on cold loads.
            hadUser.current = false;
            clearUserId();
        }
    }, [user?.id, user?.accountTier, user?.isVendor, user?.city]); // eslint-disable-line react-hooks/exhaustive-deps
    // (user object identity churns on refresh; keyed to the fields GA consumes)

    return null;
}

export default function AnalyticsProvider({ children }) {
    // Attribution capture is independent of GA — it feeds User.signupAttribution.
    useEffect(() => {
        captureAttribution();
    }, []);

    return (
        <>
            {analyticsEnabled ? (
                <>
                    <Suspense fallback={null}>
                        <PageViewTracker />
                    </Suspense>
                    <IdentityBridge />
                </>
            ) : null}
            {children}
        </>
    );
}
