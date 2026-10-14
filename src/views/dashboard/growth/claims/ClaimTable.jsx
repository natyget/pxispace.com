'use client';

import { useState } from 'react';
import { Button, DataTable, Field, StateText } from '@/components/dashboard/ui/kit';
import { handle, shortDate } from '@/lib/dashFormat';
import { revokeOrganizerClaim } from '@/services/growth';
import ClaimSubject from './ClaimSubject';
import { claimSubject } from './claimText';

const STATUS = {
    PENDING_APPROVAL: { label: 'Waiting', tone: 'warn' },
    ACTIVE: { label: 'Approved', tone: 'good' },
    REJECTED: { label: 'Rejected', tone: 'bad' },
    REVOKED: { label: 'Revoked', tone: 'muted' },
};

/**
 * Claims as a table: Claim, Type, Raised, Status and the decision note. A claim that can be revoked has a quiet
 * Revoke that asks for the reason in the note cell before anything is sent.
 * `showRaiser` adds "Raised by @x" under claims somebody else raised (the admin view).
 */
export default function ClaimTable({ claims, organizerHref, showRaiser = false, empty = null, onRevoked }) {
    const [revoking, setRevoking] = useState(null);
    const [reason, setReason] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);

    const stopRevoke = () => {
        setRevoking(null);
        setReason('');
        setError(null);
    };
    const revoke = async (claim) => {
        setBusy(true);
        setError(null);
        try {
            await revokeOrganizerClaim(claim.id, reason.trim());
            stopRevoke();
            onRevoked(claim);
        } catch (err) {
            setError(err.message || 'That did not work. Try again.');
        } finally {
            setBusy(false);
        }
    };

    const columns = [
        {
            key: 'claim',
            label: 'Claim',
            width: 'minmax(0,1.6fr)',
            render: (claim) => (
                <ClaimSubject
                    claim={claim}
                    href={claim.type === 'ORGANIZER' && claim.organizer?.id ? organizerHref(claim.organizer.id) : null}
                    more={
                        <>
                            {showRaiser && !claim.raisedByMe ? <span className="block truncate text-[12px] text-white/45">Raised by {handle(claim.raisedBy)}</span> : null}
                            <span className="block truncate text-[12px] text-white/45 md:hidden">
                                {claim.type === 'VENUE' ? 'Venue' : 'Organizer'}, {shortDate(claim.raisedAt)}
                            </span>
                        </>
                    }
                />
            ),
        },
        {
            key: 'type',
            label: 'Type',
            width: '76px',
            hideOnMobile: true,
            render: (claim) => <span className="text-[13px] text-white/70">{claim.type === 'VENUE' ? 'Venue' : 'Organizer'}</span>,
        },
        { key: 'raised', label: 'Raised', width: '84px', hideOnMobile: true, render: (claim) => <span className="text-[13px] text-white/70">{shortDate(claim.raisedAt)}</span> },
        {
            key: 'status',
            label: 'Status',
            width: '92px',
            render: (claim) => {
                const s = STATUS[claim.status] || { label: claim.status, tone: 'muted' };
                return <StateText tone={s.tone}>{s.label}</StateText>;
            },
        },
        {
            key: 'note',
            label: 'Note',
            width: 'minmax(0,1fr)',
            render: (claim) => {
                if (revoking === claim.id) {
                    return (
                        <div className="space-y-2">
                            <Field
                                aria-label={`Why are you revoking ${claimSubject(claim)}?`}
                                placeholder="Why are you revoking this?"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                maxLength={500}
                                inputClassName="h-10 bg-pxi-surface!"
                            />
                            <div className="flex items-center gap-2">
                                <Button size="sm" variant="danger" disabled={busy || !reason.trim()} onClick={() => revoke(claim)}>
                                    {busy ? 'Revoking...' : 'Revoke claim'}
                                </Button>
                                <Button size="sm" variant="quiet" disabled={busy} onClick={stopRevoke}>
                                    Cancel
                                </Button>
                            </div>
                            {error ? <p className="text-[12px] text-red-300">{error}</p> : null}
                        </div>
                    );
                }
                return (
                    <div className="min-w-0">
                        {claim.decidedNote ? <p className="text-[13px] text-white/60">{claim.decidedNote}</p> : null}
                        {claim.canRevoke ? (
                            <Button
                                size="sm"
                                variant="quiet"
                                className={`-ml-3.5 ${claim.decidedNote ? 'mt-1' : ''}`}
                                onClick={() => {
                                    setRevoking(claim.id);
                                    setReason('');
                                    setError(null);
                                }}
                            >
                                Revoke
                            </Button>
                        ) : null}
                    </div>
                );
            },
        },
    ];

    return <DataTable columns={columns} rows={claims} empty={empty} />;
}
