'use client';

import { useEffect, useRef, useState } from 'react';
import { MoreHorizontal } from 'lucide-react';

export default function ActionMenu({
  items = [],
  align = 'right',
  size = 'md',
  disabled = false,
  ariaLabel = 'Open actions menu',
  onOpenChange,
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  const toggleMenu = () => {
    if (disabled) return;
    const next = !open;
    setOpen(next);
    onOpenChange?.(next);
  };

  useEffect(() => {
    if (!open) return undefined;
    const handleOutside = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
        onOpenChange?.(false);
      }
    };
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
        onOpenChange?.(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onOpenChange, open]);

  const buttonSize = size === 'sm' ? 'h-8 w-8' : 'h-9 w-9';
  const menuAlign = align === 'left' ? 'left-0' : 'right-0';

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-expanded={open}
        onClick={toggleMenu}
        className={`${buttonSize} inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/70 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50`}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {open && (
        <div
          role="menu"
          className={`${menuAlign} absolute top-[calc(100%+6px)] z-50 min-w-[190px] rounded-xl border border-white/10 bg-zinc-950/95 p-1.5 shadow-[0_18px_40px_rgba(0,0,0,0.45)] backdrop-blur`}
        >
          {items.map((item) => {
            const toneClass =
              item.tone === 'danger'
                ? 'text-red-300 hover:bg-red-500/10'
                : 'text-white/85 hover:bg-white/10';
            return (
              <button
                type="button"
                role="menuitem"
                key={item.id}
                onClick={() => {
                  if (item.disabled) return;
                  item.onSelect?.();
                  setOpen(false);
                  onOpenChange?.(false);
                }}
                disabled={item.disabled}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${toneClass} disabled:cursor-not-allowed disabled:opacity-40`}
              >
                {item.icon ? <span className="inline-flex h-4 w-4 items-center justify-center">{item.icon}</span> : null}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
