'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  AccountSetting01Icon,
  IdentityCardIcon,
  Logout01Icon,
} from '@hugeicons/core-free-icons';
import { canHostEvents } from '@/lib/accountTier';

const defaultItems = [
  { id: 'settings', label: 'Settings', icon: AccountSetting01Icon },
  { id: 'signout', label: 'Sign Out', icon: Logout01Icon, tone: 'danger' },
];

// Accounts that can host get their organizer page here, above Settings. It opens the page itself (href), so the
// shell's own navigation map does not need to know about it.
const organizerPageItem = { id: 'organizer-page', label: 'Organizer page', icon: IdentityCardIcon, href: '/dashboard/organizer-page' };

const POPOVER_BASE_STYLE = {
  position: 'fixed',
  zIndex: 9999,
  border: 'none',
};

const SHEET_STYLE = {
  ...POPOVER_BASE_STYLE,
  left: 0,
  right: 0,
  bottom: 0,
};

/**
 * anchor="rail": the sidebar variant, a card that opens beside the rail (AdminShell).
 * anchor="below": the top-bar variant, an avatar that opens a dropdown under it on md+ and a bottom sheet on phones.
 */
export default function AccountCardPopover({
  user,
  items = defaultItems,
  collapsed = false,
  anchor = 'rail',
  onNavigate,
  onSignOut,
  isOpen = false,
  onOpenChange,
}) {
  const router = useRouter();
  const rootRef = useRef(null);
  const popoverRef = useRef(null);
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState(null);
  const sideOffset = 24;

  const menuItems = useMemo(() => (canHostEvents(user) ? [organizerPageItem, ...items] : items), [items, user]);

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
    if (anchor === 'below') {
      const narrow = window.matchMedia('(max-width: 767px)').matches;
      setPosition(narrow
        ? { sheet: true }
        : { top: rect.bottom + 8, right: Math.max(12, window.innerWidth - rect.right) });
      return;
    }
    const popoverHeight = 116;
    const top = Math.max(12, rect.bottom - popoverHeight);
    setPosition({ top, left: rect.right + sideOffset });
  }, [anchor, collapsed, isOpen, sideOffset]);

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

  let popoverStyle = null;
  if (position) {
    if (position.sheet) popoverStyle = SHEET_STYLE;
    else if (anchor === 'below') popoverStyle = { ...POPOVER_BASE_STYLE, top: position.top, right: position.right };
    else popoverStyle = { ...POPOVER_BASE_STYLE, top: position.top, left: position.left };
  }
  const isSheet = !!position?.sheet;
  const compact = collapsed || anchor === 'below';

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => onOpenChange?.(!isOpen)}
        aria-expanded={isOpen}
        className={`group inline-flex items-center bg-pxi-field text-left transition hover:bg-white/[0.07] ${
          compact ? 'h-11 w-11 justify-center rounded-full p-0' : 'w-full rounded-2xl p-2'
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
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#A523EF1f] text-sm font-bold text-pxi-purple">
            {avatarFallback}
          </span>
        )}
        {!compact && (
          <>
            <span className="ml-3 min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-white">{user?.name || 'PXI User'}</span>
              <span className="block truncate text-xs text-white/45">@{user?.username || 'account'}</span>
            </span>
            <HugeiconsIcon icon={AccountSetting01Icon} size={16} className="text-white opacity-45 group-hover:opacity-70" />
          </>
        )}
      </button>

      {mounted && isOpen && popoverStyle
        ? createPortal(
            <div
              ref={popoverRef}
              style={popoverStyle}
              className={isSheet
                ? 'dashboard-popover-surface w-full rounded-t-3xl px-2 pb-8 pt-3'
                : 'dashboard-popover-surface w-56 rounded-2xl p-1.5'}
            >
              {menuItems.map((item) => {
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
                      if (item.href) router.push(item.href);
                      else if (item.id === 'signout') onSignOut?.();
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
