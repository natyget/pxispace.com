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
      <div className="fixed inset-0 z-[9999] flex justify-end bg-black/70" onClick={onClose}>
        <aside
          className={`h-full w-full ${widthClass} rounded-l-[28px] bg-pxi-surface p-6`}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              {title ? <h2 className="pt-1.5 text-[13px] font-black uppercase tracking-[0.12em] text-white">{title}</h2> : null}
              {description ? <p className="mt-1 text-sm text-[#9a9a9a]">{description}</p> : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-pxi-field text-white/70 transition hover:text-white"
              aria-label="Close panel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="h-[calc(100%-5rem)] overflow-y-auto pr-1">{children}</div>
          {footer ? <div className="mt-4 border-t border-white/[0.08] pt-4">{footer}</div> : null}
        </aside>
      </div>
    </Portal>
  );
}
