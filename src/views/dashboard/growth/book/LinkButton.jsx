'use client';

import Link from 'next/link';

// The kit's Button, as a link (the kit's Button is a <button>). The class strings are the kit's, so it looks the
// same next to a Button.
const VARIANTS = {
    primary: 'bg-pxi-purple text-white hover:bg-[#b444f2]',
    secondary: 'bg-pxi-field text-white hover:bg-[#3a3a3a]',
    quiet: 'bg-transparent text-white/60 hover:text-white',
};

export default function LinkButton({ href, variant = 'secondary', size = 'md', className = '', children, ...rest }) {
    const sizing = size === 'sm' ? 'h-8 px-3.5 text-[12px]' : size === 'lg' ? 'h-11 px-6 text-[14px]' : 'h-10 px-5 text-[13px]';
    return (
        <Link
            href={href}
            className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-full font-semibold transition-colors ${sizing} ${VARIANTS[variant] || VARIANTS.secondary} ${className}`}
            {...rest}
        >
            {children}
        </Link>
    );
}
