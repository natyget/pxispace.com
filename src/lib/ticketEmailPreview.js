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
 * @param {string} ticketId
 * @param {string} qrValue paseto token / signature
 * @param {{ paidTotalUsd?: number }} [options]
 */
export function buildTicketEmailPreviewInput(event, ticketId, qrValue, options = {}) {
  const isPaid = event?.ticketType === 'PAID' && (event?.ticketPrice ?? 0) > 0;
  const ticketPrice = isPaid ? (options.paidTotalUsd ?? event.ticketPrice ?? 0) : 0;

  return {
    ticketId,
    qrValue,
    eventName: event.name,
    eventLocation: event.location ?? null,
    eventStartDate: event.startDate,
    eventCoverImage: event.coverImage ?? null,
    isPrivate: event.visibility === 'PRIVATE',
    ticketPrice,
    currency: event.currency ?? 'USD',
    albumName: event.name,
  };
}
