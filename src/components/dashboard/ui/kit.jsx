'use client';

// Dashboard 2 kit. Every dashboard page is built from these so the spacing, type and hierarchy are the same
// everywhere:
//   PageHeader      the page title (and at most one short line) on the left, the KPI strip on the right
//   KpiStrip        up to four numbers in one hairline-divided bar (the Command Center strip)
//   Panel           a card with a title row and an optional quiet action
//   WordTabs        a switch between views of the same content: plain words on a hairline, purple line under the active one
//   DataTable       a list of records; rows open a Drawer (quick view) instead of leaving the page
//   Drawer          the quick view, from the right
//   Button, Field, TextArea, Select, EmptyState, Notice, Avatar, Skeleton
// The page's one primary action goes in the sub-tab row through usePageAction, never inside the page body.
//
// Spacing: sections 20px apart (gap-5), cards rounded-3xl with p-5 / md:p-6, rows 56px, inner gaps 12px.
// Type: page title 28px bold, card title 17px semibold, body 14px, meta 12px at white/45.

import { useEffect, useRef } from 'react';
import Portal from '@/components/ui/Portal';
import UserAvatar from '@/components/ui/UserAvatar';

export function PageHeader({ title, subtitle = null, kpis = null, aside = null }) {
    return (
        <section className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
                <h1 className="text-2xl font-semibold text-white md:text-[28px]">{title}</h1>
                {subtitle ? <p className="mt-2 max-w-2xl text-sm text-white/50">{subtitle}</p> : null}
            </div>
            {kpis?.length ? <KpiStrip items={kpis} /> : aside}
        </section>
    );
}

/** items: [{ label, value, hint?, tone?: 'good'|'warn'|'purple' }], at most 4. */
export function KpiStrip({ items, className = '' }) {
    const cols = items.length >= 4 ? 'sm:grid-cols-4' : items.length === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2';
    const width = items.length >= 4 ? 'xl:w-[620px]' : items.length === 3 ? 'xl:w-[480px]' : 'xl:w-[340px]';
    return (
        <div className={`grid grid-cols-2 gap-px overflow-hidden rounded-3xl bg-white/[0.08] ${cols} ${width} ${className}`}>
            {items.map((item) => (
                <div key={item.label} className="min-w-0 bg-pxi-surface px-4 py-3.5">
                    <p className="truncate text-xs text-zinc-500">{item.label}</p>
                    <p className={`mt-1.5 truncate text-[22px] font-semibold leading-none tracking-tight ${toneText(item.tone)}`}>{item.value}</p>
                    {item.hint ? <p className="mt-1.5 truncate text-[11px] text-white/40">{item.hint}</p> : null}
                </div>
            ))}
        </div>
    );
}

function toneText(tone) {
    if (tone === 'good') return 'text-emerald-300';
    if (tone === 'warn') return 'text-amber-300';
    if (tone === 'purple') return 'text-[#c77dff]';
    return 'text-white';
}

export function Panel({ title = null, subtitle = null, action = null, children, className = '', bodyClassName = '', id }) {
    return (
        <section id={id} className={`dashboard-surface min-w-0 rounded-3xl p-5 md:p-6 ${className}`}>
            {title || action ? (
                <div className="mb-4 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        {title ? <h2 className="text-[17px] font-semibold text-white">{title}</h2> : null}
                        {subtitle ? <p className="mt-1 text-[13px] text-white/45">{subtitle}</p> : null}
                    </div>
                    {action ? <div className="shrink-0">{action}</div> : null}
                </div>
            ) : null}
            <div className={bodyClassName}>{children}</div>
        </section>
    );
}

/** items: [{ key, label, count? }]. The founder's switch: words, a hairline, a purple line under the active one. */
export function WordTabs({ items, value, onChange, className = '' }) {
    return (
        <div role="tablist" className={`dashboard-scrollbar-none flex min-w-0 gap-6 overflow-x-auto border-b border-white/[0.08] ${className}`}>
            {items.map((item) => {
                const active = item.key === value;
                return (
                    <button
                        key={item.key}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => onChange(item.key)}
                        className={`-mb-px inline-flex shrink-0 items-center gap-2 whitespace-nowrap border-b-2 pb-2.5 text-[15px] font-semibold transition-colors ${
                            active ? 'border-[#A523EF] text-white' : 'border-transparent text-white/50 hover:text-white'
                        }`}
                    >
                        {item.label}
                        {item.count ? <span className={`text-[12px] font-semibold ${active ? 'text-[#c77dff]' : 'text-white/35'}`}>{item.count}</span> : null}
                    </button>
                );
            })}
        </div>
    );
}

const BUTTON_VARIANTS = {
    primary: 'bg-pxi-purple text-white hover:bg-[#b444f2]',
    secondary: 'bg-pxi-field text-white hover:bg-[#3a3a3a]',
    quiet: 'bg-transparent text-white/60 hover:text-white',
    danger: 'bg-red-500/10 text-red-300 hover:bg-red-500/20',
    good: 'bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20',
};

export function Button({ variant = 'secondary', size = 'md', className = '', type = 'button', children, ...rest }) {
    const sizing = size === 'sm' ? 'h-8 px-3.5 text-[12px]' : size === 'lg' ? 'h-11 px-6 text-[14px]' : 'h-10 px-5 text-[13px]';
    return (
        <button
            type={type}
            className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-full font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${sizing} ${BUTTON_VARIANTS[variant] || BUTTON_VARIANTS.secondary} ${className}`}
            {...rest}
        >
            {children}
        </button>
    );
}

const fieldClass = 'w-full rounded-2xl bg-pxi-field px-4 text-[14px] text-white placeholder:text-white/35 outline-none transition focus:shadow-[0_0_0_1.5px_#a523ef]';

export function Field({ label = null, hint = null, className = '', inputClassName = '', ...rest }) {
    return (
        <label className={`block min-w-0 ${className}`}>
            {label ? <span className="mb-1.5 block text-[12px] font-medium text-white/50">{label}</span> : null}
            <input className={`${fieldClass} h-11 ${inputClassName}`} {...rest} />
            {hint ? <span className="mt-1.5 block text-[12px] text-white/40">{hint}</span> : null}
        </label>
    );
}

export function TextArea({ label = null, hint = null, className = '', rows = 5, ...rest }) {
    return (
        <label className={`block min-w-0 ${className}`}>
            {label ? <span className="mb-1.5 block text-[12px] font-medium text-white/50">{label}</span> : null}
            <textarea rows={rows} className={`${fieldClass} resize-y py-3 leading-6`} {...rest} />
            {hint ? <span className="mt-1.5 block text-[12px] text-white/40">{hint}</span> : null}
        </label>
    );
}

/** options: [{ value, label }] */
export function Select({ label = null, options, className = '', ...rest }) {
    return (
        <label className={`block min-w-0 ${className}`}>
            {label ? <span className="mb-1.5 block text-[12px] font-medium text-white/50">{label}</span> : null}
            <select className={`${fieldClass} h-11 appearance-none pr-10`} {...rest}>
                {options.map((o) => (
                    <option key={o.value} value={o.value} className="bg-[#1c1c1c]">
                        {o.label}
                    </option>
                ))}
            </select>
        </label>
    );
}

export function Avatar({ person, size = 36, className = '' }) {
    return <UserAvatar src={person?.avatarUrl} size={size} alt={person?.name || person?.username || ''} className={className} />;
}

/** A person as one line: avatar, name, @username under it. */
export function PersonLine({ person, size = 36, meta = null }) {
    if (!person) return null;
    return (
        <div className="flex min-w-0 items-center gap-3">
            <Avatar person={person} size={size} />
            <div className="min-w-0">
                <p className="truncate text-[14px] font-semibold text-white">{person.name || `@${person.username}`}</p>
                <p className="truncate text-[12px] text-white/45">{meta ?? (person.name && person.username ? `@${person.username}` : '')}</p>
            </div>
        </div>
    );
}

/** The empty state: one line and one action, quiet. */
export function EmptyState({ title, line = null, action = null, className = '' }) {
    return (
        <div className={`rounded-2xl bg-pxi-field px-6 py-10 text-center ${className}`}>
            <p className="text-[15px] font-semibold text-white">{title}</p>
            {line ? <p className="mx-auto mt-1.5 max-w-md text-[13px] text-white/50">{line}</p> : null}
            {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
        </div>
    );
}

/** tone: 'error' | 'good' | 'info' */
export function Notice({ tone = 'info', children, className = '' }) {
    const tones = { error: 'bg-red-500/10 text-red-200', good: 'bg-emerald-500/10 text-emerald-200', info: 'bg-pxi-field text-white/70' };
    return <div className={`rounded-2xl px-4 py-3 text-[13px] ${tones[tone] || tones.info} ${className}`}>{children}</div>;
}

export function Skeleton({ className = 'h-24' }) {
    return <div aria-hidden="true" className={`animate-pulse rounded-3xl bg-pxi-field ${className}`} />;
}

/**
 * columns: [{ key, label, width?: CSS grid track, align?: 'right', className?, render?: (row) => node, hideOnMobile? }]
 * Rows are buttons when onRowClick is given. On phones each row stacks its cells.
 */
export function DataTable({ columns, rows, rowKey = 'id', onRowClick = null, empty = null, loading = false, selectedKey = null }) {
    if (loading) {
        return (
            <div className="space-y-1.5">
                {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="h-14 animate-pulse rounded-2xl bg-pxi-field" />
                ))}
            </div>
        );
    }
    if (!rows?.length) return empty;
    const cols = { '--cols': columns.map((c) => c.width || 'minmax(0,1fr)').join(' ') };
    const grid = 'grid grid-cols-1 gap-1.5 md:items-center md:gap-4 md:[grid-template-columns:var(--cols)]';
    return (
        <div className="min-w-0">
            <div className={`hidden px-4 pb-2 md:grid ${grid}`} style={cols}>
                {columns.map((c) => (
                    <div key={c.key} className={`truncate text-[11px] font-medium text-white/40 ${c.align === 'right' ? 'text-right' : ''}`}>
                        {c.label}
                    </div>
                ))}
            </div>
            <ul className="space-y-1.5">
                {rows.map((row) => {
                    const key = typeof rowKey === 'function' ? rowKey(row) : row[rowKey];
                    const selected = selectedKey != null && key === selectedKey;
                    const rowClass = `${grid} w-full rounded-2xl px-4 py-3 text-left ${selected ? 'bg-[#3a3a3a]' : 'bg-pxi-field'} ${
                        onRowClick ? 'cursor-pointer transition hover:bg-[#363636]' : ''
                    }`;
                    const cells = columns.map((c) => (
                        <div
                            key={c.key}
                            className={`min-w-0 ${c.align === 'right' ? 'md:text-right' : ''} ${c.hideOnMobile ? 'hidden md:block' : ''} ${c.className || ''}`}
                        >
                            {c.render ? c.render(row) : row[c.key]}
                        </div>
                    ));
                    return (
                        <li key={key}>
                            {onRowClick ? (
                                <div
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => onRowClick(row)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            onRowClick(row);
                                        }
                                    }}
                                    className={rowClass}
                                    style={cols}
                                >
                                    {cells}
                                </div>
                            ) : (
                                <div className={rowClass} style={cols}>
                                    {cells}
                                </div>
                            )}
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

/** The quick view from the right. Escape and the backdrop close it. */
export function Drawer({ open, onClose, title = null, children, footer = null, width = 'max-w-[560px]' }) {
    const panelRef = useRef(null);
    useEffect(() => {
        if (!open) return undefined;
        const onKey = (e) => {
            if (e.key === 'Escape') onClose?.();
        };
        document.addEventListener('keydown', onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        panelRef.current?.focus();
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = prev;
        };
    }, [open, onClose]);
    if (!open) return null;
    return (
        <Portal>
            <div className="fixed inset-0 z-[9990] flex justify-end bg-black/60" onClick={onClose}>
                <aside
                    ref={panelRef}
                    tabIndex={-1}
                    role="dialog"
                    aria-modal="true"
                    className={`flex h-full w-full ${width} flex-col bg-pxi-surface outline-none md:rounded-l-[28px]`}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between gap-4 px-5 pb-2 pt-5 md:px-6">
                        <div className="min-w-0 text-[15px] font-semibold text-white">{title}</div>
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Close"
                            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pxi-field text-white/70 transition hover:text-white"
                        >
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                                <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                            </svg>
                        </button>
                    </div>
                    <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6 md:px-6">{children}</div>
                    {footer ? <div className="border-t border-white/[0.08] px-5 py-4 md:px-6">{footer}</div> : null}
                </aside>
            </div>
        </Portal>
    );
}

/** A small label for a state, coloured by meaning. tone: 'good'|'warn'|'bad'|'muted'|'purple' */
export function StateText({ tone = 'muted', children }) {
    const tones = {
        good: 'text-emerald-300',
        warn: 'text-amber-300',
        bad: 'text-red-300',
        muted: 'text-white/45',
        purple: 'text-[#c77dff]',
    };
    return <span className={`text-[12px] font-semibold ${tones[tone] || tones.muted}`}>{children}</span>;
}
