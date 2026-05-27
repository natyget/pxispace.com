'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

/** Newest edge (visual bottom) — match mobile `ThreadView`. */
const AT_BOTTOM_THRESHOLD_PX = 100;
/** Oldest edge (visual top) — match mobile `ThreadView`. */
const AT_TOP_THRESHOLD_PX = 100;

/** Match mobile `bumpStickToBottom` — images/layout settle after first paint. */
const STICK_NUDGE_DELAYS_MS = [0, 50, 120, 250, 400, 720, 1200, 1800];
const STICK_TO_BOTTOM_MS = 2200;

function scrollToBottom(el) {
  if (!el) return;
  const top = Math.max(0, el.scrollHeight - el.clientHeight);
  el.scrollTop = top;
  el.scrollTo({ top, behavior: 'auto' });
}

/**
 * Public thread scroll: pin to newest on load, auto-fetch older at top, preserve scroll when prepending.
 * Mirrors mobile `ThreadView` (inverted list → chronological top/bottom on web).
 */
export function useAlbumThreadScroll({
  scrollRef,
  listRef,
  topRef,
  albumId,
  active,
  threadItemCount,
  contentLoading,
  loadingMoreThread,
  hasMoreOlder,
  onLoadOlder,
}) {
  const stickToBottomRef = useRef(true);
  const pinnedToLatestRef = useRef(true);
  const stickToBottomUntilRef = useRef(0);
  const hasInitialAnchorRef = useRef(false);
  const prependAnchorRef = useRef(null);
  const userScrolledTowardOlderRef = useRef(false);
  const onLoadOlderRef = useRef(onLoadOlder);
  const [atOldestEdge, setAtOldestEdge] = useState(false);
  const nudgeTimerIdsRef = useRef([]);
  const loadingMoreRef = useRef(false);
  const hasMoreOlderRef = useRef(hasMoreOlder);

  onLoadOlderRef.current = onLoadOlder;
  loadingMoreRef.current = loadingMoreThread;
  hasMoreOlderRef.current = hasMoreOlder;

  const clearNudgeTimers = useCallback(() => {
    nudgeTimerIdsRef.current.forEach(clearTimeout);
    nudgeTimerIdsRef.current = [];
  }, []);

  const scrollToLatest = useCallback(() => {
    scrollToBottom(scrollRef.current);
  }, [scrollRef]);

  const shouldStickToBottom = useCallback(() => {
    return pinnedToLatestRef.current || Date.now() < stickToBottomUntilRef.current;
  }, []);

  const bumpScrollToLatest = useCallback(
    (durationMs = STICK_TO_BOTTOM_MS) => {
      pinnedToLatestRef.current = true;
      stickToBottomRef.current = true;
      stickToBottomUntilRef.current = Date.now() + durationMs;
      clearNudgeTimers();

      const nudge = () => {
        if (!shouldStickToBottom()) return;
        scrollToLatest();
      };

      nudge();
      for (const delay of STICK_NUDGE_DELAYS_MS) {
        if (delay > durationMs) break;
        const id = setTimeout(nudge, delay);
        nudgeTimerIdsRef.current.push(id);
      }
    },
    [clearNudgeTimers, scrollToLatest, shouldStickToBottom],
  );

  const handleThreadScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const { scrollTop, scrollHeight, clientHeight } = el;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    const atBottom = distanceFromBottom <= AT_BOTTOM_THRESHOLD_PX;

    const scrollable = scrollHeight > clientHeight + AT_TOP_THRESHOLD_PX;
    const atTop = scrollable && scrollTop <= AT_TOP_THRESHOLD_PX;

    // Chronological list: newest at bottom — "scrolled toward older" = away from bottom (inverted y > threshold on mobile).
    const scrolledTowardOlder = distanceFromBottom > AT_BOTTOM_THRESHOLD_PX * 2;

    if (atBottom) {
      pinnedToLatestRef.current = true;
      hasInitialAnchorRef.current = true;
    }

    if (hasInitialAnchorRef.current && scrolledTowardOlder) {
      userScrolledTowardOlderRef.current = true;
      pinnedToLatestRef.current = false;
      stickToBottomUntilRef.current = 0;
      clearNudgeTimers();
    }

    stickToBottomRef.current = atBottom;

    setAtOldestEdge((prev) => (prev === atTop ? prev : atTop));
  }, [scrollRef, clearNudgeTimers]);

  const capturePrependAnchor = useCallback(() => {
    const el = scrollRef.current;
    prependAnchorRef.current = el
      ? { scrollHeight: el.scrollHeight, scrollTop: el.scrollTop }
      : null;
    pinnedToLatestRef.current = false;
    stickToBottomRef.current = false;
    stickToBottomUntilRef.current = 0;
    clearNudgeTimers();
  }, [scrollRef, clearNudgeTimers]);

  const markLoadingOlder = useCallback(() => {
    capturePrependAnchor();
  }, [capturePrependAnchor]);

  // At the oldest loaded edge — fetch older only after the user scrolled up (not on initial layout).
  useEffect(() => {
    if (!active) return;
    if (!userScrolledTowardOlderRef.current) return;
    if (!atOldestEdge || !hasMoreOlder || loadingMoreThread) return;
    capturePrependAnchor();
    onLoadOlderRef.current?.();
  }, [active, atOldestEdge, hasMoreOlder, loadingMoreThread, capturePrependAnchor]);

  // IntersectionObserver top sentinel — reliable trigger on iOS/Android where scrollTop math is flaky.
  useEffect(() => {
    if (!active) return undefined;
    const root = scrollRef.current;
    const sentinel = topRef?.current;
    if (!root || !sentinel) return undefined;

    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        // Suppress auto-fetch until user has scrolled away from bottom at least once.
        if (!userScrolledTowardOlderRef.current) return;
        if (!hasMoreOlderRef.current || loadingMoreRef.current) return;
        capturePrependAnchor();
        onLoadOlderRef.current?.();
      },
      { root, rootMargin: `${AT_TOP_THRESHOLD_PX}px 0px 0px 0px`, threshold: 0 },
    );
    io.observe(sentinel);
    return () => io.disconnect();
  }, [active, scrollRef, topRef, capturePrependAnchor, threadItemCount]);

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
      requestAnimationFrame(() => {
        applyAnchor();
        // Re-evaluate top edge after prepend so pagination can chain while user stays at top.
        const { scrollTop, scrollHeight, clientHeight } = el;
        const scrollable = scrollHeight > clientHeight + AT_TOP_THRESHOLD_PX;
        const atTop = scrollable && scrollTop <= AT_TOP_THRESHOLD_PX;
        setAtOldestEdge((prev) => (prev === atTop ? prev : atTop));
      });
    });
  }, [active, contentLoading, threadItemCount, scrollRef]);

  // Pin to newest when timeline first renders / grows while pinned (mobile onContentSizeChange).
  useLayoutEffect(() => {
    if (!active || contentLoading || loadingMoreThread) return;
    if (prependAnchorRef.current) return;
    if (!threadItemCount) return;
    if (!scrollRef.current) return;
    if (userScrolledTowardOlderRef.current && !shouldStickToBottom()) return;
    if (!shouldStickToBottom() && !stickToBottomRef.current) return;

    bumpScrollToLatest();
  }, [
    active,
    contentLoading,
    threadItemCount,
    loadingMoreThread,
    bumpScrollToLatest,
    scrollRef,
    shouldStickToBottom,
  ]);

  useEffect(() => {
    if (!active || contentLoading || !listRef?.current) return undefined;
    const listEl = listRef.current;
    const ro = new ResizeObserver(() => {
      if (prependAnchorRef.current) return;
      if (shouldStickToBottom()) scrollToLatest();
    });
    ro.observe(listEl);
    return () => ro.disconnect();
  }, [active, contentLoading, listRef, scrollToLatest, shouldStickToBottom]);

  useEffect(() => {
    pinnedToLatestRef.current = true;
    stickToBottomRef.current = true;
    hasInitialAnchorRef.current = false;
    prependAnchorRef.current = null;
    userScrolledTowardOlderRef.current = false;
    stickToBottomUntilRef.current = 0;
    setAtOldestEdge(false);
  }, [albumId]);

  useEffect(() => {
    if (!active) return undefined;
    pinnedToLatestRef.current = true;
    stickToBottomRef.current = true;
    hasInitialAnchorRef.current = false;
    userScrolledTowardOlderRef.current = false;
    bumpScrollToLatest();
    return clearNudgeTimers;
  }, [active, bumpScrollToLatest, clearNudgeTimers]);

  useEffect(() => clearNudgeTimers, [clearNudgeTimers]);

  return { handleThreadScroll, scrollToLatest, markLoadingOlder, bumpScrollToLatest };
}
