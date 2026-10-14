'use client';

import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowDown01Icon } from '@hugeicons/core-free-icons';

/** The kit's field look with a chevron, for a short list of choices (the kit Select has none). options: [{ value, label }] */
export default function ChevronSelect({ options, className = '', size = 'md', ...rest }) {
    const height = size === 'sm' ? 'h-9' : 'h-10';
    return (
        <label className={`relative block min-w-0 ${className}`}>
            <select
                className={`${height} w-full appearance-none rounded-2xl bg-pxi-field pl-4 pr-10 text-[14px] font-semibold text-white outline-none transition focus:shadow-[0_0_0_1.5px_#a523ef]`}
                {...rest}
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value} className="bg-[#1c1c1c]">
                        {option.label}
                    </option>
                ))}
            </select>
            <HugeiconsIcon icon={ArrowDown01Icon} size={14} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/50" />
        </label>
    );
}
