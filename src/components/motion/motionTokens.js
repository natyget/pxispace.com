// PXI motion tokens — the house physics. One source of truth so every surface
// moves the same way. Spring feel matches the album focus overlay
// (PublicAlbumThreadFocusOverlay), the best motion in the app; the ease curve
// is the Apple sheet curve.

/** Apple's sheet/navigation curve — decisive start, soft landing. */
export const EASE_APPLE = [0.32, 0.72, 0, 1];

/** House spring — matches the focus overlay's drag snap-back. */
export const SPRING_FIRM = { type: 'spring', damping: 24, stiffness: 300 };

/** Gentler spring for large surfaces (heroes, sheets). */
export const SPRING_SOFT = { type: 'spring', damping: 30, stiffness: 220 };

export const DUR = {
    fast: 0.18,
    base: 0.3,
    slow: 0.5,
};

/** Standard entrance: fade + small rise. */
export const revealVariants = {
    hidden: { opacity: 0, y: 18 },
    visible: { opacity: 1, y: 0, transition: { duration: DUR.slow, ease: EASE_APPLE } },
};

/** Container that staggers `revealVariants` children. */
export const staggerContainerVariants = (stagger = 0.07, delayChildren = 0.05) => ({
    hidden: {},
    visible: { transition: { staggerChildren: stagger, delayChildren } },
});
