'use client';

import { AddCircleIcon, LinkForwardIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { buildReactionDisplayList } from './albumSocialDisplay';

const ACTION_BUTTON_SIZE = 38;
const ACTION_DOCK_PAD = 4;
const ACTIONS_WIDTH = ACTION_DOCK_PAD + ACTION_BUTTON_SIZE + ACTION_BUTTON_SIZE + ACTION_DOCK_PAD;

function ReactionChip({ emoji, count, compact = false }) {
  const isPill = count > 0;
  const isGhost = count === 0;

  return (
    <span
      className={[
        'inline-flex shrink-0 items-center justify-center border border-transparent bg-[rgba(42,42,42,0.8)]',
        isPill
          ? compact
            ? 'gap-0.5 rounded-full px-[5px] py-1'
            : 'gap-1 rounded-full px-2 py-1.5'
          : compact
            ? 'size-[34px] rounded-[17px]'
            : 'size-[38px] rounded-[19px]',
        isGhost ? 'opacity-60' : '',
      ].join(' ')}
    >
      <span className="text-lg leading-none">{emoji}</span>
      {isPill ? (
        <span className="text-xs font-semibold text-[#A0A0A0]">
          {count > 999 ? '999+' : count}
        </span>
      ) : null}
    </span>
  );
}

/**
 * Read-only reaction bar — mirrors mobile `AlbumReactionBar` / `FocusReactionBar` visuals.
 */
export default function PublicAlbumReactionBar({
  item,
  maxWidth,
  minWidth = 0,
  maxHeight,
  layout = 'horizontal',
  openInAppUrl = null,
}) {
  const isVertical = layout === 'vertical';
  const displayList = buildReactionDisplayList(item);
  const trackCross = 48;
  const barMainMax = isVertical ? (maxHeight ?? maxWidth) : maxWidth;
  const effectiveMinWidth = isVertical ? 0 : Math.min(minWidth || 0, maxWidth);
  const reactionsMax = Math.max(0, barMainMax - ACTIONS_WIDTH);

  const actionBtnClass =
    'flex size-[38px] shrink-0 items-center justify-center rounded-full text-white/90';

  const actionDock = (
    <div
      className={
        isVertical
          ? 'flex shrink-0 flex-col items-center gap-0 py-1'
          : 'flex shrink-0 flex-row items-center gap-0 px-1'
      }
    >
      {openInAppUrl ? (
        <a href={openInAppUrl} className={actionBtnClass} aria-label="React in the PXI app">
          <HugeiconsIcon icon={AddCircleIcon} size={26} />
        </a>
      ) : (
        <span className={`${actionBtnClass} opacity-50`} aria-hidden>
          <HugeiconsIcon icon={AddCircleIcon} size={26} />
        </span>
      )}
      {openInAppUrl ? (
        <a href={openInAppUrl} className={actionBtnClass} aria-label="Open in the PXI app">
          <HugeiconsIcon icon={LinkForwardIcon} size={26} />
        </a>
      ) : (
        <span className={`${actionBtnClass} opacity-50`} aria-hidden>
          <HugeiconsIcon icon={LinkForwardIcon} size={26} />
        </span>
      )}
    </div>
  );

  const chips = displayList.map((reaction, index) => (
    <span
      key={reaction.emoji}
      className={
        isVertical && index < displayList.length - 1
          ? 'mb-2'
          : !isVertical && index < displayList.length - 1
            ? 'mr-1.5'
            : ''
      }
    >
      <ReactionChip emoji={reaction.emoji} count={reaction.count} compact={isVertical} />
    </span>
  ));

  if (isVertical) {
    return (
      <div
        className="flex shrink-0 flex-col items-center overflow-hidden rounded-full"
        style={{ width: trackCross, maxHeight: barMainMax }}
      >
        <div
          className="no-scrollbar flex min-h-0 flex-1 flex-col items-center overflow-y-auto pt-1.5"
          style={{ maxHeight: reactionsMax }}
        >
          {chips}
        </div>
        {actionDock}
      </div>
    );
  }

  return (
    <div
      className="flex w-auto min-w-0 max-w-full items-center overflow-hidden rounded-full"
      style={{ maxWidth, minWidth: effectiveMinWidth || undefined, height: trackCross }}
    >
      <div
        className="no-scrollbar flex min-w-0 flex-1 items-center overflow-x-auto pl-2.5"
        style={{ maxWidth: reactionsMax, minWidth: 0 }}
      >
        {chips}
      </div>
      {actionDock}
    </div>
  );
}
