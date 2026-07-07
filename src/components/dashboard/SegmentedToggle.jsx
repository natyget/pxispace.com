'use client';

import Link from 'next/link';

export default function SegmentedToggle({
    items = [],
    value,
    onChange,
    ariaLabel = 'Dashboard toggle',
    className = '',
}) {
    return (
        <div className={`dashboard-segmented-toggle ${className}`.trim()} role="tablist" aria-label={ariaLabel}>
            {items.map((item) => {
                const itemValue = item.value ?? item.id;
                const active = itemValue === value;
                const className = 'dashboard-segmented-toggle__item';

                if (item.href) {
                    return (
                        <Link
                            key={itemValue}
                            href={item.href}
                            role="tab"
                            aria-selected={active}
                            aria-current={active ? 'page' : undefined}
                            data-active={active}
                            className={className}
                        >
                            {item.label}
                        </Link>
                    );
                }

                return (
                    <button
                        key={itemValue}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        data-active={active}
                        className={className}
                        onClick={() => onChange?.(itemValue)}
                    >
                        {item.label}
                    </button>
                );
            })}
        </div>
    );
}
