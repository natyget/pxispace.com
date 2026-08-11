'use client';

// Consent prompt. AUTO-opens for EEA / UK / CH only; re-openable everywhere.
//
// Everywhere outside the restricted region list the unscoped Consent Mode v2
// default is 'granted' (see AnalyticsScripts.jsx), so a US visitor never sees
// this unprompted, never pays for the region check beyond one Intl lookup, and
// loses no data. Inside the list the defaults start denied and stay denied
// until the visitor accepts here.
//
// The footer's "Cookie settings" link calls openConsentPreferences(), which
// forces this open in ANY region — GDPR Art. 7(3) requires withdrawal to be as
// easy as consent, and it doubles as the CCPA/CPRA opt-out surface for US
// visitors, who are granted by default and previously had no way to say no.
//
// Renders null on the server and on the first client paint — region detection
// needs `window`, and a banner that flashed for everyone during hydration would
// be worse than no banner. That is what the useSyncExternalStore "hydrated"
// latch below buys us: a server snapshot of false, a client snapshot of true,
// and no setState-from-an-effect cascade.

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import {
    closeConsentPreferences,
    isConsentUiOpen,
    readConsentChoice,
    needsConsentBanner,
    replayStoredConsent,
    subscribeConsentUi,
    updateGoogleConsent,
    writeConsentChoice,
} from '@/lib/consent';

const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

const uiServerSnapshot = () => false;

export default function ConsentBanner() {
    const hydrated = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
    const managing = useSyncExternalStore(subscribeConsentUi, isConsentUiOpen, uiServerSnapshot);
    const [answeredNow, setAnsweredNow] = useState(false);

    // Consent defaults reset to denied on every cold load, so a returning
    // visitor who already answered must have their choice replayed — in every
    // region, since outside the EEA the default is 'granted' and a stored
    // 'denied' would otherwise evaporate on navigation. Pure external-system
    // sync — no React state involved.
    useEffect(() => {
        try {
            replayStoredConsent();
        } catch {
            /* never break the page over a banner */
        }
    }, []);

    const answer = useCallback((status) => {
        writeConsentChoice(status);
        updateGoogleConsent(status);
        setAnsweredNow(true);
        closeConsentPreferences();
    }, []);

    // needsConsentBanner() is a pure read (Intl + localStorage) and is only
    // consulted once `hydrated` is true, so it can never desync hydration.
    // `managing` bypasses it entirely: an explicit request to review the choice
    // must win over "this visitor already answered" and over region.
    if (!hydrated) return null;
    if (!managing && (answeredNow || !needsConsentBanner())) return null;

    const current = managing ? readConsentChoice() : null;

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
                {managing ? (
                    <p className="mt-2 text-xs leading-relaxed text-white/45">
                        {current === 'granted'
                            ? 'Your current choice: accepted. Choosing “Reject all” withdraws it and clears the cookies we set.'
                            : current === 'denied'
                              ? 'Your current choice: rejected.'
                              : 'You have not made a choice yet.'}
                    </p>
                ) : null}
                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
                    {managing ? (
                        <button
                            type="button"
                            onClick={closeConsentPreferences}
                            className="cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold text-white/45 transition-colors hover:text-white sm:mr-auto"
                        >
                            Close
                        </button>
                    ) : null}
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
