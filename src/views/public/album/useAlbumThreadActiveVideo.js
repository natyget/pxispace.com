'use client';

import { useEffect, useState } from 'react';

/** Match mobile `ThreadView` viewabilityConfig.itemVisiblePercentThreshold */
const VISIBLE_RATIO_THRESHOLD = 0.4;

export function publicAlbumMediaId(item) {
  if (!item) return '';
  return String(item.id ?? item._id ?? '').trim();
}

/**
 * Pick at most one inline thread video — first viewable tile ≥40% in document order
 * (matches mobile FlatList viewableItems scan).
 */
export function useAlbumThreadActiveVideo({ scrollRef, active, enabled = true }) {
  const [activeVideoId, setActiveVideoId] = useState(null);

  useEffect(() => {
    if (!active || !enabled) {
      setActiveVideoId(null);
      return undefined;
    }

    const root = scrollRef.current;
    if (!root) return undefined;

    /** @type {Map<string, number>} */
    const visibleRatios = new Map();
    /** @type {Set<Element>} */
    const observed = new Set();

    const pickActive = () => {
      const tiles = [...root.querySelectorAll('[data-thread-video-id]')];
      let nextId = null;
      for (const el of tiles) {
        const id = el.getAttribute('data-thread-video-id');
        if (!id) continue;
        const ratio = visibleRatios.get(id) ?? 0;
        if (ratio >= VISIBLE_RATIO_THRESHOLD) {
          nextId = id;
          break;
        }
      }
      setActiveVideoId((prev) => (prev === nextId ? prev : nextId));
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.getAttribute('data-thread-video-id');
          if (!id) continue;
          const ratio = entry.intersectionRatio;
          if (entry.isIntersecting && ratio >= VISIBLE_RATIO_THRESHOLD) {
            visibleRatios.set(id, ratio);
          } else if (ratio < VISIBLE_RATIO_THRESHOLD) {
            visibleRatios.delete(id);
          } else {
            visibleRatios.set(id, ratio);
          }
        }
        pickActive();
      },
      {
        root,
        threshold: [0, 0.2, 0.4, 0.55, 0.7, 0.85, 1],
      },
    );

    const observeTiles = () => {
      root.querySelectorAll('[data-thread-video-id]').forEach((el) => {
        if (observed.has(el)) return;
        observed.add(el);
        io.observe(el);
      });
    };

    observeTiles();
    const mo = new MutationObserver(observeTiles);
    mo.observe(root, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
      visibleRatios.clear();
      setActiveVideoId(null);
    };
  }, [scrollRef, active, enabled]);

  return activeVideoId;
}
