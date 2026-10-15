'use client';

import { ago } from '@/lib/dashFormat';
import { DecideButtons, DecideError, RejectForm } from '../claims/decide';
import { useDecide } from '../claims/useDecide';
import LinkButton from './LinkButton';

const WORDS = { claims: 'Claim', support: 'Support', reports: 'Report', venues: 'Venue', accounts: 'Call', setup: 'Setup', payouts: 'Payout' };

/**
 * One thing that needs a person: the kind of thing, what it is, how long ago, and the button to deal with it.
 * `claim` is the matching waiting claim (when the item is a claim decision); the API's detail already quotes its note.
 * An organizer worth a call has no age: its detail carries the date that matters ("First ticket sold on Oct 11.").
 */
export default function InboxRow({ item, claim = null, onDecided }) {
    const action = item.action;
    const decides = action?.kind === 'decide_claim';
    const decide = useDecide({
        type: decides ? action.claimType : undefined,
        id: decides ? action.claimId : undefined,
        onDone: (kind) => onDecided(item, claim, kind),
    });
    const age = item.category === 'accounts' ? null : ago(item.at);

    return (
        <li className="rounded-2xl bg-pxi-field px-4 py-3">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-4 gap-y-2 md:grid-cols-[64px_minmax(0,1fr)_88px_168px]">
                <span className="pt-0.5 text-[12px] text-white/40 md:col-start-1 md:row-start-1">{WORDS[item.category] || ''}</span>
                <span className="pt-0.5 text-right text-[12px] text-white/40 md:col-start-3 md:row-start-1">{age}</span>
                <div className="col-span-2 min-w-0 md:col-span-1 md:col-start-2 md:row-start-1">
                    <p className="text-[14px] font-semibold text-white">{item.title}</p>
                    {item.detail ? <p className="mt-0.5 text-[13px] text-white/50">{item.detail}</p> : null}
                </div>
                <div className="col-span-2 flex md:col-span-1 md:col-start-4 md:row-start-1 md:justify-end">
                    {decides ? (
                        <DecideButtons decide={decide} />
                    ) : action?.kind === 'open' ? (
                        <LinkButton href={action.href || item.href} variant="onRow" size="sm">
                            Open
                        </LinkButton>
                    ) : null}
                </div>
            </div>
            {decides ? (
                <>
                    <RejectForm decide={decide} />
                    <DecideError decide={decide} />
                </>
            ) : null}
        </li>
    );
}
