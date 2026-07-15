'use client';

export default function SectionCard({ id, title, actions, children, dense = false, className = '', bodyClassName = '' }) {
    return (
        <section id={id} className={`glass-panel overflow-hidden rounded-[1.25rem] ${className}`.trim()}>
            <header className={`${dense ? 'px-5 pb-1 pt-5' : 'px-6 pb-1 pt-6'} flex flex-col items-start justify-between gap-3 md:flex-row md:items-center`}>
                <div className="min-w-0">
                    <h2 className="text-[15px] font-semibold tracking-tight text-white">{title}</h2>
                </div>
                {actions ? <div className="flex min-w-0 w-full items-center gap-2 md:w-auto md:shrink-0">{actions}</div> : null}
            </header>
            <div className={`${dense ? 'p-5' : 'p-6'} ${bodyClassName}`.trim()}>{children}</div>
        </section>
    );
}
