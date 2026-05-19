'use client';

import { IPHONE_VIEWPORT_WIDTH } from './albumLayoutConstants';

/**
 * Fixed iPhone logical viewport — 390×844 (matches React Native `Dimensions`).
 */
export default function IphonePane({ children, className = '' }) {
  return (
    <div
      className={`iphone-pane ${className}`.trim()}
      style={{
        width: IPHONE_VIEWPORT_WIDTH,
        maxWidth: '100%',
      }}
    >
      <div className="iphone-pane__inner flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
