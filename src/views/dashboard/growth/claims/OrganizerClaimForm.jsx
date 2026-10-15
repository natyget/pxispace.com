'use client';

import { useEffect, useState } from 'react';
import { Button, Field, PersonLine, TextArea } from '@/components/dashboard/ui/kit';
import { count, shortDate } from '@/lib/dashFormat';
import { cleanUsername } from '@/lib/staffSetup';
import { previewOrganizerClaim, raiseOrganizerClaim } from '@/services/growth';

const nights = (n) => (Number(n) > 0 ? `${count(n)} ${Number(n) === 1 ? 'night' : 'nights'}` : 'No nights yet');

/**
 * Claim an organizer by their exact username. What the account is shows as soon as the name is typed, and the
 * plan's message (already claimed, yourself, an admin...) is shown in amber with Send switched off.
 */
export default function OrganizerClaimForm({ onSent }) {
    const [username, setUsername] = useState('');
    const [note, setNote] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);
    const [preview, setPreview] = useState({ name: '', data: null, failed: false });
    const name = cleanUsername(username);

    useEffect(() => {
        if (!name) return undefined;
        let alive = true;
        const timer = setTimeout(() => {
            previewOrganizerClaim(name).then(
                (data) => {
                    if (alive) setPreview({ name, data, failed: false });
                },
                () => {
                    if (alive) setPreview({ name, data: null, failed: true });
                },
            );
        }, 350);
        return () => {
            alive = false;
            clearTimeout(timer);
        };
    }, [name]);

    const current = name && preview.name === name ? preview : null;
    const account = current?.data?.account || null;
    const plan = current?.data?.plan || null;
    const canSend = Boolean(account && plan?.ok) && !busy;

    const submit = async () => {
        setBusy(true);
        setError(null);
        try {
            await raiseOrganizerClaim({ username: name, note: note.trim() || undefined });
            onSent();
        } catch (err) {
            setError(err.message || 'That did not send. Try again.');
            setBusy(false);
        }
    };

    return (
        <form
            className="space-y-5"
            onSubmit={(e) => {
                e.preventDefault();
                if (canSend) submit();
            }}
        >
            <Field
                label="Their PXI username"
                placeholder="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                hint="The exact username, with or without the @."
            />

            {name ? (
                <div className="rounded-2xl bg-pxi-field p-4">
                    {!current ? (
                        <p className="text-[13px] text-white/45">Checking...</p>
                    ) : current.failed ? (
                        <p className="text-[13px] text-amber-300">That could not be checked. Try again.</p>
                    ) : account ? (
                        <>
                            <PersonLine
                                person={account}
                                size={44}
                                meta={
                                    <>
                                        <span className="block truncate">Joined {shortDate(account.joinedAt)}</span>
                                        <span className="block truncate">{nights(account.events)}</span>
                                    </>
                                }
                            />
                            {plan && !plan.ok ? <p className="mt-3 text-[13px] text-amber-300">{plan.message}</p> : null}
                        </>
                    ) : (
                        <p className="text-[13px] text-amber-300">{plan?.message || 'No account with that username.'}</p>
                    )}
                </div>
            ) : null}

            <TextArea label="Note for the approver (optional)" rows={3} value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />

            <div className="space-y-3">
                <Button type="submit" variant="primary" size="lg" className="w-full" disabled={!canSend}>
                    {busy ? 'Sending...' : 'Send for approval'}
                </Button>
                {error ? <p className="text-[13px] text-red-300">{error}</p> : null}
            </div>
        </form>
    );
}
