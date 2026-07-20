'use client';

import { useState } from 'react';

export function createGateId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return `gate_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

const fieldCls = 'glass-field w-full rounded-xl px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-500';

/**
 * Standalone gate-list manager: add / rename / remove named gates. No
 * placement here — a gate can exist with no xPx/yPx (placement happens in the
 * plan-calibration stage by selecting a chip, then clicking the plan).
 */
export default function GateListEditor({ gates, onChange }) {
    const [draft, setDraft] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editingValue, setEditingValue] = useState('');

    const addGate = () => {
        const name = draft.trim();
        if (!name) return;
        onChange([...gates, { id: createGateId(), gate: name }]);
        setDraft('');
    };

    const removeGate = (id) => {
        onChange(gates.filter((gate) => gate.id !== id));
        if (editingId === id) {
            setEditingId(null);
            setEditingValue('');
        }
    };

    const startRename = (gate) => {
        setEditingId(gate.id);
        setEditingValue(gate.gate);
    };

    const commitRename = () => {
        const name = editingValue.trim();
        if (name) {
            onChange(gates.map((gate) => (gate.id === editingId ? { ...gate, gate: name } : gate)));
        }
        setEditingId(null);
        setEditingValue('');
    };

    return (
        <div>
            <div className="flex items-center gap-2">
                <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            addGate();
                        }
                    }}
                    placeholder="Gate name — e.g. Main entrance"
                    className={fieldCls}
                />
                <button
                    type="button"
                    onClick={addGate}
                    disabled={!draft.trim()}
                    className="pill-ghost shrink-0 px-4 py-2 text-xs font-bold tracking-[0.02em] disabled:opacity-40"
                >
                    Add gate
                </button>
            </div>

            {gates.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                    {gates.map((gate) => (
                        <div
                            key={gate.id}
                            className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.07] py-1 pl-3 pr-2 text-xs font-bold text-zinc-200"
                        >
                            {editingId === gate.id ? (
                                <input
                                    autoFocus
                                    value={editingValue}
                                    onChange={(e) => setEditingValue(e.target.value)}
                                    onBlur={commitRename}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            commitRename();
                                        }
                                        if (e.key === 'Escape') {
                                            setEditingId(null);
                                            setEditingValue('');
                                        }
                                    }}
                                    className="w-28 rounded-md bg-black/30 px-1.5 py-0.5 text-xs text-white outline-none"
                                />
                            ) : (
                                <button type="button" onClick={() => startRename(gate)} className="transition hover:text-white" title="Click to rename">
                                    {gate.gate}
                                </button>
                            )}
                            {gate.xPx != null && gate.yPx != null ? (
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" title="Placed on the plan" />
                            ) : null}
                            <button
                                type="button"
                                aria-label={`Remove ${gate.gate}`}
                                onClick={() => removeGate(gate.id)}
                                className="text-zinc-500 transition hover:text-red-300"
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="mt-3 text-xs leading-5 text-zinc-500">
                    No gates yet. Add the entrances/checkpoints your scanners cover — you can position them on a plan later.
                </p>
            )}
        </div>
    );
}
