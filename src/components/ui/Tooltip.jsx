'use client';

import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import Portal from './Portal';

const GAP = 8;

function getPosition(rect, tooltipRect) {
    const top = Math.min(
        Math.max(rect.top + rect.height / 2 - tooltipRect.height / 2, 8),
        window.innerHeight - tooltipRect.height - 8
    );
    return {
        top,
        left: Math.min(rect.right + GAP, window.innerWidth - tooltipRect.width - 8),
    };
}

export default function Tooltip({ children, content, disabled = false, className = '' }) {
    const triggerRef = useRef(null);
    const tooltipRef = useRef(null);
    const [open, setOpen] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });

    const updatePosition = useCallback(() => {
        if (!triggerRef.current || !tooltipRef.current) return;
        setPosition(getPosition(triggerRef.current.getBoundingClientRect(), tooltipRef.current.getBoundingClientRect()));
    }, []);

    useLayoutEffect(() => {
        if (!open) return undefined;
        updatePosition();
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true);
        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, [open, updatePosition]);

    return (
        <>
            <span
                ref={triggerRef}
                className="inline-flex"
                onMouseEnter={() => {
                    if (!disabled) setOpen(true);
                }}
                onMouseLeave={() => setOpen(false)}
                onFocus={() => {
                    if (!disabled) setOpen(true);
                }}
                onBlur={() => setOpen(false)}
                aria-label={typeof content === 'string' ? content : undefined}
            >
                {children}
            </span>
            {open && content ? (
                <Portal>
                    <div
                        ref={tooltipRef}
                        role="tooltip"
                        className={`dashboard-popover-surface pointer-events-none fixed z-[9999] rounded-full px-3 py-2 text-xs font-bold text-white ${className}`.trim()}
                        style={{ top: position.top, left: position.left }}
                    >
                        {content}
                    </div>
                </Portal>
            ) : null}
        </>
    );
}
