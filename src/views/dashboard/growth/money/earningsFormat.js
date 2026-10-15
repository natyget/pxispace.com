// What a seller earns, in words and numbers. Pure functions, shared by the Earnings page and the Commissions quick view.

import { displayName, exactMoney, percentFromBps } from '@/lib/dashFormat';
import { cityLabel } from '@/lib/dashboardNavConfig';

/**
 * The four numbers a seller reads first, on their own Earnings page. The month figure counts sales made this month,
 * including nights that are not over yet, so it is "added" this month rather than "earned" (it can be more than Earned).
 */
export function myEarningsKpis(totals = {}) {
    return [
        {
            label: 'Owed to you',
            value: exactMoney(totals.owedCents || 0),
            tone: 'purple',
            hint: totals.paidCents > 0 ? `after ${exactMoney(totals.paidCents)} paid` : undefined,
        },
        { label: 'Earned', value: exactMoney(totals.earnedCents || 0), hint: `${exactMoney(totals.monthCents || 0)} added this month` },
        { label: 'On the way', value: exactMoney(totals.pendingCents || 0), hint: 'nights not over yet' },
        { label: 'Projected', value: exactMoney(totals.projectedCents || 0), hint: 'at the current pace' },
    ];
}

/** The same, for an admin looking at one seller. */
export function sellerEarningsKpis(totals = {}) {
    return [
        { label: 'Owed now', value: exactMoney(totals.owedCents || 0), tone: totals.owedCents > 0 ? 'purple' : undefined },
        { label: 'Earned', value: exactMoney(totals.earnedCents || 0) },
        { label: 'On the way', value: exactMoney(totals.pendingCents || 0) },
        { label: 'Paid', value: exactMoney(totals.paidCents || 0) },
    ];
}

/** One sentence on what the seller earns, from their rates. "Not set yet" wording when a rate is null. */
export function rateSentence(earnings) {
    if (!earnings) return null;
    const rates = earnings.rates || {};
    if (earnings.role === 'REGIONAL_MANAGER') {
        const place = cityLabel(earnings.city) || 'your city';
        if (rates.managerShareBps == null) return `Your share of PXI revenue on ${place} accounts is not set yet.`;
        return `You get ${percentFromBps(rates.managerShareBps)} of PXI revenue on ${place} accounts, and keep what is left after your ambassadors' splits.`;
    }
    const manager = rates.manager ? `${displayName(rates.manager)}'s` : "your manager's";
    if (rates.managerShareBps == null) return `${manager[0].toUpperCase()}${manager.slice(1)} share of PXI revenue is not set yet.`;
    if (rates.splitBps == null) return `Your split of ${manager} ${percentFromBps(rates.managerShareBps)} share of PXI revenue is not set yet.`;
    return `You get ${percentFromBps(rates.splitBps)} of ${manager} ${percentFromBps(rates.managerShareBps)} share of PXI revenue on accounts you bring in.`;
}
