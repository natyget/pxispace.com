'use client';

import Link from 'next/link';

const SEVERITY_DOT = {
    good: 'bg-emerald-300',
    info: 'bg-zinc-400',
    warning: 'bg-amber-300',
};

/**
 * Rule-based observations from the backend insight engine — each one is a real
 * number plus the lever that acts on it. Renders nothing when there's nothing
 * worth saying (no filler).
 */
export default function InsightsPanel({ insights = [], eyebrow = 'What we noticed', onCta }) {
    if (!insights.length) return null;

    return (
        <section className="rounded-[1.25rem] bg-white/[0.035] p-5">
            <p className="text-xs font-bold tracking-[0.02em] text-white/40">{eyebrow}</p>
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
                {insights.map((insight) => (
                    <article key={insight.id} className="rounded-2xl bg-white/[0.035] p-4">
                        <div className="flex items-center gap-2.5">
                            <span className={`h-2 w-2 shrink-0 rounded-full ${SEVERITY_DOT[insight.severity] || SEVERITY_DOT.info}`} aria-hidden="true" />
                            <h3 className="min-w-0 truncate text-sm font-bold text-white">{insight.title}</h3>
                        </div>
                        <p className="mt-2 text-xs leading-5 text-zinc-400">{insight.body}</p>
                        {insight.ctaLabel ? (
                            insight.ctaHref ? (
                                <Link
                                    href={insight.ctaHref}
                                    className="mt-3 inline-flex rounded-full bg-white/[0.07] px-3.5 py-1.5 text-[11px] font-medium tracking-[0.02em] text-zinc-200 transition hover:bg-white/[0.12] hover:text-white"
                                >
                                    {insight.ctaLabel} →
                                </Link>
                            ) : onCta ? (
                                <button
                                    type="button"
                                    onClick={() => onCta(insight)}
                                    className="mt-3 inline-flex rounded-full bg-white/[0.07] px-3.5 py-1.5 text-[11px] font-medium tracking-[0.02em] text-zinc-200 transition hover:bg-white/[0.12] hover:text-white"
                                >
                                    {insight.ctaLabel} →
                                </button>
                            ) : null
                        ) : null}
                    </article>
                ))}
            </div>
        </section>
    );
}
