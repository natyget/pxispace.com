import { count, displayName, handle, shortDate } from '@/lib/dashFormat';

// The words for a claim, shared by Today (inbox rows) and Claims.

/** The subject of a claim: the organizer's name, or the venue's. */
export function claimSubject(claim) {
    if (!claim) return '';
    if (claim.type === 'VENUE') return claim.venue?.name || 'this venue';
    return displayName(claim.organizer) || 'this organizer';
}

/** The one line shown after Approve. */
export function approvedLine(claim) {
    if (!claim) return 'Approved.';
    if (claim.type === 'VENUE') {
        const who = displayName(claim.beneficiary);
        return who ? `Approved. ${who} can now see the analytics for ${claimSubject(claim)}.` : 'Approved.';
    }
    return claim.seller ? `Approved. ${claimSubject(claim)} is now ${handle(claim.seller)}'s account.` : 'Approved.';
}

/** The one line shown after Reject. */
export function rejectedLine(claim) {
    return claim ? `Rejected. The claim on ${claimSubject(claim)} is closed.` : 'Rejected.';
}

/** What a venue claim would open up: "3 nights and 212 people become visible to them." Empty when nothing would. */
export function exposureLine(exposure) {
    const events = Number(exposure?.events) || 0;
    const attendees = Number(exposure?.attendees) || 0;
    if (!events && !attendees) return '';
    const nights = `${count(events)} ${events === 1 ? 'night' : 'nights'}`;
    const people = `${count(attendees)} ${attendees === 1 ? 'person' : 'people'}`;
    return `${nights} and ${people} become visible to them.`;
}

/** The calendar day of an ISO time ("2027-10-14"), read as the API stores it (UTC), or '' when there is none. */
export function dayOf(iso) {
    const day = typeof iso === 'string' ? iso.slice(0, 10) : '';
    return /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : '';
}

/** "Oct 14, 2027" for a stored end date. Noon keeps the day the same in every time zone. */
export function endLabel(iso) {
    const day = dayOf(iso);
    return day ? shortDate(`${day}T12:00:00`) : '';
}

/** The first day a commission end may take: the day after approval, on the same UTC calendar as the API. */
export function firstEndDay(approvedAt) {
    const day = dayOf(approvedAt);
    if (!day) return '';
    const next = new Date(`${day}T00:00:00Z`);
    next.setUTCDate(next.getUTCDate() + 1);
    return next.toISOString().slice(0, 10);
}
