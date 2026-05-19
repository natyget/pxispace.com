'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

/** Newest edge (visual bottom) — match mobile `ThreadView`. */
const AT_BOTTOM_THRESHOLD_PX = 100;
/** Oldest edge (visual top) — match mobile `ThreadView`. */
const AT_TOP_THRESHOLD_PX = 100;

const STICK_NUDGE_DELAYS_MS = [0, 50, 120, 250, 400, 720];

function scrollToBottom(el) {
  if (!el) return;
  el.scrollTo({ top: el.scrollHeight, behavior: 'auto' });
}

/**
 * Public thread scroll: pin to newest on load, auto-fetch older at top, preserve scroll when prepending.
 * Mirrors mobile `ThreadView` (inverted list → normal top/bottom mapping on web).
 */
export function useAlbumThreadScroll({
  scrollRef,
  listRef,
  albumId,
  active,
  threadItemCount,
  contentLoading,
  loadingMoreThread,
  hasMoreOlder,
  onLoadOlder,
}) {
  const stickToBottomRef = useRef(true);
  const prependAnchorRef = useRef(null);
  const userScrolledTowardOlderRef = useRef(false);
  const onLoadOlderRef = useRef(onLoadOlder);
  const [atOldestEdge, setAtOldestEdge] = useState(false);
  const nudgeTimerIdsRef = useRef([]);

  onLoadOlderRef.current = onLoadOlder;

  const clearNudgeTimers = useCallback(() => {
    nudgeTimerIdsRef.current.forEach(clearTimeout);
    nudgeTimerIdsRef.current = [];
  }, []);

  const scrollToLatest = useCallback(() => {
    scrollToBottom(scrollRef.current);
  }, [scrollRef]);

  const bumpScrollToLatest = useCallback(() => {
    clearNudgeTimers();
    for (const delay of STICK_NUDGE_DELAYS_MS) {
      const id = setTimeout(() => {
        if (stickToBottomRef.current) scrollToLatest();
      }, delay);
      nudgeTimerIdsRef.current.push(id);
    }
  }, [clearNudgeTimers, scrollToLatest]);

  const handleThreadScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const { scrollTop, scrollHeight, clientHeight } = el;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    stickToBottomRef.current = distanceFromBottom <= AT_BOTTOM_THRESHOLD_PX;

    const scrollable = scrollHeight > clientHeight + AT_TOP_THRESHOLD_PX;
    const atTop = scrollable && scrollTop <= AT_TOP_THRESHOLD_PX;

    if (scrollTop > AT_BOTTOM_THRESHOLD_PX * 2) {
      userScrolledTowardOlderRef.current = true;
    }

    setAtOldestEdge((prev) => (prev === atTop ? prev : atTop));
  }, [scrollRef]);

  const capturePrependAnchor = useCallback(() => {
    const el = scrollRef.current;
    prependAnchorRef.current = el
      ? { scrollHeight: el.scrollHeight, scrollTop: el.scrollTop }
      : null;
    stickToBottomRef.current = false;
  }, [scrollRef]);

  // At the oldest loaded edge — fetch older after the user scrolled up (not on initial layout).
  useEffect(() => {
    if (!active) return;
    if (!userScrolledTowardOlderRef.current) return;
    if (!atOldestEdge || !hasMoreOlder || loadingMoreThread) return;
    capturePrependAnchor();
    onLoadOlderRef.current?.();
  }, [active, atOldestEdge, hasMoreOlder, loadingMoreThread, capturePrependAnchor]);

  // Prepend older rows — keep the same content under the user's finger (mobile maintainVisibleContentPosition).
  useLayoutEffect(() => {
    if (!active || contentLoading) return;
    const el = scrollRef.current;
    const anchor = prependAnchorRef.current;
    if (!el || !anchor) return;

    prependAnchorRef.current = null;
    const applyAnchor = () => {
      el.scrollTop = anchor.scrollTop + (el.scrollHeight - anchor.scrollHeight);
    };
    applyAnchor();
    requestAnimationFrame(() => {
      requestAnimationFrame(applyAnchor);
    });
  }, [active, contentLoading, threadItemCount, scrollRef]);

  // Initial / new-at-bottom pin — only when the user is already at the newest edge.
  useLayoutEffect(() => {
    if (!active || contentLoading || loadingMoreThread) return;
    if (prependAnchorRef.current) return;
    const el = scrollRef.current;
    if (!el) return;
    if (!threadItemCount || !stickToBottomRef.current) return;
    bumpScrollToLatest();
  }, [active, contentLoading, threadItemCount, loadingMoreThread, bumpScrollToLatest, scrollRef]);

  useEffect(() => {
    if (!active || contentLoading || !listRef?.current) return undefined;
    const listEl = listRef.current;
    const ro = new ResizeObserver(() => {
      if (prependAnchorRef.current) return;
      if (stickToBottomRef.current) scrollToLatest();
    });
    ro.observe(listEl);
    return () => ro.disconnect();
  }, [active, contentLoading, listRef, scrollToLatest]);

  useEffect(() => {
    stickToBottomRef.current = true;
    prependAnchorRef.current = null;
    userScrolledTowardOlderRef.current = false;
    setAtOldestEdge(false);
  }, [albumId]);

  useEffect(() => {
    if (!active) return undefined;
    stickToBottomRef.current = true;
    userScrolledTowardOlderRef.current = false;
    bumpScrollToLatest();
    return clearNudgeTimers;
  }, [active, bumpScrollToLatest, clearNudgeTimers]);

  useEffect(() => clearNudgeTimers, [clearNudgeTimers]);

  return { handleThreadScroll, scrollToLatest };
}
