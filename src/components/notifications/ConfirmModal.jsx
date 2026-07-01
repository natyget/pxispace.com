'use client';

import { HugeiconsIcon } from '@hugeicons/react';
import { Cancel01Icon } from '@hugeicons/core-free-icons';

export default function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmClassName = 'bg-pxi-purple hover:opacity-90 text-white',
  onClose,
  onConfirm,
  loading = false,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="glass-panel-strong relative w-full max-w-sm rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
        {description ? <p className="text-zinc-400 text-sm mb-6">{description}</p> : <div className="mb-6" />}
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="pill-ghost px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 rounded-full text-sm font-medium disabled:opacity-50 ${confirmClassName}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ModalCloseButton({ onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="text-zinc-500 hover:text-white disabled:opacity-50"
      aria-label="Close"
    >
      <HugeiconsIcon icon={Cancel01Icon} size={20} />
    </button>
  );
}
