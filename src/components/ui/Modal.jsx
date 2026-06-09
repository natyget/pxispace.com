'use client';

import { useEffect } from 'react';
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
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md" onClick={onClose}>
        <div
          className={`dashboard-modal-panel glass-panel-strong w-full ${maxWidth} rounded-2xl p-6 text-white ${className}`.trim()}
          onClick={(event) => event.stopPropagation()}
        >
          {title ? <h2 className="text-lg font-black tracking-tight text-white">{title}</h2> : null}
          {description ? <p className="mt-2 text-sm text-zinc-400">{description}</p> : null}
          {children ? <div className="mt-5">{children}</div> : null}
          {footer ? <div className="mt-6 flex flex-nowrap gap-3">{footer}</div> : null}
        </div>
      </div>
    </Portal>
  );
}
