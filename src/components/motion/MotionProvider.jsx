'use client';

// Central reduced-motion gate: `reducedMotion="user"` makes EVERY framer-motion
// animation in the tree (landing chapters, focus overlay, these primitives)
// respect the OS "reduce motion" setting — transform/layout animations are
// skipped while opacity/color still transition. Mounted once in the root layout.

import { MotionConfig } from 'framer-motion';

export default function MotionProvider({ children }) {
    return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
