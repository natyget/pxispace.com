'use client';

// EEA / UK / CH consent prompt. Renders for NOBODY else.
//
// Everywhere outside the restricted region list the unscoped Consent Mode v2
// default is 'granted' (see AnalyticsScripts.jsx), so a US visitor never sees
// this, never pays for the region check beyond one Intl lookup, and loses no
// data. Inside the list the defaults start denied and stay denied until the
// visitor accepts here.
//
// Renders null on the server and on the first client paint — region detection
// needs `window`, and a banner that flashed for everyone during hydration would
// be worse than no banner. That is what the useSyncExternalStore "hydrated"
// latch below buys us: a server snapshot of false, a client snapshot of true,
// and no setState-from-an-effect cascade.

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import {
    isRestrictedRegion,
    needsConsentBanner,
    replayStoredConsent,
    updateGoogleConsent,
    writeConsentChoice,
} from '@/lib/consent';

const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

export default function ConsentBanner() {
    const hydrated = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
    const [answeredNow, setAnsweredNow] = useState(false);

    // Consent defaults reset to denied on every cold load, so a returning
    // visitor who already accepted must have their choice replayed. Pure
    // external-system sync — no React state involved.
    useEffect(() => {
        try {
            if (isRestrictedRegion()) replayStoredConsent();
        } catch {
            /* never break the page over a banner */
        }
    }, []);

    const answer = useCallback((status) => {
        writeConsentChoice(status);
        updateGoogleConsent(status);
        setAnsweredNow(true);
    }, []);

    // needsConsentBanner() is a pure read (Intl + localStorage) and is only
    // consulted once `hydrated` is true, so it can never desync hydration.
    if (!hydrated || answeredNow || !needsConsentBanner()) return null;

    return (
        <div
            role="dialog"
            aria-live="polite"
            aria-label="Cookie and measurement consent"
            className="fixed inset-x-0 bottom-0 z-[9999] flex justify-center p-3 sm:p-4"
        >
            <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[rgba(10,10,10,0.92)] p-4 shadow-[0_16px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-5">
                <p className="text-sm leading-relaxed text-white/80">
                    We use cookies to measure how PXI is used and to make our ads relevant. You can
                    say no and the site works exactly the same.
                </p>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        onClick={() => answer('denied')}
                        className="cursor-pointer rounded-lg border border-white/12 px-4 py-2 text-sm font-semibold text-white/70 transition-colors hover:bg-white/5 hover:text-white"
                    >
                        Reject all
                    </button>
                    <button
                        type="button"
                        onClick={() => answer('granted')}
                        className="cursor-pointer rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-purple-500/30 transition-colors hover:bg-purple-500"
                    >
                        Accept all
                    </button>
                </div>
            </div>
        </div>
    );
}
