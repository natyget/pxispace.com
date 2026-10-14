import { count, displayName, handle } from '@/lib/dashFormat';

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
