'use client';

import { ago, handle } from '@/lib/dashFormat';
import ClaimSubject from './ClaimSubject';
import { exposureLine } from './claimText';
import { DecideButtons, DecideError, RejectForm } from './decide';
import { useDecide } from './useDecide';

/** One claim waiting for this person: what it is about, who raised it, their note, what it would open up, and the buttons. */
export default function QueueRow({ claim, organizerHref, onDecided }) {
    const organizer = claim.type === 'ORGANIZER';
    const decide = useDecide({ type: organizer ? 'organizer' : 'venue', id: claim.id, onDone: (kind) => onDecided(claim, kind) });
    const exposure = organizer ? '' : exposureLine(claim.exposure);

    return (
        <li className="rounded-2xl bg-pxi-field px-4 py-3">
            <div className="grid grid-cols-1 gap-x-4 gap-y-3 md:grid-cols-[72px_minmax(0,1fr)_auto] md:items-start">
                <span className="pt-2 text-[12px] text-white/40">{organizer ? 'Organizer' : 'Venue'}</span>
                <div className="min-w-0">
                    <ClaimSubject claim={claim} href={organizer && claim.organizer?.id ? organizerHref(claim.organizer.id) : null} />
                    <p className="mt-2 text-[12px] text-white/45">
                        Raised by {handle(claim.raisedBy)}, {ago(claim.raisedAt)}
                    </p>
                    {claim.note ? <p className="mt-1.5 text-[13px] text-white/60">&ldquo;{claim.note}&rdquo;</p> : null}
                    {exposure ? <p className="mt-1.5 text-[13px] text-amber-300">{exposure}</p> : null}
                </div>
                <div className="md:justify-self-end md:pt-0.5">
                    <DecideButtons decide={decide} />
                </div>
            </div>
            <RejectForm decide={decide} />
            <DecideError decide={decide} />
        </li>
    );
}
