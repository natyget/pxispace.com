'use client';

import { useCallback, useEffect, useRef } from 'react';

/**
 * Horizontal scroll-snap pager — mirrors mobile FocusOverlay FlatList paging.
 */
export function useFocusOverlayPager({ index, itemCount, onIndexChange, onBeforeIndexChange }) {
  const pagerRef = useRef(null);
  const indexRef = useRef(index);
  const programmaticScrollRef = useRef(false);
  const scrollEndTimerRef = useRef(null);

  indexRef.current = index;

  const getPageWidth = useCallback(() => {
    const el = pagerRef.current;
    return el?.clientWidth ?? 0;
  }, []);

  const scrollToIndex = useCallback(
    (nextIndex, { smooth = false } = {}) => {
      const el = pagerRef.current;
      const pageWidth = getPageWidth();
      if (!el || pageWidth <= 0) return;
      const clamped = Math.min(Math.max(0, nextIndex), Math.max(0, itemCount - 1));

      if (clamped !== indexRef.current) {
        onBeforeIndexChange?.(indexRef.current);
        onIndexChange(clamped);
      }

      programmaticScrollRef.current = true;
      el.scrollTo({
        left: clamped * pageWidth,
        behavior: smooth ? 'smooth' : 'auto',
      });
      window.setTimeout(() => {
        programmaticScrollRef.current = false;
      }, smooth ? 320 : 0);
    },
    [getPageWidth, itemCount, onBeforeIndexChange, onIndexChange],
  );

  const syncIndexFromScroll = useCallback(() => {
    if (programmaticScrollRef.current) return;
    const el = pagerRef.current;
    const pageWidth = getPageWidth();
    if (!el || pageWidth <= 0) return;

    const next = Math.min(
      Math.max(0, Math.round(el.scrollLeft / pageWidth)),
      Math.max(0, itemCount - 1),
    );

    if (next === indexRef.current) return;
    onBeforeIndexChange?.(indexRef.current);
    onIndexChange(next);
  }, [getPageWidth, itemCount, onBeforeIndexChange, onIndexChange]);

  const handlePagerScroll = useCallback(() => {
    if (programmaticScrollRef.current) return;
    if (scrollEndTimerRef.current) window.clearTimeout(scrollEndTimerRef.current);
    scrollEndTimerRef.current = window.setTimeout(syncIndexFromScroll, 80);
  }, [syncIndexFromScroll]);

  useEffect(() => {
    // The overlay renders null on its first pass (portal mount gate), so the pager
    // element may not exist yet when this effect fires — retry until it's measurable,
    // otherwise the initial position is silently skipped and the pager opens on slide 0.
    let frame = 0;
    let attempts = 0;
    const attempt = () => {
      const el = pagerRef.current;
      if ((!el || el.clientWidth <= 0) && attempts < 120) {
        attempts += 1;
        frame = window.requestAnimationFrame(attempt);
        return;
      }
      scrollToIndex(indexRef.current, { smooth: false });
    };
    frame = window.requestAnimationFrame(attempt);
    return () => window.cancelAnimationFrame(frame);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- initial position only

  useEffect(
    () => () => {
      if (scrollEndTimerRef.current) window.clearTimeout(scrollEndTimerRef.current);
    },
    [],
  );

  const goPrev = useCallback(() => {
    const current = indexRef.current;
    if (current > 0) scrollToIndex(current - 1, { smooth: true });
  }, [scrollToIndex]);

  const goNext = useCallback(() => {
    const current = indexRef.current;
    if (current < itemCount - 1) scrollToIndex(current + 1, { smooth: true });
  }, [itemCount, scrollToIndex]);

  const wheelLockRef = useRef(false);

  const handlePagerWheel = useCallback(
    (e) => {
      if (itemCount <= 1) return;
      if (e.target instanceof Element && e.target.closest('[data-focus-comments-scroll]')) return;

      const primaryDelta =
        Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (Math.abs(primaryDelta) < 8) return;

      e.preventDefault();

      if (wheelLockRef.current) return;
      wheelLockRef.current = true;
      window.setTimeout(() => {
        wheelLockRef.current = false;
      }, 420);

      if (primaryDelta > 0) goNext();
      else goPrev();
    },
    [goNext, goPrev, itemCount],
  );

  useEffect(() => {
    const el = pagerRef.current;
    if (!el) return undefined;
    el.addEventListener('wheel', handlePagerWheel, { passive: false });
    return () => el.removeEventListener('wheel', handlePagerWheel);
  }, [handlePagerWheel]);

  return { pagerRef, handlePagerScroll, goPrev, goNext };
}
