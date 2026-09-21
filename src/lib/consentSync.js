/**
 * Send this browser's personalized-sharing consent to the server.
 *
 * The privacy policy (§4.2, §6.1) says the Cookie settings choice and Global Privacy Control decide
 * whether a person is shown by name in hosts' and venue partners' audience lists. Those lists are built
 * on the server, which until now could not see a choice that lives in local storage. This is the bridge.
 *
 * The server does the deciding: it takes the raw choice, GPC flag, time zone and language and applies
 * the same region rule as isTrackingAllowed() (backend consent.service.ts). A report is only sent when
 * something changed for this user, so a normal page load costs nothing.
 */
import { api } from '../services/api';
import { hasGlobalPrivacyControl, readConsentChoice } from './consent';

const SYNCED_KEY = 'pxi_consent_synced';

function currentReport() {
    let timeZone = null;
    let locale = null;
    try {
        timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || null;
    } catch {
        timeZone = null;
    }
    try {
        locale = typeof navigator !== 'undefined' ? navigator.language || null : null;
    } catch {
        locale = null;
    }
    return {
        choice: readConsentChoice(),
        gpc: hasGlobalPrivacyControl(),
        timeZone,
        locale,
    };
}

/**
 * @param {string} userId the signed-in user
 * @param {{ force?: boolean }} [options] force re-sends even if nothing looks different, e.g. right after
 *   the person makes a choice in the banner.
 */
export async function syncTrackingConsent(userId, { force = false } = {}) {
    if (typeof window === 'undefined' || !userId) return;
    const report = currentReport();
    const signature = `${userId}|${JSON.stringify(report)}`;
    try {
        if (!force && window.localStorage.getItem(SYNCED_KEY) === signature) return;
    } catch {
        /* storage unavailable: send anyway */
    }
    try {
        await api.post('/api/users/me/tracking-consent', report);
        try {
            window.localStorage.setItem(SYNCED_KEY, signature);
        } catch {
            /* nothing to remember with; the next load simply sends again */
        }
    } catch {
        // Not remembered, so the next session retries. Never throw from consent plumbing.
    }
}
