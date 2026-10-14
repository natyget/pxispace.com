'use client';

import { useState } from 'react';
import { approveClaim, rejectClaim } from '@/services/growth';

// The state behind Approve and Reject for one claim (see decide.jsx for the buttons and the note form).

/**
 * @param {{ type: 'organizer'|'venue'|undefined, id: string|undefined, onDone: (kind: 'approve'|'reject') => void }} args
 */
export function useDecide({ type, id, onDone }) {
    const [rejecting, setRejecting] = useState(false);
    const [note, setNote] = useState('');
    const [busy, setBusy] = useState(null);
    const [error, setError] = useState(null);

    const run = async (kind) => {
        setBusy(kind);
        setError(null);
        try {
            if (kind === 'approve') await approveClaim(type, id);
            else await rejectClaim(type, id, note.trim() || undefined);
            onDone?.(kind);
        } catch (err) {
            setError(err.message || 'That did not work. Try again.');
        } finally {
            setBusy(null);
        }
    };

    return {
        rejecting,
        note,
        busy,
        error,
        setNote,
        startReject: () => {
            setError(null);
            setRejecting(true);
        },
        cancelReject: () => {
            setNote('');
            setRejecting(false);
        },
        approve: () => run('approve'),
        reject: () => run('reject'),
    };
}
