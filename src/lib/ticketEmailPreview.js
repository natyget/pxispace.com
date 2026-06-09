import { parseEventTicketTiers } from './ticketTiers';

export function formatTicketDisplayId(ticketId) {
  if (!ticketId) return '#PXI-TICKET';
  const compact = ticketId.replace(/-/g, '').toUpperCase();
  return `#PXI-${compact.slice(0, 4)}-${compact.slice(4, 8)}`;
}

export function formatEventDateShort(isoDate) {
  return new Date(isoDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatCurrency(amount, currency) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

/** @deprecated Use tierLabel from buildTicketEmailPreviewInput when available. */
export function tierLabelFromPrice(price, currency) {
  if (price == null || price === 0) return 'General';
  if (price >= 100) return 'VIP';
  return formatCurrency(price, currency);
}

export function priceLabelFromPrice(price, currency) {
  if (price == null || price === 0) return 'Free admission';
  return formatCurrency(price, currency);
}

export function formatLocationLine(location) {
  if (!location?.trim()) return 'Venue TBA';
  const parts = location.split(',').map((p) => p.trim()).filter(Boolean);
  return parts[0] || location.trim();
}

export function formatLocationSubline(location) {
  if (!location?.trim()) return 'Details in app';
  if (location.length > 48) return 'See ticket in app';
  return location.trim();
}

export function ticketTypeLabel(isPrivate) {
  return isPrivate ? 'Private' : 'Public';
}

/**
 * @param {object} event API event row
 * @param {{ selectedTierId?: string | null }} [options]
 */
export function resolveTierDisplayForEvent(event, options = {}) {
  const tiers = parseEventTicketTiers(event);
  const selected =
    options.selectedTierId != null
      ? tiers.find((t) => t.id === options.selectedTierId) ?? tiers[0]
      : tiers[0];

  if (selected) {
    return {
      tierLabel: selected.label,
      tierPriceUsd: selected.priceUsd,
    };
  }

  const base = Number(event?.ticketPrice);
  if (String(event?.ticketType || '').toUpperCase() === 'PAID' && base > 0) {
    return { tierLabel: 'General admission', tierPriceUsd: base };
  }

  return { tierLabel: 'General', tierPriceUsd: 0 };
}

/**
 * @param {object} event API event row
 * @param {string} ticketId
 * @param {string} qrValue paseto token / signature
 * @param {{ selectedTierId?: string | null, tierLabel?: string, tierPriceUsd?: number }} [options]
 */
export function buildTicketEmailPreviewInput(event, ticketId, qrValue, options = {}) {
  const { tierLabel, tierPriceUsd } =
    options.tierLabel != null && options.tierPriceUsd != null
      ? { tierLabel: options.tierLabel, tierPriceUsd: options.tierPriceUsd }
      : resolveTierDisplayForEvent(event, { selectedTierId: options.selectedTierId });

  return {
    ticketId,
    qrValue,
    eventName: event.name,
    eventLocation: event.location ?? null,
    eventStartDate: event.startDate,
    eventCoverImage: event.coverImage ?? null,
    isPrivate: event.visibility === 'PRIVATE',
    tierLabel,
    tierPriceUsd,
    ticketPrice: tierPriceUsd,
    currency: event.currency ?? 'USD',
    albumName: event.name,
  };
}
