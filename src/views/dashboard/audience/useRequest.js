'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/** The words a person should read for a failed request: the API's own message first. */
export function errorText(error, fallback = 'Something went wrong. Try again.') {
    return error?.data?.error || error?.data?.message || error?.message || fallback;
}

/**
 * Runs `load()` whenever `key` changes (null waits) and keeps each answer with the key it was asked for, so a page
 * can tell "still loading" from "done" without setting state inside an effect.
 *   data     the last answer that arrived (kept while the next one loads, so a list does not flash empty)
 *   error    the message for the current key, or ''
 *   loading  true until the current key has an answer
 *   reload   asks again for the same key
 */
export function useRequest(key, load) {
    const [result, setResult] = useState({ key: undefined, nonce: 0, data: null, error: '' });
    const [nonce, setNonce] = useState(0);
    const loadRef = useRef(load);

    useEffect(() => {
        loadRef.current = load;
    });

    useEffect(() => {
        if (key === null) return undefined;
        let cancelled = false;
        Promise.resolve()
            .then(() => loadRef.current())
            .then((data) => {
                if (!cancelled) setResult({ key, nonce, data, error: '' });
            })
            .catch((error) => {
                if (!cancelled) setResult({ key, nonce, data: null, error: errorText(error, 'Could not load this.') });
            });
        return () => {
            cancelled = true;
        };
    }, [key, nonce]);

    const reload = useCallback(() => setNonce((n) => n + 1), []);
    const current = result.key === key && result.nonce === nonce;
    return {
        data: result.data,
        error: current ? result.error : '',
        loading: key !== null && !current,
        reload,
    };
}
