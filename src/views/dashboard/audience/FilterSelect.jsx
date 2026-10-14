'use client';

import { Select } from '@/components/dashboard/ui/kit';

/**
 * The kit Select with a chevron on it. The kit field hides the browser arrow and a filter with no label above it
 * has to read as something you can open. Small local wrapper; the kit itself is untouched.
 */
export default function FilterSelect({ ariaLabel, options, disabled = false, ...rest }) {
    return (
        <div className={`relative min-w-0 ${disabled ? 'opacity-40' : ''}`}>
            <Select aria-label={ariaLabel} options={options} disabled={disabled} {...rest} />
            <svg
                viewBox="0 0 10 10"
                aria-hidden="true"
                className="pointer-events-none absolute right-4 top-1/2 h-2.5 w-2.5 -translate-y-1/2 text-white/45"
            >
                <path d="M1 3l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        </div>
    );
}
