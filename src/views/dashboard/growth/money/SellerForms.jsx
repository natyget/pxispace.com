'use client';

// The two small inline forms of the seller quick view (super admin): set a regional manager's share, and record a
// payout PXI made outside the dashboard. Each replaces its button while open.

import { useState } from 'react';
import { Button, Field, Notice } from '@/components/dashboard/ui/kit';
import { recordPayout, setManagerShare } from '@/services/growth';
import { errorLine } from '../book/useGrowthAccess';

function todayInputValue() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Percent 0 to 50 and a note. onDone() after it is saved. */
export function ShareForm({ userId, currentBps, onDone, onCancel }) {
    const [percent, setPercent] = useState(currentBps == null ? '' : String(currentBps / 100));
    const [note, setNote] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);

    const value = parseFloat(percent);
    const valid = Number.isFinite(value) && value >= 0 && value <= 50;

    const save = async () => {
        setBusy(true);
        setError(null);
        try {
            await setManagerShare({ userId, rateBps: Math.round(value * 100), note: note.trim() || undefined });
            onDone?.();
        } catch (err) {
            setError(errorLine(err, 'Could not save the share.'));
            setBusy(false);
        }
    };

    return (
        <div className="space-y-4 rounded-2xl bg-pxi-field p-4">
            <Field
                label="Share of PXI revenue, in percent"
                hint="From 0 to 50. It applies to sales made after you save."
                type="number"
                step="0.5"
                min="0"
                max="50"
                inputMode="decimal"
                value={percent}
                onChange={(e) => setPercent(e.target.value)}
                inputClassName="bg-pxi-surface!"
            />
            <Field label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} inputClassName="bg-pxi-surface!" />
            {error ? <Notice tone="error">{error}</Notice> : null}
            <div className="flex gap-2">
                <Button variant="primary" disabled={busy || !valid} onClick={save}>
                    {busy ? 'Saving' : 'Save'}
                </Button>
                <Button variant="quiet" disabled={busy} onClick={onCancel}>
                    Cancel
                </Button>
            </div>
        </div>
    );
}

/** Amount (filled with what is owed), date, method, reference, note. onDone() after it is recorded. */
export function PayoutForm({ userId, owedCents, onDone, onCancel }) {
    const [amount, setAmount] = useState(owedCents > 0 ? (owedCents / 100).toFixed(2) : '');
    const [date, setDate] = useState(todayInputValue());
    const [method, setMethod] = useState('');
    const [reference, setReference] = useState('');
    const [note, setNote] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);

    const dollars = parseFloat(amount);
    const valid = Number.isFinite(dollars) && dollars > 0 && Boolean(date);

    const save = async () => {
        setBusy(true);
        setError(null);
        try {
            await recordPayout({
                userId,
                amountCents: Math.round(dollars * 100),
                paidAt: new Date(`${date}T12:00:00`).toISOString(),
                method: method.trim() || undefined,
                reference: reference.trim() || undefined,
                note: note.trim() || undefined,
            });
            onDone?.();
        } catch (err) {
            setError(errorLine(err, 'Could not record the payout.'));
            setBusy(false);
        }
    };

    return (
        <div className="space-y-4 rounded-2xl bg-pxi-field p-4">
            <div className="grid grid-cols-2 gap-3">
                <Field
                    label="Amount in dollars"
                    type="number"
                    step="0.01"
                    min="0"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    inputClassName="bg-pxi-surface!"
                />
                <Field label="Paid on" type="date" value={date} onChange={(e) => setDate(e.target.value)} inputClassName="bg-pxi-surface! [color-scheme:dark]" />
            </div>
            <div className="grid grid-cols-2 gap-3">
                <Field label="Method" placeholder="Bank transfer" value={method} onChange={(e) => setMethod(e.target.value)} maxLength={40} inputClassName="bg-pxi-surface!" />
                <Field label="Reference" value={reference} onChange={(e) => setReference(e.target.value)} maxLength={120} inputClassName="bg-pxi-surface!" />
            </div>
            <Field label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} inputClassName="bg-pxi-surface!" />
            {error ? <Notice tone="error">{error}</Notice> : null}
            <div className="flex gap-2">
                <Button variant="primary" disabled={busy || !valid} onClick={save}>
                    {busy ? 'Recording' : 'Record payout'}
                </Button>
                <Button variant="quiet" disabled={busy} onClick={onCancel}>
                    Cancel
                </Button>
            </div>
        </div>
    );
}
