'use client';

import { useEffect, useState } from 'react';
import { IPHONE_VIEWPORT_WIDTH } from './albumLayoutConstants';

/** Measure the thread pane width so scrapbook cards match mobile `SCREEN_W` math. */
export function useThreadPaneWidth(containerRef) {
  const [width, setWidth] = useState(IPHONE_VIEWPORT_WIDTH);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;

    const measure = () => {
      const next = el.getBoundingClientRect().width;
      if (next > 0) setWidth(next);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [containerRef]);

  return width;
}
