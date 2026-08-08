'use client';

// Client-side analytics runtime: SPA page_views on App Router navigations, GA
// User-ID + user-property sync from the auth session, first-party campaign
// attribution capture, and the EEA/UK/CH consent banner. Mounted once inside
// AuthProvider in the root layout.

import { Suspense, useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
    analyticsEnabled,
    clearUserId,
    setUserId,
    setUserPropertiesFromUser,
    trackPageView,
} from '@/lib/analytics';
import { captureAttribution } from '@/lib/attribution';
import { mirrorPageViewToSocialPixels } from '@/lib/socialPixels';
import ConsentBanner from './ConsentBanner';

// Isolated so the useSearchParams() Suspense boundary wraps ONLY this null
// renderer — never the app tree (Next would otherwise client-bail the layout).
function PageViewTracker() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const search = searchParams?.toString() ?? '';

    // Exactly ONE page_view per URL. The effect runs once on mount (the initial
    // load — GA4 is configured with send_page_view:false, so this is the only
    // hit for it) and once per pathname/search change. React 19 StrictMode
    // double-invokes effects in dev only; the ref keeps even that to one hit
    // per URL so local QA counts match production.
    const lastTracked = useRef(null);

    useEffect(() => {
        const url = search ? `${pathname}?${search}` : pathname;
        if (lastTracked.current === url) return;
        lastTracked.current = url;
        trackPageView({ path: url });
        // Meta and TikTok build their URL-based retargeting audiences out of PageView.
        // `trackPageView` talks to gtag directly and never reaches the social fan-out in
        // `track()`, so without this line those networks only ever saw the landing URL
        // and every client-side navigation on the site was invisible to them.
        mirrorPageViewToSocialPixels(url);
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
            setUserPropertiesFromUser(user);
        } else if (hadUser.current) {
            // Only clear on a real login→logout transition, not on cold loads.
            hadUser.current = false;
            clearUserId();
        }
    }, [user?.id, user?.accountTier, user?.isVendor, user?.isPassportIssued, user?.city, user?.odysseyXp]); // eslint-disable-line react-hooks/exhaustive-deps
    // (user object identity churns on refresh; keyed to the fields GA consumes)

    return null;
}

export default function AnalyticsProvider({ children }) {
    // Attribution capture is independent of GA — it feeds User.signupAttribution.
    // It writes a 90-day marketing cookie, so it is consent-gated internally.
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
            {/* Outside the analyticsEnabled gate on purpose: attribution above
                sets a non-essential cookie even when the Google tag is absent,
                so the withdrawal surface has to exist either way. The banner
                renders null unless it has something to ask. */}
            <ConsentBanner />
            {children}
        </>
    );
}
