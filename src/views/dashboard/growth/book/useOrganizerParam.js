'use client';

import { useCallback } from 'react';
import { useSearchParams } from 'next/navigation';

/**
 * [organizerId, setOrganizerId]: the organizer quick view lives in the URL as ?organizer=<id>, so a link from the
 * inbox or an email opens it, and a refresh keeps it. Next syncs history.replaceState with useSearchParams.
 */
export function useOrganizerParam() {
    const searchParams = useSearchParams();
    const id = searchParams.get('organizer') || null;
    const setId = useCallback((next) => {
        const url = new URL(window.location.href);
        if (next) url.searchParams.set('organizer', next);
        else url.searchParams.delete('organizer');
        window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
    }, []);
    return [id, setId];
}
