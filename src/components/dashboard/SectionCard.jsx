'use client';

export default function SectionCard({ id, title, actions, children, dense = false, className = '', bodyClassName = '' }) {
    return (
        <section id={id} className={`dashboard-surface overflow-hidden rounded-2xl ${className}`.trim()}>
            <header className={`${dense ? 'px-5 py-4' : 'px-6 py-5'} flex items-center justify-between gap-3 border-b border-white/5`}>
                <div>
                    <h2 className="text-[18px] font-bold text-white tracking-tight">{title}</h2>
                </div>
                {actions ? <div className="flex min-w-0 shrink-0 items-center gap-2">{actions}</div> : null}
            </header>
            <div className={`${dense ? 'p-5' : 'p-6'} ${bodyClassName}`.trim()}>{children}</div>
        </section>
    );
}
