'use client';

import { useState } from 'react';
import { Button, Field } from '@/components/dashboard/ui/kit';
import { money } from '@/lib/dashFormat';
import { BUDGET_CATEGORIES, createExpense, setBudgets } from '@/services/budget';
import ChevronSelect from './ChevronSelect';

/**
 * What you planned to spend per category and what the night really cost, against the real EventBudget and
 * EventExpense data. `summary` comes from getBudgetSummary(eventId); `onChanged` should fetch it again.
 */
export default function BudgetEditor({ eventId, summary, onChanged }) {
    const [drafts, setDrafts] = useState({});
    const [savingBudgets, setSavingBudgets] = useState(false);
    const [expenseForm, setExpenseForm] = useState({ category: 'OTHER', amount: '', label: '' });
    const [loggingExpense, setLoggingExpense] = useState(false);
    const [error, setError] = useState('');

    if (!summary) return null;
    const byCategory = new Map(summary.byCategory.map((c) => [c.category, c]));

    async function saveBudgets() {
        const budgets = Object.entries(drafts)
            .filter(([, value]) => value !== '' && value != null)
            .map(([category, value]) => ({ category, amountCents: Math.round(Number(value) * 100) }));
        if (!budgets.length) return;
        setSavingBudgets(true);
        setError('');
        try {
            await setBudgets(eventId, budgets);
            setDrafts({});
            onChanged?.();
        } catch (err) {
            setError(err?.data?.error || err?.message || 'Failed to save budgets');
        } finally {
            setSavingBudgets(false);
        }
    }

    async function logExpense() {
        const amount = Number(expenseForm.amount);
        if (!expenseForm.label.trim() || !Number.isFinite(amount) || amount <= 0) {
            setError('Enter a label and a positive amount');
            return;
        }
        setLoggingExpense(true);
        setError('');
        try {
            await createExpense(eventId, {
                category: expenseForm.category,
                amountCents: Math.round(amount * 100),
                label: expenseForm.label.trim(),
            });
            setExpenseForm({ category: 'OTHER', amount: '', label: '' });
            onChanged?.();
        } catch (err) {
            setError(err?.data?.error || err?.message || 'Failed to log expense');
        } finally {
            setLoggingExpense(false);
        }
    }

    return (
        <div>
            <div className="mb-4 flex items-baseline justify-between gap-3">
                <p className="text-[13px] text-white/45">Spent of budgeted</p>
                <p className="text-[17px] font-semibold tabular-nums text-white">
                    {money(summary.totalSpentCents)}
                    <span className="font-normal text-white/45"> of {money(summary.totalBudgetedCents)}</span>
                </p>
            </div>

            <ul className="space-y-1.5">
                {BUDGET_CATEGORIES.map(({ id, label }) => {
                    const row = byCategory.get(id) || { budgetedCents: 0, spentCents: 0 };
                    const over = row.budgetedCents > 0 && row.spentCents > row.budgetedCents;
                    const pct = row.budgetedCents > 0 ? Math.min(100, Math.round((row.spentCents / row.budgetedCents) * 100)) : 0;
                    return (
                        <li key={id} className="grid grid-cols-[minmax(0,1fr)_104px] items-center gap-x-3 gap-y-2.5 rounded-2xl bg-pxi-field px-4 py-3 md:grid-cols-[110px_minmax(0,1fr)_120px] md:gap-4">
                            <p className="order-1 truncate text-[14px] font-semibold text-white">{label}</p>
                            <div className="order-3 col-span-2 min-w-0 md:order-2 md:col-span-1">
                                <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                                    <div className={`h-full rounded-full ${over ? 'bg-amber-300' : 'bg-emerald-300'}`} style={{ width: `${pct}%` }} />
                                </div>
                                <p className="mt-1.5 truncate text-[12px] text-white/45">
                                    {money(row.spentCents)} of {money(row.budgetedCents)}
                                </p>
                            </div>
                            <Field
                                aria-label={`${label} budget in dollars`}
                                type="number"
                                min="0"
                                placeholder={String(Math.round(row.budgetedCents / 100))}
                                value={drafts[id] ?? ''}
                                onChange={(e) => setDrafts((cur) => ({ ...cur, [id]: e.target.value }))}
                                className="order-2 md:order-3"
                                inputClassName="h-9! bg-pxi-surface! text-right"
                            />
                        </li>
                    );
                })}
            </ul>
            <div className="mt-3 flex justify-end">
                <Button onClick={saveBudgets} disabled={savingBudgets || !Object.keys(drafts).length}>
                    {savingBudgets ? 'Saving...' : 'Save budgets'}
                </Button>
            </div>

            <div className="mt-6 border-t border-white/[0.08] pt-5">
                <h4 className="text-[14px] font-semibold text-white/70">Log an expense</h4>
                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-[150px_minmax(0,1fr)_120px_auto]">
                    <ChevronSelect
                        aria-label="Category"
                        value={expenseForm.category}
                        onChange={(e) => setExpenseForm((cur) => ({ ...cur, category: e.target.value }))}
                        options={BUDGET_CATEGORIES.map(({ id, label }) => ({ value: id, label }))}
                    />
                    <Field
                        aria-label="What was it for"
                        type="text"
                        placeholder="What was it for?"
                        value={expenseForm.label}
                        onChange={(e) => setExpenseForm((cur) => ({ ...cur, label: e.target.value }))}
                        inputClassName="h-10!"
                    />
                    <Field
                        aria-label="Amount in dollars"
                        type="number"
                        min="0"
                        placeholder="Amount"
                        value={expenseForm.amount}
                        onChange={(e) => setExpenseForm((cur) => ({ ...cur, amount: e.target.value }))}
                        inputClassName="h-10!"
                    />
                    <Button onClick={logExpense} disabled={loggingExpense} className="sm:col-span-2 lg:col-span-1">
                        {loggingExpense ? 'Logging...' : 'Log expense'}
                    </Button>
                </div>
            </div>
            {error ? <p className="mt-3 text-[13px] text-red-300">{error}</p> : null}
        </div>
    );
}
