// Words and one-line summaries for the organizer book and its quick view. Plain words, no separator dots.

import { ago, count, shortDate } from '@/lib/dashFormat';

/** Stage word and the StateText tone that goes with it. */
export const STAGES = {
    NEW: { label: 'New', tone: 'good' },
    BUILDING: { label: 'Building', tone: 'good' },
    SELLING: { label: 'Selling', tone: 'good' },
    BREAKOUT: { label: 'Breakout', tone: 'purple' },
    COOLING: { label: 'Cooling', tone: 'warn' },
    QUIET: { label: 'Quiet', tone: 'muted' },
};

export function stageOf(stage) {
    return STAGES[stage] || { label: stage ? String(stage).toLowerCase() : '', tone: 'muted' };
}

const TOUCH_WORDS = { CALL: 'Call', MEETING: 'Meeting', NOTE: 'Note', INCENTIVE: 'Offer', OPT_OUT: 'Opted out', EMAIL: 'Email' };

/** "Call", "Offer", "Opted out". */
export function touchWord(kind) {
    return TOUCH_WORDS[kind] || 'Note';
}

/** "Call, 3 days ago", or "Never". */
export function lastContactText(lastTouch) {
    if (!lastTouch?.at) return 'Never';
    return `${touchWord(lastTouch.kind)}, ${ago(lastTouch.at)}`;
}

/** "6 a day", "under 1 a day", or null when nothing is selling. */
export function paceText(pace) {
    const n = Number(pace);
    if (!Number.isFinite(n) || n <= 0) return null;
    if (n < 1) return 'under 1 a day';
    return `${Math.round(n)} a day`;
}

/** "Oct 22, 38 sold, 6 a day". */
export function nextNightLine(next) {
    if (!next) return '';
    return [shortDate(next.startDate), `${count(next.sold)} sold`, paceText(next.pacePerDay)].filter(Boolean).join(', ');
}

/** "38 sold of 150. 6 a day, about 92 by doors." */
export function nightProgressLine(night) {
    const sold = Number(night?.sold || 0);
    const parts = [night?.capacity ? `${count(sold)} sold of ${count(night.capacity)}.` : `${count(sold)} sold.`];
    const pace = paceText(night?.pacePerDay);
    if (pace) {
        const projected = Number(night?.projectedSold);
        parts.push(projected > sold ? `${pace}, about ${count(projected)} by doors.` : `${pace}.`);
    }
    return parts.join(' ');
}

export function ticketsText(n) {
    return `${count(n)} ${Number(n) === 1 ? 'ticket' : 'tickets'}`;
}

/** The first word of a name, for "Hi Alex". Falls back to the username. */
export function firstNameOf(person) {
    const name = String(person?.name || '').trim();
    if (name) return name.split(/\s+/)[0];
    return person?.username || 'there';
}

const CLAIM_STATUS = {
    ACTIVE: { label: 'Approved', tone: 'good' },
    PENDING_APPROVAL: { label: 'Waiting for approval', tone: 'warn' },
    REJECTED: { label: 'Rejected', tone: 'muted' },
    REVOKED: { label: 'Ended', tone: 'muted' },
};

export function claimStatusOf(status) {
    return CLAIM_STATUS[status] || { label: String(status || '').toLowerCase(), tone: 'muted' };
}

/** How the account came to the seller. */
export function claimSourceText(source) {
    if (source === 'VENUE') return 'Through a venue';
    if (source === 'ASSIGNED') return 'Moved by the PXI team';
    return 'Claimed';
}

/** A person's first name for a sentence, or their @username. */
export function plainName(person) {
    return person?.name || (person?.username ? `@${person.username}` : '');
}
