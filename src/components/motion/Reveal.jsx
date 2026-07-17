'use client';

// Shared entrance/stagger/hover primitives — the building blocks of the
// product-surface motion pass. All physics come from motionTokens so surfaces
// feel like one system. Usage:
//
//   <StaggerGroup className="grid ...">
//     {items.map((it) => <RevealItem key={it.id}>…</RevealItem>)}
//   </StaggerGroup>
//
//   <Reveal>standalone block that fades up when scrolled into view</Reveal>
//
//   <HoverLift>card content (adds lift + press physics)</HoverLift>

import { motion } from 'framer-motion';
import { revealVariants, staggerContainerVariants, SPRING_FIRM } from './motionTokens';

const VIEWPORT = { once: true, margin: '0px 0px -60px 0px' };

/** Standalone scroll-into-view fade-up. */
export function Reveal({ children, className, delay = 0, as = 'div', ...rest }) {
    const Tag = motion[as] ?? motion.div;
    return (
        <Tag
            className={className}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT}
            variants={{
                hidden: revealVariants.hidden,
                visible: {
                    ...revealVariants.visible,
                    transition: { ...revealVariants.visible.transition, delay },
                },
            }}
            {...rest}
        >
            {children}
        </Tag>
    );
}

/** Parent that staggers its RevealItem children as it scrolls into view. */
export function StaggerGroup({ children, className, stagger = 0.07, ...rest }) {
    return (
        <motion.div
            className={className}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT}
            variants={staggerContainerVariants(stagger)}
            {...rest}
        >
            {children}
        </motion.div>
    );
}

/** Child of StaggerGroup — inherits the parent's stagger timing. */
export function RevealItem({ children, className, ...rest }) {
    return (
        <motion.div className={className} variants={revealVariants} {...rest}>
            {children}
        </motion.div>
    );
}

/** Card lift on hover + press-down physics (house spring). */
export function HoverLift({ children, className, lift = -4, ...rest }) {
    return (
        <motion.div
            className={className}
            whileHover={{ y: lift, scale: 1.01 }}
            whileTap={{ scale: 0.985 }}
            transition={SPRING_FIRM}
            {...rest}
        >
            {children}
        </motion.div>
    );
}
