'use client';

// The small inline forms of the organizer quick view: log a call, meeting, note, offer or opt-out; give an account
// to a seller (super admin); grant credits (control room). Each replaces the action buttons while open.

import { useState } from 'react';
import { Button, Field, Notice, TextArea, WordTabs } from '@/components/dashboard/ui/kit';
import { assignOrganizer, logTouch } from '@/services/growth';
import { grantCredits } from '@/services/admin';
import { money } from '@/lib/dashFormat';
import { errorLine } from './useGrowthAccess';

const LOG_KINDS = [
    { key: 'CALL', label: 'Call' },
    { key: 'MEETING', label: 'Meeting' },
    { key: 'NOTE', label: 'Note' },
    { key: 'INCENTIVE', label: 'Offer' },
    { key: 'OPT_OUT', label: 'Asked to stop' },
];

const LOG_HINTS = {
    CALL: 'How did the call go? (optional)',
    MEETING: 'What was agreed? (optional)',
    NOTE: 'Write a note for the team',
    INCENTIVE: 'What did you offer? (optional)',
    OPT_OUT: 'Anything the team should know (optional)',
};

export function LogForm({ organizer, onSaved, onCancel }) {
    const [kind, setKind] = useState('CALL');
    const [body, setBody] = useState('');
    const [meetingAt, setMeetingAt] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);

    // Only a note needs words; a call, a meeting, an offer or "asked to stop" can be saved as they are.
    const ready = kind !== 'NOTE' || Boolean(body.trim());

    const save = async () => {
        setBusy(true);
        setError(null);
        try {
            const res = await logTouch(organizer.id, {
                kind,
                body: body.trim() || undefined,
                meetingAt: kind === 'MEETING' && meetingAt ? new Date(meetingAt).toISOString() : undefined,
            });
            onSaved?.(res?.touch || null, kind);
        } catch (err) {
            setError(errorLine(err, 'Could not save that.'));
            setBusy(false);
        }
    };

    return (
        <div className="space-y-4">
            <WordTabs items={LOG_KINDS} value={kind} onChange={setKind} />
            {kind === 'MEETING' ? <Field label="When" type="datetime-local" value={meetingAt} onChange={(e) => setMeetingAt(e.target.value)} inputClassName="[color-scheme:dark]" /> : null}
            <TextArea label="Details" rows={4} value={body} onChange={(e) => setBody(e.target.value)} placeholder={LOG_HINTS[kind]} />
            {kind === 'OPT_OUT' ? <p className="text-[13px] text-white/50">After this, the team cannot email them from here.</p> : null}
            {error ? <Notice tone="error">{error}</Notice> : null}
            <div className="flex gap-2">
                <Button variant="primary" disabled={busy || !ready} onClick={save}>
                    {busy ? 'Saving' : 'Save'}
                </Button>
                <Button variant="quiet" disabled={busy} onClick={onCancel}>
                    Cancel
                </Button>
            </div>
        </div>
    );
}

export function AssignForm({ organizer, onDone, onCancel }) {
    const [username, setUsername] = useState('');
    const [note, setNote] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);

    const save = async () => {
        setBusy(true);
        setError(null);
        try {
            await assignOrganizer(organizer.id, { sellerUsername: username.trim().replace(/^@/, ''), note: note.trim() || undefined });
            onDone?.();
        } catch (err) {
            setError(errorLine(err, 'Could not move this account.'));
            setBusy(false);
        }
    };

    return (
        <div className="space-y-4">
            <p className="text-[14px] font-semibold text-white">{organizer.owner ? 'Move to someone else' : 'Assign to someone'}</p>
            <Field label="Ambassador or regional manager" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="@username" autoCapitalize="none" autoCorrect="off" />
            <Field label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} />
            {error ? <Notice tone="error">{error}</Notice> : null}
            <div className="flex gap-2">
                <Button variant="primary" disabled={busy || !username.trim()} onClick={save}>
                    {busy ? 'Saving' : organizer.owner ? 'Move' : 'Assign'}
                </Button>
                <Button variant="quiet" disabled={busy} onClick={onCancel}>
                    Cancel
                </Button>
            </div>
        </div>
    );
}

export function GrantCreditsForm({ organizer, onDone, onCancel }) {
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);

    const dollars = parseFloat(amount);
    const valid = Number.isFinite(dollars) && dollars !== 0;

    const save = async () => {
        setBusy(true);
        setError(null);
        try {
            const cents = Math.round(dollars * 100);
            await grantCredits({ username: organizer.username, amountCents: cents, note: note.trim() });
            onDone?.(money(Math.abs(cents)), cents < 0);
        } catch (err) {
            setError(errorLine(err, 'Could not change the credits.'));
            setBusy(false);
        }
    };

    return (
        <div className="space-y-4">
            <p className="text-[14px] font-semibold text-white">Grant credits</p>
            <Field
                label="Amount in dollars"
                hint="Use a minus sign to take credits away."
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="20.00"
            />
            <Field label="Why" hint="Saved with the change." value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} />
            {error ? <Notice tone="error">{error}</Notice> : null}
            <div className="flex gap-2">
                <Button variant="primary" disabled={busy || !valid || !note.trim()} onClick={save}>
                    {busy ? 'Saving' : 'Grant'}
                </Button>
                <Button variant="quiet" disabled={busy} onClick={onCancel}>
                    Cancel
                </Button>
            </div>
        </div>
    );
}
