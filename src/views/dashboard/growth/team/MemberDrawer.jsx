'use client';

import { useEffect, useState } from 'react';
import { Button, Drawer, Field, PersonLine, StateText } from '@/components/dashboard/ui/kit';
import { count, money, percentFromBps } from '@/lib/dashFormat';
import { claimSummary } from '@/lib/staffSetup';
import { removeSalesAmbassador } from '@/services/sales';
import { setAmbassadorSplit } from '@/services/growth';
import { parsePercent, SAMPLE_FEE_CENTS, splitExample } from './splitExample';

function Body({ member, shareBps, onSaved, onRemoved }) {
    const [text, setText] = useState(member.splitBps === null ? '' : String(member.splitBps / 100));
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [splitError, setSplitError] = useState(null);
    const [confirming, setConfirming] = useState(false);
    const [removing, setRemoving] = useState(false);
    const [removeError, setRemoveError] = useState(null);

    useEffect(() => {
        if (!saved) return undefined;
        const timer = setTimeout(() => setSaved(false), 2000);
        return () => clearTimeout(timer);
    }, [saved]);

    const percent = parsePercent(text);
    const valid = Number.isFinite(percent) && percent >= 0 && percent <= 100;
    const changed = valid && Math.round(percent * 100) !== member.splitBps;
    const example = splitExample(shareBps, percent);

    const save = async () => {
        setSaving(true);
        setSplitError(null);
        try {
            await setAmbassadorSplit(member.username, { rateBps: Math.round(percent * 100) });
            setSaved(true);
            onSaved();
        } catch (err) {
            setSplitError(err.message || 'That did not save. Try again.');
        } finally {
            setSaving(false);
        }
    };

    const remove = async () => {
        setRemoving(true);
        setRemoveError(null);
        try {
            await removeSalesAmbassador(member.username);
            onRemoved(member);
        } catch (err) {
            setRemoveError(err.message || 'That did not work. Try again.');
            setRemoving(false);
        }
    };

    return (
        <div className="space-y-6">
            <PersonLine
                person={{ name: member.name, username: member.username, avatarUrl: member.avatarUrl }}
                size={48}
                meta={
                    <>
                        <span className="block truncate">{member.name && member.username ? `@${member.username}` : ''}</span>
                        {member.suspended ? <span className="block truncate text-amber-300">Suspended</span> : null}
                    </>
                }
            />

            <div className="space-y-3">
                <div className="flex items-end gap-3">
                    <Field
                        className="min-w-0 flex-1"
                        label="Their split, in percent"
                        inputMode="decimal"
                        placeholder="0 to 100"
                        value={text}
                        onChange={(e) => {
                            setText(e.target.value);
                            setSaved(false);
                        }}
                        autoComplete="off"
                    />
                    <Button variant="secondary" size="lg" disabled={saving || !changed} onClick={save}>
                        {saving ? 'Saving...' : 'Save'}
                    </Button>
                </div>
                {text.trim() && !valid ? <p className="text-[12px] text-amber-300">Use a number from 0 to 100.</p> : null}
                {splitError ? <p className="text-[12px] text-red-300">{splitError}</p> : null}
                {saved ? <StateText tone="good">Saved</StateText> : null}
                {shareBps === null || shareBps === undefined ? (
                    <p className="text-[13px] text-amber-300">Your share is not set yet, so there is nothing to split.</p>
                ) : example ? (
                    <p className="text-[13px] text-white/60">
                        On a ${SAMPLE_FEE_CENTS / 100} PXI fee they get {money(example.theirs)} and you keep {money(example.yours)}.
                    </p>
                ) : null}
            </div>

            <dl className="space-y-2 text-[13px]">
                <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-white/50">Accounts</dt>
                    <dd className="font-semibold text-white">{count(member.accounts)}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-white/50">Claims</dt>
                    <dd className="text-white/70">{claimSummary(member.claims).replace(/^Claims: /, '')}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-white/50">Their split now</dt>
                    <dd className="text-white/70">{member.splitBps === null ? 'Not set' : `${percentFromBps(member.splitBps)} of your share`}</dd>
                </div>
            </dl>

            <div className="border-t border-white/[0.08] pt-5">
                {confirming ? (
                    <div className="space-y-3">
                        <p className="text-[13px] text-white/70">Take @{member.username} off your team? The claims they raised stay as they are.</p>
                        <div className="flex items-center gap-2">
                            <Button size="sm" variant="danger" disabled={removing} onClick={remove}>
                                {removing ? 'Removing...' : 'Remove'}
                            </Button>
                            <Button size="sm" variant="quiet" disabled={removing} onClick={() => setConfirming(false)}>
                                Keep
                            </Button>
                        </div>
                        {removeError ? <p className="text-[12px] text-red-300">{removeError}</p> : null}
                    </div>
                ) : (
                    <Button variant="danger" onClick={() => setConfirming(true)}>
                        Remove from team
                    </Button>
                )}
            </div>
        </div>
    );
}

/** The quick view of one ambassador: their split with a worked example, their accounts, and Remove from team. */
export default function MemberDrawer({ member, shareBps, onClose, onSaved, onRemoved }) {
    return (
        <Drawer open={Boolean(member)} onClose={onClose} title="Ambassador">
            {member ? <Body key={member.username} member={member} shareBps={shareBps} onSaved={onSaved} onRemoved={onRemoved} /> : null}
        </Drawer>
    );
}
