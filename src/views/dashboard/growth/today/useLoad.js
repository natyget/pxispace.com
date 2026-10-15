'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * Loads one thing for a page. `loader` must keep the same identity between renders (a module-level function, or a
 * useCallback). A new loader starts a fresh load (loading is true until it answers). reload() fetches again but keeps
 * showing the old data until the new answer arrives, so a list does not blink after an action.
 * @template T
 * @param {() => Promise<T>} loader
 * @returns {{ data: T|null, error: (Error & { status?: number, code?: string })|null, loading: boolean, reload: () => void }}
 */
export function useLoad(loader) {
    const [tick, setTick] = useState(0);
    const [state, setState] = useState({ loader: null, data: null, error: null });

    useEffect(() => {
        let alive = true;
        const timer = setTimeout(() => {
            loader().then(
                (data) => {
                    if (alive) setState({ loader, data, error: null });
                },
                (error) => {
                    if (alive) setState({ loader, data: null, error });
                },
            );
        }, 0);
        return () => {
            alive = false;
            clearTimeout(timer);
        };
    }, [loader, tick]);

    const reload = useCallback(() => setTick((n) => n + 1), []);
    const loading = state.loader !== loader;
    return { data: loading ? null : state.data, error: loading ? null : state.error, loading, reload };
}
