'use client';

export default function SectionCard({ id, title, actions, children, dense = false, className = '', bodyClassName = '' }) {
    return (
        <section id={id} className={`glass-panel overflow-hidden rounded-[2rem] ${className}`.trim()}>
            <header className={`${dense ? 'px-5 py-4' : 'px-6 py-5'} flex items-center justify-between gap-3 shadow-[inset_0_-1px_0_rgba(255,255,255,0.035)]`}>
                <div>
                    <h2 className="text-[18px] font-bold text-white tracking-tight">{title}</h2>
                </div>
                {actions ? <div className="flex min-w-0 shrink-0 items-center gap-2">{actions}</div> : null}
            </header>
            <div className={`${dense ? 'p-5' : 'p-6'} ${bodyClassName}`.trim()}>{children}</div>
        </section>
    );
}
