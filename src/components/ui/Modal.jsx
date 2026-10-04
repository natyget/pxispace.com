'use client';

import { useEffect, useId } from 'react';
import { X } from 'lucide-react';
import Portal from './Portal';

/**
 * @param {object} props
 * @param {boolean} props.open
 * @param {string} [props.title]
 * @param {string} [props.description]
 * @param {() => void} [props.onClose]
 * @param {import('react').ReactNode} [props.children]
 * @param {import('react').ReactNode} [props.footer]
 * @param {string} [props.maxWidth]
 * @param {string} [props.className]
 */
export default function Modal({ open, title, description, onClose, children, footer, maxWidth = 'max-w-md', className = '' }) {
  const titleId = useId();
  const descriptionId = useId();
  useEffect(() => {
    if (!open) return undefined;
    const onEscape = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onEscape);
    return () => document.removeEventListener('keydown', onEscape);
  }, [onClose, open]);

  if (!open) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
        {/* Announced as a dialog, named by its title, so screen readers do not read it as page text. */}
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? titleId : undefined}
          aria-describedby={description ? descriptionId : undefined}
          className={`dashboard-modal-panel w-full ${maxWidth} rounded-[28px] bg-pxi-surface p-6 text-white ${className}`.trim()}
          onClick={(event) => event.stopPropagation()}
        >
          {/* App look: a small white caps title top-left, a close X top-right */}
          {title || onClose ? (
            <div className="flex items-start justify-between gap-4">
              {title ? <h2 id={titleId} className="pt-1.5 text-[13px] font-black uppercase tracking-[0.12em] text-white">{title}</h2> : <span />}
              {onClose ? (
                <button
                  type="button"
                  onClick={onClose}
                  className="-mr-1 -mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pxi-field text-white/70 transition hover:text-white"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          ) : null}
          {description ? <p id={descriptionId} className="mt-2 text-sm text-[#9a9a9a]">{description}</p> : null}
          {children ? <div className="mt-5">{children}</div> : null}
          {footer ? <div className="mt-6 flex flex-nowrap gap-3">{footer}</div> : null}
        </div>
      </div>
    </Portal>
  );
}
