'use client';

import { useState } from 'react';
import { BUDGET_CATEGORIES, setBudgets, createExpense } from '@/services/budget';

function formatCents(cents) {
    return `$${((Number(cents) || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Per-event budget planning + expense logging against real EventBudget/EventExpense data.
 * summary comes from getBudgetSummary(eventId); onChanged should refetch it.
 */
export default function BudgetPanel({ eventId, summary, onChanged, className = '' }) {
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
        <section className={`glass-panel rounded-[1.25rem] p-5 ${className}`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-lg font-bold text-white">Budget</h2>
                    <p className="mt-1 text-sm text-zinc-500">
                        Set what you planned to spend per category, log real costs as they happen.
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-[11px] font-medium tracking-[0.02em] text-zinc-500">Total spent / budgeted</p>
                    <p className="mt-1 text-lg font-bold text-white">
                        {formatCents(summary.totalSpentCents)} <span className="text-zinc-500">/ {formatCents(summary.totalBudgetedCents)}</span>
                    </p>
                </div>
            </div>

            <div className="mt-4 space-y-2">
                {BUDGET_CATEGORIES.map(({ id, label }) => {
                    const row = byCategory.get(id) || { budgetedCents: 0, spentCents: 0 };
                    const pct = row.budgetedCents > 0 ? Math.min(100, Math.round((row.spentCents / row.budgetedCents) * 100)) : 0;
                    return (
                        <div key={id} className="grid grid-cols-[100px_1fr_120px] items-center gap-3 rounded-2xl bg-white/[0.035] px-4 py-3">
                            <p className="text-sm font-bold text-white">{label}</p>
                            <div className="space-y-1">
                                <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                                    <div
                                        className={`h-full rounded-full ${row.spentCents > row.budgetedCents && row.budgetedCents > 0 ? 'bg-red-400' : 'bg-emerald-300'}`}
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                                <p className="text-xs text-zinc-500">{formatCents(row.spentCents)} spent of {formatCents(row.budgetedCents)}</p>
                            </div>
                            <input
                                type="number"
                                min="0"
                                placeholder={(row.budgetedCents / 100).toFixed(0)}
                                value={drafts[id] ?? ''}
                                onChange={(e) => setDrafts((cur) => ({ ...cur, [id]: e.target.value }))}
                                className="glass-field rounded-xl px-3 py-2 text-sm text-white outline-none"
                            />
                        </div>
                    );
                })}
            </div>
            <button
                type="button"
                onClick={saveBudgets}
                disabled={savingBudgets || !Object.keys(drafts).length}
                className="pill-solid mt-3 px-4 py-2 text-xs disabled:opacity-40"
            >
                {savingBudgets ? 'Saving...' : 'Save budgets'}
            </button>

            <div className="mt-6 border-t border-white/10 pt-4">
                <p className="text-[11px] font-bold tracking-[0.02em] text-zinc-500">Log an expense</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                    <select
                        value={expenseForm.category}
                        onChange={(e) => setExpenseForm((cur) => ({ ...cur, category: e.target.value }))}
                        className="glass-field rounded-xl px-3 py-2 text-sm text-white"
                    >
                        {BUDGET_CATEGORIES.map(({ id, label }) => (
                            <option key={id} value={id}>{label}</option>
                        ))}
                    </select>
                    <input
                        type="text"
                        placeholder="What was it for?"
                        value={expenseForm.label}
                        onChange={(e) => setExpenseForm((cur) => ({ ...cur, label: e.target.value }))}
                        className="glass-field min-w-[160px] flex-1 rounded-xl px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-500"
                    />
                    <input
                        type="number"
                        min="0"
                        placeholder="Amount ($)"
                        value={expenseForm.amount}
                        onChange={(e) => setExpenseForm((cur) => ({ ...cur, amount: e.target.value }))}
                        className="glass-field w-32 rounded-xl px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-500"
                    />
                    <button
                        type="button"
                        onClick={logExpense}
                        disabled={loggingExpense}
                        className="pill-solid px-4 py-2 text-xs disabled:opacity-40"
                    >
                        {loggingExpense ? 'Logging...' : 'Log expense'}
                    </button>
                </div>
            </div>
            {error ? <p className="mt-2 text-xs font-semibold text-red-300">{error}</p> : null}
        </section>
    );
}
