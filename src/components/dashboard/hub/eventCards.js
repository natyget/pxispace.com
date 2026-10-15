import { eventStatus } from '@/services/commandCenter';

/** Only real image URLs reach next/image; anything else falls back to the placeholder. */
export function coverImageUrl(value) {
    const raw = typeof value === 'string' ? value.trim() : '';
    return raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('data:image/') ? raw : null;
}

/** Raw event from GET /api/events?mine=1 to the card shape. Returns null for past or draft events. */
export function toLiveOrUpcomingCard(event, now = Date.now()) {
    const status = eventStatus(event, now);
    if (status !== 'live' && status !== 'upcoming') return null;
    return {
        id: event.id,
        href: event.id ? `/dashboard/events/${event.id}` : '/dashboard/events',
        name: event.name || 'Untitled event',
        cover: coverImageUrl(event.coverImage),
        venue: event.location || event.venue || '',
        status: status === 'live' ? 'Live' : 'Upcoming',
        dateLabel: event.startDate
            ? new Date(event.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            : 'Date pending',
    };
}
