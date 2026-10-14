'use client';

import Link from 'next/link';
import { PersonLine } from '@/components/dashboard/ui/kit';
import { handle } from '@/lib/dashFormat';

/**
 * Who or what a claim is about. An organizer is a PersonLine (a link to their quick view when `href` is given);
 * a venue is its name with "for @account" under it, on a plain disc so the text lines up with the organizers.
 * `more` is extra lines under the second line (each wrapped in a block span that truncates).
 */
export default function ClaimSubject({ claim, href = null, more = null }) {
    if (claim.type === 'VENUE') {
        const name = claim.venue?.name || 'A venue';
        return (
            <div className="flex min-w-0 items-center gap-3">
                <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pxi-surface text-[13px] font-semibold text-white/50">
                    {name.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0">
                    <p className="truncate text-[14px] font-semibold text-white">{name}</p>
                    <p className="truncate text-[12px] text-white/45">{claim.beneficiary ? `for ${handle(claim.beneficiary)}` : ''}</p>
                    {more}
                </div>
            </div>
        );
    }
    const person = (
        <PersonLine
            person={claim.organizer}
            meta={
                <>
                    <span className="block truncate">{claim.organizer?.name && claim.organizer?.username ? `@${claim.organizer.username}` : ''}</span>
                    {more}
                </>
            }
        />
    );
    return href ? (
        <Link href={href} className="block min-w-0 hover:opacity-80">
            {person}
        </Link>
    ) : (
        person
    );
}
