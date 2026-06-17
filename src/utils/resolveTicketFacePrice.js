import { parseEventTicketTiers } from '@/lib/ticketTiers';

function eventMaxFacePriceUsd(event) {
    if (String(event.ticketType || '').toUpperCase() !== 'PAID') return 0;
    const tiers = parseEventTicketTiers(event);
    if (tiers.length) return Math.max(...tiers.map((t) => t.priceUsd));
    const base = Number(event.ticketPrice);
    return Number.isFinite(base) && base > 0 ? base : 0;
}

/**
 * Client-side fallback when passport-events API is unavailable.
 * Prefer GET /api/users/:id/passport-events for purchased tier accuracy.
 */
export function resolvePassportStampPriceUsd(ticket, event, albumRole) {
    const role = String(albumRole || 'MEMBER').toUpperCase();
    const eventMax = eventMaxFacePriceUsd(event);

    if (String(event.ticketType || '').toUpperCase() !== 'PAID') {
        return 0;
    }

    if (ticket.stripePaymentIntentId) {
        const tiers = parseEventTicketTiers(event);
        if (tiers.length === 1) return tiers[0].priceUsd;
        if (tiers.length > 1) {
            const base = Number(event.ticketPrice);
            if (Number.isFinite(base) && base > 0) return base;
            return Math.min(...tiers.map((t) => t.priceUsd));
        }
        const base = Number(event.ticketPrice);
        return Number.isFinite(base) && base > 0 ? base : 0;
    }

    if (role === 'OWNER' || role === 'ADMIN' || role === 'BOUNCER') {
        return eventMax;
    }

    return 0;
}
