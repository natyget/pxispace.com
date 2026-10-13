'use client';

import { useEffect } from 'react';
import { dashboardShellActions, useDashboardShellStore } from '@/lib/dashboardShellStore';

/**
 * A page puts its one action (e.g. Create Event) at the right of the sub-tab row without touching the shell.
 * Pass a stable node (memoize it if it depends on state); it is cleared when the page unmounts.
 * @param {import('react').ReactNode} node
 */
export function usePageAction(node) {
    useEffect(() => {
        dashboardShellActions.setPageAction(node ?? null);
        return () => dashboardShellActions.setPageAction(null);
    }, [node]);
}

/** Read side, for the shell's sub-tab row. */
export function usePageActionSlot() {
    return useDashboardShellStore((state) => state.pageAction);
}
