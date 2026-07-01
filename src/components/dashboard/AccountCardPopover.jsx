'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  AccountSetting01Icon,
  Logout01Icon,
} from '@hugeicons/core-free-icons';

const defaultItems = [
  { id: 'settings', label: 'Settings', icon: AccountSetting01Icon },
  { id: 'signout', label: 'Sign Out', icon: Logout01Icon, tone: 'danger' },
];

const POPOVER_BASE_STYLE = {
  position: 'fixed',
  zIndex: 9999,
  border: 'none',
};

export default function AccountCardPopover({
  user,
  items = defaultItems,
  collapsed = false,
  onNavigate,
  onSignOut,
  isOpen = false,
  onOpenChange,
}) {
  const rootRef = useRef(null);
  const popoverRef = useRef(null);
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState(null);
  const sideOffset = 24;

  const avatarFallback = useMemo(
    () => user?.name?.charAt(0)?.toUpperCase() || user?.username?.charAt(0)?.toUpperCase() || 'P',
    [user?.name, user?.username]
  );

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!isOpen || !rootRef.current) return;
    const rect = rootRef.current.getBoundingClientRect();
    const popoverHeight = 116;
    const top = Math.max(12, rect.bottom - popoverHeight);
    setPosition({ top, left: rect.right + sideOffset });
  }, [collapsed, isOpen, sideOffset]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onOutside = (event) => {
      const isInsideTrigger = rootRef.current?.contains(event.target);
      const isInsidePopover = popoverRef.current?.contains(event.target);
      if (!isInsideTrigger && !isInsidePopover) {
        onOpenChange?.(false);
      }
    };
    const onEscape = (event) => {
      if (event.key === 'Escape') onOpenChange?.(false);
    };
    document.addEventListener('mousedown', onOutside);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onOutside);
      document.removeEventListener('keydown', onEscape);
    };
  }, [isOpen, onOpenChange]);

  const popoverStyle = position
    ? { ...POPOVER_BASE_STYLE, top: position.top, left: position.left }
    : null;

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => onOpenChange?.(!isOpen)}
        className={`group inline-flex items-center bg-white/[0.045] text-left transition hover:bg-white/[0.07] ${
          collapsed ? 'h-11 w-11 justify-center rounded-full p-0' : 'w-full rounded-2xl p-2'
        }`}
      >
        {user?.avatarUrl ? (
          <Image
            src={user.avatarUrl}
            alt={user?.name ?? 'PXI User'}
            width={36}
            height={36}
            unoptimized
            className="h-9 w-9 rounded-full object-cover"
          />
        ) : (
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#d84aff1f] text-sm font-bold text-[#d84aff]">
            {avatarFallback}
          </span>
        )}
        {!collapsed && (
          <>
            <span className="ml-3 min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-white">{user?.name || 'PXI User'}</span>
              <span className="block truncate text-xs text-white/45">@{user?.username || 'account'}</span>
            </span>
            <HugeiconsIcon icon={AccountSetting01Icon} size={16} className="text-white/45 group-hover:text-white/70" />
          </>
        )}
      </button>

      {mounted && isOpen && popoverStyle
        ? createPortal(
            <div
              ref={popoverRef}
              style={popoverStyle}
              className="dashboard-popover-surface w-56 rounded-2xl p-1.5"
            >
              {items.map((item) => {
                const toneClass =
                  item.tone === 'danger'
                    ? 'text-red-300 hover:bg-red-500/10'
                    : 'text-white/85 hover:bg-white/10';
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onOpenChange?.(false);
                      if (item.id === 'signout') onSignOut?.();
                      else onNavigate?.(item.id);
                    }}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition ${toneClass}`}
                  >
                    <HugeiconsIcon icon={item.icon} size={16} className="opacity-80" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
