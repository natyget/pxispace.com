'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import Portal from './Portal';

/**
 * @param {object} props
 * @param {boolean} props.open
 * @param {string} [props.title]
 * @param {string} [props.description]
 * @param {'sm'|'md'|'lg'} [props.size]
 * @param {() => void} [props.onClose]
 * @param {import('react').ReactNode} [props.children]
 * @param {import('react').ReactNode} [props.footer]
 */
export default function SlideOver({ open, title, description, size = 'md', onClose, children, footer }) {
  useEffect(() => {
    if (!open) return undefined;
    const onEscape = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onEscape);
    return () => document.removeEventListener('keydown', onEscape);
  }, [onClose, open]);

  if (!open) return null;

  const widthClass = size === 'lg' ? 'max-w-2xl' : size === 'sm' ? 'max-w-md' : 'max-w-xl';

  return (
    <Portal>
      <div className="fixed inset-0 z-[9999] flex justify-end bg-black/70 backdrop-blur-md" onClick={onClose}>
        <aside
          className={`glass-panel-strong h-full w-full ${widthClass} p-6`}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              {title ? <h2 className="text-lg font-black tracking-tight text-white">{title}</h2> : null}
              {description ? <p className="mt-1 text-sm text-zinc-400">{description}</p> : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-white/60 transition hover:bg-white/10 hover:text-white"
              aria-label="Close panel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="h-[calc(100%-5rem)] overflow-y-auto pr-1">{children}</div>
          {footer ? <div className="mt-4 pt-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">{footer}</div> : null}
        </aside>
      </div>
    </Portal>
  );
}
