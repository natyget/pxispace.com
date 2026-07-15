import { api } from './api';

/** Per-event budgeting: EventBudget (set ahead of time) vs. EventExpense (actuals logged). */

export const BUDGET_CATEGORIES = [
    { id: 'STAFF', label: 'Staff' },
    { id: 'VENUE', label: 'Venue' },
    { id: 'VENDOR', label: 'Vendor' },
    { id: 'MARKETING', label: 'Marketing' },
    { id: 'EQUIPMENT', label: 'Equipment' },
    { id: 'OTHER', label: 'Other' },
];

/** → { eventId, byCategory: [{category, budgetedCents, spentCents, remainingCents}], totalBudgetedCents, totalSpentCents, totalRemainingCents } */
export function getBudgetSummary(eventId) {
    return api.get(`/api/budget/${eventId}`);
}

/** budgets: [{ category, amountCents, note? }] */
export function setBudgets(eventId, budgets) {
    return api.put(`/api/budget/${eventId}`, { budgets });
}

export function listExpenses(eventId) {
    return api.get(`/api/budget/${eventId}/expenses`);
}

/** { category, amountCents, label, vendorName?, receiptUrl? } */
export function createExpense(eventId, expense) {
    return api.post(`/api/budget/${eventId}/expenses`, expense);
}

export function deleteExpense(eventId, expenseId) {
    return api.delete(`/api/budget/${eventId}/expenses/${expenseId}`);
}
