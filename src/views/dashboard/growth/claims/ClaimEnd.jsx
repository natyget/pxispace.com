'use client';

import { useState } from 'react';
import { Button, Field } from '@/components/dashboard/ui/kit';
import { setClaimEnd } from '@/services/growth';
import { dayOf, endLabel, firstEndDay } from './claimText';

/**
 * When an organizer claim's commission ends: "Ends 12 months after approval" while it waits, the day once approved.
 * Whoever may move it gets a quiet Change, which opens a date field with Save and Cancel. Save updates this row.
 */
export default function ClaimEnd({ claim }) {
    const [end, setEnd] = useState(claim.commissionEndDate || null);
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);

    if (claim.status === 'PENDING_APPROVAL') {
        return <p className="mt-1 text-[12px] text-white/45">Ends 12 months after approval</p>;
    }
    if ((claim.status !== 'ACTIVE' && claim.status !== 'REVOKED') || !end) return null;

    const startEdit = () => {
        setDraft(dayOf(end));
        setError(null);
        setEditing(true);
    };
    const stopEdit = () => {
        setEditing(false);
        setError(null);
    };
    const save = async () => {
        setBusy(true);
        setError(null);
        try {
            const saved = await setClaimEnd(claim.id, draft);
            setEnd(saved?.commissionEndDate || draft);
            setEditing(false);
        } catch (err) {
            setError(err.message || 'That did not work. Try again.');
        } finally {
            setBusy(false);
        }
    };

    if (editing) {
        return (
            <div className="mt-1 space-y-2">
                <Field
                    type="date"
                    aria-label="Commission ends on"
                    value={draft}
                    min={firstEndDay(claim.approvedAt) || undefined}
                    onChange={(e) => setDraft(e.target.value)}
                    inputClassName="h-10 bg-pxi-surface!"
                />
                <div className="flex items-center gap-2">
                    <Button size="sm" variant="primary" disabled={busy || !draft} onClick={save}>
                        {busy ? 'Saving...' : 'Save'}
                    </Button>
                    <Button size="sm" variant="quiet" disabled={busy} onClick={stopEdit}>
                        Cancel
                    </Button>
                </div>
                {error ? <p className="text-[12px] text-red-300">{error}</p> : null}
            </div>
        );
    }

    return (
        <div className="mt-1 flex flex-wrap items-center text-[12px] text-white/45">
            <span>Ends {endLabel(end)}</span>
            {claim.canEditEnd ? (
                <Button size="sm" variant="quiet" className="-ml-2" onClick={startEdit}>
                    Change
                </Button>
            ) : null}
        </div>
    );
}
