// The words and small decisions behind the Campaigns page, kept apart from the markup.

import { getPublicEventUrl } from '@/lib/inviteShare';
import { dayDate } from '@/lib/dashFormat';

export const AUDIENCE_OPTIONS = [
    { value: 'ALL_PAST', label: 'Everyone who came (opted in)' },
    { value: 'ATTENDEES', label: 'The people from one night' },
    { value: 'SEGMENT', label: 'A saved list' },
];

/** What the status of a campaign says, and how loudly. tone is a StateText tone. */
export const STATUS = {
    DRAFT: { label: 'Draft', tone: 'muted' },
    PENDING_PAYMENT: { label: 'Waiting for payment', tone: 'warn' },
    SENDING: { label: 'Sending', tone: 'purple' },
    SENT: { label: 'Sent', tone: 'good' },
    FAILED: { label: 'Failed', tone: 'bad' },
    CANCELLED: { label: 'Cancelled', tone: 'muted' },
};

export function statusOf(campaign) {
    return STATUS[campaign?.status] || { label: String(campaign?.status || '').replaceAll('_', ' ').toLowerCase(), tone: 'muted' };
}

export const channelWord = (channel) => (channel === 'SMS' ? 'Text' : 'Email');

/** Who a sent campaign went to, in words. Older sends may carry an audience this page no longer offers. */
export function audienceLabel(campaign, events = [], segments = []) {
    const night = campaign?.eventId ? events.find((e) => e.id === campaign.eventId) : null;
    if (campaign?.audience === 'ALL_PAST') return 'Everyone who came';
    if (campaign?.audience === 'SEGMENT') {
        const list = segments.find((s) => s.id === campaign.segmentId);
        return list ? list.name : 'A saved list';
    }
    if (campaign?.audience === 'ATTENDEES' || campaign?.audience === 'TICKET_HOLDERS') {
        return night ? night.name : 'One night';
    }
    return 'Everyone who came';
}

/** The name PXI files a send under. There is no name field: the subject (or the start of a text) is the name. */
export function campaignName({ channel, subject, body }) {
    if (channel === 'EMAIL') return String(subject || '').trim().slice(0, 120);
    const text = String(body || '').trim().replace(/\s+/g, ' ');
    return text.length > 48 ? `${text.slice(0, 48).trim()}...` : text;
}

const venueOf = (event) => event?.venueName || String(event?.location || '').split(',')[0].trim();

const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/** The night that is on today (or live now) and the next one after it, from the host's own nights. */
export function pickNights(events, now = new Date()) {
    const dated = (events || [])
        .filter((e) => e.startDate && !Number.isNaN(new Date(e.startDate).getTime()) && e.status !== 'CANCELLED')
        .map((e) => ({ event: e, start: new Date(e.startDate), end: e.endDate ? new Date(e.endDate) : null }));
    const tonight = dated.find(({ event, start, end }) => event.status === 'LIVE' || sameDay(start, now) || (end && start <= now && end >= now));
    const upcoming = dated
        .filter(({ start }) => start.getTime() > now.getTime() && !sameDay(start, now))
        .sort((a, b) => a.start - b.start)[0];
    return { tonight: tonight?.event || null, next: upcoming?.event || null };
}

/**
 * The three "Start from" messages. Each returns { subject, body } for the channel being written, or null when
 * there is no night to write about. Plain words, no exclamation marks, nothing the host has not said.
 */
export function startFrom({ key, channel, nights, night }) {
    const sms = channel === 'SMS';
    if (key === 'thanks') {
        const place = night?.name ? `to ${night.name}` : 'out';
        return {
            subject: 'Thank you for coming',
            body: sms ? `Thank you for coming ${place}. See you next time.` : `Thank you for coming ${place}. We loved having you there.\n\nSee you next time.`,
        };
    }
    if (key === 'last') {
        const e = nights.next;
        if (!e) return null;
        const link = getPublicEventUrl(e.id);
        const when = dayDate(e.startDate);
        return {
            subject: `Last call for ${e.name}`,
            body: sms ? `Last call for ${e.name} on ${when}. Get your ticket: ${link}` : `${e.name} is on ${when}${venueOf(e) ? ` at ${venueOf(e)}` : ''}.\n\nGet your ticket here: ${link}`,
        };
    }
    if (key === 'tonight') {
        const e = nights.tonight || nights.next;
        if (!e) return null;
        const today = nights.tonight === e;
        const time = new Date(e.startDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        const lead = today ? 'Tonight' : dayDate(e.startDate);
        const place = venueOf(e) ? ` at ${venueOf(e)}` : '';
        return {
            subject: today ? "Tonight's details" : `Details for ${e.name}`,
            body: sms
                ? `${lead}: ${e.name}${place}. Starts at ${time}. Show your ticket at the door.`
                : `${lead}: ${e.name}${place}.\n\nStarts at ${time}. Show your ticket at the door.`,
        };
    }
    return null;
}
