'use client';

import { createElement, memo } from 'react';

function GlowCard({ as = 'div', interactive = false, className = '', children, ...props }) {
    return createElement(
        as,
        {
            className: `glow-surface rounded-2xl ${interactive ? 'glow-interactive' : ''} ${className}`.trim(),
            ...props,
        },
        children
    );
}

export default memo(GlowCard);
