'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import Portal from './Portal';

const GAP = 12;

function getPosition(rect, contentRect, placement, offset = GAP) {
    if (placement === 'right') {
        return {
            top: Math.min(Math.max(rect.top, 8), window.innerHeight - contentRect.height - 8),
            left: Math.min(rect.right + offset, window.innerWidth - contentRect.width - 8),
        };
    }

    return {
        top: Math.min(rect.bottom + GAP, window.innerHeight - contentRect.height - 8),
        left: Math.min(Math.max(rect.right - contentRect.width, 8), window.innerWidth - contentRect.width - 8),
    };
}

export default function Popover({
    children,
    content,
    open,
    onOpenChange,
    placement = 'bottom-end',
    className = '',
    offset = GAP,
    triggerClassName = 'inline-flex',
}) {
    const triggerRef = useRef(null);
    const contentRef = useRef(null);
    const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const isOpen = open ?? uncontrolledOpen;

    const setOpen = useCallback(
        (next) => {
            setUncontrolledOpen(next);
            onOpenChange?.(next);
        },
        [onOpenChange]
    );

    const updatePosition = useCallback(() => {
        if (!triggerRef.current || !contentRef.current) return;
        setPosition(getPosition(triggerRef.current.getBoundingClientRect(), contentRef.current.getBoundingClientRect(), placement, offset));
    }, [offset, placement]);

    useLayoutEffect(() => {
        if (!isOpen) return undefined;
        updatePosition();
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true);
        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, [isOpen, updatePosition]);

    useEffect(() => {
        if (!isOpen) return undefined;
        const onPointerDown = (event) => {
            const target = event.target;
            if (triggerRef.current?.contains(target) || contentRef.current?.contains(target)) return;
            setOpen(false);
        };
        const onKeyDown = (event) => {
            if (event.key === 'Escape') setOpen(false);
        };
        document.addEventListener('pointerdown', onPointerDown);
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('pointerdown', onPointerDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [isOpen, setOpen]);

    return (
        <>
            <span
                ref={triggerRef}
                className={triggerClassName}
                aria-expanded={isOpen}
                aria-haspopup="dialog"
                onClick={() => setOpen(!isOpen)}
            >
                {children}
            </span>
            {isOpen ? (
                <Portal>
                    <div
                        ref={contentRef}
                        className={`dashboard-popover-surface fixed z-[9999] rounded-2xl p-2 text-white ${className}`.trim()}
                        style={{ top: position.top, left: position.left }}
                    >
                        {content}
                    </div>
                </Portal>
            ) : null}
        </>
    );
}
