/** @typedef {{ id: string, name: string, capacity: string, price: string }} TicketTierDraft */

export function createTierId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `tier_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/** @returns {TicketTierDraft} */
export function createEmptyTier() {
  return { id: createTierId(), name: '', capacity: '', price: '' };
}

/** @param {TicketTierDraft[]} drafts */
export function normalizeTicketTiersForApi(drafts) {
  return drafts
    .map((t) => {
      const label = String(t.name || '').trim();
      const priceUsd = parseInt(String(t.price || '').replace(/[^\d]/g, ''), 10);
      if (!label || !Number.isFinite(priceUsd) || priceUsd <= 0) return null;
      const capRaw = String(t.capacity || '').trim();
      const capacity = capRaw ? parseInt(capRaw.replace(/[^\d]/g, ''), 10) : null;
      return {
        id: t.id || createTierId(),
        label,
        priceUsd,
        ...(capacity != null && Number.isFinite(capacity) && capacity > 0 ? { capacity } : {}),
      };
    })
    .filter(Boolean);
}

/** @param {{ isPaid: boolean, useTierList: boolean, price: string, tiers: TicketTierDraft[] }} input */
export function validatePaidPricing(input) {
  const { isPaid, useTierList, price, tiers } = input;
  if (!isPaid) return { ok: true };
  if (useTierList) {
    if (!tiers.length) {
      return { ok: false, error: 'Add at least one ticket tier.' };
    }
    for (const t of tiers) {
      const label = String(t.name || '').trim();
      if (!label) return { ok: false, error: 'Each tier needs a name.' };
      const p = parseInt(String(t.price || '').replace(/[^\d]/g, ''), 10);
      if (!String(t.price || '').trim() || !Number.isFinite(p) || p <= 0) {
        return { ok: false, error: `Set a price greater than 0 for "${label}".` };
      }
      const capRaw = String(t.capacity || '').trim();
      if (capRaw) {
        const c = parseInt(capRaw.replace(/[^\d]/g, ''), 10);
        if (!Number.isFinite(c) || c <= 0) {
          return { ok: false, error: `Capacity for "${label}" must be a positive number or empty.` };
        }
      }
    }
    return { ok: true };
  }
  const p = parseInt(String(price || '').replace(/[^\d]/g, ''), 10);
  if (!String(price || '').trim() || !Number.isFinite(p) || p <= 0) {
    return { ok: false, error: 'Paid events need a ticket price greater than 0.' };
  }
  return { ok: true };
}

/** @param {{ isPaid: boolean, useTierList: boolean, price: string, tiers: TicketTierDraft[] }} input */
export function buildTicketPricingPayload(input) {
  const { isPaid, useTierList, price, tiers } = input;
  if (!isPaid) {
    return { ticketType: 'FREE', ticketPrice: 0, ticketTiersJson: null };
  }
  if (useTierList) {
    const normalized = normalizeTicketTiersForApi(tiers);
    const ticketPrice = Math.min(...normalized.map((t) => t.priceUsd));
    return { ticketType: 'PAID', ticketPrice, ticketTiersJson: normalized };
  }
  const ticketPrice = parseInt(String(price || '').replace(/[^\d]/g, ''), 10);
  return { ticketType: 'PAID', ticketPrice, ticketTiersJson: null };
}

/** @param {number | null | undefined} usd @param {string} [currency] */
export function formatTicketPrice(usd, currency = 'USD') {
  if (usd == null || !Number.isFinite(Number(usd))) return '—';
  const sym = currency === 'EUR' ? '€' : '$';
  return `${sym}${Number(usd).toFixed(2)}`;
}

/**
 * Display-ready tiers for an event (multi-tier list or single GA price).
 * @param {Record<string, unknown> | null | undefined} event
 * @returns {{ id: string | null, label: string, priceUsd: number, capacity?: number }[]}
 */
export function parseEventTicketTiers(event) {
  if (!event || String(event.ticketType || '').toUpperCase() !== 'PAID') return [];
  const raw = event.ticketTiersJson;
  if (Array.isArray(raw) && raw.length) {
    const rows = raw.filter((t) => t && typeof t.priceUsd === 'number' && t.priceUsd > 0);
    if (rows.length) {
      return rows.map((t) => ({
        id: t.id ?? null,
        label: t.label || t.name || 'Ticket',
        priceUsd: t.priceUsd,
        ...(t.capacity != null && Number(t.capacity) > 0 ? { capacity: Number(t.capacity) } : {}),
      }));
    }
  }
  const base = Number(event.ticketPrice);
  if (base > 0) return [{ id: null, label: 'General admission', priceUsd: base }];
  return [];
}
