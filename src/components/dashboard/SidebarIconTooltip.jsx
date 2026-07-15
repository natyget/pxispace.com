'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export default function SidebarIconTooltip({ label, side = 'right', disabled = false, children }) {
  const triggerRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState(null);
  const [mounted, setMounted] = useState(false);
  const sideOffset = 24;

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const openTooltip = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPosition({
      top: rect.top + rect.height / 2,
      left: side === 'left' ? rect.left - sideOffset : rect.right + sideOffset,
      transform: side === 'left' ? 'translate(-100%, -50%)' : 'translateY(-50%)',
    });
    setOpen(true);
  };

  if (disabled) return children;

  return (
    <span
      ref={triggerRef}
      className="relative inline-flex"
      onMouseEnter={openTooltip}
      onMouseLeave={() => setOpen(false)}
      onFocus={openTooltip}
      onBlur={() => setOpen(false)}
    >
      {children}
      {mounted && open && position
        ? createPortal(
            <span
              role="tooltip"
              style={{
                position: 'fixed',
                top: position.top,
                left: position.left,
                transform: position.transform,
                zIndex: 9999,
              }}
              className="dashboard-popover-surface pointer-events-none whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-semibold tracking-wide text-white/90"
            >
              {label}
            </span>,
            document.body
          )
        : null}
    </span>
  );
}
