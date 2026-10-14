'use client';

import { Button, Field } from '@/components/dashboard/ui/kit';

// Approve and Reject for a claim, the same in the inbox and on the Claims page. The state is in useDecide.js:
// DecideButtons goes where the row's action goes, RejectForm and DecideError go under the row.

export function DecideButtons({ decide }) {
    return (
        <div className="flex items-center gap-2">
            <Button size="sm" variant="good" disabled={Boolean(decide.busy)} onClick={decide.approve}>
                {decide.busy === 'approve' ? 'Approving...' : 'Approve'}
            </Button>
            {decide.rejecting ? null : (
                <Button size="sm" variant="quiet" disabled={Boolean(decide.busy)} onClick={decide.startReject}>
                    Reject
                </Button>
            )}
        </div>
    );
}

export function RejectForm({ decide }) {
    if (!decide.rejecting) return null;
    return (
        <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-center">
            <Field
                className="min-w-0 flex-1"
                aria-label="Note (optional)"
                placeholder="Note (optional)"
                value={decide.note}
                onChange={(e) => decide.setNote(e.target.value)}
                maxLength={500}
                autoFocus
                inputClassName="h-10 bg-pxi-surface!"
            />
            <div className="flex items-center gap-2">
                <Button size="sm" variant="danger" disabled={Boolean(decide.busy)} onClick={decide.reject}>
                    {decide.busy === 'reject' ? 'Rejecting...' : 'Reject claim'}
                </Button>
                <Button size="sm" variant="quiet" disabled={Boolean(decide.busy)} onClick={decide.cancelReject}>
                    Cancel
                </Button>
            </div>
        </div>
    );
}

/** The refusal from the API, under the row. */
export function DecideError({ decide }) {
    return decide.error ? <p className="mt-2 text-[12px] text-red-300">{decide.error}</p> : null;
}
